import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { login, register, quickDemoLogin } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' | 'register-customer' | 'register-provider'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Common Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [street, setStreet] = useState('');

  // Provider-specific fields
  const [experience, setExperience] = useState('5');
  const [hourlyRate, setHourlyRate] = useState('500');
  const [skills, setSkills] = useState(['Pipe Repair', 'Leak Detection']);
  const [categories, setCategories] = useState(['Plumbing']);
  const [serviceAreas, setServiceAreas] = useState(['Hyderabad', 'Banjara Hills']);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({
        name,
        email,
        password,
        phone,
        role: 'customer',
        address: { city, street }
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterProvider = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({
        name,
        email,
        password,
        phone,
        role: 'provider',
        address: { city, street },
        experience: Number(experience),
        pricing: { hourlyRate: Number(hourlyRate) },
        skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()),
        categories: Array.isArray(categories) ? categories : categories.split(',').map(c => c.trim()),
        serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : serviceAreas.split(',').map(a => a.trim())
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Provider registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (roleKey) => {
    setLoading(true);
    setError(null);
    try {
      await quickDemoLogin(roleKey);
      onClose();
    } catch (err) {
      setError(err.message || 'Quick demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '520px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        position: 'relative'
      }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '1.4rem',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', textAlign: 'center' }}>
          Welcome to <span style={{ color: 'var(--primary)' }}>CareConnect</span>
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Connect with trusted service professionals powered by AI matching
        </p>

        {/* Tab Headers */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <button
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'login' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'login' ? '#fff' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'register-customer' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'register-customer' ? '#fff' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('register-customer')}
          >
            Customer Sign Up
          </button>
          <button
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'register-provider' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'register-provider' ? '#fff' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab('register-provider')}
          >
            Provider Join
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-light)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: 'var(--danger)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. customer1@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            {/* DEMO ACCOUNTS QUICK LAUNCH */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '10px', textTransform: 'uppercase' }}>
                ⚡ Quick Demo One-Click Sign In
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => handleQuickDemo('customer')}>
                  👤 Customer
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => handleQuickDemo('provider')}>
                  🔧 Provider
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => handleQuickDemo('admin')}>
                  🛡 Admin
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => handleQuickDemo('operations')}>
                  ⚙ Operations
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => handleQuickDemo('support')} style={{ gridColumn: 'span 2' }}>
                  🎧 Support Agent
                </button>
              </div>
            </div>
          </form>
        )}

        {/* CUSTOMER REGISTER FORM */}
        {activeTab === 'register-customer' && (
          <form onSubmit={handleRegisterCustomer}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Arun Verma" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="arun@gmail.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Minimum 6 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98888 77777" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input type="text" className="form-input" value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Street / Area</label>
                <input type="text" className="form-input" value={street} onChange={e => setStreet(e.target.value)} placeholder="Banjara Hills" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Register as Customer'}
            </button>
          </form>
        )}

        {/* PROVIDER REGISTER FORM */}
        {activeTab === 'register-provider' && (
          <form onSubmit={handleRegisterProvider}>
            <div className="form-group">
              <label className="form-label">Business / Provider Name</label>
              <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Ravi Plumbing Services" />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="ravi@plumbing.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 97777 66666" />
              </div>
              <div className="form-group">
                <label className="form-label">Experience (Years)</label>
                <input type="number" className="form-input" value={experience} onChange={e => setExperience(e.target.value)} min="0" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Hourly Base Rate (₹)</label>
              <input type="number" className="form-input" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Categories (Comma-separated)</label>
              <input type="text" className="form-input" value={Array.isArray(categories) ? categories.join(', ') : categories} onChange={e => setCategories(e.target.value)} placeholder="Plumbing, AC Repair" />
            </div>
            <div className="form-group">
              <label className="form-label">Skills (Comma-separated)</label>
              <input type="text" className="form-input" value={Array.isArray(skills) ? skills.join(', ') : skills} onChange={e => setSkills(e.target.value)} placeholder="Pipe Repair, Leak Detection" />
            </div>
            <div className="form-group">
              <label className="form-label">Service Areas (Comma-separated)</label>
              <input type="text" className="form-input" value={Array.isArray(serviceAreas) ? serviceAreas.join(', ') : serviceAreas} onChange={e => setServiceAreas(e.target.value)} placeholder="Hyderabad, Banjara Hills" />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Submitting Application...' : 'Register as Provider'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
