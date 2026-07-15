import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const STATUS_STEPS  = ['pending', 'accepted', 'in-progress', 'completed'];
const STATUS_LABELS = {
  pending:      { label: '🔍 Finding Driver...',     bg: '#fff8e1', msg: 'Looking for a nearby driver. Please wait.' },
  accepted:     { label: '✅ Driver Assigned',        bg: '#e3f2fd', msg: 'Your driver is on the way to pick you up!' },
  'in-progress':{ label: '🚗 Ride in Progress',      bg: '#e8f5e9', msg: 'You are on your way. Sit back and relax!' },
  completed:    { label: '🎉 Ride Completed',         bg: '#d4edda', msg: 'You have reached your destination. Thank you!' },
  cancelled:    { label: '❌ Ride Cancelled',         bg: '#f8d7da', msg: 'This ride has been cancelled.' },
};

export default function RideTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ride, setRide]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [prevStatus, setPrevStatus] = useState(null); // eslint-disable-line no-unused-vars

  useEffect(() => {
    fetchRide();
    const interval = setInterval(fetchRide, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchRide = async () => {
    try {
      const { data } = await api.get(`/rides/${id}`);
      setRide(prev => {
        if (prev && prev.status !== data.status) setPrevStatus(prev.status);
        return data;
      });
    } catch {}
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this ride?')) return;
    await api.put(`/rides/${id}/cancel`);
    fetchRide();
  };

  if (loading) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-warning" style={{ width: 60, height: 60 }} />
    </div>
  );

  if (!ride) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <h4>Ride not found</h4>
    </div>
  );

  const stepIndex  = STATUS_STEPS.indexOf(ride.status);
  const statusInfo = STATUS_LABELS[ride.status] || STATUS_LABELS.pending;

  return (
    <div className="min-vh-100 py-4" style={{ background: '#f0f2f5' }}>
      <div className="container" style={{ maxWidth: 720 }}>
        <h2 className="fw-bold mb-4">🚕 Ride Tracking</h2>

        {/* Status Banner */}
        <div className="card border-0 shadow-sm mb-4 p-4 text-center"
          style={{ background: statusInfo.bg }}>
          <h4 className="fw-bold mb-1">{statusInfo.label}</h4>
          <p className="text-muted mb-0">{statusInfo.msg}</p>
          {ride.status === 'pending' && (
            <div className="mt-3">
              <div className="spinner-border spinner-border-sm text-warning me-2" />
              <small className="text-muted">Auto-refreshing every 3 seconds...</small>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {ride.status !== 'cancelled' && (
          <div className="card border-0 shadow-sm mb-4 p-4">
            <div className="d-flex justify-content-between align-items-center">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="d-flex align-items-center flex-grow-1">
                  <div className="d-flex flex-column align-items-center">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                      style={{
                        width: 38, height: 38,
                        background: i <= stepIndex ? '#f5a623' : '#dee2e6',
                        color: i <= stepIndex ? '#fff' : '#999',
                        fontSize: '0.85rem',
                        transition: 'background 0.5s',
                      }}>
                      {i < stepIndex ? '✓' : i + 1}
                    </div>
                    <small className="mt-1 text-center text-capitalize"
                      style={{ fontSize: '0.68rem', maxWidth: 64, color: i <= stepIndex ? '#f5a623' : '#999' }}>
                      {step.replace('-', ' ')}
                    </small>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className="flex-grow-1 mx-1"
                      style={{ height: 4, borderRadius: 2, background: i < stepIndex ? '#f5a623' : '#dee2e6', transition: 'background 0.5s' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="row g-4">
          {/* Trip Details */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm p-4 h-100">
              <h6 className="fw-bold mb-3">📋 Trip Details</h6>
              <div className="d-flex flex-column gap-2">
                <div className="p-2 rounded" style={{ background: '#e8f5e9' }}>
                  <small className="text-muted d-block">📍 Pickup</small>
                  <span className="fw-semibold">{ride.pickup}</span>
                </div>
                <div className="p-2 rounded" style={{ background: '#fce4ec' }}>
                  <small className="text-muted d-block">🏁 Drop-off</small>
                  <span className="fw-semibold">{ride.dropoff}</span>
                </div>
                <div className="row g-2 mt-1">
                  <div className="col-4 text-center p-2 rounded" style={{ background: '#f8f9fa' }}>
                    <small className="text-muted d-block">Cab</small>
                    <span className="fw-semibold text-capitalize">{ride.cabType}</span>
                  </div>
                  <div className="col-4 text-center p-2 rounded" style={{ background: '#f8f9fa' }}>
                    <small className="text-muted d-block">Distance</small>
                    <span className="fw-semibold">{ride.distance} km</span>
                  </div>
                  <div className="col-4 text-center p-2 rounded" style={{ background: '#fff8e1' }}>
                    <small className="text-muted d-block">Fare</small>
                    <span className="fw-bold" style={{ color: '#f5a623' }}>₹{ride.fare}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Info */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm p-4 h-100">
              <h6 className="fw-bold mb-3">🚗 Driver Info</h6>
              {ride.driver ? (
                <div>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center fw-bold text-white"
                      style={{ width: 52, height: 52, fontSize: '1.3rem' }}>
                      {ride.driver.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="fw-bold fs-6">{ride.driver.name}</div>
                      <div className="text-muted small">📞 {ride.driver.phone}</div>
                      <div className="text-muted small">⭐ {ride.driver.rating} · <span className="text-capitalize">{ride.driver.cabType}</span></div>
                    </div>
                  </div>
                  <div className="p-2 rounded text-center" style={{ background: '#e8f5e9' }}>
                    <small className="text-success fw-semibold">
                      {ride.status === 'accepted' && '🟡 Driver is coming to pick you up'}
                      {ride.status === 'in-progress' && '🟢 You are currently on the ride'}
                      {ride.status === 'completed' && '✅ Ride completed successfully'}
                    </small>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <div style={{ fontSize: '2.5rem' }}>🔍</div>
                  <p className="mt-2 mb-0">Searching for a driver...</p>
                  <small>A driver will be assigned shortly</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="d-flex gap-3 mt-4">
          {(ride.status === 'pending' || ride.status === 'accepted') && (
            <button className="btn btn-outline-danger flex-grow-1 fw-bold" onClick={handleCancel}>
              ❌ Cancel Ride
            </button>
          )}
          {(ride.status === 'completed' || ride.status === 'cancelled') && (
            <button className="btn btn-warning w-100 fw-bold btn-lg" onClick={() => navigate('/book')}>
              🚕 Book Another Ride
            </button>
          )}
          {ride.status === 'completed' && (
            <button className="btn btn-outline-success flex-grow-1 fw-bold" onClick={() => navigate('/payments')}>
              🧾 View Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
