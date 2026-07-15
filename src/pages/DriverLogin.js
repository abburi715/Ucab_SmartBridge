import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function DriverLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.user.role !== 'driver') {
        setError('This is the driver login. Please use Passenger Login.');
        return;
      }
      login(data.user, data.token);
      navigate('/driver');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #0f3460, #16213e)' }}>
      <div className="card shadow-lg border-0 p-4" style={{ width: '100%', maxWidth: 420 }}>

        {/* Role switcher */}
        <div className="d-flex rounded overflow-hidden mb-4 border">
          <Link to="/login" className="w-50 text-center py-2 fw-semibold text-decoration-none"
            style={{ background: '#f8f9fa', color: '#555' }}>
            🧍 Passenger
          </Link>
          <div className="w-50 text-center py-2 fw-bold" style={{ background: '#28a745', color: '#fff' }}>
            🚗 Driver
          </div>
        </div>

        <div className="text-center mb-4">
          <div style={{ fontSize: '3rem' }}>🚗</div>
          <h3 className="fw-bold">Driver Login</h3>
          <p className="text-muted">Login to manage your rides</p>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Driver Email</label>
            <input type="email" className="form-control" placeholder="driver@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="mb-2">
            <label className="form-label fw-semibold">Password</label>
            <input type="password" className="form-control" placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="text-end mb-4">
            <Link to="/forgot-password" className="text-success fw-semibold" style={{ fontSize: '0.875rem' }}>
              Forgot Password?
            </Link>
          </div>
          <button type="submit" className="btn btn-success w-100 fw-bold" disabled={loading}>
            {loading ? 'Logging in...' : 'Login as Driver'}
          </button>
        </form>

        <p className="text-center mt-3 mb-0 text-muted" style={{ fontSize: '0.875rem' }}>
          New driver? Contact admin to register your account.
        </p>
      </div>
    </div>
  );
}
