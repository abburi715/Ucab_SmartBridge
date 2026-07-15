import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

import Home from './pages/Home';
import UserLogin from './pages/UserLogin';
import DriverLogin from './pages/DriverLogin';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import BookRide from './pages/BookRide';
import RideTracking from './pages/RideTracking';
import RideHistory from './pages/RideHistory';
import Payments from './pages/Payments';
import Admin from './pages/Admin';
import DriverDashboard from './pages/DriverDashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/driver-login" element={<DriverLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/book" element={<PrivateRoute><BookRide /></PrivateRoute>} />
          <Route path="/ride/:id" element={<PrivateRoute><RideTracking /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><RideHistory /></PrivateRoute>} />
          <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
          <Route path="/driver" element={<PrivateRoute><DriverDashboard /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
