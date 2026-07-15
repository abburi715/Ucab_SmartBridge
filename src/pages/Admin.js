import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  pending: 'warning', accepted: 'primary', 'in-progress': 'info',
  completed: 'success', cancelled: 'danger',
};

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [rides, setRides] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [driverForm, setDriverForm] = useState({ name: '', email: '', phone: '', licenseNumber: '', cabType: 'economy' });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchAll(); }, []);

  if (user?.role !== 'admin') return <Navigate to="/" />;

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [u, d, r, p] = await Promise.all([
        api.get('/auth/users'),
        api.get('/drivers'),
        api.get('/rides/all'),
        api.get('/payments/all/admin'),
      ]);
      setUsers(u.data);
      setDrivers(d.data);
      setRides(r.data);
      setPayments(p.data);
    } catch {}
    setLoading(false);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/auth/users/${id}`);
    fetchAll();
  };

  const handleDeleteRide = async (id) => {
    if (!window.confirm('Delete this ride?')) return;
    await api.delete(`/rides/${id}`);
    fetchAll();
  };

  const handleVerifyDriver = async (id) => {
    await api.put(`/drivers/${id}/verify`);
    fetchAll();
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    try {
      await api.post('/drivers/register', driverForm);
      setMsg('Driver registered!');
      setDriverForm({ name: '', email: '', phone: '', licenseNumber: '', cabType: 'economy' });
      fetchAll();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed');
    }
  };

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0).toFixed(2);

  const tabs = [
    { key: 'users',    label: '👥 Users',    count: users.length },
    { key: 'drivers',  label: '🚗 Drivers',  count: drivers.length },
    { key: 'rides',    label: '📋 Rides',    count: rides.length },
    { key: 'payments', label: '💳 Payments', count: payments.length },
  ];

  return (
    <div className="min-vh-100 py-4" style={{ background: '#f0f2f5' }}>
      <div className="container-fluid px-4">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-0">🛠 Admin Dashboard</h2>
            <small className="text-muted">Manage all registered data</small>
          </div>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchAll}>🔄 Refresh</button>
        </div>

        {/* Stats Row */}
        <div className="row g-3 mb-4">
          {[
            { label: 'Total Users',    value: users.length,    icon: '👥', color: '#007bff' },
            { label: 'Total Drivers',  value: drivers.length,  icon: '🚗', color: '#28a745' },
            { label: 'Total Rides',    value: rides.length,    icon: '📋', color: '#f5a623' },
            { label: 'Total Revenue',  value: `₹${totalRevenue}`, icon: '💰', color: '#dc3545' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="col-6 col-md-3">
              <div className="card border-0 shadow-sm p-3 text-center h-100"
                style={{ borderLeft: `5px solid ${color}` }}>
                <div style={{ fontSize: '1.8rem' }}>{icon}</div>
                <h4 className="fw-bold mt-1 mb-0">{value}</h4>
                <small className="text-muted">{label}</small>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom p-0">
            <ul className="nav nav-tabs border-0">
              {tabs.map(t => (
                <li key={t.key} className="nav-item">
                  <button
                    className={`nav-link fw-semibold px-4 py-3 border-0 ${tab === t.key ? 'active text-warning border-bottom border-warning border-3' : 'text-muted'}`}
                    style={{ borderBottom: tab === t.key ? '3px solid #f5a623' : 'none' }}
                    onClick={() => setTab(t.key)}>
                    {t.label}
                    <span className="badge ms-2 rounded-pill"
                      style={{ background: tab === t.key ? '#f5a623' : '#dee2e6', color: tab === t.key ? '#fff' : '#555' }}>
                      {t.count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5"><div className="spinner-border text-warning" /></div>
            ) : (

              <>
                {/* ── USERS TABLE ── */}
                {tab === 'users' && (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th className="ps-4">#</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Role</th>
                          <th>Registered On</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-5 text-muted">No users registered yet</td></tr>
                        ) : users.map((u, i) => (
                          <tr key={u._id}>
                            <td className="ps-4 text-muted">{i + 1}</td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                                  style={{ width: 34, height: 34, background: '#f5a623', fontSize: '0.85rem' }}>
                                  {u.name?.[0]?.toUpperCase()}
                                </div>
                                <span className="fw-semibold">{u.name}</span>
                              </div>
                            </td>
                            <td className="text-muted">{u.email}</td>
                            <td className="text-muted">{u.phone || '—'}</td>
                            <td>
                              <span className={`badge bg-${u.role === 'admin' ? 'danger' : u.role === 'driver' ? 'success' : 'primary'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="text-muted">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                            <td className="text-center">
                              <button className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteUser(u._id)}>🗑 Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── DRIVERS TABLE ── */}
                {tab === 'drivers' && (
                  <div>
                    {/* Add Driver Form */}
                    <div className="p-4 border-bottom" style={{ background: '#fffbf0' }}>
                      <h6 className="fw-bold mb-3">➕ Register New Driver</h6>
                      {msg && <div className="alert alert-info py-2 mb-3">{msg}</div>}
                      <form onSubmit={handleAddDriver}>
                        <div className="row g-2">
                          {[
                            { key: 'name', placeholder: 'Full Name', type: 'text' },
                            { key: 'email', placeholder: 'Email', type: 'email' },
                            { key: 'phone', placeholder: 'Phone', type: 'tel' },
                            { key: 'licenseNumber', placeholder: 'License No.', type: 'text' },
                          ].map(({ key, placeholder, type }) => (
                            <div key={key} className="col-md-2">
                              <input type={type} className="form-control form-control-sm" placeholder={placeholder}
                                value={driverForm[key]}
                                onChange={e => setDriverForm({ ...driverForm, [key]: e.target.value })} required />
                            </div>
                          ))}
                          <div className="col-md-2">
                            <select className="form-select form-select-sm" value={driverForm.cabType}
                              onChange={e => setDriverForm({ ...driverForm, cabType: e.target.value })}>
                              <option value="economy">Economy</option>
                              <option value="comfort">Comfort</option>
                              <option value="premium">Premium</option>
                            </select>
                          </div>
                          <div className="col-md-2">
                            <button type="submit" className="btn btn-warning btn-sm w-100 fw-bold">Register</button>
                          </div>
                        </div>
                      </form>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead style={{ background: '#f8f9fa' }}>
                          <tr>
                            <th className="ps-4">#</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>License No.</th>
                            <th>Cab Type</th>
                            <th>Status</th>
                            <th>Rating</th>
                            <th className="text-center">Verified</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drivers.length === 0 ? (
                            <tr><td colSpan={9} className="text-center py-5 text-muted">No drivers registered yet</td></tr>
                          ) : drivers.map((d, i) => (
                            <tr key={d._id}>
                              <td className="ps-4 text-muted">{i + 1}</td>
                              <td className="fw-semibold">{d.name}</td>
                              <td className="text-muted">{d.email}</td>
                              <td className="text-muted">{d.phone}</td>
                              <td><code>{d.licenseNumber}</code></td>
                              <td><span className="badge bg-secondary text-capitalize">{d.cabType}</span></td>
                              <td>
                                <span className={`badge bg-${d.isAvailable ? 'success' : 'warning text-dark'}`}>
                                  {d.isAvailable ? 'Available' : 'On Ride'}
                                </span>
                              </td>
                              <td>⭐ {d.rating}</td>
                              <td className="text-center">
                                {d.isVerified
                                  ? <span className="badge bg-success">✓ Verified</span>
                                  : <button className="btn btn-sm btn-outline-success"
                                      onClick={() => handleVerifyDriver(d._id)}>Verify</button>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── RIDES TABLE ── */}
                {tab === 'rides' && (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th className="ps-4">#</th>
                          <th>User</th>
                          <th>Driver</th>
                          <th>Pickup</th>
                          <th>Drop-off</th>
                          <th>Cab</th>
                          <th>Distance</th>
                          <th>Fare</th>
                          <th>ETA</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rides.length === 0 ? (
                          <tr><td colSpan={12} className="text-center py-5 text-muted">No rides booked yet</td></tr>
                        ) : rides.map((r, i) => (
                          <tr key={r._id}>
                            <td className="ps-4 text-muted">{i + 1}</td>
                            <td>
                              <div className="fw-semibold">{r.user?.name || '—'}</div>
                              <small className="text-muted">{r.user?.email}</small>
                            </td>
                            <td className="text-muted">{r.driver?.name || <span className="text-warning">Unassigned</span>}</td>
                            <td style={{ maxWidth: 140 }}>
                              <small className="text-truncate d-block" title={r.pickup}>{r.pickup}</small>
                            </td>
                            <td style={{ maxWidth: 140 }}>
                              <small className="text-truncate d-block" title={r.dropoff}>{r.dropoff}</small>
                            </td>
                            <td><span className="badge bg-secondary text-capitalize">{r.cabType}</span></td>
                            <td>{r.distance} km</td>
                            <td className="fw-bold" style={{ color: '#f5a623' }}>₹{r.fare}</td>
                            <td>{r.eta} min</td>
                            <td>
                              <span className={`badge bg-${STATUS_COLORS[r.status]}`}>{r.status}</span>
                            </td>
                            <td className="text-muted">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                            <td className="text-center">
                              <button className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteRide(r._id)}>🗑</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── PAYMENTS TABLE ── */}
                {tab === 'payments' && (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th className="ps-4">#</th>
                          <th>User</th>
                          <th>Pickup → Drop-off</th>
                          <th>Cab Type</th>
                          <th>Distance</th>
                          <th>Method</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th className="text-end pe-4">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length === 0 ? (
                          <tr><td colSpan={9} className="text-center py-5 text-muted">No payments recorded yet</td></tr>
                        ) : payments.map((p, i) => (
                          <tr key={p._id}>
                            <td className="ps-4 text-muted">{i + 1}</td>
                            <td>
                              <div className="fw-semibold">{p.user?.name || '—'}</div>
                              <small className="text-muted">{p.user?.email}</small>
                            </td>
                            <td style={{ maxWidth: 200 }}>
                              <small className="d-block text-truncate">{p.ride?.pickup} → {p.ride?.dropoff}</small>
                            </td>
                            <td><span className="badge bg-secondary text-capitalize">{p.ride?.cabType || '—'}</span></td>
                            <td>{p.ride?.distance || '—'} km</td>
                            <td><span className="badge bg-info text-dark text-capitalize">{p.method}</span></td>
                            <td><span className="badge bg-success">{p.status}</span></td>
                            <td className="text-muted">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                            <td className="text-end pe-4 fw-bold" style={{ color: '#f5a623' }}>₹{p.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                      {payments.length > 0 && (
                        <tfoot style={{ background: '#fff8e1' }}>
                          <tr>
                            <td colSpan={8} className="text-end fw-bold pe-3">Total Revenue:</td>
                            <td className="text-end pe-4 fw-bold fs-5" style={{ color: '#f5a623' }}>₹{totalRevenue}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
