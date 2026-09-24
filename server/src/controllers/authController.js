import { User } from '../models/User.js';
import { Provider } from '../models/Provider.js';
import { generateToken } from '../utils/generateToken.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { ROLES, PROVIDER_STATUS } from '../utils/constants.js';
import { AuditService } from '../services/auditService.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role = ROLES.CUSTOMER, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'An account with this email address already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role === ROLES.PROVIDER ? ROLES.PROVIDER : ROLES.CUSTOMER,
      address: address || {}
    });

    let providerProfile = null;
    if (user.role === ROLES.PROVIDER) {
      providerProfile = await Provider.create({
        userId: user._id,
        verificationStatus: PROVIDER_STATUS.PENDING,
        skills: req.body.skills || [],
        categories: req.body.categories || [],
        serviceAreas: req.body.serviceAreas || (address?.city ? [address.city] : ['Hyderabad'])
      });
    }

    const token = generateToken(user._id, user.role);

    await AuditService.logAction({
      userId: user._id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user._id,
      metadata: { email: user.email, role: user.role },
      req
    });

    return sendSuccess(res, 201, 'Registration successful', {
      user,
      provider: providerProfile,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'Your account is deactivated. Please contact support.', 'ACCOUNT_DEACTIVATED');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }

    let providerProfile = null;
    if (user.role === ROLES.PROVIDER) {
      providerProfile = await Provider.findOne({ userId: user._id });
    }

    const token = generateToken(user._id, user.role);

    return sendSuccess(res, 200, 'Login successful', {
      user,
      provider: providerProfile,
      token
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    let providerProfile = null;
    if (req.user.role === ROLES.PROVIDER) {
      providerProfile = await Provider.findOne({ userId: req.user._id });
    }

    return sendSuccess(res, 200, 'Current user profile retrieved', {
      user: req.user,
      provider: providerProfile
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  return sendSuccess(res, 200, 'Logged out successfully');
};

export const createPrivilegedUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'An account with this email address already exists', 'EMAIL_ALREADY_EXISTS');
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
      address: address || {}
    });

    await AuditService.logAction({
      userId: req.user._id,
      action: 'PRIVILEGED_USER_CREATED',
      entityType: 'User',
      entityId: user._id,
      metadata: { createdRole: role, targetEmail: email },
      req
    });

    return sendSuccess(res, 201, `${role} account created successfully`, { user });
  } catch (error) {
    next(error);
  }
};
