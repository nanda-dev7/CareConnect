import { ClassificationService } from './ai/classificationService.js';
import { AIService } from './ai/aiService.js';

export const classifyServiceRequest = async (description, customerSelectedCategory = null) => {
  return await ClassificationService.classifyRequest(description, customerSelectedCategory);
};

export const fallbackClassify = (description, validCategories = [], customerSelectedCategory = null) => {
  return ClassificationService.fallbackClassifier(description, validCategories, customerSelectedCategory);
};

export { ClassificationService, AIService };
export default {
  classifyServiceRequest,
  fallbackClassify,
  ClassificationService,
  AIService
};
