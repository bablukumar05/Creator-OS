import * as aiService from './ai.service.js';
import { sendSuccess } from '../../../utils/http.js';
export async function chat(req, res) {
  const data = await aiService.chatWithAI(req, req.body);
  sendSuccess(res, 200, data, 'AI response generated successfully.');
}
export async function query(req, res) {
  const data = await aiService.queryNaturalLanguage(req, req.body);
  sendSuccess(res, 200, data, 'Natural language query processed.');
}
export async function listConversations(req, res) {
  const data = await aiService.listConversations(req);
  sendSuccess(res, 200, data, 'Conversations loaded successfully.');
}
export async function getConversationMessages(req, res) {
  const data = await aiService.getConversationMessages(req, req.params.id);
  sendSuccess(res, 200, data, 'Conversation messages loaded successfully.');
}
