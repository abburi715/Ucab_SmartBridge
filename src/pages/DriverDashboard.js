import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = { pending: 'warning', accepted: 'primary', 'in-progress': 'info', completed: 'success', cancelled: 'danger' };

export default function DriverDashboard() {
  const { user } = useAuth();
  const [pendingRides, setPendingRides] = useState([]);
  const [myRides, setMyRides]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [actionId, setActionId]         = useState(null);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 4000);
    return () => clearInterval(interval);
  }, []);

  if (user?.role !== 'driver') return <Navigate to="/" />;

  const fetchAll = async () => {
    try {
      const [pending, mine] = await Promise.all([
        api.get('/rides/driver/pending'),
        api.get('/rides/driver/mine'),
      ]);
      setPendingRides(pending.data);
      setMyRides(mine.data);
    } catch {}
    setLoading(false);
  };

  const handleAccept = async (rideId) => {
    setActionId(rideId);
    try {
      await api.put(`/rides/${rideId}/accept`);
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept ride');
    }
    setActionId(null);
  };

  const handleStatus = async (rideId, status) => {
    setActionId(rideId);
    try {
      await api.put(`/rides/${rideId}/status`, { status });
      fetchAll();
    } catch {}
    setActionId(null);
  };

  const handleDecline = async (rideId) => {
    setActionId(rideId);
    try {
      await api.put(`/rides/${rideId}/cancel`);
      fetchAll();
    } catch {}
    setActionId(null);
  };

  const active    = myRides.filter(r => r.status === 'accepted' || r.status === 'in-progress');
  const completed = myRides.filter(r => r.status === 'completed');
  const earnings  = completed.reduce((s, r) => s + r.fare, 0).toFixed(2);

  return (
    <div className="min-vh-100 py-4" style={{ background: '#f0f2f5' }}>
      <div className="container">

        {/* Header */}
        <div className="card border-0 shadow-sm p-4 mb-4"
          style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: 'white' }}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center fw-bold"
                style={{ width: 56, height: 56, fontSize: '1.4rem' }}>
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h4 className="fw-bold mb-0">Welcome, {user.name} 👋</h4>
                <small className="opacity-75">Driver Dashboard · Auto-refreshes every 4s</small>
              </div>
            </div>
            <div className="d-flex gap-3">
              {[
                { label: 'Pending', value: pendingRides.length, color: '#f5a623' },
                { label: 'Active',  value: active.length,       color: '#17a2b8' },
                { label: 'Done',    value: completed.length,    color: '#28a745' },
                { label: 'Earned',  value: `₹${earnings}`,      color: '#f5a623' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <div className="fw-bold fs-5" style={{ color }}>{value}</div>
                  <small className="opacity-75">{label}</small>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Ride — shown prominently */}
        {active.length > 0 && active.map(ride => (
          <div key={ride._id} className="card border-0 shadow mb-4"
            style={{ borderLeft: '5px solid #007bff' }}>
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h5 className="fw-bold mb-0">🚗 Active Ride</h5>
                <span className={`badge bg-${STATUS_COLORS[ride.status]} fs-6`}>{ride.status}</span>
              </div>

              <div className="row g-3 mb-3">
                {/* Passenger Info */}
                <div className="col-md-4">
                  <div className="p-3 rounded" style={{ background: '#e8f5e9' }}>
                    <div className="fw-bold mb-2">👤 Passenger</div>
                    <div className="fw-semibold">{ride.user?.name}</div>
                    <div className="text-muted small">📧 {ride.user?.email}</div>
                    <div className="text-muted small">📞 {ride.user?.phone || 'N/A'}</div>
                  </div>
                </div>
                {/* Trip Info */}
                <div className="col-md-5">
                  <div className="p-3 rounded" style={{ background: '#fff8e1' }}>
                    <div className="fw-bold mb-2">📍 Trip</div>
                    <div className="small fw-semibold">From: {ride.pickup}</div>
                    <div className="small text-muted">To: {ride.dropoff}</div>
                    <div className="mt-1">
                      <span className="badge bg-secondary me-1 text-capitalize">{ride.cabType}</span>
                      <span className="badge bg-light text-dark me-1">{ride.distance} km</span>
                      <span className="fw-bold" style={{ color: '#f5a623' }}>₹{ride.fare}</span>
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="col-md-3 d-flex flex-column gap-2 justify-content-center">
                  {ride.status === 'accepted' && (
                    <button className="btn btn-primary fw-bold"
                      disabled={actionId === ride._id}
                      onClick={() => handleStatus(ride._id, 'in-progress')}>
                      🚦 Start Ride
                    </button>
                  )}
                  {ride.status === 'in-progress' && (
                    <button className="btn btn-success fw-bold"
                      disabled={actionId === ride._id}
                      onClick={() => handleStatus(ride._id, 'completed')}>
                      🏁 Complete Ride
                    </button>
                  )}
                  <button className="btn btn-outline-danger btn-sm"
                    disabled={actionId === ride._id}
                    onClick={() => handleDecline(ride._id)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Pending Ride Requests */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white fw-bold py-3">
            🔔 New Ride Requests
            <span className="badge bg-warning text-dark ms-2">{pendingRides.length}</span>
            <small className="text-muted fw-normal ms-2">— refreshes automatically</small>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-warning" /></div>
            ) : pendingRides.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <div style={{ fontSize: '3rem' }}>😴</div>
                <p className="mt-2">No pending requests right now</p>
              </div>
            ) : (
              pendingRides.map(ride => (
                <div key={ride._id} className="p-4 border-bottom">
                  <div className="row align-items-center g-3">
                    {/* Passenger */}
                    <div className="col-md-3">
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center fw-bold text-white"
                          style={{ width: 40, height: 40 }}>
                          {ride.user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-semibold">{ride.user?.name}</div>
                          <small className="text-muted">📞 {ride.user?.phone || 'N/A'}</small>
                        </div>
                      </div>
                    </div>
                    {/* Trip */}
                    <div className="col-md-5">
                      <div className="small fw-semibold">📍 {ride.pickup}</div>
                      <div className="small text-muted">🏁 {ride.dropoff}</div>
                      <div className="mt-1">
                        <span className="badge bg-secondary me-1 text-capitalize">{ride.cabType}</span>
                        <span className="badge bg-light text-dark me-1">{ride.distance} km</span>
                        <span className="fw-bold small" style={{ color: '#f5a623' }}>₹{ride.fare}</span>
                        <span className="text-muted small ms-2">⏱ {ride.eta} min</span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="col-md-4 d-flex gap-2 justify-content-md-end">
                      <button className="btn btn-success fw-bold px-4"
                        disabled={actionId === ride._id || active.length > 0}
                        onClick={() => handleAccept(ride._id)}>
                        {actionId === ride._id ? '⏳' : '✅ Accept'}
                      </button>
                      <button className="btn btn-outline-danger"
                        disabled={actionId === ride._id}
                        onClick={() => handleDecline(ride._id)}>
                        ❌ Decline
                      </button>
                    </div>
                    {active.length > 0 && (
                      <div className="col-12">
                        <small className="text-warning">⚠ Complete your active ride before accepting a new one</small>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Rides */}
        {completed.length > 0 && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-bold py-3">✅ Completed Rides</div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th className="ps-4">Passenger</th>
                    <th>Pickup → Drop-off</th>
                    <th>Cab</th>
                    <th>Distance</th>
                    <th>Date</th>
                    <th className="text-end pe-4">Fare</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map(ride => (
                    <tr key={ride._id}>
                      <td className="ps-4">
                        <div className="fw-semibold">{ride.user?.name}</div>
                        <small className="text-muted">{ride.user?.phone || ride.user?.email}</small>
                      </td>
                      <td>
                        <small className="d-block">{ride.pickup}</small>
                        <small className="text-muted">{ride.dropoff}</small>
                      </td>
                      <td><span className="badge bg-secondary text-capitalize">{ride.cabType}</span></td>
                      <td>{ride.distance} km</td>
                      <td className="text-muted">{new Date(ride.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="text-end pe-4 fw-bold" style={{ color: '#f5a623' }}>₹{ride.fare}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: '#fff8e1' }}>
                  <tr>
                    <td colSpan={5} className="text-end fw-bold pe-3">Total Earnings:</td>
                    <td className="text-end pe-4 fw-bold" style={{ color: '#f5a623' }}>₹{earnings}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
