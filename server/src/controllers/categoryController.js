import { Category } from '../models/Category.js';
import { Skill } from '../models/Skill.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuditService } from '../services/auditService.js';

export const getCategories = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const categories = await Category.find(filter).sort({ name: 1 });
    return sendSuccess(res, 200, 'Categories retrieved successfully', categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 404, 'Category not found', 'NOT_FOUND');
    }
    const skills = await Skill.find({ categoryId: category._id, isActive: true });
    return sendSuccess(res, 200, 'Category retrieved', { category, skills });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description, requiredSkills, basePrice } = req.body;

    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return sendError(res, 409, 'Category already exists', 'CATEGORY_EXISTS');
    }

    const category = await Category.create({
      name,
      description,
      requiredSkills: requiredSkills || [],
      basePrice: Number(basePrice)
    });

    await AuditService.logAction({
      userId: req.user._id,
      action: 'CATEGORY_CREATED',
      entityType: 'Category',
      entityId: category._id,
      metadata: { name: category.name, basePrice: category.basePrice },
      req
    });

    return sendSuccess(res, 201, 'Category created successfully', category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 404, 'Category not found', 'NOT_FOUND');
    }

    const { name, description, requiredSkills, basePrice, isActive } = req.body;
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (requiredSkills) category.requiredSkills = requiredSkills;
    if (basePrice !== undefined) category.basePrice = Number(basePrice);
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    await AuditService.logAction({
      userId: req.user._id,
      action: 'CATEGORY_UPDATED',
      entityType: 'Category',
      entityId: category._id,
      metadata: { name: category.name },
      req
    });

    return sendSuccess(res, 200, 'Category updated successfully', category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 404, 'Category not found', 'NOT_FOUND');
    }

    category.isActive = false;
    await category.save();

    await AuditService.logAction({
      userId: req.user._id,
      action: 'CATEGORY_DEACTIVATED',
      entityType: 'Category',
      entityId: category._id,
      req
    });

    return sendSuccess(res, 200, 'Category deactivated successfully');
  } catch (error) {
    next(error);
  }
};

// Skill Handlers
export const getSkills = async (req, res, next) => {
  try {
    const { categoryId, isActive } = req.query;
    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skills = await Skill.find(filter).populate('categoryId', 'name').sort({ name: 1 });
    return sendSuccess(res, 200, 'Skills retrieved successfully', skills);
  } catch (error) {
    next(error);
  }
};

export const createSkill = async (req, res, next) => {
  try {
    const { name, description, categoryId } = req.body;
    const skill = await Skill.create({
      name,
      description,
      categoryId
    });

    // Also push skill to category's requiredSkills if categoryId exists
    if (categoryId) {
      await Category.findByIdAndUpdate(categoryId, { $addToSet: { requiredSkills: name } });
    }

    return sendSuccess(res, 201, 'Skill created successfully', skill);
  } catch (error) {
    next(error);
  }
};
