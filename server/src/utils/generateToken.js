import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN }
  );
};
