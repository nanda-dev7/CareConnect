import { Availability } from '../models/Availability.js';
import { Provider } from '../models/Provider.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { ROLES } from '../utils/constants.js';

export const getAvailability = async (req, res, next) => {
  try {
    let providerId = req.query.providerId;

    if (!providerId && req.user.role === ROLES.PROVIDER) {
      const provider = await Provider.findOne({ userId: req.user._id });
      if (provider) providerId = provider._id;
    }

    if (!providerId) {
      return sendError(res, 400, 'Provider ID is required', 'MISSING_PARAM');
    }

    const schedule = await Availability.find({ providerId }).sort({ dayOfWeek: 1, startTime: 1 });
    return sendSuccess(res, 200, 'Availability schedule retrieved', schedule);
  } catch (error) {
    next(error);
  }
};

export const createAvailability = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      return sendError(res, 404, 'Provider profile not found', 'NOT_FOUND');
    }

    const { dayOfWeek, startTime, endTime, isAvailable = true } = req.body;

    if (startTime >= endTime) {
      return sendError(res, 400, 'Start time must be earlier than end time', 'INVALID_TIME_RANGE');
    }

    const slot = await Availability.create({
      providerId: provider._id,
      dayOfWeek,
      startTime,
      endTime,
      isAvailable
    });

    return sendSuccess(res, 201, 'Availability slot created successfully', slot);
  } catch (error) {
    next(error);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      return sendError(res, 404, 'Provider profile not found', 'NOT_FOUND');
    }

    const slot = await Availability.findById(req.params.id);
    if (!slot) {
      return sendError(res, 404, 'Availability slot not found', 'NOT_FOUND');
    }

    if (slot.providerId.toString() !== provider._id.toString()) {
      return sendError(res, 403, 'You can only update your own availability schedule', 'ACCESS_DENIED');
    }

    const { dayOfWeek, startTime, endTime, isAvailable } = req.body;
    if (dayOfWeek) slot.dayOfWeek = dayOfWeek;
    if (startTime) slot.startTime = startTime;
    if (endTime) slot.endTime = endTime;
    if (isAvailable !== undefined) slot.isAvailable = isAvailable;

    if (slot.startTime >= slot.endTime) {
      return sendError(res, 400, 'Start time must be earlier than end time', 'INVALID_TIME_RANGE');
    }

    await slot.save();
    return sendSuccess(res, 200, 'Availability slot updated successfully', slot);
  } catch (error) {
    next(error);
  }
};

export const deleteAvailability = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ userId: req.user._id });
    if (!provider) {
      return sendError(res, 404, 'Provider profile not found', 'NOT_FOUND');
    }

    const slot = await Availability.findById(req.params.id);
    if (!slot) {
      return sendError(res, 404, 'Availability slot not found', 'NOT_FOUND');
    }

    if (slot.providerId.toString() !== provider._id.toString()) {
      return sendError(res, 403, 'You can only delete your own availability schedule', 'ACCESS_DENIED');
    }

    await Availability.findByIdAndDelete(req.params.id);
    return sendSuccess(res, 200, 'Availability slot removed successfully');
  } catch (error) {
    next(error);
  }
};
