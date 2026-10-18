import { Asset } from './asset.model.js';
import { findByIdWithinOrganization as findContentById } from '../content/content.repository.js';
import { findByIdWithinOrganization as findCampaignById } from '../campaigns/campaign.repository.js';
import { recordActivity } from '../../../services/resourceService.js';
import { ApiError } from '../../../utils/http.js';
import { generatePresignedUploadUrl } from '../../shared/storage/storage.service.js';
import { enqueueMediaProcessing, getQueueHealth } from '../../shared/queue/queue.service.js';

async function verifyAssetRelations(data, organizationId, ownerId) {
  const targetContentId = data.content || data.contentId;
  if (targetContentId) {
    const content = await findContentById(targetContentId, organizationId, ownerId, { lean: true });
    if (!content) throw new ApiError(400, 'Select a valid content item from your workspace.');
    data.content = content._id;
    data.contentId = content._id;
  }
  const targetCampaignId = data.campaign || data.campaignId;
  if (targetCampaignId) {
    const campaign = await findCampaignById(targetCampaignId, organizationId, ownerId, { lean: true });
    if (!campaign) throw new ApiError(400, 'Select a valid campaign from your workspace.');
    data.campaign = campaign._id;
    data.campaignId = campaign._id;
  }
}

export async function listAssets(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const criteria = {
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  };
  if (req.query.contentId) criteria.contentId = req.query.contentId;
  if (req.query.campaignId) criteria.campaignId = req.query.campaignId;
  if (req.query.type) criteria.type = req.query.type;
  const items = await Asset.find(criteria)
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name email')
    .lean();
  return { items, total: items.length };
}

export async function getAssetById(req, assetId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const asset = await Asset.findOne({
    _id: assetId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  }).lean();
  if (!asset) throw new ApiError(404, 'Asset not found.');
  return asset;
}

export async function getPresignedUpload(req, data) {
  const result = await generatePresignedUploadUrl({
    fileName: data.fileName,
    mimeType: data.mimeType,
    fileSize: data.fileSize,
    organizationId: req.organizationId,
    folder: data.folder || 'assets',
  });
  return result;
}

export async function confirmDirectUpload(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyAssetRelations(data, req.organizationId, ownerId);
  const initialVersion = {
    versionNumber: 1,
    fileUrl: data.fileUrl,
    fileSize: data.fileSize || 0,
    mimeType: data.mimeType || '',
    uploadedBy: req.user._id,
  };
  const asset = await Asset.create({
    fileName: data.fileName,
    fileKey: data.fileKey,
    fileUrl: data.fileUrl,
    fileSize: data.fileSize || 0,
    mimeType: data.mimeType || '',
    type: data.type || (data.mimeType?.startsWith('video/') ? 'Raw Video' : 'Image'),
    storageProvider: data.provider || 's3',
    processingStatus: 'processing',
    organizationId: req.organizationId,
    owner: ownerId,
    uploadedBy: req.user._id,
    contentId: data.contentId || null,
    campaignId: data.campaignId || null,
    version: 1,
    versions: [initialVersion],
  });

  const io = req.app.get('io');
  await enqueueMediaProcessing(
    {
      assetId: asset._id,
      fileKey: data.fileKey,
      fileUrl: asset.fileUrl,
      mimeType: asset.mimeType,
      organizationId: req.organizationId,
    },
    io,
  );

  if (io && req.organizationId) {
    io.to(`org:${req.organizationId}`).emit('asset-uploaded', {
      assetId: asset._id,
      fileName: asset.fileName,
      fileUrl: asset.fileUrl,
      type: asset.type,
      storageProvider: asset.storageProvider,
    });
  }

  await recordActivity(req, `Uploaded Cloud Asset: ${asset.fileName}`, 'assets', asset._id);
  return asset;
}

export async function uploadAsset(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyAssetRelations(data, req.organizationId, ownerId);
  const initialVersion = {
    versionNumber: 1,
    fileUrl: data.fileUrl,
    fileSize: data.fileSize || 0,
    mimeType: data.mimeType || '',
    uploadedBy: req.user._id,
  };
  const asset = await Asset.create({
    ...data,
    organizationId: req.organizationId,
    owner: ownerId,
    uploadedBy: req.user._id,
    version: 1,
    versions: [initialVersion],
  });

  const io = req.app.get('io');
  await enqueueMediaProcessing(
    {
      assetId: asset._id,
      fileKey: asset.fileKey || `asset_${asset._id}`,
      fileUrl: asset.fileUrl,
      mimeType: asset.mimeType,
      organizationId: req.organizationId,
    },
    io,
  );

  await recordActivity(req, `Uploaded Asset: ${asset.fileName}`, 'assets', asset._id);
  return asset;
}

export async function addAssetVersion(req, assetId, versionData) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const asset = await Asset.findOne({
    _id: assetId,
    $or: [{ organizationId: req.organizationId }, { owner: ownerId }],
    deletedAt: null,
  });
  if (!asset) throw new ApiError(404, 'Asset not found.');
  const nextVersionNumber = asset.version + 1;
  const newVersion = {
    versionNumber: nextVersionNumber,
    fileUrl: versionData.fileUrl,
    fileSize: versionData.fileSize || 0,
    mimeType: versionData.mimeType || asset.mimeType,
    notes: versionData.notes || '',
    uploadedBy: req.user._id,
  };
  asset.version = nextVersionNumber;
  asset.fileUrl = versionData.fileUrl;
  if (versionData.fileSize) asset.fileSize = versionData.fileSize;
  if (versionData.mimeType) asset.mimeType = versionData.mimeType;
  asset.versions.push(newVersion);
  await asset.save();
  await recordActivity(req, `Uploaded Asset Version v${nextVersionNumber} for ${asset.fileName}`, 'assets', asset._id);
  return asset;
}

export async function archiveAsset(req, assetId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const asset = await Asset.findOneAndUpdate(
    { _id: assetId, $or: [{ organizationId: req.organizationId }, { owner: ownerId }], deletedAt: null },
    { $set: { deletedAt: new Date() } },
    { new: true },
  );
  if (!asset) throw new ApiError(404, 'Asset not found.');
  await recordActivity(req, `Archived Asset: ${asset.fileName}`, 'assets', asset._id);
  return asset;
}

export async function getQueueStatus() {
  return await getQueueHealth();
}
