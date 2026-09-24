import { useState, useEffect } from 'react';
import { availabilityApi } from '../services/api';
import { notify } from '../components/common/Toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ProviderSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [submitting, setSubmitting] = useState(false);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await availabilityApi.getMy();
      if (res.success) setSchedule(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await availabilityApi.create({
        dayOfWeek,
        startTime,
        endTime
      });
      if (res.success) {
        notify('Availability time slot added!', 'success');
        fetchSchedule();
      }
    } catch (err) {
      notify(err.message || 'Failed to add slot', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id) => {
    try {
      const res = await availabilityApi.delete(id);
      if (res.success) {
        notify('Time slot removed.', 'info');
        setSchedule(prev => prev.filter(s => s._id !== id));
      }
    } catch (err) {
      notify(err.message || 'Failed to delete slot', 'error');
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>📅 Provider Availability & Schedule</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Set your working days and hourly availability slots. Our system checks your schedule to prevent double-booking.
        </p>
      </div>

      {/* ADD AVAILABILITY SLOT FORM */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>➕ Add Availability Time Slot</h3>
        <form onSubmit={handleAddSlot} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'end' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Day of Week</label>
            <select className="form-select" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Start Time</label>
            <input type="time" className="form-input" value={startTime} onChange={e => setStartTime(e.target.value)} required />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">End Time</label>
            <input type="time" className="form-input" value={endTime} onChange={e => setEndTime(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Add Slot'}
          </button>
        </form>
      </div>

      {/* SCHEDULE GRID */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>Active Weekly Slots ({schedule.length})</h2>

      {loading ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading schedule...</div>
      ) : schedule.length === 0 ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No recurring availability slots set yet. Add slots above!
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {schedule.map((slot) => (
            <div key={slot._id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--secondary)' }}>{slot.dayOfWeek}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ⏰ {slot.startTime} - {slot.endTime}
                </div>
              </div>
              <button className="btn btn-outline btn-sm" style={{ color: 'var(--danger)', padding: '4px 8px' }} onClick={() => handleDeleteSlot(slot._id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
