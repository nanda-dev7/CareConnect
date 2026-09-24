import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { ENV } from './config/env.js';

// Middlewares
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import serviceRequestRoutes from './routes/serviceRequestRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import disputeRoutes from './routes/disputeRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import pricingRuleRoutes from './routes/pricingRuleRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import operationsRoutes from './routes/operationsRoutes.js';
import supportRoutes from './routes/supportRoutes.js';

export const createApp = () => {
  const app = express();

  // 1. Security Headers & CORS
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // 2. Rate Limiting (100 req/min for general API)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes',
      error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api', limiter);

  // 3. Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Request Logging
  if (ENV.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // 5. Static uploads directory for media files
  const uploadDir = path.resolve(process.cwd(), ENV.UPLOAD_DIR || 'uploads');
  app.use('/uploads', express.static(uploadDir));

  // 6. Health Check
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      service: 'CareConnect Backend',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // 7. Core Application Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/providers', providerRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/service-requests', serviceRequestRoutes);
  app.use('/api/requests', serviceRequestRoutes);
  app.use('/api/quotes', quoteRoutes);
  app.use('/api/availability', availabilityRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/invoices', invoiceRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/disputes', disputeRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/pricing-rules', pricingRuleRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/operations', operationsRoutes);
  app.use('/api/support', supportRoutes);

  // 8. 404 & Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
