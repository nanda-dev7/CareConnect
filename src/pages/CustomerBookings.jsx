import { useState, useEffect } from 'react';
import { serviceRequestApi, quoteApi, bookingApi, jobApi, invoiceApi, reviewApi, disputeApi } from '../services/api';
import { notify } from '../components/common/Toast';

export default function CustomerBookings() {
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected state for modals
  const [activeRequestQuotes, setActiveRequestQuotes] = useState(null); // { requestId, quotes: [] }
  const [evidenceModalBooking, setEvidenceModalBooking] = useState(null); // { bookingId, evidence: [] }
  const [reviewModalBooking, setReviewModalBooking] = useState(null);
  const [disputeModalBooking, setDisputeModalBooking] = useState(null);
  const [invoiceModalBooking, setInvoiceModalBooking] = useState(null);

  // Form inputs
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const [reqRes, bookRes] = await Promise.all([
        serviceRequestApi.getAll(),
        bookingApi.getAll()
      ]);
      if (reqRes.success) setRequests(reqRes.data || []);
      if (bookRes.success) setBookings(bookRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const handleViewQuotes = async (requestId) => {
    try {
      const res = await quoteApi.getByRequest(requestId);
      if (res.success) {
        setActiveRequestQuotes({ requestId, quotes: res.data || [] });
      }
    } catch (err) {
      notify(err.message || 'Failed to fetch quotes', 'error');
    }
  };

  const handleAcceptQuote = async (quoteId) => {
    setActionLoading(true);
    try {
      const res = await quoteApi.accept(quoteId);
      if (res.success) {
        notify('Quote accepted! Booking created & scheduled.', 'success');
        setActiveRequestQuotes(null);
        fetchCustomerData();
      }
    } catch (err) {
      notify(err.message || 'Failed to accept quote. Check schedule conflicts.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCompletion = async (bookingId) => {
    setActionLoading(true);
    try {
      const res = await bookingApi.confirm(bookingId);
      if (res.success) {
        notify('Job completion confirmed! Invoice generated.', 'success');
        fetchCustomerData();
        // open invoice
        if (res.data.invoice) setInvoiceModalBooking({ invoice: res.data.invoice });
      }
    } catch (err) {
      notify(err.message || 'Failed to confirm completion', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewEvidence = async (booking) => {
    try {
      const res = await jobApi.getEvidence(booking._id);
      if (res.success) {
        setEvidenceModalBooking({ booking, evidence: res.data || [] });
      }
    } catch (err) {
      notify(err.message || 'Failed to load job evidence', 'error');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalBooking) return;
    setActionLoading(true);
    try {
      const res = await reviewApi.create({
        bookingId: reviewModalBooking._id,
        rating: Number(reviewRating),
        comment: reviewComment
      });
      if (res.success) {
        notify('Thank you! Review submitted and provider rating updated.', 'success');
        setReviewModalBooking(null);
        setReviewComment('');
        fetchCustomerData();
      }
    } catch (err) {
      notify(err.message || 'Failed to submit review', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!disputeModalBooking) return;
    setActionLoading(true);
    try {
      const res = await disputeApi.create({
        bookingId: disputeModalBooking._id,
        reason: disputeReason,
        description: disputeDescription
      });
      if (res.success) {
        notify('Dispute case created! Operations and Support team notified.', 'warning');
        setDisputeModalBooking(null);
        setDisputeReason('');
        setDisputeDescription('');
        fetchCustomerData();
      }
    } catch (err) {
      notify(err.message || 'Failed to raise dispute', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayInvoice = async (invoiceId) => {
    setActionLoading(true);
    try {
      const res = await invoiceApi.updatePayment(invoiceId, 'paid', 'credit_card');
      if (res.success) {
        notify('Payment successful! Invoice marked as paid.', 'success');
        setInvoiceModalBooking(null);
        fetchCustomerData();
      }
    } catch (err) {
      notify(err.message || 'Payment failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'customer_confirmed': return 'badge-success';
      case 'in_progress':
      case 'en_route': return 'badge-primary';
      case 'scheduled':
      case 'quoted': return 'badge-secondary';
      case 'disputed':
      case 'cancelled': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="animate-fade-in">
      
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Customer Service Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Track your requests, compare provider quotes, review completed jobs, and manage invoices.
        </p>
      </div>

      {/* ACTIVE BOOKINGS SECTION */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📋 Active Bookings ({bookings.length})
      </h2>

      {loading ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '32px' }}>
          No active bookings found yet. Post an AI Service Request to get started!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
          {bookings.map((booking) => (
            <div key={booking._id} className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.15rem' }}>Booking #{booking._id.slice(-6)}</h3>
                    <span className={`badge ${getStatusBadge(booking.status)}`}>{booking.status}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Provider: <strong style={{ color: 'var(--text-primary)' }}>{booking.providerId?.userId?.name || 'Assigned Provider'}</strong> •
                    Date: <strong>{new Date(booking.date).toLocaleDateString()} ({booking.startTime})</strong>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent)' }}>
                    ₹{booking.price}
                  </div>
                </div>
              </div>

              {/* LIVE WORKFLOW PROGRESS BAR */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.03)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '0.75rem',
                gap: '8px',
                overflowX: 'auto'
              }}>
                {['scheduled', 'en_route', 'in_progress', 'completed', 'customer_confirmed'].map((step, idx) => {
                  const stepIndex = ['scheduled', 'en_route', 'in_progress', 'completed', 'customer_confirmed'].indexOf(booking.status);
                  const currentIdx = ['scheduled', 'en_route', 'in_progress', 'completed', 'customer_confirmed'].indexOf(step);
                  const isDone = currentIdx <= stepIndex;
                  return (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isDone ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isDone ? 700 : 400 }}>
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: isDone ? 'var(--accent)' : 'var(--bg-input)',
                        color: isDone ? '#fff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem'
                      }}>
                        {isDone ? '✓' : idx + 1}
                      </span>
                      <span style={{ textTransform: 'capitalize' }}>{step.replace('_', ' ')}</span>
                    </div>
                  );
                })}
              </div>

              {/* ACTION BUTTONS FOR CUSTOMER */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <button className="btn btn-outline btn-sm" onClick={() => handleViewEvidence(booking)}>
                  📷 View Job Evidence
                </button>

                {booking.status === 'completed' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleConfirmCompletion(booking._id)} disabled={actionLoading}>
                    ✅ Confirm Completion & Generate Invoice
                  </button>
                )}

                {booking.status === 'customer_confirmed' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setReviewModalBooking(booking)}>
                    ⭐ Rate & Review Provider
                  </button>
                )}

                {['scheduled', 'en_route', 'in_progress', 'completed'].includes(booking.status) && (
                  <button className="btn btn-danger btn-sm" onClick={() => setDisputeModalBooking(booking)}>
                    🚨 Raise Dispute
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* SERVICE REQUESTS & QUOTES SECTION */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>
        📨 My Service Requests & Quotes ({requests.length})
      </h2>

      {requests.length === 0 ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No open service requests.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map((req) => (
            <div key={req._id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '1rem' }}>{req.description.slice(0, 70)}...</h4>
                  <span className={`badge ${getStatusBadge(req.status)}`}>{req.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Category: <strong>{req.categoryId?.name || req.aiClassification?.category || 'General'}</strong> •
                  Date: <strong>{req.preferredDate} ({req.preferredTime})</strong>
                </div>
              </div>

              <div>
                <button className="btn btn-outline btn-sm" onClick={() => handleViewQuotes(req._id)}>
                  View Quotes ➔
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: VIEW QUOTES FOR A REQUEST */}
      {activeRequestQuotes && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Received Provider Quotes</h3>
              <button onClick={() => setActiveRequestQuotes(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {activeRequestQuotes.quotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                No quotes received yet for this request. Local providers will respond shortly.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeRequestQuotes.quotes.map((q) => (
                  <div key={q._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.05rem' }}>{q.providerId?.userId?.name || 'Verified Provider'}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Estimated Duration: <strong>{q.estimatedDuration || '1-2 hrs'}</strong>
                        </div>
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
                        ₹{q.price}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      "{q.message || 'Ready to complete service as requested.'}"
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {q.status === 'pending' ? (
                        <button className="btn btn-primary btn-sm" onClick={() => handleAcceptQuote(q._id)} disabled={actionLoading}>
                          Accept Quote & Book
                        </button>
                      ) : (
                        <span className="badge badge-success">{q.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: VIEW EVIDENCE */}
      {evidenceModalBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Job Evidence & Photos</h3>
              <button onClick={() => setEvidenceModalBooking(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {evidenceModalBooking.evidence.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                No before/after photos or document evidence uploaded yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {evidenceModalBooking.evidence.map((ev, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <span className="badge badge-secondary" style={{ marginBottom: '6px', fontSize: '0.65rem' }}>{ev.type || 'Photo'}</span>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{ev.description || 'Job proof image'}</div>
                    {ev.fileUrl && (
                      <a href={`http://localhost:5000${ev.fileUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                        View Uploaded File ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT REVIEW */}
      {reviewModalBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Rate & Review Service</h3>
              <button onClick={() => setReviewModalBooking(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label className="form-label">Rating (1 to 5 Stars)</label>
                <select className="form-select" value={reviewRating} onChange={e => setReviewRating(e.target.value)}>
                  <option value="5">⭐⭐⭐⭐⭐ 5 Stars - Excellent</option>
                  <option value="4">⭐⭐⭐⭐ 4 Stars - Very Good</option>
                  <option value="3">⭐⭐⭐ 3 Stars - Average</option>
                  <option value="2">⭐⭐ 2 Stars - Below Average</option>
                  <option value="1">⭐ 1 Star - Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Review Comment</label>
                <textarea className="form-textarea" rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Write your experience..." required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={actionLoading}>
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RAISE DISPUTE */}
      {disputeModalBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--danger)' }}>🚨 Raise Service Dispute</h3>
              <button onClick={() => setDisputeModalBooking(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleSubmitDispute}>
              <div className="form-group">
                <label className="form-label">Dispute Reason</label>
                <select className="form-select" value={disputeReason} onChange={e => setDisputeReason(e.target.value)} required>
                  <option value="">Select reason...</option>
                  <option value="Incomplete Work">Incomplete Work</option>
                  <option value="Quality Issue">Poor Quality of Work</option>
                  <option value="Pricing / Charge Discrepancy">Pricing Discrepancy</option>
                  <option value="Provider No-Show">Provider No-Show</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea className="form-textarea" rows={4} value={disputeDescription} onChange={e => setDisputeDescription(e.target.value)} placeholder="Describe what went wrong..." required />
              </div>

              <button type="submit" className="btn btn-danger" style={{ width: '100%' }} disabled={actionLoading}>
                Submit Dispute Ticket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INVOICE VIEWER & PAYMENT */}
      {invoiceModalBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>📄 Official Service Invoice</h3>
              <button onClick={() => setInvoiceModalBooking(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {(() => {
              const inv = invoiceModalBooking.invoice;
              return (
                <div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Base Service Charge:</span>
                      <strong>₹{inv.basePrice || 350}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Parts & Materials:</span>
                      <strong>₹{inv.partsCost || 0}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Platform Service Fee:</span>
                      <strong>₹{inv.serviceFee || 50}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-color)', fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 800 }}>
                      <span>Total Amount:</span>
                      <span>₹{inv.total}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                    Status: <span className={`badge ${inv.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>{inv.paymentStatus}</span>
                  </div>

                  {inv.paymentStatus !== 'paid' && (
                    <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handlePayInvoice(inv._id)} disabled={actionLoading}>
                      💳 Pay ₹{inv.total} Now
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
