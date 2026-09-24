import { useState, useEffect } from 'react';
import { categoryApi, providerApi } from '../services/api';

export default function ExploreServices({ onBookCategory }) {
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minRating, setMinRating] = useState('0');
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [catRes, provRes] = await Promise.all([
          categoryApi.getAll(),
          providerApi.getAll()
        ]);

        if (catRes.success) setCategories(catRes.data || []);
        if (provRes.success) setProviders(provRes.data || []);
      } catch (err) {
        console.error('Failed to load explore data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleFilterSearch = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCategory) queryParams.append('category', selectedCategory);
      if (minRating > 0) queryParams.append('rating', minRating);
      if (searchLocation) queryParams.append('location', searchLocation);

      const res = await providerApi.getAll(queryParams.toString());
      if (res.success) setProviders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      
      {/* Hero Banner */}
      <div className="glass-panel" style={{
        padding: '40px 32px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.15))',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
          On-Demand Home Services, <span style={{ color: 'var(--secondary)' }}>Powered by AI</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '680px', margin: '0 auto 24px' }}>
          Describe your service issue in plain English. Our AI classifies your request, selects required skills, and matches top verified local providers in real-time.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => onBookCategory()}>
          ✨ Describe Problem with AI
        </button>
      </div>

      {/* Service Categories Grid */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🏷 Service Categories
      </h2>

      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading categories...</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '40px'
        }}>
          {categories.map((cat) => (
            <div key={cat._id} className="glass-panel glass-panel-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.15rem' }}>{cat.name}</h3>
                  <span className="badge badge-secondary">From ₹{cat.basePrice}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', minHeight: '40px' }}>
                  {cat.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                  {(cat.skills || cat.requiredSkills || []).map((sk, idx) => (
                    <span key={idx} className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{sk}</span>
                  ))}
                </div>
              </div>
              <button className="btn btn-outline btn-sm" style={{ width: '100%' }} onClick={() => onBookCategory(cat._id)}>
                Book {cat.name}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filter & Provider Search Bar */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>🔍 Search & Filter Verified Providers</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Category</label>
            <select className="form-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Minimum Rating</label>
            <select className="form-select" value={minRating} onChange={e => setMinRating(e.target.value)}>
              <option value="0">Any Rating</option>
              <option value="4">4.0+ ★</option>
              <option value="4.5">4.5+ ★</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Location / City</label>
            <input type="text" className="form-input" placeholder="e.g. Hyderabad" value={searchLocation} onChange={e => setSearchLocation(e.target.value)} />
          </div>

          <button className="btn btn-primary" onClick={handleFilterSearch}>
            Filter Providers
          </button>
        </div>
      </div>

      {/* Verified Providers List */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>⭐ Top Verified Providers ({providers.length})</h2>

      {providers.length === 0 ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No providers matching current filter criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {providers.map((prov) => (
            <div key={prov._id} className="glass-panel glass-panel-hover" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>{prov.userId?.name || 'Verified Service Provider'}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    📍 {prov.serviceAreas?.join(', ') || 'Hyderabad'}
                  </div>
                </div>
                <span className={`badge ${prov.verificationStatus === 'verified' ? 'badge-success' : 'badge-warning'}`}>
                  {prov.verificationStatus === 'verified' ? '✓ Verified' : prov.verificationStatus}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--warning)', fontWeight: 700 }}>★ {prov.rating ? prov.rating.toFixed(1) : '5.0'}</span>
                  <span style={{ color: 'var(--text-muted)' }}> ({prov.totalReviews || 0} reviews)</span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  💼 {prov.experience || 3} yrs exp
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(prov.skills || []).map((sk, i) => (
                    <span key={i} className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{sk}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rate: </span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{prov.pricing?.hourlyRate || 500}/hr</span>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => onBookCategory()}>
                  Request Service
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
