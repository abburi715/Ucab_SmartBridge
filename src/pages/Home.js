import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', minHeight: '90vh' }}
        className="d-flex align-items-center">
        <div className="container text-center text-white py-5">
          <div className="mb-4" style={{ fontSize: '5rem' }}>🚕</div>
          <h1 className="display-3 fw-bold mb-3">
            Welcome to <span style={{ color: '#f5a623' }}>Ucab</span>
          </h1>
          <p className="lead mb-4 text-light opacity-75" style={{ maxWidth: 600, margin: '0 auto' }}>
            Book rides quickly and comfortably. Real-time tracking, secure payments, and always on time.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            {user ? (
              <Link to="/book" className="btn btn-warning btn-lg px-5 fw-bold">Book a Ride Now</Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-warning btn-lg px-5 fw-bold">Get Started</Link>
                <Link to="/login" className="btn btn-outline-light btn-lg px-4">Passenger Login</Link>
                <Link to="/driver-login" className="btn btn-outline-success btn-lg px-4">Driver Login</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">Why Choose Ucab?</h2>
          <div className="row g-4">
            {[
              { icon: '⚡', title: 'Instant Booking', desc: 'Book a cab in seconds with just a few taps.' },
              { icon: '📍', title: 'Real-Time Tracking', desc: 'Track your driver live from pickup to drop-off.' },
              { icon: '💳', title: 'Secure Payments', desc: 'Pay safely with saved cards or cash.' },
              { icon: '🚗', title: 'Multiple Cab Types', desc: 'Economy, Comfort, or Premium — your choice.' },
              { icon: '📋', title: 'Ride History', desc: 'View all past rides and receipts anytime.' },
              { icon: '🎁', title: 'Discounts & Offers', desc: 'Enjoy exclusive deals and loyalty rewards.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="col-md-4">
                <div className="card h-100 border-0 shadow-sm text-center p-4">
                  <div style={{ fontSize: '2.5rem' }}>{icon}</div>
                  <h5 className="fw-bold mt-3">{title}</h5>
                  <p className="text-muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cab Types */}
      <div className="py-5">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">Our Cab Types</h2>
          <div className="row g-4 justify-content-center">
            {[
              { type: 'Economy', price: '$8/km', icon: '🚗', color: '#28a745', desc: 'Affordable everyday rides' },
              { type: 'Comfort', price: '$12/km', icon: '🚙', color: '#007bff', desc: 'Extra space and comfort' },
              { type: 'Premium', price: '$18/km', icon: '🏎️', color: '#f5a623', desc: 'Luxury rides in style' },
            ].map(({ type, price, icon, color, desc }) => (
              <div key={type} className="col-md-4">
                <div className="card border-0 shadow text-center p-4 h-100"
                  style={{ borderTop: `4px solid ${color}` }}>
                  <div style={{ fontSize: '3rem' }}>{icon}</div>
                  <h4 className="fw-bold mt-3">{type}</h4>
                  <p className="text-muted">{desc}</p>
                  <span className="badge fs-6 mt-2" style={{ background: color }}>{price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#1a1a2e' }} className="text-white text-center py-4">
        <p className="mb-0">© 2024 <span style={{ color: '#f5a623' }}>Ucab</span> — Making travel simple, reliable, and stress-free.</p>
      </footer>
    </div>
  );
}
