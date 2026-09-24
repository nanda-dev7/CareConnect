import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { serviceRequestApi, quoteApi, bookingApi, jobApi } from '../services/api';
import { notify } from '../components/common/Toast';

export default function ProviderJobs() {
  const { providerProfile, refreshProfile } = useAuth();
  const [requestsFeed, setRequestsFeed] = useState([]);
  const [myQuotes, setMyQuotes] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [quoteModalRequest, setQuoteModalRequest] = useState(null);
  const [evidenceModalBooking, setEvidenceModalBooking] = useState(null);

  // Quote form
  const [quotePrice, setQuotePrice] = useState('450');
  const [estimatedDuration, setEstimatedDuration] = useState('1.5 hours');
  const [quoteMessage, setQuoteMessage] = useState('I can complete this repair with 1-year service warranty.');
  const [actionLoading, setActionLoading] = useState(false);

  // Evidence upload form
  const [evidenceType, setEvidenceType] = useState('after');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchProviderData = async () => {
    setLoading(true);
    try {
      const [reqRes, quotesRes, jobsRes] = await Promise.all([
        serviceRequestApi.getAll(),
        quoteApi.getMy(),
        bookingApi.getAll()
      ]);

      if (reqRes.success) setRequestsFeed(reqRes.data || []);
      if (quotesRes.success) setMyQuotes(quotesRes.data || []);
      if (jobsRes.success) setAssignedJobs(jobsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderData();
  }, []);

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!quoteModalRequest) return;
    setActionLoading(true);
    try {
      const res = await quoteApi.create({
        requestId: quoteModalRequest._id,
        price: Number(quotePrice),
        estimatedDuration,
        availableDate: quoteModalRequest.preferredDate,
        availableTime: quoteModalRequest.preferredTime,
        message: quoteMessage
      });

      if (res.success) {
        notify('Quote submitted successfully! Customer will be notified.', 'success');
        setQuoteModalRequest(null);
        fetchProviderData();
      }
    } catch (err) {
      notify(err.message || 'Failed to submit quote', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateJobStatus = async (bookingId, newStatus) => {
    setActionLoading(true);
    try {
      const res = await bookingApi.updateStatus(bookingId, newStatus, `Status updated to ${newStatus}`);
      if (res.success) {
        notify(`Job status updated to ${newStatus}`, 'success');
        fetchProviderData();
      }
    } catch (err) {
      notify(err.message || 'Invalid status transition', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!evidenceModalBooking) return;
    setActionLoading(true);

    try {
      const formData = new FormData();
      formData.append('type', evidenceType);
      formData.append('description', evidenceDescription || `${evidenceType} evidence photo`);
      if (selectedFile) {
        formData.append('evidence', selectedFile);
      }

      const res = await jobApi.uploadEvidence(evidenceModalBooking._id, formData);
      if (res.success) {
        notify('Job evidence photo uploaded successfully!', 'success');
        setEvidenceModalBooking(null);
        setSelectedFile(null);
        setEvidenceDescription('');
        fetchProviderData();
      }
    } catch (err) {
      notify(err.message || 'Failed to upload evidence file', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const isVerified = providerProfile?.verificationStatus === 'verified';

  return (
    <div className="animate-fade-in">
      
      {/* Verification Header Banner */}
      {!isVerified ? (
        <div className="glass-panel" style={{
          padding: '16px 20px',
          marginBottom: '24px',
          background: 'var(--warning-light)',
          borderColor: 'rgba(245, 158, 11, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--warning)' }}>⚠️ Account Verification Pending</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Your provider profile is currently undergoing verification by Platform Admin. You can browse requests, but quote submissions require verified status.
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={refreshProfile}>
            Check Status
          </button>
        </div>
      ) : (
        <div className="glass-panel" style={{
          padding: '16px 20px',
          marginBottom: '24px',
          background: 'var(--accent-light)',
          borderColor: 'rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🛡️</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent)' }}>Verified Provider Account</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Rating: <strong>★ {providerProfile?.rating?.toFixed(1) || '5.0'}</strong> • Completed Jobs: <strong>{providerProfile?.completedJobs || 0}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNED JOBS SECTION */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🛠 My Assigned Jobs ({assignedJobs.length})
      </h2>

      {loading ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading jobs...</div>
      ) : assignedJobs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          No active assigned jobs at the moment. Submit quotes on customer service requests below!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
          {assignedJobs.map((job) => (
            <div key={job._id} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>Job #{job._id.slice(-6)}</h3>
                    <span className="badge badge-primary">{job.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Customer: <strong>{job.customerId?.name || 'Customer'}</strong> • Phone: <strong>{job.customerId?.phone || 'N/A'}</strong> • Location: <strong>{job.location?.addressLine || 'Address'}</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)' }}>₹{job.price}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(job.date).toLocaleDateString()} at {job.startTime}</div>
                </div>
              </div>

              {/* STATUS UPDATE CONTROLS (Strict State Machine) */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>CONTROL JOB STATUS:</span>

                {job.status === 'scheduled' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateJobStatus(job._id, 'en_route')} disabled={actionLoading}>
                    🚗 Mark En Route
                  </button>
                )}

                {job.status === 'en_route' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleUpdateJobStatus(job._id, 'in_progress')} disabled={actionLoading}>
                    🔧 Start Job (In Progress)
                  </button>
                )}

                {job.status === 'in_progress' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleUpdateJobStatus(job._id, 'completed')} disabled={actionLoading}>
                    🏁 Mark Job Completed
                  </button>
                )}

                {job.status === 'completed' && (
                  <span className="badge badge-success">✓ Awaiting Customer Confirmation</span>
                )}

                <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setEvidenceModalBooking(job)}>
                  📸 Upload Proof Evidence
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* SERVICE REQUESTS MARKETPLACE FEED */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🎯 Open Service Requests Marketplace ({requestsFeed.length})
      </h2>

      {requestsFeed.length === 0 ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          No open service requests right now.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginBottom: '36px' }}>
          {requestsFeed.map((req) => (
            <div key={req._id} className="glass-panel glass-panel-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className="badge badge-secondary">{req.categoryId?.name || req.aiClassification?.category || 'General'}</span>
                  <span className="badge badge-warning">Urgency: {req.urgency || 'medium'}</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '8px' }}>"{req.description}"</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  📍 {req.location?.city || 'Hyderabad'} • Preferred: {req.preferredDate} ({req.preferredTime})
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>REQUIRED SKILLS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(req.requiredSkills || []).map((sk, i) => (
                      <span key={i} className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{sk}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary btn-sm"
                style={{ width: '100%' }}
                onClick={() => setQuoteModalRequest(req)}
                disabled={!isVerified}
              >
                {isVerified ? '💼 Submit Quote' : 'Verification Required to Quote'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MY SUBMITTED QUOTES SECTION */}
      {myQuotes.length > 0 && (
        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💼 My Submitted Quotes ({myQuotes.length})
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {myQuotes.map((q) => (
              <div key={q._id} className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <strong>₹{q.price}</strong>
                  <span className={`badge ${q.status === 'accepted' ? 'badge-success' : q.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                    {q.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Duration: {q.estimatedDuration} • {new Date(q.availableDate).toLocaleDateString()} at {q.availableTime}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  "{q.message || 'No additional note'}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT QUOTE */}
      {quoteModalRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Submit Quote to Customer</h3>
              <button onClick={() => setQuoteModalRequest(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmitQuote}>
              <div className="form-group">
                <label className="form-label">Quoted Price (₹)</label>
                <input type="number" className="form-input" value={quotePrice} onChange={e => setQuotePrice(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Duration</label>
                <input type="text" className="form-input" value={estimatedDuration} onChange={e => setEstimatedDuration(e.target.value)} placeholder="e.g. 1-2 hours" required />
              </div>

              <div className="form-group">
                <label className="form-label">Message / Warranty Details for Customer</label>
                <textarea className="form-textarea" rows={3} value={quoteMessage} onChange={e => setQuoteMessage(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={actionLoading}>
                {actionLoading ? 'Sending Quote...' : 'Submit Quote'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD EVIDENCE */}
      {evidenceModalBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>📷 Upload Proof Evidence</h3>
              <button onClick={() => setEvidenceModalBooking(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleUploadEvidence}>
              <div className="form-group">
                <label className="form-label">Evidence Stage</label>
                <select className="form-select" value={evidenceType} onChange={e => setEvidenceType(e.target.value)}>
                  <option value="before">Before Work Started</option>
                  <option value="during">During Work Progress</option>
                  <option value="after">After Completion Proof</option>
                  <option value="document">Parts / Bill Document</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Note</label>
                <input type="text" className="form-input" value={evidenceDescription} onChange={e => setEvidenceDescription(e.target.value)} placeholder="e.g. Clean joint repair proof photo" />
              </div>

              <div className="form-group">
                <label className="form-label">Select File / Photo</label>
                <input type="file" className="form-input" onChange={e => setSelectedFile(e.target.files[0])} />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={actionLoading}>
                {actionLoading ? 'Uploading File...' : 'Upload Evidence'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
