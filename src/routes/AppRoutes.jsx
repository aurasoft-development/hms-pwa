import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { hasRoutePermissions } from '../utils/permissions';
import LoginPage from '../pages/LoginPage';
import AppLayout from '../templates/AppLayout';
import Dashboard from '../pages/Dashboard';
import Bookings from '../pages/Bookings';
import PackageManagement from '../pages/PackageManagement';
import AdminManagement from '../pages/AdminManagement';
import NewBooking from '../pages/NewBooking';
import EditBooking from '../pages/EditBooking';
import ReceiptPage from '../pages/ReceiptPage';
import RoomBoard from '../pages/RoomBoard';
import RoomManagement from '../pages/RoomManagement';
import EditRoom from '../pages/EditRoom';
import CreateRoom from '../pages/CreateRoom';
import CreateAdmin from '../pages/CreateAdmin';
import EditAdmin from '../pages/EditAdmin';
import HotelInfo from '../pages/HotelInfo';
import HotelManagement from '../pages/HotelManagement';
import CreateHotel from '../pages/CreateHotel';
import EditHotel from '../pages/EditHotel';
import Subscriptions from '../pages/Subscriptions';
import ReviewPage from '../pages/ReviewPage';
import EventBookings from '../pages/EventBookings';
import NewEventBooking from '../pages/NewEventBooking';
import EditEventBooking from '../pages/EditEventBooking';

function ProtectedRoute({ children, module }) {
  const { user, isAuthenticated } = useAuthStore();
  console.log(user, 'user');
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If module is provided, check permissions
  if (module && user?.role) {
    if (!hasRoutePermissions(user.role, module)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated && user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route path="/review" element={<ReviewPage />} />

      {/* Unified routes - permissions handle access control */}
      <Route
        path="/*"
        element={
          <ProtectedRoute module="dashboard">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
        <Route path="bookings" element={<ProtectedRoute module="bookings"><Bookings /></ProtectedRoute>} />
        <Route path="event-bookings" element={<ProtectedRoute module="bookings"><EventBookings /></ProtectedRoute>} />
        <Route path="new-event-booking" element={<ProtectedRoute module="bookings"><NewEventBooking /></ProtectedRoute>} />
        <Route path="edit-event-booking/:id" element={<ProtectedRoute module="bookings"><EditEventBooking /></ProtectedRoute>} />
        <Route path="new-booking" element={<ProtectedRoute module="bookings"><NewBooking /></ProtectedRoute>} />
        <Route path="edit-booking/:id" element={<ProtectedRoute module="bookings"><EditBooking /></ProtectedRoute>} />
        <Route path="receipt/:id" element={<ProtectedRoute module="receipts"><ReceiptPage /></ProtectedRoute>} />
        <Route path="room-board" element={<ProtectedRoute module="room_board"><RoomBoard /></ProtectedRoute>} />
        <Route path="room-management" element={<ProtectedRoute module="rooms"><RoomManagement /></ProtectedRoute>} />
        <Route path="room-management/new" element={<ProtectedRoute module="rooms"><CreateRoom /></ProtectedRoute>} />
        <Route path="room-management/edit/:id" element={<ProtectedRoute module="rooms"><EditRoom /></ProtectedRoute>} />
        <Route path="hotels" element={<ProtectedRoute module="hotels"><HotelInfo /></ProtectedRoute>} />
        <Route path="hotel-info" element={<ProtectedRoute module="hotels"><HotelInfo /></ProtectedRoute>} />
        <Route path="hotel-management" element={<ProtectedRoute module="hotel_management"><HotelManagement /></ProtectedRoute>} />
        <Route path="hotel-management/new" element={<ProtectedRoute module="hotel_management"><CreateHotel /></ProtectedRoute>} />
        <Route path="hotel-management/edit/:id" element={<ProtectedRoute module="hotel_management"><EditHotel /></ProtectedRoute>} />
        <Route path="packages" element={<ProtectedRoute module="packages"><PackageManagement /></ProtectedRoute>} />
        <Route path="subscriptions" element={<ProtectedRoute module="subscriptions"><Subscriptions /></ProtectedRoute>} />
        <Route path="admins" element={<ProtectedRoute module="admins"><AdminManagement /></ProtectedRoute>} />
        <Route path="admins/new" element={<ProtectedRoute module="admins"><CreateAdmin /></ProtectedRoute>} />
        <Route path="admins/edit/:id" element={<ProtectedRoute module="admins"><EditAdmin /></ProtectedRoute>} />
        <Route path="" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;

