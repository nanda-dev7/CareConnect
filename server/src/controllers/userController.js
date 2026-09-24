import { User } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { AuditService } from '../services/auditService.js';

export const getProfile = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'User profile retrieved', req.user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) {
      user.address = {
        ...user.address.toObject(),
        ...address
      };
    }

    await user.save();
    return sendSuccess(res, 200, 'Profile updated successfully', user);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { role, isActive, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Users retrieved successfully', users, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, 'User not found', 'USER_NOT_FOUND');
    }
    return sendSuccess(res, 200, 'User details retrieved', user);
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return sendError(res, 400, 'Field isActive must be a boolean', 'INVALID_INPUT');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, 'User not found', 'USER_NOT_FOUND');
    }

    user.isActive = isActive;
    await user.save();

    await AuditService.logAction({
      userId: req.user._id,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: user._id,
      metadata: { targetEmail: user.email, isActive },
      req
    });

    return sendSuccess(res, 200, `User account ${isActive ? 'activated' : 'deactivated'} successfully`, user);
  } catch (error) {
    next(error);
  }
};
