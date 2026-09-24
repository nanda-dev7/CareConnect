import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { serviceRequestApi, providerApi, categoryApi } from '../services/api';
import { notify } from '../components/common/Toast';

export default function AiServiceBooking({ initialCategoryId, onOpenAuthModal, onViewBookings }) {
  const { isAuthenticated, role } = useAuth();

  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [city, setCity] = useState('Hyderabad');
  const [street, setStreet] = useState('Banjara Hills');
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId || '');
  const [categories, setCategories] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [createdRequest, setCreatedRequest] = useState(null);
  const [matchedProviders, setMatchedProviders] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    categoryApi.getAll().then(res => {
      if (res.success) setCategories(res.data || []);
    }).catch(console.error);
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      notify('Please log in or sign up to create a service request', 'warning');
      onOpenAuthModal('login');
      return;
    }

    if (role !== 'customer') {
      notify(`Current active account is ${role}. Switch to Customer account to post requests.`, 'warning');
      return;
    }

    if (!description.trim()) {
      notify('Please enter a description of your issue', 'warning');
      return;
    }

    setSubmitting(true);
    setCreatedRequest(null);
    setMatchedProviders([]);

    try {
      const payload = {
        description,
        preferredDate,
        preferredTime,
        location: { city, street, addressLine: `${street}, ${city}` },
        categoryId: selectedCategoryId || undefined
      };

      const res = await serviceRequestApi.create(payload);

      if (res.success && res.data) {
        setCreatedRequest(res.data.serviceRequest);
        notify('Service request submitted & AI classification completed!', 'success');

        // Fetch AI Explainable Provider Recommendations
        fetchRecommendations(res.data.serviceRequest._id);
      }
    } catch (err) {
      notify(err.message || 'Failed to submit service request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchRecommendations = async (requestId) => {
    setLoadingMatches(true);
    try {
      const matchRes = await providerApi.match(requestId);
      if (matchRes.success && matchRes.data) {
        setMatchedProviders(matchRes.data.providers || []);
      }
    } catch (err) {
      console.error('Failed to fetch matched providers:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <span className="badge badge-primary" style={{ marginBottom: '8px' }}>🤖 CareConnect AI Engine</span>
        <h1 style={{ fontSize: '2.2rem' }}>AI-Powered Service Request & Provider Matching</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Describe your problem in your own words. Our AI extracts category, skills & urgency to match qualified local providers.
        </p>
      </div>

      {/* Main Request Form Panel */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '32px' }}>
        <form onSubmit={handleCreateRequest}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Describe your issue in detail *</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>✨ AI auto-detects required skills</span>
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. My kitchen sink is leaking continuously near the pipe joint and making a mess under the cabinet. Need someone urgently to inspect and repair the seal."
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category (Optional Manual Override)</label>
              <select className="form-select" value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)}>
                <option value="">Let AI Classify Automatically</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Preferred Date</label>
              <input type="date" className="form-input" value={preferredDate} onChange={e => setPreferredDate(e.target.value)} required />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Preferred Time</label>
              <select className="form-select" value={preferredTime} onChange={e => setPreferredTime(e.target.value)}>
                <option value="09:00 AM">09:00 AM - 11:00 AM</option>
                <option value="11:00 AM">11:00 AM - 01:00 PM</option>
                <option value="02:00 PM">02:00 PM - 04:00 PM</option>
                <option value="05:00 PM">05:00 PM - 07:00 PM</option>
              </select>
            </div>

          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">City</label>
              <input type="text" className="form-input" value={city} onChange={e => setCity(e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Street / Area Address</label>
              <input type="text" className="form-input" value={street} onChange={e => setStreet(e.target.value)} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? '🤖 AI Analyzing Request...' : 'Submit & Match Providers'}
          </button>
        </form>
      </div>

      {/* AI CLASSIFICATION RESULTS DISPLAY */}
      {createdRequest && (
        <div className="animate-fade-in" style={{ marginBottom: '32px' }}>
          
          <div className="glass-panel" style={{
            padding: '24px',
            borderLeft: '6px solid var(--secondary)',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(17, 24, 39, 0.8))',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span className="badge badge-secondary" style={{ marginBottom: '4px' }}>AI CLASSIFICATION RESULTS</span>
                <h2 style={{ fontSize: '1.4rem' }}>
                  Category: <span style={{ color: 'var(--secondary)' }}>{createdRequest.aiClassification?.category || 'General Repair'}</span>
                </h2>
              </div>
              <span className={`badge ${createdRequest.urgency === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                Urgency: {createdRequest.urgency || 'medium'}
              </span>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>REQUIRED SKILLS IDENTIFIED</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(createdRequest.requiredSkills || []).map((sk, idx) => (
                  <span key={idx} className="badge badge-primary">{sk}</span>
                ))}
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Status: <strong style={{ color: 'var(--accent)' }}>{createdRequest.status}</strong> — Request opened for verified providers.
            </div>
          </div>

          {/* EXPLAINABLE PROVIDER RECOMMENDATIONS */}
          <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎯 AI Explainable Provider Recommendations
          </h2>

          {loadingMatches ? (
            <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Calculating 5-factor weighted scores (Skills 40%, Area 20%, Availability 20%, Rating 10%, Experience 10%)...
            </div>
          ) : matchedProviders.length === 0 ? (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No verified providers found matching the required criteria in this service area. Providers in the system can view your open request in their feed and submit quotes.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {matchedProviders.map((rec) => (
                <div key={rec.providerId} className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {rec.name}
                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Verified Pro</span>
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        ★ {rec.rating} ({rec.totalReviews} reviews) • {rec.experience} yrs exp • {rec.serviceAreaMatch ? '📍 Area Match' : ''}
                      </div>
                    </div>

                    {/* MATCH SCORE PILL */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: rec.matchScore >= 80 ? 'var(--accent)' : 'var(--secondary)',
                        fontFamily: 'var(--font-heading)'
                      }}>
                        {rec.matchScore}% Match
                      </div>
                      <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>AI Explainable Score</span>
                    </div>
                  </div>

                  {/* FACTOR BREAKDOWN */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '12px',
                    fontSize: '0.75rem'
                  }}>
                    <div>Skill Match: <strong style={{ color: 'var(--accent)' }}>{rec.matchedSkills?.length} skill(s)</strong></div>
                    <div>Availability: <strong style={{ color: rec.available ? 'var(--accent)' : 'var(--warning)' }}>{rec.available ? 'Available' : 'Busy'}</strong></div>
                    <div>Area Match: <strong>{rec.serviceAreaMatch ? 'Yes' : 'Nearby'}</strong></div>
                    <div>Rating Factor: <strong>{(rec.rating * 20).toFixed(0)}%</strong></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Matched Skills: {rec.matchedSkills?.join(', ') || 'All required skills'}
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => onViewBookings()}>
                      Track Request & Quotes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
