import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
      <div className="container">
        <Link className="navbar-brand fw-bold fs-4" to="/">
          🚕 <span style={{ color: '#f5a623' }}>Ucab</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav ms-auto align-items-center gap-2">
            {user ? (
              <>
                <li className="nav-item"><Link className="nav-link" to="/book">Book Ride</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/history">My Rides</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/payments">Payments</Link></li>
                {user.role === 'driver' && (
                  <li className="nav-item"><Link className="nav-link" to="/driver">Driver Dashboard</Link></li>
                )}
                {user.role === 'admin' && (
                  <li className="nav-item"><Link className="nav-link" to="/admin">Admin</Link></li>
                )}
                <li className="nav-item">
                  <span className="nav-link text-warning">👤 {user.name}</span>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-warning btn-sm" onClick={handleLogout}>Logout</button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item"><Link className="nav-link" to="/login">Passenger Login</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/driver-login">Driver Login</Link></li>
                <li className="nav-item"><Link className="btn btn-warning btn-sm px-3" to="/register">Sign Up</Link></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
