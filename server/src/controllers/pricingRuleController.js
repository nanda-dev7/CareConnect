import { PricingRule } from '../models/PricingRule.js';
import { Category } from '../models/Category.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuditService } from '../services/auditService.js';

export const getPricingRules = async (req, res, next) => {
  try {
    const rules = await PricingRule.find({ isActive: true }).populate('categoryId', 'name');
    return sendSuccess(res, 200, 'Pricing rules retrieved', rules);
  } catch (error) {
    next(error);
  }
};

export const createPricingRule = async (req, res, next) => {
  try {
    const { categoryId, basePrice, emergencyFee, weekendFee, serviceFee } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return sendError(res, 404, 'Category not found', 'CATEGORY_NOT_FOUND');
    }

    const existing = await PricingRule.findOne({ categoryId });
    if (existing) {
      return sendError(res, 409, 'Pricing rule for this category already exists', 'RULE_EXISTS');
    }

    const rule = await PricingRule.create({
      categoryId,
      categoryName: category.name,
      basePrice: Number(basePrice),
      emergencyFee: emergencyFee !== undefined ? Number(emergencyFee) : 150,
      weekendFee: weekendFee !== undefined ? Number(weekendFee) : 100,
      serviceFee: serviceFee !== undefined ? Number(serviceFee) : 50
    });

    await AuditService.logAction({
      userId: req.user._id,
      action: 'PRICING_RULE_CREATED',
      entityType: 'PricingRule',
      entityId: rule._id,
      metadata: { categoryName: category.name, basePrice },
      req
    });

    return sendSuccess(res, 201, 'Pricing rule created successfully', rule);
  } catch (error) {
    next(error);
  }
};

export const updatePricingRule = async (req, res, next) => {
  try {
    const rule = await PricingRule.findById(req.params.id);
    if (!rule) {
      return sendError(res, 404, 'Pricing rule not found', 'NOT_FOUND');
    }

    const { basePrice, emergencyFee, weekendFee, serviceFee, isActive } = req.body;
    if (basePrice !== undefined) rule.basePrice = Number(basePrice);
    if (emergencyFee !== undefined) rule.emergencyFee = Number(emergencyFee);
    if (weekendFee !== undefined) rule.weekendFee = Number(weekendFee);
    if (serviceFee !== undefined) rule.serviceFee = Number(serviceFee);
    if (isActive !== undefined) rule.isActive = isActive;

    await rule.save();

    await AuditService.logAction({
      userId: req.user._id,
      action: 'PRICING_RULE_UPDATED',
      entityType: 'PricingRule',
      entityId: rule._id,
      metadata: { basePrice: rule.basePrice },
      req
    });

    return sendSuccess(res, 200, 'Pricing rule updated successfully', rule);
  } catch (error) {
    next(error);
  }
};

export const deletePricingRule = async (req, res, next) => {
  try {
    const rule = await PricingRule.findById(req.params.id);
    if (!rule) {
      return sendError(res, 404, 'Pricing rule not found', 'NOT_FOUND');
    }

    rule.isActive = false;
    await rule.save();

    return sendSuccess(res, 200, 'Pricing rule deactivated successfully');
  } catch (error) {
    next(error);
  }
};
