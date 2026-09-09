import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import io from 'socket.io-client';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LotView from './pages/LotView';
import BookingPage from './pages/BookingPage';
import BookingSuccess from './pages/BookingSuccess';
import MyBookings from './pages/MyBookings';
import EVStationsNearby from './pages/EVStationsNearby';
import RentYourSpace from './pages/RentYourSpace';
import AdminDashboard from './pages/AdminDashboard';
import AdminBookings from './pages/AdminBookings';
import { IconClock } from './components/Icons';

const PrivateRoute = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: '36px', height: '36px',
        border: '3px solid #e2e8f0', borderTopColor: '#2563eb',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite'
      }} />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const socket = io('http://localhost:5000');
    const userId = user.id || user._id;

    socket.emit('register-user', userId);

    const handleExpiryNotification = (data) => {
      toast.warn(
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginBottom: '4px', color: '#b45309' }}>
            <IconClock size={15} color="#b45309" /> Parking Expiring in {data.remainingMinutes} min(s)!
          </div>
          <div style={{ fontSize: '12.5px', color: '#451a03', marginBottom: '8px' }}>
            {data.message}
          </div>
          <button
            onClick={() => navigate('/my-bookings')}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Extend Duration Now →
          </button>
        </div>,
        { autoClose: 15000, toastId: `expiry-${data.bookingId || 'active'}` }
      );
    };

    socket.on('booking-expiring-soon', handleExpiryNotification);

    return () => socket.disconnect();
  }, [user, navigate]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/lot/:id" element={<PrivateRoute><LotView /></PrivateRoute>} />
        <Route path="/book/:id" element={<PrivateRoute><BookingPage /></PrivateRoute>} />
        <Route path="/booking-success/:id" element={<PrivateRoute><BookingSuccess /></PrivateRoute>} />
        <Route path="/my-bookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
        <Route path="/ev-stations" element={<PrivateRoute><EVStationsNearby /></PrivateRoute>} />
        <Route path="/rent-space" element={<PrivateRoute><RentYourSpace /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/bookings" element={<PrivateRoute adminOnly><AdminBookings /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right" autoClose={3000} hideProgressBar={false} limit={2}
          toastStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
          theme="light"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
