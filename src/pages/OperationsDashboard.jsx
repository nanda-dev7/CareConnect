import { useState, useEffect } from 'react';
import { operationsApi } from '../services/api';

export default function OperationsDashboard() {
  const [opsData, setOpsData] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOpsData = async () => {
    setLoading(true);
    try {
      const [dashRes, jobsRes] = await Promise.all([
        operationsApi.getDashboard(),
        operationsApi.getActiveJobs()
      ]);
      if (dashRes.success) setOpsData(dashRes.data || {});
      if (jobsRes.success) setActiveJobs(jobsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpsData();
  }, []);

  return (
    <div className="animate-fade-in">
      
      <div style={{ marginBottom: '24px' }}>
        <span className="badge badge-warning" style={{ marginBottom: '6px' }}>OPERATIONS MANAGEMENT HUB</span>
        <h1 style={{ fontSize: '2rem' }}>Job Execution & Dispatch Control</h1>
      </div>

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTIVE IN-PROGRESS JOBS</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{opsData?.inProgressJobs || 0}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>UNASSIGNED REQUESTS</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>{opsData?.unassignedRequests || 0}</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>HIGH PRIORITY / DELAYED</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>{opsData?.delayedJobs || 0}</div>
        </div>
      </div>

      {/* LIVE JOBS DISPATCH MONITOR */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>🛠 Live Active Jobs Queue ({activeJobs.length})</h2>

      {loading ? (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading operations feed...</div>
      ) : activeJobs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          All active jobs are running smoothly without operational bottlenecks.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeJobs.map((job) => (
            <div key={job._id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '1.05rem' }}>Booking #{job._id.slice(-6)}</h4>
                  <span className="badge badge-primary">{job.status}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Customer: {job.customerId?.name} • Provider: {job.providerId?.userId?.name || 'Unassigned'} • Date: {new Date(job.date).toLocaleDateString()}
                </div>
              </div>

              <div>
                <span className="badge badge-success">₹{job.price}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
