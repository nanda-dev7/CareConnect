import { PricingRule } from '../models/PricingRule.js';
import { Category } from '../models/Category.js';

export class PricingService {
  /**
   * Calculates transparent pricing breakdown for quotes and invoices.
   */
  static async calculatePrice({ categoryId, categoryName, isEmergency = false, date = null, partsCost = 0, additionalCharges = 0, customBasePrice = null }) {
    let basePrice = customBasePrice || 300;
    let emergencyFee = 0;
    let weekendFee = 0;
    let serviceFee = 50;

    // Check pricing rule
    let rule = null;
    if (categoryId) {
      rule = await PricingRule.findOne({ categoryId, isActive: true });
    }
    if (!rule && categoryName) {
      rule = await PricingRule.findOne({ categoryName, isActive: true });
    }

    if (rule) {
      basePrice = customBasePrice !== null ? customBasePrice : rule.basePrice;
      serviceFee = rule.serviceFee || 50;
      if (isEmergency) emergencyFee = rule.emergencyFee || 150;
    } else if (categoryId) {
      const cat = await Category.findById(categoryId);
      if (cat) {
        basePrice = customBasePrice !== null ? customBasePrice : cat.basePrice;
      }
    }

    // Check if scheduled date falls on a weekend
    if (date) {
      const day = new Date(date).getDay();
      if (day === 0 || day === 6) { // Sunday or Saturday
        weekendFee = rule ? rule.weekendFee : 100;
      }
    }

    const total = Number((basePrice + partsCost + serviceFee + emergencyFee + weekendFee + additionalCharges).toFixed(2));

    return {
      basePrice,
      partsCost,
      serviceFee,
      emergencyFee,
      weekendFee,
      additionalCharges,
      total
    };
  }
}
