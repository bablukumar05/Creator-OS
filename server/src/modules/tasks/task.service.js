import { TASK_SORT_FIELDS } from './task.constants.js';
import {
  archiveWithinOrganization,
  createForOrganization,
  findAllByOrganization,
  findByIdWithinOrganization,
  restoreWithinOrganization,
} from './task.repository.js';
import { findByIdWithinOrganization as findBrandByIdWithinOrganization } from '../brands/brand.repository.js';
import { findByIdWithinOrganization as findCampaignByIdWithinOrganization } from '../campaigns/campaign.repository.js';
import { findByIdWithinOrganization as findContentByIdWithinOrganization } from '../content/content.repository.js';
import { Member } from '../members/member.model.js';
import { recordActivity } from '../../../services/resourceService.js';
import { ApiError, escapeRegex } from '../../../utils/http.js';
const CLEARABLE_FIELDS = [
  'description',
  'dueDate',
  'category',
  'brand',
  'brandId',
  'campaign',
  'campaignId',
  'content',
  'contentId',
  'assignedTo',
];
async function verifyTaskRelationsAndAssignee(data, organizationId, ownerId) {
  const targetBrandId = data.brand || data.brandId;
  if (targetBrandId) {
    const brand = await findBrandByIdWithinOrganization(targetBrandId, organizationId, ownerId, {
      lean: true,
    });
    if (!brand) {
      throw new ApiError(400, 'Select a valid brand from your workspace.');
    }
    data.brand = brand._id;
    data.brandId = brand._id;
  }
  const targetCampaignId = data.campaign || data.campaignId;
  if (targetCampaignId) {
    const campaign = await findCampaignByIdWithinOrganization(
      targetCampaignId,
      organizationId,
      ownerId,
      { lean: true },
    );
    if (!campaign) {
      throw new ApiError(400, 'Select a valid campaign from your workspace.');
    }
    data.campaign = campaign._id;
    data.campaignId = campaign._id;
  }
  const targetContentId = data.content || data.contentId;
  if (targetContentId) {
    const content = await findContentByIdWithinOrganization(
      targetContentId,
      organizationId,
      ownerId,
      { lean: true },
    );
    if (!content) {
      throw new ApiError(400, 'Select a valid related content from your workspace.');
    }
    data.content = content._id;
    data.contentId = content._id;
  }
  if (data.assignedTo) {
    if (organizationId) {
      const isActiveMember = await Member.exists({
        organizationId,
        userId: data.assignedTo,
        status: 'active',
      });
      if (!isActiveMember) {
        throw new ApiError(400, 'Assigned user must be an active member of this workspace.');
      }
    } else if (String(data.assignedTo) !== String(ownerId)) {
      throw new ApiError(400, 'Assigned user must belong to this workspace.');
    }
  }
}
export async function listTasks(req) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const includeDeleted = req.query.archived === 'true';
  const criteria = {};
  if (req.query.search) {
    criteria.title = {
      $regex: escapeRegex(String(req.query.search).slice(0, 100)),
      $options: 'i',
    };
  }
  if (req.query.status) criteria.status = String(req.query.status);
  if (req.query.priority) criteria.priority = String(req.query.priority);
  if (req.query.category) criteria.category = String(req.query.category);
  const brandFilter = req.query.brand || req.query.brandId;
  if (brandFilter) {
    if (!/^[a-f\d]{24}$/i.test(String(brandFilter))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.brand = String(brandFilter);
  }
  const campaignFilter = req.query.campaign || req.query.campaignId;
  if (campaignFilter) {
    if (!/^[a-f\d]{24}$/i.test(String(campaignFilter))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.campaign = String(campaignFilter);
  }
  const contentFilter = req.query.content || req.query.contentId;
  if (contentFilter) {
    if (!/^[a-f\d]{24}$/i.test(String(contentFilter))) {
      throw new ApiError(400, 'Invalid relationship filter.');
    }
    criteria.content = String(contentFilter);
  }
  if (req.query.assignedTo) {
    if (!/^[a-f\d]{24}$/i.test(String(req.query.assignedTo))) {
      throw new ApiError(400, 'Invalid assignee filter.');
    }
    criteria.assignedTo = String(req.query.assignedTo);
  }
  if (req.query.from || req.query.to) {
    criteria.dueDate = {};
    if (req.query.from) {
      const from = new Date(String(req.query.from));
      if (!Number.isFinite(+from)) throw new ApiError(400, 'Invalid start date.');
      criteria.dueDate.$gte = from;
    }
    if (req.query.to) {
      const to = new Date(String(req.query.to));
      if (!Number.isFinite(+to)) throw new ApiError(400, 'Invalid end date.');
      criteria.dueDate.$lte = to;
    }
  }
  const page = Math.max(1, Number.parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit) || 10));
  const rawSort = String(req.query.sort || '-createdAt');
  const sortField = rawSort.replace(/^-/, '');
  const sort = TASK_SORT_FIELDS.includes(sortField) ? rawSort : '-createdAt';
  const { items, total } = await findAllByOrganization(req.organizationId, ownerId, criteria, {
    includeDeleted,
    sort,
    skip: (page - 1) * limit,
    limit,
  });
  return {
    items,
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
}
export async function getTaskById(req, taskId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const task = await findByIdWithinOrganization(taskId, req.organizationId, ownerId, {
    lean: true,
  });
  if (!task) throw new ApiError(404, 'Record not found.');
  return task;
}
export async function createTask(req, data) {
  const ownerId = req.organization?.ownerId || req.user._id;
  await verifyTaskRelationsAndAssignee(data, req.organizationId, ownerId);
  const task = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Created ${task.title}`, 'tasks', task._id);
  return task;
}
export async function updateTask(req, taskId, data, rawBody = {}) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const task = await findByIdWithinOrganization(taskId, req.organizationId, ownerId);
  if (!task) throw new ApiError(404, 'Record not found.');
  await verifyTaskRelationsAndAssignee(data, req.organizationId, ownerId);
  Object.assign(task, data);
  task.updatedBy = req.user._id;
  // allow clearing nullable foreign keys when empty string passed from form
  for (const field of CLEARABLE_FIELDS) {
    if (rawBody[field] === '') {
      task.set(field, undefined);
      if (field === 'brand' || field === 'brandId') {
        task.set('brand', undefined);
        task.set('brandId', undefined);
      }
      if (field === 'campaign' || field === 'campaignId') {
        task.set('campaign', undefined);
        task.set('campaignId', undefined);
      }
      if (field === 'content' || field === 'contentId') {
        task.set('content', undefined);
        task.set('contentId', undefined);
      }
    }
  }
  await task.save();
  await recordActivity(req, `Updated ${task.title}`, 'tasks', task._id);
  return task;
}
export async function archiveTask(req, taskId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const task = await archiveWithinOrganization(
    taskId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!task) throw new ApiError(404, 'Record not found.');
  await recordActivity(req, `Archived ${task.title}`, 'tasks', task._id);
  return task;
}
export async function duplicateTask(req, taskId) {
  const original = await getTaskById(req, taskId);
  const { _id, createdAt, updatedAt, __v, ...data } = original;
  data.title = `${original.title} (copy)`;
  const ownerId = req.organization?.ownerId || req.user._id;
  const copy = await createForOrganization(data, req.organizationId, ownerId, req.user._id);
  await recordActivity(req, `Duplicated ${original.title}`, 'tasks', copy._id);
  return copy;
}
export async function restoreTask(req, taskId) {
  const ownerId = req.organization?.ownerId || req.user._id;
  const task = await restoreWithinOrganization(
    taskId,
    req.organizationId,
    ownerId,
    req.user._id,
  );
  if (!task) throw new ApiError(404, 'Archived record not found.');
  await recordActivity(req, `Restored ${task.title}`, 'tasks', task._id);
  return task;
}
