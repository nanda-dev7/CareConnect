import { AIService } from './aiService.js';
import { Category } from '../../models/Category.js';

// Domain knowledge base for heuristic classification fallback
const KEYWORD_MAP = [
  {
    category: 'Plumbing',
    keywords: ['leak', 'pipe', 'sink', 'tap', 'drain', 'toilet', 'flush', 'water', 'clog', 'faucet'],
    skills: ['Pipe Repair', 'Leak Detection', 'Sink Repair', 'Drain Cleaning'],
    urgencyRules: [{ word: 'flood', urgency: 'emergency' }, { word: 'burst', urgency: 'emergency' }, { word: 'dripping', urgency: 'low' }]
  },
  {
    category: 'AC Repair',
    keywords: ['ac', 'air conditioner', 'cooling', 'compressor', 'gas leak', 'not cooling', 'filter', 'blower'],
    skills: ['AC Diagnostics', 'Cooling System Repair', 'Gas Charging', 'Filter Cleaning'],
    urgencyRules: [{ word: 'smoke', urgency: 'emergency' }, { word: 'burning', urgency: 'emergency' }, { word: 'heatwave', urgency: 'high' }]
  },
  {
    category: 'Electrical',
    keywords: ['spark', 'wiring', 'switch', 'socket', 'fuse', 'short circuit', 'power', 'tripping', 'mcb', 'light'],
    skills: ['Electrical Wiring', 'Circuit Breaker Repair', 'Switch & Socket Installation', 'Fault Finding'],
    urgencyRules: [{ word: 'spark', urgency: 'emergency' }, { word: 'smoke', urgency: 'emergency' }, { word: 'shock', urgency: 'emergency' }]
  },
  {
    category: 'Appliance Repair',
    keywords: ['washing machine', 'refrigerator', 'fridge', 'microwave', 'oven', 'dishwasher', 'dryer'],
    skills: ['Washing Machine Repair', 'Refrigerator Repair', 'Appliance Diagnostics'],
    urgencyRules: [{ word: 'water leaking', urgency: 'high' }]
  },
  {
    category: 'Cleaning',
    keywords: ['deep clean', 'clean', 'sanitize', 'dusting', 'sofa clean', 'kitchen clean', 'bathroom clean'],
    skills: ['Deep Cleaning', 'Sanitization', 'Upholstery Cleaning'],
    urgencyRules: []
  },
  {
    category: 'Carpentry',
    keywords: ['wood', 'door', 'lock', 'hinge', 'furniture', 'cabinet', 'drawer', 'shelf'],
    skills: ['Furniture Repair', 'Door & Lock Repair', 'Cabinet Work'],
    urgencyRules: [{ word: 'jammed door', urgency: 'high' }]
  },
  {
    category: 'Painting',
    keywords: ['paint', 'wall', 'primer', 'color', 'whitewash', 'waterproofing'],
    skills: ['Interior Painting', 'Wall Prep', 'Waterproofing'],
    urgencyRules: []
  },
  {
    category: 'Pest Control',
    keywords: ['pest', 'termite', 'cockroach', 'bugs', 'rats', 'rodent', 'bed bugs', 'ants'],
    skills: ['Termite Treatment', 'General Pest Control', 'Rodent Management'],
    urgencyRules: [{ word: 'infestation', urgency: 'high' }]
  }
];

export class ClassificationService {
  /**
   * Classifies user service request text into category, skills, and urgency.
   */
  static async classifyRequest(description, customerSelectedCategory = null) {
    const validCategories = await Category.find({ isActive: true }).select('name requiredSkills').lean();
    const categoryNames = validCategories.map(c => c.name);

    const systemInstruction = `You are CareConnect's AI Service Request Classifier.
Analyze the customer's problem description and output structured JSON.
Allowed Categories: ${categoryNames.length ? categoryNames.join(', ') : 'Plumbing, Electrical, AC Repair, Appliance Repair, Cleaning, Carpentry, Painting, Pest Control'}.
Urgency must be one of: low, medium, high, emergency.`;

    const schema = {
      category: 'string',
      skills: ['string'],
      urgency: 'string'
    };

    let aiResult = await AIService.generateStructuredResponse({
      prompt: description,
      systemInstruction,
      schema
    });

    if (aiResult && aiResult.category && Array.isArray(aiResult.skills)) {
      // Validate category against available categories
      const matchedCategory = validCategories.find(c => c.name.toLowerCase() === aiResult.category.toLowerCase());
      const normalizedUrgency = ['low', 'medium', 'high', 'emergency'].includes(aiResult.urgency?.toLowerCase())
        ? aiResult.urgency.toLowerCase()
        : 'medium';

      return {
        category: matchedCategory ? matchedCategory.name : (customerSelectedCategory || aiResult.category),
        categoryId: matchedCategory ? matchedCategory._id : null,
        skills: aiResult.skills.length ? aiResult.skills : (matchedCategory?.requiredSkills || []),
        urgency: normalizedUrgency,
        status: 'completed',
        rawResponse: aiResult
      };
    }

    // Deterministic Rule-Based Fallback Engine
    return this.fallbackClassifier(description, validCategories, customerSelectedCategory);
  }

  static fallbackClassifier(description, validCategories = [], customerSelectedCategory = null) {
    const text = description.toLowerCase();
    let bestMatch = null;
    let maxKeywordHits = 0;

    for (const rule of KEYWORD_MAP) {
      const hits = rule.keywords.filter(kw => text.includes(kw)).length;
      if (hits > maxKeywordHits) {
        maxKeywordHits = hits;
        bestMatch = rule;
      }
    }

    let detectedCategory = customerSelectedCategory;
    let detectedSkills = [];
    let detectedUrgency = 'medium';

    if (bestMatch && maxKeywordHits > 0) {
      detectedCategory = detectedCategory || bestMatch.category;
      detectedSkills = bestMatch.skills;

      for (const ur of bestMatch.urgencyRules) {
        if (text.includes(ur.word)) {
          detectedUrgency = ur.urgency;
          break;
        }
      }
    }

    // Cross-reference with DB categories
    const matchedCategoryDoc = validCategories.find(c =>
      c.name.toLowerCase() === (detectedCategory || '').toLowerCase()
    );

    if (matchedCategoryDoc) {
      detectedCategory = matchedCategoryDoc.name;
      if (!detectedSkills.length && matchedCategoryDoc.requiredSkills?.length) {
        detectedSkills = matchedCategoryDoc.requiredSkills;
      }
    }

    return {
      category: detectedCategory || 'General Maintenance',
      categoryId: matchedCategoryDoc ? matchedCategoryDoc._id : null,
      skills: detectedSkills.length ? detectedSkills : ['General Inspection', 'Diagnostics'],
      urgency: detectedUrgency,
      status: detectedCategory ? 'completed' : 'pending',
      rawResponse: { fallback: true, maxKeywordHits }
    };
  }
}
