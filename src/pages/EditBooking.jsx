import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { bookingApi } from '../api/bookingApi/bookingApi';
import { roomManagementApi } from '../api/roomManagementApi/roomManagementApi';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { packagesApi } from '../api/packagesApi/packagesApi';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { useFormStore } from '../store/formStore';
import { useRooms } from '../hooks/useRooms';
import { calculateBookingPrice } from '../utils/priceCalculator';
import { whatsappService } from '../utils/whatsappService';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Card } from '../atoms/Card';
import { ManagerShareSelection } from '../organisms/ManagerShareSelection';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Share2 } from 'lucide-react';

// Transform API room to UI format
const transformRoomFromAPI = (apiRoom) => {
  return {
    id: apiRoom._id || apiRoom.id,
    number: apiRoom.roomNumber || apiRoom.number,
    type: apiRoom.roomType || apiRoom.type,
    price: apiRoom.pricePerNight || apiRoom.price,
    description: apiRoom.description || '',
    amenities: apiRoom.amenities || [],
    maxOccupancy: apiRoom.maxOccupancy || 2,
    status: apiRoom.status || 'available',
    isActive: apiRoom.isActive !== undefined ? apiRoom.isActive : true,
    floor: apiRoom.floor || 1,
    ...apiRoom, // Keep all original fields
  };
};
export default function EditBooking() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { packages, foodPackages } = useAppStore();
  const { rooms: hookRooms } = useRooms();
  const { setFormData: setPersistentData, clearFormData, getFormData } = useFormStore();

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [booking, setBooking] = useState(null);

  const [apiRooms, setApiRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [hotelId, setHotelId] = useState(null);
  const [apiFoodPackages, setApiFoodPackages] = useState([]);
  const [foodPackagesLoading, setFoodPackagesLoading] = useState(false);
  const [selectedManagers, setSelectedManagers] = useState(() => getFormData(`editBooking_${id}_managers`, []));
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (id) {
      setPersistentData(`editBooking_${id}_managers`, selectedManagers);
    }
  }, [selectedManagers, id, setPersistentData]);

  // Form State
  const [formData, setFormData] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    numberOfGuests: '',
    purposeOfVisit: '',
    comingFrom: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    foodPackageId: '',
    status: '',
    notes: '',
  });

  useEffect(() => {
    if (!fetchLoading && id) {
      setPersistentData(`editBooking_${id}`, formData);
    }
  }, [formData, id, fetchLoading, setPersistentData]);

  const [checkoutData, setCheckoutData] = useState({
    isOpen: false,
    qrCode: '',
    token: '',
  });

  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [errors, setErrors] = useState({});

  // Use API rooms or fallback
  const rooms = apiRooms.length > 0 ? apiRooms : hookRooms;
  // Use API food packages or fallback
  const availableFoodPackages = apiFoodPackages.length > 0 ? apiFoodPackages : foodPackages;

  // Helper to convert ISO date to datetime-local format
  const convertISOToDateTimeLocal = (isoDate) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) return '';

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const getDefaultDateTime = (date, defaultTime) => {
    if (!date) return '';
    if (date.includes('T')) return date;
    return `${date}T${defaultTime}`;
  };


  // Fetch Booking Data
  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      setFetchLoading(true);
      try {
        const response = await bookingApi.getBookingById(id);
        const bookingData = response.data || response;
        setBooking(bookingData);

        if (bookingData.hotelId) {
          setHotelId(bookingData.hotelId);
        }

        // Map to form data
        const apiData = {
          guestName: bookingData.guestName || '',
          guestEmail: bookingData.guestEmail || '',
          guestPhone: bookingData.guestPhone || '',
          numberOfGuests: bookingData.numberOfGuests || '',
          purposeOfVisit: bookingData.purposeOfVisit || '',
          comingFrom: bookingData.comingFrom || '',
          roomId: bookingData.roomId ? String(bookingData.roomId) : '',
          checkIn: convertISOToDateTimeLocal(bookingData.checkInDate || bookingData.checkIn),
          checkOut: convertISOToDateTimeLocal(bookingData.checkOutDate || bookingData.checkOut),
          foodPackageId: '', // Will update after fetching packages
          status: bookingData.status || 'pending',
          notes: bookingData.notes || '',
        };

        const savedData = getFormData(`editBooking_${id}`, null);
        setFormData(savedData || apiData);

      } catch (error) {
        console.error('Failed to fetch booking:', error);
        toast.error('Failed to fetch booking');
        navigate('/bookings');
      } finally {
        setFetchLoading(false);
      }
    };
    fetchBooking();
  }, [id, navigate]);

  // Fetch Rooms (Same as NewBooking)
  useEffect(() => {
    const fetchRooms = async () => {
      if (!hotelId) return;
      setRoomsLoading(true);
      try {
        const response = await roomManagementApi.getAllRooms(hotelId);
        const roomsData = response.rooms || response.data?.rooms || [];
        setApiRooms(roomsData.map(transformRoomFromAPI));
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
        toast.error('Failed to load rooms');
      } finally {
        setRoomsLoading(false);
      }
    };
    fetchRooms();
  }, [hotelId]);

  // Fetch Food Packages (Same as NewBooking)
  useEffect(() => {
    const fetchFoodPackages = async () => {
      if (!hotelId) return;
      setFoodPackagesLoading(true);
      try {
        const response = await packagesApi.getAllPackages(hotelId);
        const packagesData = response.packages || response.data?.packages || response.data || response || [];
        const foodPackagesList = Array.isArray(packagesData)
          ? packagesData.filter((pkg) => pkg.meals?.length > 0).map((pkg) => ({
            id: pkg._id || pkg.id,
            name: pkg.name || 'Unnamed Package',
            price: pkg.price || 0,
            description: pkg.description || '',
            meals: pkg.meals || [],
          }))
          : [];
        setApiFoodPackages(foodPackagesList);

        // Map existing booking food package if present
        if (booking && (booking.foodPackage || booking.foodPackageName)) {
          const fpName = booking.foodPackage || booking.foodPackageName;
          const found = foodPackagesList.find(fp =>
            fp.name === fpName || fp.name?.toLowerCase() === fpName?.toLowerCase()
          );
          if (found) {
            setFormData(prev => ({ ...prev, foodPackageId: String(found.id) }));
          }
        }

      } catch (error) {
        console.error('Failed to fetch food packages:', error);
      } finally {
        setFoodPackagesLoading(false);
      }
    };
    fetchFoodPackages();
  }, [hotelId, booking]); // Added booking dependency to trigger mapping

  // Price Calculation (Same as NewBooking)
  useEffect(() => {
    if (formData.roomId && formData.checkIn && formData.checkOut) {
      const selectedRoom = rooms.find((r) =>
        String(r.id || r._id) === String(formData.roomId)
      );

      const selectedFoodPackage = availableFoodPackages.find((fp) =>
        String(fp.id || fp._id) === String(formData.foodPackageId)
      );

      if (selectedRoom) {
        const roomPrice = selectedRoom.price || selectedRoom.pricePerNight || 0;
        const breakdown = calculateBookingPrice(
          roomPrice,
          formData.checkIn,
          formData.checkOut,
          0,
          selectedFoodPackage?.price || 0
        );
        setPriceBreakdown(breakdown);
      }
    }
  }, [formData.roomId, formData.checkIn, formData.checkOut, formData.foodPackageId, rooms, availableFoodPackages]);


  const handleChange = (field, value) => {
    if (field === 'checkIn' && value && !value.includes('T')) {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      value = getDefaultDateTime(value, `${currentHours}:${currentMinutes}`);
    } else if (field === 'checkOut' && value && !value.includes('T')) {
      value = getDefaultDateTime(value, '12:00');
    }

    if (field === 'guestPhone') {
      const digitsOnly = value.replace(/\D/g, '');
      if (value && digitsOnly.length < 10) {
        setErrors(prev => ({ ...prev, guestPhone: 'Phone number must have at least 10 digits' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.guestPhone;
          return newErrors;
        });
      }
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.guestName || !formData.roomId || !formData.checkIn || !formData.checkOut || !formData.numberOfGuests) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const selectedFoodPackage = availableFoodPackages.find(fp => String(fp.id || fp._id) === String(formData.foodPackageId));

      const apiPayload = {
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone,
        numberOfGuests: parseInt(formData.numberOfGuests) || 1,
        purposeOfVisit: formData.purposeOfVisit,
        comingFrom: formData.comingFrom,
        roomId: formData.roomId,
        checkInDate: new Date(formData.checkIn).toISOString(),
        checkOutDate: new Date(formData.checkOut).toISOString(),
        foodPackage: selectedFoodPackage?.name || '',
        status: formData.status,
        notes: formData.notes,
      };

      const bookingResponse = await bookingApi.updateBooking(id, apiPayload);
      const updatedBooking = bookingResponse.data || bookingResponse;

      // Prepare data for sharing
      const selectedRoom = rooms.find(r => String(r.id || r._id) === String(formData.roomId));
      const shareData = {
        ...updatedBooking,
        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        roomNumber: selectedRoom?.number || selectedRoom?.roomNumber || '',
        roomType: selectedRoom?.type || selectedRoom?.roomType || '',
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        nights: priceBreakdown?.nights || 0,
        totalAmount: priceBreakdown?.total || 0,
        paymentStatus: updatedBooking.paymentStatus || 'Pending',
        notes: formData.notes
      };

      setSuccessData(shareData);

      // Automatic WhatsApp Sharing to selected managers
      if (selectedManagers.length > 0) {
        selectedManagers.forEach(managerPhone => {
          whatsappService.shareBookingDetailsWithManager(shareData, managerPhone);
        });
        toast.success('Sent updates to selected managers');
      }

      toast.success('Booking updated successfully!');
      clearFormData(`editBooking_${id}`);
      clearFormData(`editBooking_${id}_managers`);
    } catch (error) {
      toast.error(error || 'Failed to update booking');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="p-8 text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900">Booking Updated!</h1>
          <p className="text-gray-500">The booking details have been updated and are ready to share.</p>

          <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-3 border border-gray-100">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Booking ID</span>
              <span className="font-semibold text-gray-900">#{successData._id?.slice(-6) || successData.id || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Guest Name</span>
              <span className="font-semibold text-gray-900">{successData.guestName}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Room</span>
              <span className="font-semibold text-gray-900">{successData.roomNumber} ({successData.roomType})</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Status</span>
              <span className={`font-bold capitalize ${successData.status === 'cancelled' ? 'text-red-600' : 'text-green-600'}`}>
                {successData.status?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-gray-900 font-bold">Total Amount</span>
              <span className="text-xl font-bold text-orange-500">₹{successData.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <Button
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center gap-2 h-12"
              onClick={() => whatsappService.shareReceipt(successData)}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Share via WhatsApp
            </Button>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 h-12 border-gray-300"
              onClick={() => {
                if (selectedManagers.length > 0) {
                  selectedManagers.forEach(managerPhone => {
                    whatsappService.shareBookingDetailsWithManager(successData, managerPhone);
                  });
                  toast.success('Shared with managers');
                } else {
                  toast.error('No managers selected');
                }
              }}
            >
              Resend to Manager(s)
            </Button>
          </div>

          <Button
            className="w-full bg-gray-900 hover:bg-black text-white h-12"
            onClick={() => navigate('/bookings')}
          >
            Go to Bookings List
          </Button>
        </Card>
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy mx-auto mb-4" style={{ borderBottomColor: '#800020' }} />
          <p className="text-gray-500">Loading booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/bookings')}
            className="mb-2 p-0 h-auto text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Booking</h1>
          <p className="text-gray-500 text-sm">Update reservation details</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {
            clearFormData(`editBooking_${id}`);
            navigate('/bookings');
          }}>Cancel</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Form Inputs */}
        <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

          {/* Reservation Details */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Reservation Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="Check-in Date & Time"
                type="datetime-local"
                value={formData.checkIn}
                onChange={(e) => handleChange('checkIn', e.target.value)}
                required
              />
              <InputField
                label="Nights"
                type="number"
                value={priceBreakdown?.nights || 0}
                readOnly
                disabled
                className="bg-gray-50"
              />
              <InputField
                label="Check-out Date & Time"
                type="datetime-local"
                value={formData.checkOut}
                onChange={(e) => handleChange('checkOut', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Guest Details */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Guest Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Guest Name"
                value={formData.guestName}
                onChange={(e) => handleChange('guestName', e.target.value)}
                required
              />
              <InputField
                label="Guest Email"
                type="email"
                value={formData.guestEmail}
                onChange={(e) => handleChange('guestEmail', e.target.value)}
              />
              <InputField
                label="Guest Phone"
                type="tel"
                value={formData.guestPhone}
                onChange={(e) => handleChange('guestPhone', e.target.value)}
                error={errors.guestPhone}
                minLength={10}
              />
              <InputField
                label="Number of Guests"
                type="number"
                value={formData.numberOfGuests}
                onChange={(e) => handleChange('numberOfGuests', e.target.value)}
                min="1"
                required
              />
              <InputField
                label="Purpose of Visit"
                value={formData.purposeOfVisit}
                onChange={(e) => handleChange('purposeOfVisit', e.target.value)}
                placeholder="e.g., Business, Leisure"
              />
              <InputField
                label="Coming From"
                value={formData.comingFrom}
                onChange={(e) => handleChange('comingFrom', e.target.value)}
                placeholder="e.g., Mumbai"
              />
            </div>
          </div>

          {/* Booking Status & Room */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Booking & Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectDropdown
                label="Room"
                value={formData.roomId}
                onChange={(e) => handleChange('roomId', e.target.value)}
                options={(() => {
                  const currentRoomId = booking?.roomId ? String(booking.roomId) : '';
                  const filteredRooms = rooms.filter((r) => {
                    const roomIdStr = String(r.id || r._id);
                    return (['vacant', 'dirty', 'available', 'occupied'].includes(r.status)) ||
                      (currentRoomId && (roomIdStr === currentRoomId || String(r._id) === currentRoomId)) ||
                      (String(formData.roomId) === roomIdStr || String(formData.roomId) === String(r._id));
                  });
                  return filteredRooms.map(r => ({
                    id: r.id || r._id,
                    name: `Room ${r.number || r.roomNumber || 'N/A'} - ${r.type || r.roomType || 'N/A'} (₹${(r.price || r.pricePerNight || 0).toLocaleString()}/night)`
                  }));
                })()}
                placeholder={roomsLoading ? "Loading rooms..." : "Select a room"}
                required
              />
              <SelectDropdown
                label="Food Package (Optional)"
                value={formData.foodPackageId}
                onChange={(e) => handleChange('foodPackageId', e.target.value)}
                options={availableFoodPackages.map((fp) => ({
                  id: fp.id || fp._id,
                  name: `${fp.name}${fp.price ? ` (₹${fp.price.toLocaleString()})` : ''}`,
                }))}
                placeholder={foodPackagesLoading ? "Loading food packages..." : "Select food package"}
              />
              <SelectDropdown
                label="Booking Status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                options={[
                  { id: 'pending', name: 'Pending' },
                  { id: 'confirmed', name: 'Confirmed' },
                  { id: 'checked_in', name: 'Checked In' },
                  { id: 'checked_out', name: 'Checked Out' },
                  { id: 'cancelled', name: 'Cancelled' },
                ]}
                required
              />
            </div>
          </div>

          {/* Manager Selection Section */}
          <ManagerShareSelection
            selectedManagers={selectedManagers}
            setSelectedManagers={setSelectedManagers}
            title="Share Updates with Managers"
          />
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 sticky top-20 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Booking Summary</h2>
            {priceBreakdown ? (
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Room Total ({priceBreakdown.nights} nights)</span>
                  <span className="font-semibold text-gray-900">₹{priceBreakdown.roomTotal.toFixed(2)}</span>
                </div>
                {priceBreakdown.foodTotal > 0 && (
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Food Package</span>
                    <span className="font-semibold text-gray-900">₹{priceBreakdown.foodTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="h-px bg-gray-200 mt-4" />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-900 font-bold">Grand Total</span>
                  <span className="text-2xl font-bold text-orange-600">₹{priceBreakdown.total.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 mb-6 text-sm italic">Select room and dates to see price breakdown</div>
            )}

            <Button
              size="lg"
              className="w-full bg-[#039E2F] hover:bg-[#027a24] text-white h-12 text-lg font-bold shadow-md"
              onClick={handleSubmit}
              loading={loading}
            >
              Update Booking
            </Button>

            <p className="text-center text-[10px] text-gray-400 mt-4 px-2">
              Ensuring guest information is up to date helps in provides better service during their stay.
            </p>
          </Card>
        </div>
      </div>

      {/* Checkout QR Code Modal */}
      <Card
        className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 transition-opacity duration-300 ${checkoutData.isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => {
          setCheckoutData(prev => ({ ...prev, isOpen: false }));
          navigate('/bookings');
        }}
      >
        <div
          className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl transform transition-transform duration-300"
          style={{ transform: checkoutData.isOpen ? 'scale(1)' : 'scale(0.95)' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="mb-6">
            <div className="w-16 h-16 bg-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(128, 0, 32, 0.1)' }}>
              <CheckCircle2 className="w-8 h-8 text-burgundy" style={{ color: '#800020' }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Guest Checkout</h2>
            <p className="text-gray-500">Ask the guest to scan this QR code to leave a review</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl mb-6 flex justify-center border-2 border-dashed border-gray-200">
            {checkoutData.qrCode ? (
              <img
                src={checkoutData.qrCode}
                alt="Checkout QR Code"
                className="w-48 h-48 shadow-lg rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                Generating QR...
              </div>
            )}
          </div>

          <Button
            onClick={() => {
              setCheckoutData(prev => ({ ...prev, isOpen: false }));
              navigate('/bookings');
            }}
            className="w-full py-4 rounded-xl font-bold bg-burgundy hover:bg-burgundy/90 text-white"
            style={{ backgroundColor: '#800020' }}
          >
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}
