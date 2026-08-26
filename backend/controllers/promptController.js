import * as promptService from "../services/promptService.js";

function validatePrompt(body = {}) {
  const errors = {};
  for (const field of ["title", "content", "category"]) {
    if (typeof body[field] !== "string" || !body[field].trim()) {
      errors[field] = `${field} is required.`;
    }
  }
  return errors;
}

function promptPayload(body = {}) {
  return {
    title: body.title.trim(),
    content: body.content.trim(),
    category: body.category.trim(),
  };
}

export async function list(req, res) {
  const prompts = await promptService.listPrompts(req.user.id);
  return res.json({ success: true, data: prompts });
}

export async function getOne(req, res) {
  const prompt = await promptService.getPrompt(req.params.id, req.user.id);
  if (!prompt) return res.status(404).json({ success: false, message: "Prompt not found." });
  return res.json({ success: true, data: prompt });
}

export async function create(req, res) {
  const errors = validatePrompt(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ success: false, message: "Prompt validation failed.", errors });
  }
  const prompt = await promptService.createPrompt(promptPayload(req.body), req.user.id);
  return res.status(201).json({ success: true, data: prompt });
}

export async function update(req, res) {
  const errors = validatePrompt(req.body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ success: false, message: "Prompt validation failed.", errors });
  }
  const prompt = await promptService.updatePrompt(req.params.id, promptPayload(req.body), req.user.id);
  if (!prompt) return res.status(404).json({ success: false, message: "Prompt not found." });
  return res.json({ success: true, data: prompt });
}

export async function remove(req, res) {
  const prompt = await promptService.deletePrompt(req.params.id, req.user.id);
  if (!prompt) return res.status(404).json({ success: false, message: "Prompt not found." });
  return res.json({ success: true, message: "Prompt deleted successfully." });
}
