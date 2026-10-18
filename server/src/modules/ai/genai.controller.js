import * as scriptService from './scriptGenerator.service.js';
import * as contractService from './contractAnalyzer.service.js';
import * as pitchService from './brandPitch.service.js';
import { Content } from '../content/content.model.js';
import { ApiError } from '../../../utils/http.js';

export async function generateScript(req, res) {
  const result = await scriptService.generateScript(req.body);
  res.json({ success: true, data: result });
}

export async function analyzeContract(req, res) {
  const result = await contractService.analyzeContract(req.body);
  res.json({ success: true, data: result });
}

export async function generateBrandPitch(req, res) {
  const result = await pitchService.generateBrandPitch(req.body);
  res.json({ success: true, data: result });
}

export async function saveScriptToContent(req, res) {
  const { title, scriptText, platform = 'youtube', description = '' } = req.body;

  if (!title) {
    throw new ApiError(400, 'Title is required to save content.');
  }

  const content = await Content.create({
    organizationId: req.organizationId,
    owner: req.organization?.ownerId || req.user._id,
    title,
    description: `${description}\n\n--- AI Generated Script ---\n${scriptText || ''}`.trim(),
    platform: platform.toLowerCase(),
    type: platform.toLowerCase() === 'youtube' ? 'Video' : 'Post',
    contentType: 'Video',
    status: 'Idea',
    priority: 'High',
  });

  res.status(201).json({
    success: true,
    data: content,
    message: 'Script saved to Content Planner successfully!',
  });
}
