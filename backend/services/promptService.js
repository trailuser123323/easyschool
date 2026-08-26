import Prompt from "../models/Prompt.js";

export function listPrompts(ownerId) {
  return Prompt.find({ owner: ownerId }).sort({ updatedAt: -1 });
}

export function getPrompt(id, ownerId) {
  return Prompt.findOne({ _id: id, owner: ownerId });
}

export function createPrompt(data, ownerId) {
  return Prompt.create({ ...data, owner: ownerId });
}

export function updatePrompt(id, data, ownerId) {
  return Prompt.findOneAndUpdate(
    { _id: id, owner: ownerId },
    data,
    { new: true, runValidators: true },
  );
}

export function deletePrompt(id, ownerId) {
  return Prompt.findOneAndDelete({ _id: id, owner: ownerId });
}
