import { ServiceRequest } from '../models/ServiceRequest.js';
import { Provider } from '../models/Provider.js';
import { ClassificationService } from '../services/ai/classificationService.js';
import { MatchingService } from '../services/ai/matchingService.js';
import { NotificationService } from '../services/notificationService.js';
import { AuditService } from '../services/auditService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { ROLES, REQUEST_STATUS, NOTIFICATION_TYPES } from '../utils/constants.js';

export const createServiceRequest = async (req, res, next) => {
  try {
    const {
      description,
      categoryName,
      categoryId,
      urgency,
      location,
      preferredDate,
      preferredTime,
      attachments
    } = req.body;

    // Run AI Classification Engine (with domain fallback)
    const classification = await ClassificationService.classifyRequest(
      description,
      categoryName
    );

    const finalCategoryName = classification.category || categoryName || 'General Maintenance';
    const finalCategoryId = classification.categoryId || categoryId || null;
    const finalSkills = (classification.skills && classification.skills.length > 0)
      ? classification.skills
      : ['General Inspection'];
    const finalUrgency = urgency || classification.urgency || 'medium';

    const serviceRequest = await ServiceRequest.create({
      customerId: req.user._id,
      description,
      categoryId: finalCategoryId,
      categoryName: finalCategoryName,
      requiredSkills: finalSkills,
      urgency: finalUrgency,
      location: location || req.user.address || {},
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || '',
      attachments: attachments || [],
      aiClassification: {
        category: classification.category,
        skills: classification.skills,
        urgency: classification.urgency,
        status: classification.status,
        rawResponse: classification.rawResponse
      },
      status: REQUEST_STATUS.OPEN
    });

    // Find recommended providers
    const recommendedProviders = await MatchingService.matchProviders(serviceRequest, { limit: 5 });

    // Notify matching providers
    for (const match of recommendedProviders) {
      const pDoc = await Provider.findById(match.providerId).select('userId');
      if (pDoc?.userId) {
        await NotificationService.notifyUser({
          userId: pDoc.userId,
          title: 'New Service Request Available',
          message: `A new request matching your skills in "${finalCategoryName}" has been posted in ${serviceRequest.location.city || 'your area'}.`,
          type: NOTIFICATION_TYPES.REQUEST,
          relatedEntity: { entityType: 'ServiceRequest', entityId: serviceRequest._id }
        });
      }
    }

    // Notify Operations
    await NotificationService.notifyRole(ROLES.OPERATIONS, {
      title: 'New Service Request Created',
      message: `Request #${serviceRequest._id} created for ${finalCategoryName} (Urgency: ${finalUrgency})`,
      type: NOTIFICATION_TYPES.REQUEST,
      relatedEntity: { entityType: 'ServiceRequest', entityId: serviceRequest._id }
    });

    await AuditService.logAction({
      userId: req.user._id,
      action: 'SERVICE_REQUEST_CREATED',
      entityType: 'ServiceRequest',
      entityId: serviceRequest._id,
      metadata: { category: finalCategoryName, urgency: finalUrgency },
      req
    });

    return sendSuccess(res, 201, 'Service request created and classified successfully', {
      serviceRequest,
      aiClassification: serviceRequest.aiClassification,
      recommendedProviders
    });
  } catch (error) {
    next(error);
  }
};

export const getServiceRequests = async (req, res, next) => {
  try {
    const { status, category, urgency, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.categoryName = { $regex: new RegExp(category, 'i') };
    if (urgency) filter.urgency = urgency;

    // Role-specific scoping
    if (req.user.role === ROLES.CUSTOMER) {
      filter.customerId = req.user._id;
    } else if (req.user.role === ROLES.PROVIDER) {
      const provider = await Provider.findOne({ userId: req.user._id });
      if (provider && provider.categories?.length) {
        filter.categoryName = { $in: provider.categories };
        // Providers can only see open / matching requests unless quoting
        if (!filter.status) {
          filter.status = { $in: [REQUEST_STATUS.OPEN, REQUEST_STATUS.MATCHING, REQUEST_STATUS.QUOTED] };
        }
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ServiceRequest.countDocuments(filter);
    const requests = await ServiceRequest.find(filter)
      .populate('customerId', 'name email phone')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Service requests retrieved', requests, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

export const getServiceRequestById = async (req, res, next) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id).populate('customerId', 'name email phone address');
    if (!serviceRequest) {
      return sendError(res, 404, 'Service request not found', 'REQUEST_NOT_FOUND');
    }

    // Ownership check for customer
    if (
      req.user.role === ROLES.CUSTOMER &&
      serviceRequest.customerId._id.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, 'You do not have access to this service request', 'ACCESS_DENIED');
    }

    return sendSuccess(res, 200, 'Service request details retrieved', serviceRequest);
  } catch (error) {
    next(error);
  }
};

export const cancelServiceRequest = async (req, res, next) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    if (!serviceRequest) {
      return sendError(res, 404, 'Service request not found', 'REQUEST_NOT_FOUND');
    }

    if (
      req.user.role === ROLES.CUSTOMER &&
      serviceRequest.customerId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, 'You can only cancel your own service request', 'ACCESS_DENIED');
    }

    if ([REQUEST_STATUS.BOOKED, REQUEST_STATUS.COMPLETED].includes(serviceRequest.status)) {
      return sendError(res, 400, 'Cannot cancel a request that is already booked or completed. Use booking cancellation.', 'INVALID_STATUS');
    }

    serviceRequest.status = REQUEST_STATUS.CANCELLED;
    await serviceRequest.save();

    await AuditService.logAction({
      userId: req.user._id,
      action: 'SERVICE_REQUEST_CANCELLED',
      entityType: 'ServiceRequest',
      entityId: serviceRequest._id,
      req
    });

    return sendSuccess(res, 200, 'Service request cancelled successfully', serviceRequest);
  } catch (error) {
    next(error);
  }
};

export const updateServiceRequest = async (req, res, next) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);
    if (!serviceRequest) {
      return sendError(res, 404, 'Service request not found', 'REQUEST_NOT_FOUND');
    }

    if (
      req.user.role === ROLES.CUSTOMER &&
      serviceRequest.customerId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 403, 'You can only modify your own service request', 'ACCESS_DENIED');
    }

    if ([REQUEST_STATUS.BOOKED, REQUEST_STATUS.COMPLETED, REQUEST_STATUS.CANCELLED].includes(serviceRequest.status)) {
      return sendError(res, 400, 'Cannot modify a closed, booked, or completed request', 'INVALID_STATUS');
    }

    const { description, preferredDate, preferredTime, location, urgency } = req.body;
    if (description && description !== serviceRequest.description) {
      serviceRequest.description = description;
      const classification = await ClassificationService.classifyRequest(description);
      serviceRequest.aiClassification = {
        category: classification.category,
        skills: classification.skills,
        urgency: classification.urgency,
        status: classification.status,
        rawResponse: classification.rawResponse
      };
      if (classification.category) serviceRequest.categoryName = classification.category;
      if (classification.skills?.length) serviceRequest.requiredSkills = classification.skills;
    }

    if (preferredDate) serviceRequest.preferredDate = preferredDate;
    if (preferredTime) serviceRequest.preferredTime = preferredTime;
    if (location) serviceRequest.location = { ...serviceRequest.location, ...location };
    if (urgency) serviceRequest.urgency = urgency;

    await serviceRequest.save();

    return sendSuccess(res, 200, 'Service request updated successfully', serviceRequest);
  } catch (error) {
    next(error);
  }
};

