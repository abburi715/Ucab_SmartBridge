import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=reset form
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ otp: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setOtpCode(data.otp);
      setMsg('Reset code generated successfully.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Email not found');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { email, otp: form.otp, newPassword: form.newPassword });
      setMsg('Password reset successful! You can now login.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. Check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }}>
      <div className="card shadow-lg border-0 p-4" style={{ width: '100%', maxWidth: 420 }}>
        <div className="text-center mb-4">
          <div style={{ fontSize: '3rem' }}>{step === 3 ? '✅' : '🔐'}</div>
          <h3 className="fw-bold">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Enter Reset Code'}
            {step === 3 && 'Password Reset!'}
          </h3>
          <p className="text-muted">
            {step === 1 && 'Enter your registered email to receive a reset code'}
            {step === 2 && `Code sent to ${email}`}
            {step === 3 && 'Your password has been updated successfully'}
          </p>
        </div>

        {msg && <div className="alert alert-success py-2">{msg}</div>}
        {error && <div className="alert alert-danger py-2">{error}</div>}

        {/* Step 1 — Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="mb-4">
              <label className="form-label fw-semibold">Registered Email</label>
              <input type="email" className="form-control" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-warning w-100 fw-bold" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* Step 2 — OTP + New Password */}
        {step === 2 && (
          <form onSubmit={handleReset}>
            {/* Show OTP on screen */}
            {otpCode && (
              <div className="alert border-0 mb-3 text-center" style={{ background: '#fff8e1' }}>
                <small className="text-muted d-block mb-1">Your Reset Code</small>
                <div className="fw-bold fs-3 letter-spacing" style={{ color: '#f5a623', letterSpacing: 8 }}>
                  {otpCode}
                </div>
                <small className="text-muted">Valid for 10 minutes</small>
              </div>
            )}
            <div className="mb-3">
              <label className="form-label fw-semibold">Enter Reset Code</label>
              <input type="text" className="form-control form-control-lg text-center fw-bold"
                placeholder="Enter 6-digit code"
                maxLength={6}
                value={form.otp} onChange={e => setForm({ ...form, otp: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">New Password</label>
              <input type="password" className="form-control" placeholder="••••••••"
                value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">Confirm Password</label>
              <input type="password" className="form-control" placeholder="••••••••"
                value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-warning w-100 fw-bold" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button type="button" className="btn btn-link w-100 mt-2 text-muted"
              onClick={() => { setStep(1); setError(''); setMsg(''); }}>
              ← Back
            </button>
          </form>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <Link to="/login" className="btn btn-warning w-100 fw-bold">Go to Login</Link>
        )}

        {step === 1 && (
          <p className="text-center mt-3 mb-0">
            Remember it? <Link to="/login" className="text-warning fw-semibold">Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}
