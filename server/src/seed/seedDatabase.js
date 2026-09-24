import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Skill } from '../models/Skill.js';
import { Provider } from '../models/Provider.js';
import { Availability } from '../models/Availability.js';
import { ServiceRequest } from '../models/ServiceRequest.js';
import { Quote } from '../models/Quote.js';
import { Booking } from '../models/Booking.js';
import { Invoice } from '../models/Invoice.js';
import { Review } from '../models/Review.js';
import { Dispute } from '../models/Dispute.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { PricingRule } from '../models/PricingRule.js';
import {
  ROLES,
  PROVIDER_STATUS,
  REQUEST_STATUS,
  QUOTE_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  DISPUTE_STATUS
} from '../utils/constants.js';

export const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(ENV.MONGO_URI);
    console.log('[Seed] Connected.');

    // Clear existing collections
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Skill.deleteMany({}),
      Provider.deleteMany({}),
      Availability.deleteMany({}),
      ServiceRequest.deleteMany({}),
      Quote.deleteMany({}),
      Booking.deleteMany({}),
      Invoice.deleteMany({}),
      Review.deleteMany({}),
      Dispute.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      PricingRule.deleteMany({})
    ]);

    console.log('[Seed] Creating System Categories & Skills...');
    const categoryData = [
      {
        name: 'Plumbing',
        description: 'Complete plumbing repairs, leak fixes, tap installations, and drainage solutions.',
        basePrice: 350,
        skills: ['Pipe Repair', 'Leak Detection', 'Sink Repair', 'Drain Cleaning']
      },
      {
        name: 'AC Repair',
        description: 'Air conditioner servicing, gas charging, cooling issues, and diagnostics.',
        basePrice: 499,
        skills: ['AC Diagnostics', 'Cooling System Repair', 'Gas Charging', 'Filter Cleaning']
      },
      {
        name: 'Electrical',
        description: 'Wiring issues, short circuits, switchboard repairs, and lighting fixtures.',
        basePrice: 300,
        skills: ['Electrical Wiring', 'Circuit Breaker Repair', 'Switch & Socket Installation', 'Fault Finding']
      },
      {
        name: 'Appliance Repair',
        description: 'Repair services for washing machines, refrigerators, microwaves, and dishwashers.',
        basePrice: 400,
        skills: ['Washing Machine Repair', 'Refrigerator Repair', 'Appliance Diagnostics']
      },
      {
        name: 'Cleaning',
        description: 'Full house deep cleaning, kitchen sanitization, sofa, and bathroom cleaning.',
        basePrice: 799,
        skills: ['Deep Cleaning', 'Sanitization', 'Upholstery Cleaning']
      },
      {
        name: 'Carpentry',
        description: 'Furniture repair, door locks, hinges, cabinets, and woodwork.',
        basePrice: 350,
        skills: ['Furniture Repair', 'Door & Lock Repair', 'Cabinet Work']
      },
      {
        name: 'Painting',
        description: 'Interior wall painting, touch-ups, waterproofing, and exterior coatings.',
        basePrice: 1200,
        skills: ['Interior Painting', 'Wall Prep', 'Waterproofing']
      },
      {
        name: 'Pest Control',
        description: 'Termite inspection, cockroach treatment, bed bugs, and rodent control.',
        basePrice: 850,
        skills: ['Termite Treatment', 'General Pest Control', 'Rodent Management']
      }
    ];

    const createdCategories = {};
    for (const cat of categoryData) {
      const categoryDoc = await Category.create({
        name: cat.name,
        description: cat.description,
        requiredSkills: cat.skills,
        basePrice: cat.basePrice
      });
      createdCategories[cat.name] = categoryDoc;

      for (const skillName of cat.skills) {
        await Skill.create({
          name: skillName,
          description: `Skill for ${cat.name}`,
          categoryId: categoryDoc._id
        });
      }

      await PricingRule.create({
        categoryId: categoryDoc._id,
        categoryName: cat.name,
        basePrice: cat.basePrice,
        emergencyFee: 200,
        weekendFee: 150,
        serviceFee: 50
      });
    }

    console.log('[Seed] Creating Privileged Users (1 Admin, 1 Operations, 1 Support)...');
    const adminUser = await User.create({
      name: 'Priya Sharma (Admin)',
      email: 'admin@careconnect.com',
      password: 'Password123!',
      phone: '+91 98765 43210',
      role: ROLES.ADMIN,
      address: { city: 'Hyderabad', state: 'Telangana', street: 'Hitech City Road' }
    });

    const opsUser = await User.create({
      name: 'Vikram Reddy (Operations)',
      email: 'operations@careconnect.com',
      password: 'Password123!',
      phone: '+91 98765 43211',
      role: ROLES.OPERATIONS,
      address: { city: 'Hyderabad', state: 'Telangana', street: 'Madhapur' }
    });

    const supportUser = await User.create({
      name: 'Ananya Verma (Support)',
      email: 'support@careconnect.com',
      password: 'Password123!',
      phone: '+91 98765 43212',
      role: ROLES.SUPPORT,
      address: { city: 'Hyderabad', state: 'Telangana', street: 'Gachibowli' }
    });

    console.log('[Seed] Creating 5 Customer Accounts...');
    const customer1 = await User.create({
      name: 'Rahul Mehta',
      email: 'customer1@gmail.com',
      password: 'Password123!',
      phone: '+91 91234 56780',
      role: ROLES.CUSTOMER,
      address: { street: 'Flat 402, Sunshine Apts', city: 'Hyderabad', state: 'Telangana', zipCode: '500081' }
    });

    const customer2 = await User.create({
      name: 'Sneha Patel',
      email: 'customer2@gmail.com',
      password: 'Password123!',
      phone: '+91 91234 56781',
      role: ROLES.CUSTOMER,
      address: { street: 'House 12, Jubilee Hills', city: 'Hyderabad', state: 'Telangana', zipCode: '500033' }
    });

    const customer3 = await User.create({
      name: 'Arjun Rao',
      email: 'customer3@gmail.com',
      password: 'Password123!',
      phone: '+91 91234 56782',
      role: ROLES.CUSTOMER,
      address: { street: 'B-303, Kondapur Heights', city: 'Hyderabad', state: 'Telangana', zipCode: '500084' }
    });

    const customer4 = await User.create({
      name: 'Kavita Singh',
      email: 'customer4@gmail.com',
      password: 'Password123!',
      phone: '+91 91234 56783',
      role: ROLES.CUSTOMER,
      address: { street: 'Villa 7, Gachibowli Palm Meadows', city: 'Hyderabad', state: 'Telangana', zipCode: '500032' }
    });

    const customer5 = await User.create({
      name: 'Aditya Roy',
      email: 'customer5@gmail.com',
      password: 'Password123!',
      phone: '+91 91234 56784',
      role: ROLES.CUSTOMER,
      address: { street: 'Flat 101, Banjara Heritage', city: 'Hyderabad', state: 'Telangana', zipCode: '500034' }
    });

    console.log('[Seed] Creating Providers (Verified & Pending)...');
    const providerSpecs = [
      {
        name: 'Ravi Kumar (Apex Plumbing)',
        email: 'provider.plumbing@careconnect.com',
        phone: '+91 99887 76650',
        categories: ['Plumbing'],
        skills: ['Pipe Repair', 'Leak Detection', 'Sink Repair', 'Drain Cleaning'],
        experience: 8,
        rating: 4.9,
        totalReviews: 42,
        serviceAreas: ['Hyderabad', 'Madhapur', 'Hitech City', 'Kondapur'],
        verificationStatus: PROVIDER_STATUS.VERIFIED
      },
      {
        name: 'Suresh Reddy (Spark Electricals)',
        email: 'provider.electrical@careconnect.com',
        phone: '+91 99887 76652',
        categories: ['Electrical'],
        skills: ['Electrical Wiring', 'Circuit Breaker Repair', 'Switch & Socket Installation', 'Fault Finding'],
        experience: 10,
        rating: 4.95,
        totalReviews: 58,
        serviceAreas: ['Hyderabad', 'Jubilee Hills', 'Banjara Hills', 'Madhapur'],
        verificationStatus: PROVIDER_STATUS.VERIFIED
      },
      {
        name: 'Mohammad Tariq (CoolAir AC Care)',
        email: 'provider.ac@careconnect.com',
        phone: '+91 99887 76651',
        categories: ['AC Repair'],
        skills: ['AC Diagnostics', 'Cooling System Repair', 'Gas Charging', 'Filter Cleaning'],
        experience: 6,
        rating: 4.8,
        totalReviews: 35,
        serviceAreas: ['Hyderabad', 'Gachibowli', 'Hitech City', 'Kondapur'],
        verificationStatus: PROVIDER_STATUS.VERIFIED
      },
      {
        name: 'Ganesh Acharya (Master Woodworks)',
        email: 'provider.carpentry@careconnect.com',
        phone: '+91 99887 76654',
        categories: ['Carpentry'],
        skills: ['Furniture Repair', 'Door & Lock Repair', 'Cabinet Work'],
        experience: 12,
        rating: 4.85,
        totalReviews: 44,
        serviceAreas: ['Hyderabad', 'Kondapur', 'Miyapur', 'Kukatpally'],
        verificationStatus: PROVIDER_STATUS.VERIFIED
      },
      {
        name: 'Amit Joshi (Urban Cleaners)',
        email: 'provider.pending@careconnect.com',
        phone: '+91 99887 76699',
        categories: ['Cleaning'],
        skills: ['Deep Cleaning', 'Sanitization'],
        experience: 3,
        rating: 4.5,
        totalReviews: 0,
        serviceAreas: ['Hyderabad', 'Madhapur'],
        verificationStatus: PROVIDER_STATUS.PENDING
      }
    ];

    const createdProviders = [];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const spec of providerSpecs) {
      const pUser = await User.create({
        name: spec.name,
        email: spec.email,
        password: 'Password123!',
        phone: spec.phone,
        role: ROLES.PROVIDER,
        address: { city: 'Hyderabad', state: 'Telangana', street: 'Service Hub' }
      });

      const pDoc = await Provider.create({
        userId: pUser._id,
        categories: spec.categories,
        skills: spec.skills,
        experience: spec.experience,
        rating: spec.rating,
        totalReviews: spec.totalReviews,
        completedJobs: spec.totalReviews,
        serviceAreas: spec.serviceAreas,
        verificationStatus: spec.verificationStatus,
        isAvailable: true,
        pricing: { hourlyRate: 350, calloutFee: 100, emergencyRate: 500 },
        documents: [
          { name: 'Government ID Proof', url: '/uploads/demo-id.png', type: 'identity' },
          { name: 'Trade Skill Certificate', url: '/uploads/demo-cert.pdf', type: 'certification' }
        ]
      });

      createdProviders.push({ user: pUser, provider: pDoc });

      for (const day of daysOfWeek) {
        await Availability.create({
          providerId: pDoc._id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '19:00',
          isAvailable: true
        });
      }
    }

    console.log('[Seed] Creating Sample Workflows (Requests, Quotes, Bookings, Reviews, Disputes)...');
    
    // 1. Completed Booking with Review & Invoice
    const acReq = await ServiceRequest.create({
      customerId: customer1._id,
      description: 'My split AC is running but blowing warm air and not cooling the bedroom.',
      categoryId: createdCategories['AC Repair']._id,
      categoryName: 'AC Repair',
      requiredSkills: ['AC Diagnostics', 'Cooling System Repair'],
      urgency: 'high',
      location: customer1.address,
      preferredDate: new Date(Date.now() - 86400000),
      preferredTime: '11:00',
      aiClassification: {
        category: 'AC Repair',
        skills: ['AC Diagnostics', 'Cooling System Repair'],
        urgency: 'high',
        status: 'completed'
      },
      status: REQUEST_STATUS.COMPLETED
    });

    const acProvider = createdProviders.find(p => p.provider.categories.includes('AC Repair')).provider;
    const acQuote = await Quote.create({
      requestId: acReq._id,
      providerId: acProvider._id,
      price: 550,
      estimatedDuration: '2 hours',
      availableDate: new Date(Date.now() - 86400000),
      availableTime: '11:00',
      message: 'Will check compressor pressure and inspect cooling coil for leaks.',
      status: QUOTE_STATUS.ACCEPTED
    });

    const acBooking = await Booking.create({
      requestId: acReq._id,
      customerId: customer1._id,
      providerId: acProvider._id,
      quoteId: acQuote._id,
      date: new Date(Date.now() - 86400000),
      startTime: '11:00',
      endTime: '13:00',
      location: customer1.address,
      price: 550,
      status: BOOKING_STATUS.CUSTOMER_CONFIRMED,
      completedAt: new Date(Date.now() - 86400000),
      confirmedAt: new Date(Date.now() - 86400000)
    });

    const acInvoice = await Invoice.create({
      bookingId: acBooking._id,
      customerId: customer1._id,
      providerId: acProvider._id,
      basePrice: 550,
      partsCost: 0,
      serviceFee: 50,
      total: 600,
      paymentStatus: PAYMENT_STATUS.PAID,
      paidAt: new Date(Date.now() - 86400000)
    });

    await Review.create({
      bookingId: acBooking._id,
      customerId: customer1._id,
      providerId: acProvider._id,
      rating: 5,
      comment: 'Very professional! Identified the gas leak quickly and refilled it. AC is cooling well now.'
    });

    // 2. Scheduled Booking
    const plumbingReq = await ServiceRequest.create({
      customerId: customer2._id,
      description: 'Kitchen sink pipe has a steady drip under the cabinet.',
      categoryId: createdCategories['Plumbing']._id,
      categoryName: 'Plumbing',
      requiredSkills: ['Sink Repair', 'Leak Detection'],
      urgency: 'medium',
      location: customer2.address,
      preferredDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      preferredTime: '14:00',
      aiClassification: {
        category: 'Plumbing',
        skills: ['Sink Repair', 'Leak Detection'],
        urgency: 'medium',
        status: 'completed'
      },
      status: REQUEST_STATUS.BOOKED
    });

    const plumbingProvider = createdProviders.find(p => p.provider.categories.includes('Plumbing')).provider;
    const plumbingQuote = await Quote.create({
      requestId: plumbingReq._id,
      providerId: plumbingProvider._id,
      price: 400,
      estimatedDuration: '1 hour',
      availableDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      availableTime: '14:00',
      message: 'Includes pipe seal replacement and leak testing.',
      status: QUOTE_STATUS.ACCEPTED
    });

    await Booking.create({
      requestId: plumbingReq._id,
      customerId: customer2._id,
      providerId: plumbingProvider._id,
      quoteId: plumbingQuote._id,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      startTime: '14:00',
      endTime: '15:30',
      location: customer2.address,
      price: 400,
      status: BOOKING_STATUS.SCHEDULED
    });

    // 3. In-Progress Booking with Dispute
    const electricalReq = await ServiceRequest.create({
      customerId: customer3._id,
      description: 'Main switchboard spark during power surge, need complete diagnostic.',
      categoryId: createdCategories['Electrical']._id,
      categoryName: 'Electrical',
      requiredSkills: ['Electrical Wiring', 'Circuit Breaker Repair'],
      urgency: 'high',
      location: customer3.address,
      preferredDate: new Date(),
      preferredTime: '09:00',
      aiClassification: {
        category: 'Electrical',
        skills: ['Electrical Wiring', 'Circuit Breaker Repair'],
        urgency: 'high',
        status: 'completed'
      },
      status: REQUEST_STATUS.BOOKED
    });

    const electricalProvider = createdProviders.find(p => p.provider.categories.includes('Electrical')).provider;
    const electricalQuote = await Quote.create({
      requestId: electricalReq._id,
      providerId: electricalProvider._id,
      price: 600,
      estimatedDuration: '2 hours',
      availableDate: new Date(),
      availableTime: '09:00',
      message: 'Will bring heavy duty voltage meters and spare circuit breakers.',
      status: QUOTE_STATUS.ACCEPTED
    });

    const electricalBooking = await Booking.create({
      requestId: electricalReq._id,
      customerId: customer3._id,
      providerId: electricalProvider._id,
      quoteId: electricalQuote._id,
      date: new Date(),
      startTime: '09:00',
      endTime: '11:00',
      location: customer3.address,
      price: 600,
      status: BOOKING_STATUS.IN_PROGRESS
    });

    await Dispute.create({
      bookingId: electricalBooking._id,
      customerId: customer3._id,
      providerId: electricalProvider._id,
      reason: 'Pricing / Charge Discrepancy',
      description: 'Provider mentioned extra fee for component inspection not agreed in quote.',
      status: DISPUTE_STATUS.OPEN
    });

    // 4. Open Request with Quotes received
    const carpentryReq = await ServiceRequest.create({
      customerId: customer4._id,
      description: 'Teak wood dining chair legs are wobbly and master bedroom wardrobe door hinge is loose.',
      categoryId: createdCategories['Carpentry']._id,
      categoryName: 'Carpentry',
      requiredSkills: ['Furniture Repair', 'Door & Lock Repair'],
      urgency: 'low',
      location: customer4.address,
      preferredDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      preferredTime: '15:00',
      aiClassification: {
        category: 'Carpentry',
        skills: ['Furniture Repair', 'Door & Lock Repair'],
        urgency: 'low',
        status: 'completed'
      },
      status: REQUEST_STATUS.QUOTED
    });

    const carpentryProvider = createdProviders.find(p => p.provider.categories.includes('Carpentry')).provider;
    await Quote.create({
      requestId: carpentryReq._id,
      providerId: carpentryProvider._id,
      price: 350,
      estimatedDuration: '1.5 hours',
      availableDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      availableTime: '15:00',
      message: 'Experienced carpenter with brass hinges and wood glue ready.',
      status: QUOTE_STATUS.PENDING
    });

    // 5. Fresh Open Request
    await ServiceRequest.create({
      customerId: customer5._id,
      description: 'Full kitchen deep cleaning and chimney degreasing before festival.',
      categoryId: createdCategories['Cleaning']._id,
      categoryName: 'Cleaning',
      requiredSkills: ['Deep Cleaning', 'Sanitization'],
      urgency: 'medium',
      location: customer5.address,
      preferredDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
      preferredTime: '10:00',
      aiClassification: {
        category: 'Cleaning',
        skills: ['Deep Cleaning', 'Sanitization'],
        urgency: 'medium',
        status: 'completed'
      },
      status: REQUEST_STATUS.OPEN
    });

    console.log('[Seed] Database successfully seeded with 1 Admin, 5 Customers, Providers, Categories, Requests, Quotes, Bookings, Reviews, and Disputes!');
    console.log('========================================================================');
    console.log(' Credentials:');
    console.log('   Admin:      admin@careconnect.com / Password123!');
    console.log('   Operations: operations@careconnect.com / Password123!');
    console.log('   Support:    support@careconnect.com / Password123!');
    console.log('   Customer 1: customer1@gmail.com / Password123!');
    console.log('   Customer 2: customer2@gmail.com / Password123!');
    console.log('   Customer 3: customer3@gmail.com / Password123!');
    console.log('   Customer 4: customer4@gmail.com / Password123!');
    console.log('   Customer 5: customer5@gmail.com / Password123!');
    console.log('   Provider 1: provider.plumbing@careconnect.com / Password123!');
    console.log('   Provider 2: provider.electrical@careconnect.com / Password123!');
    console.log('   Provider 3: provider.ac@careconnect.com / Password123!');
    console.log('   Provider 4: provider.pending@careconnect.com / Password123!');
    console.log('========================================================================');

    return true;
  } catch (err) {
    console.error('[Seed Error]', err);
    throw err;
  }
};

if (process.argv[1]?.includes('seedDatabase.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
