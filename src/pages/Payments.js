import { useState, useEffect } from 'react';
import api from '../api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState({}); // { [id]: { downloading, emailing, emailMsg } }

  useEffect(() => {
    api.get('/payments')
      .then(({ data }) => setPayments(data))
      .finally(() => setLoading(false));
  }, []);

  const total   = payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2);
  const avgFare = payments.length ? (total / payments.length).toFixed(2) : '0.00';

  const setAction = (id, update) =>
    setActionState(prev => ({ ...prev, [id]: { ...prev[id], ...update } }));

  const handleDownload = async (payment) => {
    setAction(payment._id, { downloading: true });
    try {
      const res = await api.get(`/payments/${payment._id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ucab_Receipt_${payment._id.toString().slice(-8).toUpperCase()}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download receipt');
    } finally {
      setAction(payment._id, { downloading: false });
    }
  };

  const handleEmail = async (payment) => {
    setAction(payment._id, { emailing: true, emailMsg: '' });
    try {
      const { data } = await api.post(`/payments/${payment._id}/email`);
      setAction(payment._id, { emailMsg: data.message });
    } catch (err) {
      setAction(payment._id, { emailMsg: err.response?.data?.message || 'Failed to send email' });
    } finally {
      setAction(payment._id, { emailing: false });
    }
  };

  if (loading) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-warning" />
    </div>
  );

  return (
    <div className="min-vh-100 py-5" style={{ background: '#f8f9fa' }}>
      <div className="container">
        <h2 className="fw-bold mb-4">💳 Payment History</h2>

        {/* Summary Cards */}
        <div className="row g-4 mb-4">
          {[
            { icon: '💰', label: 'Total Spent',    value: `₹${total}`,          color: '#f5a623' },
            { icon: '🧾', label: 'Total Rides',    value: payments.length,       color: '#28a745' },
            { icon: '📊', label: 'Avg per Ride',   value: `₹${avgFare}`,         color: '#007bff' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="col-md-4">
              <div className="card border-0 shadow-sm p-4 text-center" style={{ borderTop: `4px solid ${color}` }}>
                <div style={{ fontSize: '2rem' }}>{icon}</div>
                <h3 className="fw-bold mt-2">{value}</h3>
                <p className="text-muted mb-0">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Payments List */}
        {payments.length === 0 ? (
          <div className="card border-0 shadow-sm p-5 text-center">
            <div style={{ fontSize: '4rem' }}>💳</div>
            <h4 className="mt-3">No payments yet</h4>
            <p className="text-muted">Complete a ride to see your payment history.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {payments.map(p => {
              const state = actionState[p._id] || {};
              const receiptId = p._id.toString().slice(-8).toUpperCase();
              return (
                <div key={p._id} className="card border-0 shadow-sm p-4">
                  <div className="row align-items-center g-3">

                    {/* Receipt Info */}
                    <div className="col-md-5">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: 48, height: 48, background: '#fff8e1', fontSize: '1.5rem' }}>
                          🧾
                        </div>
                        <div>
                          <div className="fw-bold">Receipt #{receiptId}</div>
                          <small className="text-muted">{new Date(p.createdAt).toLocaleString('en-IN')}</small>
                        </div>
                      </div>
                    </div>

                    {/* Trip Info */}
                    <div className="col-md-4">
                      <div style={{ fontSize: '0.85rem' }}>
                        <div className="fw-semibold text-truncate">📍 {p.ride?.pickup}</div>
                        <div className="text-muted text-truncate">🏁 {p.ride?.dropoff}</div>
                        <div className="mt-1">
                          <span className="badge bg-secondary text-capitalize me-1">{p.ride?.cabType}</span>
                          <span className="badge bg-info text-dark text-capitalize me-1">{p.method}</span>
                          <span className="badge bg-success">{p.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Amount + Actions */}
                    <div className="col-md-3 text-md-end">
                      <div className="fs-5 fw-bold mb-2" style={{ color: '#f5a623' }}>₹{p.amount}</div>
                      <div className="d-flex gap-2 justify-content-md-end flex-wrap">
                        <button
                          className="btn btn-sm btn-warning fw-semibold"
                          onClick={() => handleDownload(p)}
                          disabled={state.downloading}>
                          {state.downloading ? '⏳' : '📄'} PDF
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary fw-semibold"
                          onClick={() => handleEmail(p)}
                          disabled={state.emailing}>
                          {state.emailing ? '⏳' : '📧'} Email
                        </button>
                      </div>
                      {state.emailMsg && (
                        <small className={`d-block mt-1 ${state.emailMsg.includes('sent') ? 'text-success' : 'text-danger'}`}>
                          {state.emailMsg}
                        </small>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
