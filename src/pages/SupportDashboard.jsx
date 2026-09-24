import { useState, useEffect } from 'react';
import { disputeApi } from '../services/api';
import { notify } from '../components/common/Toast';

export default function SupportDashboard() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolution modal state
  const [resolveModalDispute, setResolveModalDispute] = useState(null);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [refundAmount, setRefundAmount] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await disputeApi.getAll();
      if (res.success) setDisputes(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModalDispute) return;
    setSubmitting(true);
    try {
      const res = await disputeApi.resolve(resolveModalDispute._id, resolutionSummary, Number(refundAmount));
      if (res.success) {
        notify('Dispute case successfully resolved & updated!', 'success');
        setResolveModalDispute(null);
        setResolutionSummary('');
        fetchDisputes();
      }
    } catch (err) {
      notify(err.message || 'Failed to resolve dispute', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async (id) => {
    try {
      const res = await disputeApi.escalate(id, 'Escalated for senior admin review');
      if (res.success) {
        notify('Dispute escalated to Admin level.', 'warning');
        fetchDisputes();
      }
    } catch (err) {
      notify(err.message || 'Failed to escalate', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      
      <div style={{ marginBottom: '24px' }}>
        <span className="badge badge-secondary" style={{ marginBottom: '6px' }}>SUPPORT AGENT WORKSPACE</span>
        <h1 style={{ fontSize: '2rem' }}>Customer Complaints & Dispute Resolution</h1>
      </div>

      <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>🚨 Service Dispute Tickets ({disputes.length})</h2>

      {loading ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading tickets...</div>
      ) : disputes.length === 0 ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No open disputes or complaints ticket.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {disputes.map((d) => (
            <div key={d._id} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>Ticket #{d._id.slice(-6)}: {d.reason}</h3>
                    <span className={`badge ${d.status === 'resolved' ? 'badge-success' : 'badge-danger'}`}>{d.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Customer: <strong>{d.customerId?.name || 'Customer'}</strong> • Provider: <strong>{d.providerId?.userId?.name || 'Provider'}</strong>
                  </div>
                </div>

                {d.status !== 'resolved' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setResolveModalDispute(d)}>
                      ✓ Resolve Dispute
                    </button>
                    <button className="btn btn-outline btn-sm" style={{ color: 'var(--warning)' }} onClick={() => handleEscalate(d._id)}>
                      ▲ Escalate
                    </button>
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                "{d.description}"
              </div>

              {d.resolution && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--accent)' }}>
                  <strong>Resolution:</strong> {d.resolution} (Refund: ₹{d.refundAmount || 0})
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {resolveModalDispute && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Resolve Service Dispute</h3>
              <button onClick={() => setResolveModalDispute(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleResolveSubmit}>
              <div className="form-group">
                <label className="form-label">Resolution Summary / Action Taken</label>
                <textarea className="form-textarea" rows={3} value={resolutionSummary} onChange={e => setResolutionSummary(e.target.value)} placeholder="e.g. Issue investigated. Provider agreed to re-inspect at zero charge." required />
              </div>

              <div className="form-group">
                <label className="form-label">Refund Amount to Customer (₹)</label>
                <input type="number" className="form-input" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} min="0" required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
