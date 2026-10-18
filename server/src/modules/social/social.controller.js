import * as service from './social.service.js';

export async function listChannels(req, res) {
  const items = await service.listChannels(req);
  res.json({ success: true, data: { items, total: items.length } });
}

export async function getChannel(req, res) {
  const channel = await service.getChannelById(req, req.params.id);
  res.json({ success: true, data: channel });
}

export async function connectChannel(req, res) {
  const channel = await service.connectChannel(req, req.body);
  res.status(201).json({ success: true, data: channel, message: 'Social channel connected successfully.' });
}

export async function syncChannel(req, res) {
  const channel = await service.syncChannel(req, req.params.id);
  res.json({ success: true, data: channel, message: 'Social metrics synced successfully.' });
}

export async function syncAllChannels(req, res) {
  const results = await service.syncAllChannels(req);
  res.json({ success: true, data: results, message: 'All channels synced successfully.' });
}

export async function disconnectChannel(req, res) {
  const result = await service.disconnectChannel(req, req.params.id);
  res.json({ success: true, data: result, message: 'Social channel disconnected.' });
}

export async function publishPost(req, res) {
  const result = await service.publishPost(req, req.body);
  res.status(201).json({ success: true, data: result, message: 'Post published successfully to social channel.' });
}

export async function getSocialStats(req, res) {
  const stats = await service.getSocialAggregates(req);
  res.json({ success: true, data: stats });
}
