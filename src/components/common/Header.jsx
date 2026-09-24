import { useState, useEffect } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../../context/AuthContext';
import { notificationApi } from '../../services/api';

export default function Header({ activeTab, setActiveTab, openAuthModal, onOpenNotifications }) {
  const { user, logout, quickDemoLogin, isAuthenticated, role } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      notificationApi.getAll()
        .then(res => {
          if (res.success && res.data) {
            const unread = res.data.filter(n => !n.isRead).length;
            setUnreadCount(unread);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, activeTab]);

  const handleDemoSwitch = async (roleKey) => {
    setDemoDropdownOpen(false);
    try {
      await quickDemoLogin(roleKey);
      if (roleKey === 'customer') setActiveTab('customer-requests');
      else if (roleKey === 'provider') setActiveTab('provider-jobs');
      else if (roleKey === 'admin') setActiveTab('admin-dashboard');
      else if (roleKey === 'operations') setActiveTab('operations-dashboard');
      else if (roleKey === 'support') setActiveTab('support-dashboard');
    } catch (err) {
      console.error('Demo login failed', err);
    }
  };

  const getRoleBadgeClass = (r) => {
    switch (r) {
      case 'admin': return 'badge-danger';
      case 'operations': return 'badge-warning';
      case 'support': return 'badge-secondary';
      case 'provider': return 'badge-primary';
      case 'customer': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('explore')}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            fontWeight: 800,
            fontSize: '1.4rem',
            color: '#fff'
          }}>
            C
          </div>
          <div>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CareConnect
            </span>
            <div style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 600, letterSpacing: '0.08em', marginTop: '-4px' }}>
              AI HOME SERVICES PLATFORM
            </div>
          </div>
        </div>

        {/* Role Navigation Links */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'explore' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('explore')}
          >
            🔍 Explore Services
          </button>

          {role === 'customer' && (
            <>
              <button
                className={`btn btn-sm ${activeTab === 'ai-request' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('ai-request')}
              >
                ✨ AI Book Service
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'customer-bookings' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('customer-bookings')}
              >
                📋 My Bookings
              </button>
            </>
          )}

          {role === 'provider' && (
            <>
              <button
                className={`btn btn-sm ${activeTab === 'provider-feed' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('provider-feed')}
              >
                🎯 Requests Feed
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'provider-jobs' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('provider-jobs')}
              >
                🛠 Active Jobs
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'provider-schedule' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('provider-schedule')}
              >
                📅 Availability
              </button>
            </>
          )}

          {role === 'admin' && (
            <>
              <button
                className={`btn btn-sm ${activeTab === 'admin-dashboard' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('admin-dashboard')}
              >
                📊 Admin Dashboard
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'admin-verifications' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('admin-verifications')}
              >
                🛡 Provider Verifications
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'admin-audit' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveTab('admin-audit')}
              >
                📜 Audit Logs
              </button>
            </>
          )}

          {role === 'operations' && (
            <button
              className={`btn btn-sm ${activeTab === 'operations-dashboard' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('operations-dashboard')}
            >
              ⚙ Operations Hub
            </button>
          )}

          {role === 'support' && (
            <button
              className={`btn btn-sm ${activeTab === 'support-dashboard' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('support-dashboard')}
            >
              🎧 Support Hub
            </button>
          )}
        </nav>

        {/* User Controls & Demo Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Quick Demo Switcher Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-sm btn-outline"
              style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)' }}
              onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
            >
              ⚡ Demo Switcher ▾
            </button>

            {demoDropdownOpen && (
              <div className="glass-panel" style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                width: '240px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                zIndex: 200,
                boxShadow: 'var(--shadow-lg)'
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, padding: '4px 8px' }}>
                  SWITCH DEMO ROLE
                </div>
                {Object.keys(DEMO_CREDENTIALS).map((rk) => (
                  <button
                    key={rk}
                    onClick={() => handleDemoSwitch(rk)}
                    style={{
                      background: role === rk ? 'var(--primary-light)' : 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>{rk}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{DEMO_CREDENTIALS[rk].name}</div>
                    </div>
                    {role === rk && <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Notification Button */}
              <button
                className="btn btn-outline btn-sm"
                onClick={onOpenNotifications}
                style={{ position: 'relative', padding: '6px 10px' }}
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: 'var(--danger)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Profile info & Role Badge */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.name}</div>
                <span className={`badge ${getRoleBadgeClass(user.role)}`}>{user.role}</span>
              </div>

              <button className="btn btn-outline btn-sm" onClick={logout} style={{ color: 'var(--danger)' }}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => openAuthModal('login')}>
                Log In
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => openAuthModal('register')}>
                Sign Up
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
