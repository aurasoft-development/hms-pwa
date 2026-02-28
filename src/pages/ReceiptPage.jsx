import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { pdfService } from '../utils/pdfService';
import { whatsappService } from '../utils/whatsappService';
import { format } from 'date-fns';
import { Download, ArrowLeft, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatSafeDate, safeDate } from '../utils/dateUtils';

export default function ReceiptPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { bookings, hotel, initializeData } = useAppStore();
  const { user } = useAuthStore();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    if (bookings.length > 0) {
      // Handle both numeric and string IDs
      const foundBooking = bookings.find((b) => 
        b.id === parseInt(id) || 
        b.id === id || 
        b.id?.toString() === id?.toString()
      );
      setBooking(foundBooking);
    }
  }, [bookings, id]);

  const handleDownload = () => {
    if (booking) {
      pdfService.generateReceipt(booking, hotel);
      toast.success('Receipt downloaded successfully');
    }
  };

  const handleShareWhatsApp = () => {
    if (booking) {
      // If guest has phone number, share directly to them
      if (booking.guestPhone) {
        // Format phone number with country code (handled by whatsappService)
        whatsappService.shareReceipt(booking, booking.guestPhone);
        toast.success('Opening WhatsApp to share receipt...');
      } else {
        // Open WhatsApp without pre-filled number (user can choose contact)
        whatsappService.shareReceipt(booking);
        toast.success('Opening WhatsApp to share receipt...');
      }
    }
  };

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading receipt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="secondary" onClick={() => navigate('/bookings')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bookings
        </Button>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleShareWhatsApp}
            style={{ 
              backgroundColor: '#25D366',
              color: 'white',
              borderColor: '#25D366'
            }}
            className="hover:opacity-90"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Share on WhatsApp
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <Card>
        {/* Hotel Information Header */}
        {hotel && (
          <div className="text-center mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-burgundy mb-2">{hotel.name || 'Grand Hotel'}</h1>
            <div className="space-y-1 text-sm text-gray-600">
              {hotel.address && <p>{hotel.address}</p>}
              <div className="flex items-center justify-center gap-4 mt-2">
                {hotel.phone && <p>Phone: {hotel.phone}</p>}
                {hotel.email && <p>Email: {hotel.email}</p>}
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">HOTEL RECEIPT</h2>
          <p className="text-gray-600 mt-2">Receipt #{booking.id}</p>
          <p className="text-sm text-gray-500 mt-1">
            Date: {formatSafeDate(booking.createdAt, (d) => format(d, 'PPp'), 'N/A')}
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Guest Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p><span className="font-medium">Name:</span> {booking.guestName}</p>
              {booking.guestEmail && (
                <p><span className="font-medium">Email:</span> {booking.guestEmail}</p>
              )}
              {booking.guestPhone && (
                <p><span className="font-medium">Phone:</span> {booking.guestPhone}</p>
              )}
              {booking.numberOfGuests && (
                <p><span className="font-medium">Number of Guests:</span> {booking.numberOfGuests}</p>
              )}
              {booking.purposeOfVisit && (
                <p><span className="font-medium">Purpose of Visit:</span> {booking.purposeOfVisit}</p>
              )}
              {booking.comingFrom && (
                <p><span className="font-medium">Coming From:</span> {booking.comingFrom}</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Booking Details</h2>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {booking.roomNumber ? (
                <p>
                  <span className="font-medium">Room:</span>{' '}
                  <span className="font-semibold text-burgundy">Room {booking.roomNumber}</span>
                  {booking.roomType && <span className="text-gray-600"> ({booking.roomType})</span>}
                </p>
              ) : (
                <p><span className="font-medium">Room Type:</span> {booking.roomType || 'N/A'}</p>
              )}
              <p>
                <span className="font-medium">Check-in:</span>{' '}
                {formatSafeDate(booking.checkIn, (d) => format(d, 'PP'), 'N/A')}
                {booking.checkedInAt && (
                  <span className="text-sm text-gray-500 ml-2">
                    (Checked in: {formatSafeDate(booking.checkedInAt, (d) => format(d, 'PPp'), '')})
                  </span>
                )}
              </p>
              <p>
                <span className="font-medium">Check-out:</span>{' '}
                {formatSafeDate(booking.checkOut, (d) => format(d, 'PP'), 'N/A')}
                {booking.checkedOutAt && (
                  <span className="text-sm text-gray-500 ml-2">
                    (Checked out: {formatSafeDate(booking.checkedOutAt, (d) => format(d, 'PPp'), '')})
                  </span>
                )}
              </p>
              <p><span className="font-medium">Nights:</span> {booking.nights || 0}</p>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">Charges Breakdown</h2>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span>Room ({booking.nights || 0} nights)</span>
                <span className="font-medium">₹{(booking.roomPrice || 0).toFixed(2)}</span>
              </div>
              {booking.packagePrice > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span>Package: {booking.packageName}</span>
                  <span className="font-medium">₹{(booking.packagePrice || 0).toFixed(2)}</span>
                </div>
              )}
              {booking.foodPackagePrice > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span>Food: {booking.foodPackageName}</span>
                  <span className="font-medium">₹{(booking.foodPackagePrice || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-4 border-t-2 border-gray-300 mt-4">
                <span className="text-lg font-bold">Total Amount:</span>
                <span className="text-lg font-bold text-burgundy">
                  ₹{(booking.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center pt-6 border-t">
            <p className="text-sm text-gray-500">Thank you for your stay!</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

