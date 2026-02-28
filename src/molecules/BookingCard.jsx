import { format } from 'date-fns';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { useAuthStore } from '../store/authStore';
import { hasUpdatePermissions, hasDeletePermissions } from '../utils/permissions';
import { Calendar, User, Phone, Mail, MapPin, Eye, Edit, Trash2, Users, Briefcase } from 'lucide-react';
import { formatSafeDate } from '../utils/dateUtils';
import { theme } from '../utils/theme';

export const BookingCard = ({ booking, onView, onEdit, onDelete, showActions = true }) => {
  const { user } = useAuthStore();
  const canUpdate = hasUpdatePermissions(user?.role, 'bookings');
  const canDelete = hasDeletePermissions(user?.role, 'bookings');
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' };
      case 'checked-in':
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
      case 'checked-out':
        return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-500' };
      default:
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' };
    }
  };

  const statusStyle = getStatusColor(booking.status);

  return (
    <Card hover className="overflow-hidden relative">
      {/* Gradient accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: booking.status === 'confirmed'
            ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
            : booking.status === 'checked-in'
              ? 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)'
              : booking.status === 'checked-out'
                ? 'linear-gradient(90deg, #6B7280 0%, #4B5563 100%)'
                : 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
        }}
      />

      <div className="flex flex-col gap-2.5">
        {/* Header Section - Guest Info */}
        <div className="flex items-start gap-2.5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md"
            style={{
              background: theme.colors.gradients.accent
            }}
          >
            <User className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h3 className="text-base font-bold text-gray-900 truncate">{booking.guestName}</h3>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1 flex-shrink-0 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending'}
              </span>
            </div>

            {booking.guestEmail && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-0.5">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{booking.guestEmail}</span>
              </div>
            )}

            {booking.guestPhone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-0.5">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>{booking.guestPhone}</span>
              </div>
            )}
            {booking.numberOfGuests && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-0.5">
                <Users className="w-3 h-3 flex-shrink-0" />
                <span>{booking.numberOfGuests} {booking.numberOfGuests == 1 ? 'Guest' : 'Guests'}</span>
              </div>
            )}
            {booking.purposeOfVisit && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-0.5">
                <Briefcase className="w-3 h-3 flex-shrink-0" />
                <span>{booking.purposeOfVisit}</span>
              </div>
            )}
            {booking.comingFrom && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>From: {booking.comingFrom}</span>
              </div>
            )}
          </div>
        </div>

        {/* Booking Details - Date, Room & Total Amount in same section */}
        <div className="pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
          <div className="grid grid-cols-2 gap-5 flex">
            {/* Date */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" style={{ color: '#039E2F' }} />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dates</p>
              </div>
              <p className="text-xs font-semibold text-gray-900 leading-tight">
                {formatSafeDate(booking.checkIn, (d) => format(d, 'MMM dd'), 'N/A')} - {formatSafeDate(booking.checkOut, (d) => format(d, 'MMM dd'), 'N/A')}
              </p>
            </div>

            {/* Room */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" style={{ color: '#039E2F' }} />
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Room</p>
              </div>
              {booking.roomNumber ? (
                <p className="text-xs font-semibold text-gray-900 leading-tight">
                  Room {booking.roomNumber}
                </p>
              ) : (
                <p className="text-xs font-semibold text-gray-900 leading-tight">{booking.roomType || 'N/A'}</p>
              )}
              <p className="text-xs text-gray-500 leading-tight">
                {booking.roomType || 'N/A'}
                {booking.nights && ` • ${booking.nights} ${booking.nights === 1 ? 'night' : 'nights'}`}
              </p>
            </div>

            {/* Total Amount */}
            {/* <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold" style={{ color: '#039E2F' }}>₹</span>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total</p>
              </div>
              <p className="text-xs font-bold leading-tight" style={{ color: '#039E2F' }}>
                ₹{(booking.totalAmount || 0).toFixed(2)}
              </p>
              {booking.packageName && (
                <p className="text-xs text-gray-500 truncate">+ {booking.packageName}</p>
              )}
            </div> */}
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="pt-2 flex gap-2">
            {onEdit && canUpdate && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(booking)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </Button>
            )}
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(booking)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </Button>
            )}
            {onDelete && canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(booking)}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

