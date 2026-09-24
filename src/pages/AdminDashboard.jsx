import { useState, useEffect } from 'react';
import { adminApi, providerApi, categoryApi, userApi, serviceRequestApi, bookingApi, disputeApi } from '../services/api';
import { notify } from '../components/common/Toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, providers, categories, requests, bookings, disputes, audit
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [providers, setProviders] = useState([]);
  const [pendingProviders, setPendingProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Category Modal Form State
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catBasePrice, setCatBasePrice] = useState('350');
  const [catSkills, setCatSkills] = useState('Pipe Repair, Leak Detection');

  // Dispute Resolve State
  const [resolvingDisputeId, setResolvingDisputeId] = useState(null);
  const [disputeResolutionText, setDisputeResolutionText] = useState('');

  const fetchAdminData = async () => {
    try {
      const [dashRes, provRes, pendingRes, catRes, userRes, reqRes, bookRes, dispRes, auditRes] = await Promise.all([
        adminApi.getDashboard().catch(() => ({ success: false })),
        providerApi.getAll().catch(() => ({ success: false })),
        providerApi.getPending().catch(() => ({ success: false })),
        categoryApi.getAll().catch(() => ({ success: false })),
        userApi.getAll().catch(() => ({ success: false })),
        serviceRequestApi.getAll().catch(() => ({ success: false })),
        bookingApi.getAll().catch(() => ({ success: false })),
        disputeApi.getAll().catch(() => ({ success: false })),
        adminApi.getAuditLogs().catch(() => ({ success: false }))
      ]);

      if (dashRes.success) setDashboardData(dashRes.data?.metrics || {});
      if (provRes.success) setProviders(provRes.data || []);
      if (pendingRes.success) setPendingProviders(pendingRes.data || []);
      if (catRes.success) setCategories(catRes.data || []);
      if (userRes.success) setUsers(userRes.data || []);
      if (reqRes.success) setRequests(reqRes.data || []);
      if (bookRes.success) setBookings(bookRes.data || []);
      if (dispRes.success) setDisputes(dispRes.data || []);
      if (auditRes.success) setAuditLogs(auditRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerifyProvider = async (id) => {
    try {
      const res = await providerApi.verify(id);
      if (res.success) {
        notify('Provider account verified successfully!', 'success');
        fetchAdminData();
      }
    } catch (err) {
      notify(err.message || 'Verification failed', 'error');
    }
  };

  const handleRejectProvider = async (id) => {
    try {
      const res = await providerApi.reject(id, 'Document requirements incomplete');
      if (res.success) {
        notify('Provider application rejected.', 'info');
        fetchAdminData();
      }
    } catch (err) {
      notify(err.message || 'Action failed', 'error');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await categoryApi.create({
        name: catName,
        description: catDesc,
        basePrice: Number(catBasePrice),
        skills: catSkills.split(',').map(s => s.trim())
      });
      if (res.success) {
        notify('New service category created!', 'success');
        setShowCatModal(false);
        setCatName('');
        setCatDesc('');
        fetchAdminData();
      }
    } catch (err) {
      notify(err.message || 'Failed to create category', 'error');
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!resolvingDisputeId || !disputeResolutionText.trim()) return;
    try {
      const res = await disputeApi.resolve(resolvingDisputeId, disputeResolutionText.trim());
      if (res.success) {
        notify('Dispute marked as resolved and customer notified!', 'success');
        setResolvingDisputeId(null);
        setDisputeResolutionText('');
        fetchAdminData();
      }
    } catch (err) {
      notify(err.message || 'Failed to resolve dispute', 'error');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'verified':
      case 'completed':
      case 'customer_confirmed':
      case 'resolved': return 'badge-success';
      case 'pending':
      case 'in_progress':
      case 'en_route':
      case 'open': return 'badge-warning';
      case 'scheduled':
      case 'booked': return 'badge-primary';
      case 'rejected':
      case 'cancelled': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="animate-fade-in">
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span className="badge badge-danger" style={{ marginBottom: '6px' }}>ADMINISTRATIVE CONTROL CENTER</span>
          <h1 style={{ fontSize: '2rem' }}>Platform Control & Administration</h1>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchAdminData}>
          🔄 Refresh Platform Data
        </button>
      </div>

      {/* ADMIN NAVIGATION TABS */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginBottom: '28px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px'
      }}>
        {[
          { id: 'overview', label: '📊 Dashboard Overview' },
          { id: 'users', label: `👥 Users (${users.length})` },
          { id: 'providers', label: `🛠 Providers (${providers.length})` },
          { id: 'categories', label: `🏷 Categories (${categories.length})` },
          { id: 'requests', label: `📨 Requests (${requests.length})` },
          { id: 'bookings', label: `📋 Bookings (${bookings.length})` },
          { id: 'disputes', label: `🚨 Disputes (${disputes.length})` },
          { id: 'audit', label: '📜 Audit Logs' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL USERS</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{dashboardData?.totalUsers || users.length || 0}</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL CUSTOMERS</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>{dashboardData?.totalCustomers || 0}</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL PROVIDERS</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>{dashboardData?.totalProviders || providers.length || 0}</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>VERIFIED PROVIDERS</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>{dashboardData?.verifiedProviders || 0}</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>PENDING PROVIDERS</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>{dashboardData?.pendingProviders || pendingProviders.length || 0}</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL REQUESTS</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>{dashboardData?.totalRequests || requests.length || 0}</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTIVE BOOKINGS</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>{dashboardData?.activeBookings || 0}</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>COMPLETED BOOKINGS</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>{dashboardData?.completedBookings || 0}</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>CANCELLED BOOKINGS</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>{dashboardData?.cancelledBookings || 0}</div>
            </div>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOTAL REVENUE</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>₹{dashboardData?.totalRevenue || 0}</div>
            </div>
          </div>

          {/* Quick Pending Provider Verification Box */}
          {pendingProviders.length > 0 && (
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', borderLeft: '4px solid var(--warning)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--warning)' }}>
                ⚠️ Provider Applications Requiring Verification ({pendingProviders.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pendingProviders.map(p => (
                  <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <strong>{p.userId?.name || 'Provider'}</strong> — {p.categories?.join(', ')} ({p.userId?.email})
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => handleVerifyProvider(p._id)}>Verify</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleRejectProvider(p._id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USERS LIST */}
      {activeTab === 'users' && (
        <div className="animate-fade-in glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Registered Platform Users</h2>
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No users found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px' }}>Email</th>
                    <th style={{ padding: '10px' }}>Phone</th>
                    <th style={{ padding: '10px' }}>Role</th>
                    <th style={{ padding: '10px' }}>City</th>
                    <th style={{ padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{u.name}</td>
                      <td style={{ padding: '10px' }}>{u.email}</td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                      <td style={{ padding: '10px' }}>
                        <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'provider' ? 'badge-primary' : 'badge-success'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>{u.address?.city || 'Hyderabad'}</td>
                      <td style={{ padding: '10px' }}>
                        <span className={`badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROVIDERS LIST */}
      {activeTab === 'providers' && (
        <div className="animate-fade-in glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>All Platform Service Providers</h2>
          {providers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No providers found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px' }}>Categories</th>
                    <th style={{ padding: '10px' }}>Experience</th>
                    <th style={{ padding: '10px' }}>Rating</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>{p.userId?.name || 'Provider'}</td>
                      <td style={{ padding: '10px' }}>{p.categories?.join(', ') || 'General'}</td>
                      <td style={{ padding: '10px' }}>{p.experience || p.experienceYears || 1} yrs</td>
                      <td style={{ padding: '10px' }}>★ {p.rating?.toFixed(1) || '5.0'} ({p.totalReviews || 0})</td>
                      <td style={{ padding: '10px' }}>
                        <span className={`badge ${getStatusBadgeClass(p.verificationStatus)}`}>
                          {p.verificationStatus}
                        </span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {p.verificationStatus === 'pending' ? (
                          <button className="btn btn-primary btn-sm" onClick={() => handleVerifyProvider(p._id)}>
                            Verify
                          </button>
                        ) : p.verificationStatus === 'verified' ? (
                          <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>✓ Verified</span>
                        ) : (
                          <button className="btn btn-outline btn-sm" onClick={() => handleVerifyProvider(p._id)}>
                            Re-Verify
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.3rem' }}>Service Categories & Base Pricing</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCatModal(true)}>
              ➕ Add Category
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
            {categories.map((cat) => (
              <div key={cat._id} className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '1.1rem' }}>{cat.name}</strong>
                  <span className="badge badge-secondary">Base ₹{cat.basePrice}</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{cat.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(cat.skills || cat.requiredSkills || []).map((s, i) => (
                    <span key={i} className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SERVICE REQUESTS */}
      {activeTab === 'requests' && (
        <div className="animate-fade-in glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>All Service Requests</h2>
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No service requests found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Description</th>
                    <th style={{ padding: '10px' }}>Category</th>
                    <th style={{ padding: '10px' }}>Customer</th>
                    <th style={{ padding: '10px' }}>Urgency</th>
                    <th style={{ padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px', maxWidth: '300px' }}>{r.description}</td>
                      <td style={{ padding: '10px' }}>{r.categoryName || r.categoryId?.name || 'General'}</td>
                      <td style={{ padding: '10px' }}>{r.customerId?.name || 'Customer'}</td>
                      <td style={{ padding: '10px' }}>
                        <span className={`badge ${r.urgency === 'high' ? 'badge-danger' : 'badge-neutral'}`}>
                          {r.urgency || 'medium'}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span className={`badge ${getStatusBadgeClass(r.status)}`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="animate-fade-in glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>All Platform Bookings</h2>
          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No bookings found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px' }}>Booking ID</th>
                    <th style={{ padding: '10px' }}>Customer</th>
                    <th style={{ padding: '10px' }}>Provider</th>
                    <th style={{ padding: '10px' }}>Date & Time</th>
                    <th style={{ padding: '10px' }}>Amount</th>
                    <th style={{ padding: '10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px', fontWeight: 600 }}>#{b._id.slice(-6)}</td>
                      <td style={{ padding: '10px' }}>{b.customerId?.name || 'Customer'}</td>
                      <td style={{ padding: '10px' }}>{b.providerId?.userId?.name || 'Provider'}</td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>
                        {new Date(b.date).toLocaleDateString()} at {b.startTime}
                      </td>
                      <td style={{ padding: '10px', fontWeight: 700, color: 'var(--accent)' }}>₹{b.price}</td>
                      <td style={{ padding: '10px' }}>
                        <span className={`badge ${getStatusBadgeClass(b.status)}`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: DISPUTES */}
      {activeTab === 'disputes' && (
        <div className="animate-fade-in glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Customer Disputes Management</h2>
          {disputes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No disputes recorded.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {disputes.map(d => (
                <div key={d._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--danger)' }}>{d.reason}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Customer: {d.customerId?.name} • Provider: {d.providerId?.userId?.name || 'Assigned Pro'}
                      </div>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(d.status)}`}>{d.status}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    "{d.description}"
                  </p>
                  {d.status !== 'resolved' ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {resolvingDisputeId === d._id ? (
                        <form onSubmit={handleResolveDispute} style={{ display: 'flex', gap: '8px', width: '100%' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={disputeResolutionText}
                            onChange={e => setDisputeResolutionText(e.target.value)}
                            placeholder="Enter resolution notes..."
                            style={{ flex: 1 }}
                            required
                          />
                          <button type="submit" className="btn btn-primary btn-sm">Confirm Resolve</button>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setResolvingDisputeId(null)}>Cancel</button>
                        </form>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => setResolvingDisputeId(d._id)}>
                          ⚖️ Resolve Dispute
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                      ✓ Resolution: {d.resolution || 'Resolved by Administrator'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="animate-fade-in glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Immutable Platform Audit Trail</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>Timestamp</th>
                  <th style={{ padding: '10px' }}>Action</th>
                  <th style={{ padding: '10px' }}>User / Performed By</th>
                  <th style={{ padding: '10px' }}>Entity Type</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 20).map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{new Date(log.timestamp || log.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '10px', fontWeight: 600, color: 'var(--secondary)' }}>{log.action}</td>
                    <td style={{ padding: '10px' }}>{log.userId?.name || 'System Admin'}</td>
                    <td style={{ padding: '10px' }}><span className="badge badge-neutral">{log.entityType}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {showCatModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Create New Category</h3>
              <button onClick={() => setShowCatModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input type="text" className="form-input" value={catName} onChange={e => setCatName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input type="text" className="form-input" value={catDesc} onChange={e => setCatDesc(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Base Price (₹)</label>
                <input type="number" className="form-input" value={catBasePrice} onChange={e => setCatBasePrice(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Skills (Comma-separated)</label>
                <input type="text" className="form-input" value={catSkills} onChange={e => setCatSkills(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Category</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
