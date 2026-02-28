import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi/bookingApi';
import { roomManagementApi } from '../api/roomManagementApi/roomManagementApi';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { useAuthStore } from '../store/authStore';
import { hasCreatePermissions, hasUpdatePermissions, hasDeletePermissions, hasViewPermissions } from '../utils/permissions';
import { BookingCard } from '../molecules/BookingCard';
import { ConfirmationDialog } from '../molecules/ConfirmationDialog';
import { Button } from '../atoms/Button';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Card } from '../atoms/Card';
import { Modal } from '../atoms/Modal';
import { Calendar, Search, X, Filter, User, Mail, Phone, MapPin, Users, Briefcase, FileText, Edit, CheckCircle2, Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { generateDailyBookingReportApi } from '../api/bookingReportApi/generateDailyBookingReportApi';
import { extractId } from '../utils/apiUtils';
import toast from 'react-hot-toast';

export default function Bookings() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    booking: null,
  });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewBookingData, setViewBookingData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [hotelId, setHotelId] = useState(null);

  const [checkoutData, setCheckoutData] = useState({
    isOpen: false,
    qrCode: '',
    token: '',
  });
  const [reportModal, setReportModal] = useState({
    isOpen: false,
    date: new Date().toISOString().split('T')[0],
    format: 'pdf',
    loading: false
  });

  // Fetch bookings from API
  const fetchBookings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await bookingApi.getAllBookingsWithPagination(
        page,
        pagination.limit,
        statusFilter || undefined,
        undefined, // roomId
        undefined  // room
      );

      // Handle different response formats
      const bookingsData = response.bookings || response.data || response || [];
      let transformedBookings = Array.isArray(bookingsData)
        ? bookingsData.map(transformBookingFromAPI)
        : [];

      // Fetch room details for bookings that have roomId but no room data
      const bookingsWithRoomPromises = transformedBookings.map(async (booking) => {
        if (booking.roomId && !booking.roomNumber && booking.hotelId) {
          try {
            const roomResponse = await roomManagementApi.getRoomById(booking.hotelId, booking.roomId);
            const roomData = roomResponse.data || roomResponse;
            if (roomData) {
              return {
                ...booking,
                roomNumber: roomData.roomNumber || booking.roomNumber || '',
                roomType: roomData.roomType || booking.roomType || '',
                // Recalculate totalAmount if we now have room price
                totalAmount: booking.totalAmount || (booking.nights * (roomData.pricePerNight || 0)) || 0,
              };
            }
          } catch (error) {
            console.error(`Failed to fetch room ${booking.roomId}:`, error);
            // Continue with existing booking data
          }
        }
        return booking;
      });

      transformedBookings = await Promise.all(bookingsWithRoomPromises);

      setBookings(transformedBookings);
      setPagination({
        page: response.page || page,
        limit: response.limit || pagination.limit,
        total: response.total || transformedBookings.length,
        totalPages: response.totalPages || Math.ceil((response.total || transformedBookings.length) / pagination.limit),
      });
    } catch (error) {
      toast.error(error || 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, statusFilter]);

  // Transform API booking to UI format
  const transformBookingFromAPI = (apiBooking) => {
    return {
      ...apiBooking, // Original fields at top
      id: extractId(apiBooking._id || apiBooking.id),
      guestName: apiBooking.guestName || '',
      guestEmail: apiBooking.guestEmail || '',
      guestPhone: apiBooking.guestPhone || '',
      numberOfGuests: apiBooking.numberOfGuests || 1,
      purposeOfVisit: apiBooking.purposeOfVisit || '',
      comingFrom: apiBooking.comingFrom || '',
      roomId: extractId(apiBooking.roomId),
      roomNumber: apiBooking.room?.roomNumber || apiBooking.roomNumber || apiBooking.room?.number || '',
      roomType: apiBooking.room?.roomType || apiBooking.roomType || apiBooking.room?.type || '',
      checkIn: apiBooking.checkInDate || apiBooking.checkIn || '',
      checkOut: apiBooking.checkOutDate || apiBooking.checkOut || '',
      checkInDate: apiBooking.checkInDate || apiBooking.checkIn || '',
      checkOutDate: apiBooking.checkOutDate || apiBooking.checkOut || '',
      foodPackage: apiBooking.foodPackage || '',
      foodPackageName: apiBooking.foodPackage || '',
      status: apiBooking.status || 'pending',
      notes: apiBooking.notes || '',
      totalAmount: apiBooking.totalAmount || apiBooking.total || calculateNightsPrice(apiBooking) || 0,
      nights: calculateNights(apiBooking.checkInDate || apiBooking.checkIn, apiBooking.checkOutDate || apiBooking.checkOut),
      hotelId: extractId(apiBooking.hotelId),
      createdAt: apiBooking.createdAt || '',
      updatedAt: apiBooking.updatedAt || '',
    };
  };

  // Calculate nights between check-in and check-out
  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    try {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const diffTime = Math.abs(checkOutDate - checkInDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays || 1;
    } catch {
      return 1;
    }
  };

  // Calculate price based on nights (if not provided)
  const calculateNightsPrice = (booking) => {
    const nights = calculateNights(booking.checkInDate || booking.checkIn, booking.checkOutDate || booking.checkOut);
    const pricePerNight = booking.room?.pricePerNight || booking.room?.price || booking.pricePerNight || booking.price || 0;
    return nights * pricePerNight;
  };

  useEffect(() => {
    fetchBookings(1);
  }, [fetchBookings]);

  // Fetch hotel ID for reports
  useEffect(() => {
    const fetchHotelId = async () => {
      try {
        const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
        if (isSuperAdmin || !user) return;

        const response = await hotelManagementApi.getMyHotel();
        const hotel = response.data || response;
        if (hotel?._id || hotel?.id) {
          setHotelId(extractId(hotel));
        }
      } catch (error) {
        console.error('Failed to fetch hotel:', error);
      }
    };
    fetchHotelId();
  }, []);

  // Filter bookings based on search (client-side filtering for search)
  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((booking) => {
        return (
          booking.guestName?.toLowerCase().includes(query) ||
          booking.guestEmail?.toLowerCase().includes(query) ||
          booking.guestPhone?.toLowerCase().includes(query) ||
          booking.roomType?.toLowerCase().includes(query) ||
          booking.roomNumber?.toString().toLowerCase().includes(query) ||
          booking.foodPackage?.toLowerCase().includes(query) ||
          booking.id?.toString().includes(query)
        );
      });
    }

    return filtered;
  }, [bookings, searchQuery]);

  // Handle view booking details
  const handleView = async (booking) => {
    setViewLoading(true);
    setIsViewModalOpen(true);
    setRoomNumber('');
    setHotelName('');

    try {
      const response = await bookingApi.getBookingById(booking.id);
      const bookingData = response.data || response;
      setViewBookingData(bookingData);

      // Fetch room details to get room number
      const targetRoomId = extractId(bookingData.roomId);
      const targetHotelId = extractId(bookingData.hotelId);

      if (targetRoomId && targetHotelId) {
        try {
          const roomResponse = await roomManagementApi.getRoomById(targetHotelId, targetRoomId);
          const roomData = roomResponse.data || roomResponse;
          if (roomData.roomNumber) {
            setRoomNumber(roomData.roomNumber);
          }
        } catch (roomError) {
          console.error('Failed to fetch room details:', roomError);
          // Don't show error toast, just continue without room number
        }
      }

      // Fetch hotel details to get hotel name
      if (targetHotelId) {
        try {
          const hotelResponse = await hotelManagementApi.getHotelById(targetHotelId);
          const hotelData = hotelResponse.data || hotelResponse;
          if (hotelData.name) {
            setHotelName(hotelData.name);
          }
        } catch (hotelError) {
          console.error('Failed to fetch hotel details:', hotelError);
          // Don't show error toast, just continue without hotel name
        }
      }
    } catch (error) {
      toast.error(error || 'Failed to fetch booking details');
      setIsViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleViewReceipt = (booking) => {
    navigate(`/receipt/${booking.id}`);
  };

  const handleEditBooking = (booking) => {
    navigate(`/edit-booking/${booking.id}`);
  };

  const handleDelete = (booking) => {
    setDeleteDialog({ isOpen: true, booking });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.booking) return;

    setLoading(true);
    try {
      await bookingApi.deleteBooking(deleteDialog.booking.id);
      toast.success('Booking deleted successfully');
      setDeleteDialog({ isOpen: false, booking: null });
      fetchBookings(pagination.page); // Refresh the list
    } catch (error) {
      toast.error(error || 'Failed to delete booking');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status, hotelId) => {
    setLoading(true);
    try {
      const response = await bookingApi.updateBookingStatus(id, status, hotelId);

      if (status === 'checked_out' && (response.qrCode || response.data?.qrCode)) {
        const qrCode = response.qrCode || response.data?.qrCode;
        const token = response.token || response.data?.token;
        setCheckoutData({
          isOpen: true,
          qrCode,
          token
        });
        setIsViewModalOpen(false);
        toast.success('Successfully checked out!');
      } else {
        toast.success(`Status updated to ${status}`);
        fetchBookings(pagination.page);
      }
    } catch (error) {
      toast.error(error || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

  const handleGenerateReport = async () => {
    const targetHotelId = hotelId || user?.hotelId || user?.hotel?._id || user?.id;

    if (!targetHotelId) {
      toast.error('Hotel ID not found. Please wait a moment or try refreshing.');
      return;
    }

    setReportModal(prev => ({ ...prev, loading: true }));
    try {
      let response;
      const { date, format } = reportModal;

      if (format === 'pdf') {
        response = await generateDailyBookingReportApi.generateDailyBookingReportPDFFormat(targetHotelId, date);
      } else {
        response = await generateDailyBookingReportApi.generateDailyBookingReportXLSXFormat(targetHotelId, date);
      }

      // Handle binary data for download
      const blob = new Blob([response], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Daily_Booking_Report_${date}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${format.toUpperCase()} Report generated successfully`);
      setReportModal(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error(error?.message || 'Failed to generate report');
    } finally {
      setReportModal(prev => ({ ...prev, loading: false }));
    }
  };

  const hasActiveFilters = searchQuery.trim() || statusFilter;

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy mx-auto mb-4"
            style={{ borderBottomColor: '#800020' }}
          />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-600 mt-1">View and manage all bookings</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {hasViewPermissions(user?.role, 'bookings') && (
            <Button
              variant="outline"
              onClick={() => setReportModal(prev => ({ ...prev, isOpen: true }))}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Daily Report
            </Button>
          )}
          {hasCreatePermissions(user?.role, 'bookings') && (
            <Button
              onClick={() => navigate('/new-booking')}
              size="lg"
              className="w-full sm:w-auto"
            >
              New Booking
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter Section - Show only if user has view permission */}
      {hasViewPermissions(user?.role, 'bookings') && (
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by guest name, email, phone ..."
                  className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-burgundy focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400 shadow-sm"
                  style={{ '--tw-ring-color': '#800020' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-64">
              <SelectDropdown
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  // Reset to page 1 when filter changes
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                options={[
                  { id: '', name: 'All Status' },
                  { id: 'pending', name: 'Pending' },
                  { id: 'confirmed', name: 'Confirmed' },
                  { id: 'checked-in', name: 'Checked In' },
                  { id: 'checked-out', name: 'Checked Out' },
                  { id: 'cancelled', name: 'Cancelled' },
                ]}
                placeholder="Filter by status"
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full lg:w-auto flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Results Count */}
          {(hasActiveFilters || filteredBookings.length !== bookings.length) && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredBookings.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{pagination.total}</span> bookings
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Bookings List */}
      {filteredBookings.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onView={hasViewPermissions(user?.role, 'bookings') ? handleView : null}
                onEdit={hasUpdatePermissions(user?.role, 'bookings') ? handleEditBooking : null}
                onDelete={hasDeletePermissions(user?.role, 'bookings') ? handleDelete : null}
                showActions={true}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Card>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} bookings
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBookings(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchBookings(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : bookings.length > 0 ? (
        <Card className="py-16">
          <div className="flex flex-col items-center justify-center px-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #F5E6D3 0%, rgba(245,230,211,0.5) 100%)'
              }}
            >
              <Search className="w-10 h-10" style={{ color: '#800020' }} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 text-center max-w-md mb-4">
              {hasActiveFilters
                ? 'Try adjusting your search or filter criteria to find bookings.'
                : 'Get started by creating your first booking. Click the "New Booking" button above to begin.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="py-16">
          <div className="flex flex-col items-center justify-center px-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #F5E6D3 0%, rgba(245,230,211,0.5) 100%)'
              }}
            >
              <Calendar className="w-10 h-10" style={{ color: '#800020' }} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 text-center max-w-md mb-4">
              Get started by creating your first booking. Click the "New Booking" button above to begin.
            </p>
            {hasCreatePermissions(user?.role, 'bookings') && (
              <Button onClick={() => navigate('/new-booking')}>
                Create First Booking
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* View Booking Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewBookingData(null);
          setRoomNumber('');
          setHotelName('');
        }}
        title="Booking Details"
        size="xl"
      >
        {viewLoading ? (
          <div className="py-16 text-center text-gray-500">Loading booking details...</div>
        ) : viewBookingData ? (
          <div className="space-y-6">
            {/* Booking Header */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Booking #{viewBookingData._id || viewBookingData.id}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${viewBookingData.status === 'confirmed'
                  ? 'bg-green-100 text-green-800'
                  : viewBookingData.status === 'checked_in'
                    ? 'bg-blue-100 text-blue-800'
                    : viewBookingData.status === 'checked_out'
                      ? 'bg-gray-100 text-gray-800'
                      : viewBookingData.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {viewBookingData.status?.charAt(0).toUpperCase() + viewBookingData.status?.slice(1) || 'Pending'}
                </span>
              </div>
            </div>

            {/* Guest Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Guest Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Guest Name
                    </label>
                    <p className="text-gray-900 mt-1">{viewBookingData.guestName || 'N/A'}</p>
                  </div>
                  {viewBookingData.guestEmail && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <p className="text-gray-900 mt-1">
                        <a href={`mailto:${viewBookingData.guestEmail}`} className="text-blue-600 hover:underline">
                          {viewBookingData.guestEmail}
                        </a>
                      </p>
                    </div>
                  )}
                  {viewBookingData.guestPhone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </label>
                      <p className="text-gray-900 mt-1">{viewBookingData.guestPhone}</p>
                    </div>
                  )}
                  {viewBookingData.numberOfGuests && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Number of Guests
                      </label>
                      <p className="text-gray-900 mt-1">{viewBookingData.numberOfGuests} {viewBookingData.numberOfGuests === 1 ? 'Guest' : 'Guests'}</p>
                    </div>
                  )}
                  {viewBookingData.purposeOfVisit && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Purpose of Visit
                      </label>
                      <p className="text-gray-900 mt-1">{viewBookingData.purposeOfVisit}</p>
                    </div>
                  )}
                  {viewBookingData.comingFrom && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Coming From
                      </label>
                      <p className="text-gray-900 mt-1">{viewBookingData.comingFrom}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Booking Details</h3>
                <div className="space-y-3">
                  {(roomNumber || viewBookingData.roomId) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Room Number</label>
                      <p className="text-gray-900 mt-1">
                        {roomNumber || viewBookingData.room?.roomNumber || 'N/A'}
                      </p>
                    </div>
                  )}
                  {viewBookingData.checkInDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Check-in Date
                      </label>
                      <p className="text-gray-900 mt-1">
                        {new Date(viewBookingData.checkInDate).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {viewBookingData.checkOutDate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Check-out Date
                      </label>
                      <p className="text-gray-900 mt-1">
                        {new Date(viewBookingData.checkOutDate).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {viewBookingData.foodPackage && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Food Package</label>
                      <p className="text-gray-900 mt-1">{viewBookingData.foodPackage}</p>
                    </div>
                  )}
                  {(hotelName || viewBookingData.hotelId) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Hotel</label>
                      <p className="text-gray-900 mt-1">
                        {hotelName || viewBookingData.hotel?.name || 'N/A'}
                      </p>
                    </div>
                  )}
                  {(hotelName || viewBookingData.hotelId) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Booking ID</label>
                      <p className="text-gray-900 mt-1">
                        {viewBookingData._id || viewBookingData.id}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Notes */}
            {viewBookingData.notes && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Notes
                </h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{viewBookingData.notes}</p>
              </div>
            )}

            {/* Additional Information */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {viewBookingData.createdAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(viewBookingData.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {viewBookingData.updatedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-gray-900 mt-1">
                      {new Date(viewBookingData.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewBookingData(null);
                }}
              >
                Close
              </Button>
              {/* {hasViewPermissions(user?.role, 'receipts') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleViewReceipt({ id: viewBookingData._id || viewBookingData.id });
                  }}
                >
                  View Receipt
                </Button>
              )} */}
              {hasUpdatePermissions(user?.role, 'bookings') && (
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEditBooking({ id: viewBookingData._id || viewBookingData.id });
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Booking
                </Button>
              )}
              {hasUpdatePermissions(user?.role, 'bookings') && viewBookingData.status === 'checked_in' && (
                <Button
                  onClick={() => handleStatusUpdate(viewBookingData._id || viewBookingData.id, 'checked_out', viewBookingData.hotelId?._id || viewBookingData.hotelId?.id || viewBookingData.hotelId)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Check Out
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">No booking data available</div>
        )}
      </Modal>

      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, booking: null })}
        onConfirm={confirmDelete}
        title="Delete Booking"
        message={`Are you sure you want to delete the booking for "${deleteDialog.booking?.guestName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Checkout QR Code Modal */}
      {checkoutData.isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300"
          onClick={() => {
            setCheckoutData(prev => ({ ...prev, isOpen: false }));
            fetchBookings(pagination.page);
          }}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-all duration-300 scale-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-6">
              <div className="w-16 h-16 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(128, 0, 32, 0.1)' }}>
                <CheckCircle2 className="w-8 h-8 text-burgundy" style={{ color: '#800020' }} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Checkout Complete</h2>
              <p className="text-gray-500">Guest has been checked out. Ask them to scan this for feedback.</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl mb-6 flex justify-center border-2 border-dashed border-gray-200">
              {checkoutData.qrCode ? (
                <img
                  src={checkoutData.qrCode}
                  alt="Checkout QR Code"
                  className="w-48 h-48 shadow-lg rounded-lg animate-in zoom-in duration-500"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                  <div className="animate-pulse">Generating QR...</div>
                </div>
              )}
            </div>

            <Button
              onClick={() => {
                setCheckoutData(prev => ({ ...prev, isOpen: false }));
                fetchBookings(pagination.page);
              }}
              className="w-full py-4 rounded-xl font-bold bg-burgundy hover:bg-burgundy/90 text-white shadow-lg hover:shadow-burgundy/20"
              style={{ backgroundColor: '#800020' }}
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Daily Report Modal */}
      <Modal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
        title="Generate Daily Booking Report"
        size="md"
      >
        <div className="space-y-6 py-2">
          <p className="text-gray-600 text-sm">
            Select a date and format to generate the daily booking report.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={reportModal.date}
                  onChange={(e) => setReportModal(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-burgundy focus:border-transparent transition-all duration-200 bg-white"
                  style={{ '--tw-ring-color': '#800020' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Format
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setReportModal(prev => ({ ...prev, format: 'pdf' }))}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${reportModal.format === 'pdf'
                    ? 'border-burgundy bg-burgundy/5 text-burgundy shadow-sm'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  style={reportModal.format === 'pdf' ? { borderColor: '#800020', color: '#800020' } : {}}
                >
                  <div className={`p-2 rounded-lg ${reportModal.format === 'pdf' ? 'bg-burgundy/10' : 'bg-gray-100'}`}
                    style={reportModal.format === 'pdf' ? { backgroundColor: 'rgba(128,0,32,0.1)' } : {}}
                  >
                    <Download className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">PDF Format</span>
                </button>

                <button
                  onClick={() => setReportModal(prev => ({ ...prev, format: 'xlsx' }))}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 ${reportModal.format === 'xlsx'
                    ? 'border-green-600 bg-green-50 text-green-700 shadow-sm'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className={`p-2 rounded-lg ${reportModal.format === 'xlsx' ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">Excel Format</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setReportModal(prev => ({ ...prev, isOpen: false }))}
              disabled={reportModal.loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={reportModal.loading}
              className="flex items-center gap-2"
            >
              {reportModal.loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
