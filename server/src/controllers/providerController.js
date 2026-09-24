import { Provider } from '../models/Provider.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { MatchingService } from '../services/ai/matchingService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { PROVIDER_STATUS, ROLES, NOTIFICATION_TYPES } from '../utils/constants.js';
import { NotificationService } from '../services/notificationService.js';
import { AuditService } from '../services/auditService.js';

export const createProviderProfile = async (req, res, next) => {
  try {
    const existing = await Provider.findOne({ userId: req.user._id });
    if (existing) {
      return sendError(res, 400, 'Provider profile already exists for this account', 'PROFILE_EXISTS');
    }

    const { businessName, bio, skills, categories, serviceAreas, experience, experienceYears, pricing } = req.body;
    const expVal = experienceYears !== undefined ? Number(experienceYears) : (experience !== undefined ? Number(experience) : 1);
    const provider = await Provider.create({
      userId: req.user._id,
      businessName: businessName || '',
      bio: bio || '',
      skills: skills || [],
      categories: categories || [],
      serviceAreas: serviceAreas || [],
      experience: expVal,
      experienceYears: expVal,
      pricing: pricing || {},
      verificationStatus: PROVIDER_STATUS.PENDING
    });

    return sendSuccess(res, 201, 'Provider profile created successfully. Pending verification.', provider);
  } catch (error) {
    next(error);
  }
};

export const getProviders = async (req, res, next) => {
  try {
    const { category, rating, location, verificationStatus = PROVIDER_STATUS.VERIFIED, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (verificationStatus) {
      filter.verificationStatus = verificationStatus;
    }
    if (category) {
      filter.categories = { $regex: new RegExp(category, 'i') };
    }
    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }
    if (location) {
      filter.serviceAreas = { $regex: new RegExp(location, 'i') };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Provider.countDocuments(filter);
    const providers = await Provider.find(filter)
      .populate('userId', 'name email phone address')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1, completedJobs: -1 });

    return sendSuccess(res, 200, 'Providers retrieved', providers, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

export const matchProvidersForRequest = async (req, res, next) => {
  try {
    const { requestId } = req.query;
    if (!requestId) {
      return sendError(res, 400, 'requestId query parameter is required', 'MISSING_PARAM');
    }

    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) {
      return sendError(res, 404, 'Service request not found', 'REQUEST_NOT_FOUND');
    }

    // Check customer permission
    if (
      req.user.role === ROLES.CUSTOMER &&
      serviceRequest.customerId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, 'You can only view matched providers for your own requests', 'ACCESS_DENIED');
    }

    const matchedProviders = await MatchingService.matchProviders(serviceRequest);

    return sendSuccess(res, 200, 'Matched providers retrieved successfully', {
      requestId: serviceRequest._id,
      categoryName: serviceRequest.categoryName,
      requiredSkills: serviceRequest.requiredSkills,
      providers: matchedProviders
    });
  } catch (error) {
    next(error);
  }
};

export const getMyProviderProfile = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id }).populate('userId', 'name email phone address');
    if (!provider) {
      return sendError(res, 404, 'Provider profile not found', 'NOT_FOUND');
    }
    return sendSuccess(res, 200, 'Provider profile retrieved', provider);
  } catch (error) {
    next(error);
  }
};

export const updateMyProviderProfile = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      return sendError(res, 404, 'Provider profile not found', 'NOT_FOUND');
    }

    const { businessName, bio, skills, categories, serviceAreas, experience, experienceYears, pricing, isAvailable } = req.body;
    if (businessName !== undefined) provider.businessName = businessName;
    if (bio !== undefined) provider.bio = bio;
    if (skills) provider.skills = skills;
    if (categories) provider.categories = categories;
    if (serviceAreas) provider.serviceAreas = serviceAreas;
    if (experienceYears !== undefined) {
      provider.experienceYears = Number(experienceYears);
      provider.experience = Number(experienceYears);
    } else if (experience !== undefined) {
      provider.experience = Number(experience);
      provider.experienceYears = Number(experience);
    }
    if (pricing) provider.pricing = { ...provider.pricing.toObject(), ...pricing };
    if (isAvailable !== undefined) provider.isAvailable = isAvailable;

    await provider.save();
    return sendSuccess(res, 200, 'Provider profile updated successfully', provider);
  } catch (error) {
    next(error);
  }
};

export const getPendingProviders = async (req, res, next) => {
  try {
    const pending = await Provider.find({ verificationStatus: PROVIDER_STATUS.PENDING })
      .populate('userId', 'name email phone address')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Pending providers retrieved', pending);
  } catch (error) {
    next(error);
  }
};

export const getProviderById = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id).populate('userId', 'name email phone address');
    if (!provider) {
      return sendError(res, 404, 'Provider not found', 'NOT_FOUND');
    }
    return sendSuccess(res, 200, 'Provider details retrieved', provider);
  } catch (error) {
    next(error);
  }
};

export const updateProviderStatus = (targetStatus) => {
  return async (req, res, next) => {
    try {
      const provider = await Provider.findById(req.params.id).populate('userId');
      if (!provider) {
        return sendError(res, 404, 'Provider not found', 'NOT_FOUND');
      }

      provider.verificationStatus = targetStatus;
      await provider.save();

      await AuditService.logAction({
        userId: req.user._id,
        action: `PROVIDER_${targetStatus.toUpperCase()}`,
        entityType: 'Provider',
        entityId: provider._id,
        metadata: { providerEmail: provider.userId?.email, status: targetStatus },
        req
      });

      if (provider.userId?._id) {
        await NotificationService.notifyUser({
          userId: provider.userId._id,
          title: `Provider Account ${targetStatus.toUpperCase()}`,
          message: `Your provider profile verification status has been updated to: ${targetStatus}`,
          type: NOTIFICATION_TYPES.SYSTEM,
          relatedEntity: { entityType: 'Provider', entityId: provider._id }
        });
      }

      return sendSuccess(res, 200, `Provider status changed to ${targetStatus}`, provider);
    } catch (error) {
      next(error);
    }
  };
};
