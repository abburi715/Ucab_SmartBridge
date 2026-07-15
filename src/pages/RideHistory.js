import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const STATUS_COLORS = {
  pending: 'warning', accepted: 'primary', 'in-progress': 'info',
  completed: 'success', cancelled: 'danger'
};

export default function RideHistory() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/rides/history')
      .then(({ data }) => setRides(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-warning" />
    </div>
  );

  return (
    <div className="min-vh-100 py-5" style={{ background: '#f8f9fa' }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold mb-0">📋 My Rides</h2>
          <Link to="/book" className="btn btn-warning fw-bold">+ Book New Ride</Link>
        </div>

        {rides.length === 0 ? (
          <div className="card border-0 shadow-sm p-5 text-center">
            <div style={{ fontSize: '4rem' }}>🚗</div>
            <h4 className="mt-3">No rides yet</h4>
            <p className="text-muted">Book your first ride to get started!</p>
            <Link to="/book" className="btn btn-warning fw-bold mx-auto" style={{ width: 200 }}>Book a Ride</Link>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {rides.map(ride => (
              <div key={ride._id} className="card border-0 shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className={`badge bg-${STATUS_COLORS[ride.status]}`}>{ride.status}</span>
                      <span className="text-muted small">{new Date(ride.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="fw-semibold">📍 {ride.pickup}</div>
                    <div className="text-muted">🏁 {ride.dropoff}</div>
                    <div className="mt-2">
                      <small className="text-muted me-3">🚗 {ride.cabType}</small>
                      <small className="text-muted me-3">📏 {ride.distance} km</small>
                      <small className="fw-bold" style={{ color: '#f5a623' }}>💰 ₹{ride.fare}</small>
                    </div>
                  </div>
                  <Link to={`/ride/${ride._id}`} className="btn btn-outline-warning btn-sm">
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
