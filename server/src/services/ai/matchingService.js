import { Provider } from '../../models/Provider.js';
import { Availability } from '../../models/Availability.js';
import { Booking } from '../../models/Booking.js';
import { PROVIDER_STATUS, MATCH_WEIGHTS, BOOKING_STATUS } from '../../utils/constants.js';

export class MatchingService {
  /**
   * Deterministically filters verified providers and calculates explainable weighted match scores.
   */
  static async matchProviders(serviceRequest, options = {}) {
    const { categoryName, requiredSkills = [], location, preferredDate, preferredTime } = serviceRequest;

    // 1. Filter: verified, active, matching category
    const query = {
      verificationStatus: PROVIDER_STATUS.VERIFIED,
      isAvailable: true
    };

    if (categoryName) {
      query.categories = { $regex: new RegExp(`^${categoryName}$`, 'i') };
    }

    const providers = await Provider.find(query).populate('userId', 'name email phone address').lean();

    if (!providers.length) {
      return [];
    }

    // Determine target day of week if preferredDate is provided
    let targetDayOfWeek = null;
    if (preferredDate) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      targetDayOfWeek = days[new Date(preferredDate).getDay()];
    }

    const scoredProviders = await Promise.all(providers.map(async (provider) => {
      // 2. Skill Match calculation (40%)
      const providerSkills = (provider.skills || []).map(s => s.toLowerCase());
      const neededSkills = (requiredSkills || []).map(s => s.toLowerCase());
      const matchedSkills = (requiredSkills || []).filter(s =>
        providerSkills.some(ps => ps.includes(s.toLowerCase()) || s.toLowerCase().includes(ps))
      );
      const skillScore = neededSkills.length > 0
        ? (matchedSkills.length / neededSkills.length)
        : 1.0;

      // 3. Service Area Match (20%)
      const reqCity = location?.city?.toLowerCase() || '';
      let areaScore = 0.5; // Neutral default
      if (reqCity && provider.serviceAreas?.length) {
        const areaMatched = provider.serviceAreas.some(area =>
          area.toLowerCase().includes(reqCity) || reqCity.includes(area.toLowerCase()) || area.toLowerCase() === 'all'
        );
        areaScore = areaMatched ? 1.0 : 0.2;
      } else if (!reqCity) {
        areaScore = 1.0;
      }

      // 4. Availability Check (20%)
      let availabilityScore = 0.8;
      let isAvailableForSlot = true;

      if (targetDayOfWeek && preferredTime) {
        const availSchedule = await Availability.findOne({
          providerId: provider._id,
          dayOfWeek: targetDayOfWeek,
          isAvailable: true
        }).lean();

        if (availSchedule) {
          // Check if preferredTime falls in [startTime, endTime]
          if (preferredTime >= availSchedule.startTime && preferredTime <= availSchedule.endTime) {
            availabilityScore = 1.0;
          } else {
            availabilityScore = 0.3;
            isAvailableForSlot = false;
          }
        } else {
          // If no specific day schedule is defined, assume standard available or neutral
          availabilityScore = 0.7;
        }

        // Check overlapping bookings
        if (preferredDate) {
          const startOfDay = new Date(preferredDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(preferredDate);
          endOfDay.setHours(23, 59, 59, 999);

          const conflict = await Booking.findOne({
            providerId: provider._id,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CUSTOMER_CONFIRMED] },
            startTime: { $lte: preferredTime },
            endTime: { $gte: preferredTime }
          });

          if (conflict) {
            availabilityScore = 0.0;
            isAvailableForSlot = false;
          }
        }
      }

      // 5. Rating Score (10%)
      const ratingScore = Math.min((provider.rating || 3.5) / 5.0, 1.0);

      // 6. Experience Score (10%)
      // Max experience cap for calculation is 10 years
      const expScore = Math.min((provider.experience || 1) / 10.0, 1.0);

      // Weighted Composite Score (0 - 100)
      const rawScore = (
        (skillScore * MATCH_WEIGHTS.SKILL_MATCH) +
        (areaScore * MATCH_WEIGHTS.AREA_MATCH) +
        (availabilityScore * MATCH_WEIGHTS.AVAILABILITY) +
        (ratingScore * MATCH_WEIGHTS.RATING) +
        (expScore * MATCH_WEIGHTS.EXPERIENCE)
      ) * 100;

      const finalMatchScore = Math.round(rawScore);

      // Explainable match reasons
      const reasons = [];
      if (skillScore >= 0.8) reasons.push('Strong skill alignment');
      if (areaScore >= 0.8) reasons.push('Local area provider');
      if (availabilityScore >= 0.9) reasons.push('Immediate schedule match');
      if (provider.rating >= 4.5) reasons.push('Top-rated provider');
      if (provider.experience >= 5) reasons.push(`${provider.experience}+ years experience`);

      return {
        providerId: provider._id,
        name: provider.userId?.name || provider.businessName || 'CareConnect Pro',
        skills: provider.skills || [],
        rating: provider.rating || 0,
        totalReviews: provider.totalReviews || 0,
        experience: provider.experience || provider.experienceYears || 0,
        pricing: provider.pricing,
        matchScore: finalMatchScore,
        matchedSkills,
        reasons,
        available: isAvailableForSlot,
        serviceArea: provider.serviceAreas?.[0] || 'Hyderabad',
        serviceAreas: provider.serviceAreas || []
      };
    }));

    // Rank descending by matchScore
    scoredProviders.sort((a, b) => b.matchScore - a.matchScore);

    const limit = options.limit || 10;
    return scoredProviders.slice(0, limit);
  }
}
