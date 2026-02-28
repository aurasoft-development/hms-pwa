import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { useRooms } from '../hooks/useRooms';
import { calculateBookingPrice } from '../utils/priceCalculator';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Card } from '../atoms/Card';
import { roomManagementApi } from '../api/roomManagementApi/roomManagementApi';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { packagesApi } from '../api/packagesApi/packagesApi';
import toast from 'react-hot-toast';

// Transform API room to UI room format
const transformRoomFromAPI = (apiRoom) => {
  return {
    id: apiRoom._id || apiRoom.id,
    number: apiRoom.roomNumber || apiRoom.number,
    type: apiRoom.roomType || apiRoom.type,
    price: apiRoom.pricePerNight || apiRoom.price,
    description: apiRoom.description || '',
    amenities: apiRoom.amenities || [],
    maxOccupancy: apiRoom.maxOccupancy || 2,
    status: apiRoom.status || 'vacant',
    isActive: apiRoom.isActive !== undefined ? apiRoom.isActive : true,
    floor: apiRoom.floor || 1,
    ...apiRoom, // Keep all original fields
  };
};

export const BookingForm = ({ onSubmit, initialData = null, loading = false, rooms: propRooms = null }) => {
  const { user } = useAuthStore();
  const { packages, foodPackages } = useAppStore();
  const { rooms: hookRooms } = useRooms();
  const [apiRooms, setApiRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [hotelId, setHotelId] = useState(null);
  const [apiFoodPackages, setApiFoodPackages] = useState([]);
  const [foodPackagesLoading, setFoodPackagesLoading] = useState(false);

  // Use prop rooms if provided, otherwise use API rooms, fallback to hook rooms
  const rooms = propRooms || (apiRooms.length > 0 ? apiRooms : hookRooms);

  // Use API food packages if available, otherwise fallback to store
  const availableFoodPackages = apiFoodPackages.length > 0 ? apiFoodPackages : foodPackages;

  // Helper function to get default datetime with time
  const getDefaultDateTime = (date, defaultTime) => {
    if (!date) return '';
    // If date already has time, return as is
    if (date.includes('T')) return date;
    // Otherwise, add default time
    return `${date}T${defaultTime}`;
  };

  // Helper to get today's date with default time
  const getTodayWithDefaultTime = (defaultTime) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${defaultTime}`;
  };

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
    packageId: '',
    foodPackageId: '',
    notes: '',
  });

  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [errors, setErrors] = useState({});

  // Get hotelId on component mount
  useEffect(() => {
    const fetchHotelId = async () => {
      try {
        const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
        if (isSuperAdmin || !user) return;

        const response = await hotelManagementApi.getMyHotel();
        const hotel = response.data || response;
        if (hotel?._id || hotel?.id) {
          setHotelId(hotel._id || hotel.id);
        }
      } catch (error) {
        console.error('Failed to fetch hotel:', error);
        toast.error('Failed to load hotel information');
      }
    };
    fetchHotelId();
  }, []);

  // Fetch rooms from API
  useEffect(() => {
    const fetchRooms = async () => {
      if (!hotelId) return;

      setRoomsLoading(true);
      try {
        const response = await roomManagementApi.getAllRooms(hotelId);
        const roomsData = response.rooms || response.data?.rooms || [];
        const transformedRooms = roomsData.map(transformRoomFromAPI);
        setApiRooms(transformedRooms);
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
        toast.error('Failed to load rooms');
        setApiRooms([]);
      } finally {
        setRoomsLoading(false);
      }
    };

    fetchRooms();
  }, [hotelId]);

  // Fetch food packages from API
  useEffect(() => {
    const fetchFoodPackages = async () => {
      if (!hotelId) return;

      setFoodPackagesLoading(true);
      try {
        const response = await packagesApi.getAllPackages(hotelId);
        const packagesData = response.packages || response.data?.packages || response.data || response || [];

        // Filter food packages (packages with meals array)
        const foodPackagesList = Array.isArray(packagesData)
          ? packagesData
            .filter((pkg) => pkg.meals && Array.isArray(pkg.meals) && pkg.meals.length > 0)
            .map((pkg) => ({
              id: pkg._id || pkg.id,
              name: pkg.name || 'Unnamed Package',
              price: pkg.price || 0,
              description: pkg.description || '',
              meals: pkg.meals || [],
            }))
          : [];

        setApiFoodPackages(foodPackagesList);
      } catch (error) {
        console.error('Failed to fetch food packages:', error);
        // Don't show error toast, just silently fail and use store data
        setApiFoodPackages([]);
      } finally {
        setFoodPackagesLoading(false);
      }
    };

    fetchFoodPackages();
  }, [hotelId]);

  // Set default datetime values for new bookings (not editing)
  useEffect(() => {
    if (!initialData) {
      // Only set defaults if fields are empty (new booking)
      setFormData(prev => {
        if (!prev.checkIn && !prev.checkOut) {
          const defaultCheckIn = getTodayWithDefaultTime('11:00');
          const defaultCheckOut = getTodayWithDefaultTime('12:00');
          return {
            ...prev,
            checkIn: defaultCheckIn,
            checkOut: defaultCheckOut,
          };
        }
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Helper to convert ISO date to datetime-local format
  const convertISOToDateTimeLocal = (isoDate) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) return '';

      // Format: YYYY-MM-DDTHH:mm
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

  useEffect(() => {
    if (initialData) {
      // Ensure IDs are strings for SelectDropdown compatibility
      // Handle datetime format for checkIn and checkOut
      let checkIn = initialData.checkIn || '';
      let checkOut = initialData.checkOut || '';

      // Convert ISO dates to datetime-local format if needed
      if (checkIn && checkIn.includes('T') && checkIn.includes('Z')) {
        checkIn = convertISOToDateTimeLocal(checkIn);
      } else if (checkIn && !checkIn.includes('T')) {
        checkIn = getDefaultDateTime(checkIn, '11:00');
      }

      if (checkOut && checkOut.includes('T') && checkOut.includes('Z')) {
        checkOut = convertISOToDateTimeLocal(checkOut);
      } else if (checkOut && !checkOut.includes('T')) {
        checkOut = getDefaultDateTime(checkOut, '12:00');
      }

      // Map foodPackage name to foodPackageId if needed
      let foodPackageId = initialData.foodPackageId ? String(initialData.foodPackageId) : '';
      if (!foodPackageId && (initialData.foodPackage || initialData.foodPackageName)) {
        // Try to find food package by name
        const foodPackageName = initialData.foodPackage || initialData.foodPackageName;
        const foundFoodPackage = availableFoodPackages.find((fp) =>
          fp.name === foodPackageName ||
          fp.name?.toLowerCase() === foodPackageName?.toLowerCase()
        );
        if (foundFoodPackage) {
          foodPackageId = String(foundFoodPackage.id || foundFoodPackage._id);
        }
      }

      setFormData({
        guestName: initialData.guestName || '',
        guestEmail: initialData.guestEmail || '',
        guestPhone: initialData.guestPhone || '',
        numberOfGuests: initialData.numberOfGuests || '',
        purposeOfVisit: initialData.purposeOfVisit || '',
        comingFrom: initialData.comingFrom || '',
        roomId: initialData.roomId ? String(initialData.roomId) : '',
        checkIn: checkIn,
        checkOut: checkOut,
        packageId: initialData.packageId ? String(initialData.packageId) : '',
        foodPackageId: foodPackageId,
        notes: initialData.notes || '',
      });
      // Clear errors when loading initial data
      setErrors({});
    }
  }, [initialData, availableFoodPackages]);

  useEffect(() => {
    if (formData.roomId && formData.checkIn && formData.checkOut) {
      // Handle both string IDs (r101), numeric IDs, and MongoDB _id
      const selectedRoom = rooms.find((r) =>
        r.id === formData.roomId ||
        r._id === formData.roomId ||
        r.id === parseInt(formData.roomId) ||
        r.id?.toString() === formData.roomId.toString() ||
        r._id?.toString() === formData.roomId.toString()
      );
      const selectedPackage = packages.find((p) => p.id === parseInt(formData.packageId));
      const selectedFoodPackage = availableFoodPackages.find((fp) =>
        (fp.id === formData.foodPackageId) ||
        (fp.id === parseInt(formData.foodPackageId)) ||
        (fp._id === formData.foodPackageId) ||
        (String(fp.id) === String(formData.foodPackageId)) ||
        (String(fp._id) === String(formData.foodPackageId))
      );

      if (selectedRoom) {
        const roomPrice = selectedRoom.price || selectedRoom.pricePerNight || 0;
        const breakdown = calculateBookingPrice(
          roomPrice,
          formData.checkIn,
          formData.checkOut,
          selectedPackage?.price || 0,
          selectedFoodPackage?.price || 0
        );
        setPriceBreakdown(breakdown);
      }
    }
  }, [formData, rooms, packages, availableFoodPackages]);

  const handleChange = (field, value) => {
    // Handle datetime fields - add default time if only date is provided
    if (field === 'checkIn' && value && !value.includes('T')) {
      value = getDefaultDateTime(value, '11:00');
    } else if (field === 'checkOut' && value && !value.includes('T')) {
      value = getDefaultDateTime(value, '12:00');
    }

    // Validate phone number
    if (field === 'guestPhone') {
      // Remove non-digit characters for validation
      const digitsOnly = value.replace(/\D/g, '');
      if (value && digitsOnly.length < 10) {
        setErrors((prev) => ({ ...prev, guestPhone: 'Phone number must have at least 10 digits' }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.guestPhone;
          return newErrors;
        });
      }
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate phone number before submission
    const digitsOnly = formData.guestPhone.replace(/\D/g, '');
    if (formData.guestPhone && digitsOnly.length < 10) {
      setErrors((prev) => ({ ...prev, guestPhone: 'Phone number must have at least 10 digits' }));
      return;
    }

    // Handle both string IDs (r101), numeric IDs, and MongoDB _id
    const selectedRoom = rooms.find((r) =>
      r.id === formData.roomId ||
      r._id === formData.roomId ||
      r.id === parseInt(formData.roomId) ||
      r.id?.toString() === formData.roomId.toString() ||
      r._id?.toString() === formData.roomId.toString()
    );
    const selectedPackage = packages.find((p) => p.id === parseInt(formData.packageId));
    const selectedFoodPackage = availableFoodPackages.find((fp) =>
      (fp.id === formData.foodPackageId) ||
      (fp.id === parseInt(formData.foodPackageId)) ||
      (fp._id === formData.foodPackageId) ||
      (String(fp.id) === String(formData.foodPackageId)) ||
      (String(fp._id) === String(formData.foodPackageId))
    );

    const bookingData = {
      ...formData,
      roomId: selectedRoom?.id || selectedRoom?._id,
      roomNumber: selectedRoom?.number || selectedRoom?.roomNumber,
      roomType: selectedRoom?.type || selectedRoom?.roomType,
      roomPrice: selectedRoom?.price || selectedRoom?.pricePerNight,
      packageName: selectedPackage?.name,
      packagePrice: selectedPackage?.price || 0,
      foodPackageName: selectedFoodPackage?.name,
      foodPackagePrice: selectedFoodPackage?.price || 0,
      nights: priceBreakdown?.nights || 0,
      totalAmount: priceBreakdown?.total || 0,
    };

    onSubmit(bookingData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Guest Name"
          value={formData.guestName}
          onChange={(e) => handleChange('guestName', e.target.value)}
          required
          disabled={loading}
        />
        <InputField
          label="Guest Email"
          type="email"
          value={formData.guestEmail}
          onChange={(e) => handleChange('guestEmail', e.target.value)}
          disabled={loading}
        />
        <InputField
          label="Guest Phone"
          type="tel"
          value={formData.guestPhone}
          onChange={(e) => handleChange('guestPhone', e.target.value)}
          error={errors.guestPhone}
          disabled={loading}
          minLength={10}
        />
        <InputField
          label="Number of Guests"
          type="number"
          value={formData.numberOfGuests}
          onChange={(e) => handleChange('numberOfGuests', e.target.value)}
          min="1"
          required
          disabled={loading}
        />
        <InputField
          label="Purpose of Visit"
          value={formData.purposeOfVisit}
          onChange={(e) => handleChange('purposeOfVisit', e.target.value)}
          placeholder="e.g., Business, Leisure, Family"
          disabled={loading}
        />
        <InputField
          label="Coming From"
          value={formData.comingFrom}
          onChange={(e) => handleChange('comingFrom', e.target.value)}
          placeholder="e.g., Mumbai, Delhi"
          disabled={loading}
        />
        <SelectDropdown
          label="Room"
          value={formData.roomId}
          onChange={(e) => handleChange('roomId', e.target.value)}
          options={(() => {
            // When editing, include the current room even if status doesn't match
            const currentRoomId = initialData?.roomId ? String(initialData.roomId) : '';
            const filteredRooms = rooms.filter((r) => {
              const roomIdStr = String(r.id || r._id);
              // Include if status matches OR if it's the current room being edited
              return (r.status === 'vacant' || r.status === 'dirty' || r.status === 'available' || r.status === 'occupied') ||
                (currentRoomId && (roomIdStr === currentRoomId || String(r._id) === currentRoomId));
            });
            return filteredRooms.map((r) => ({
              id: r.id || r._id,
              name: `Room ${r.number || r.roomNumber || 'N/A'} - ${r.type || r.roomType || 'N/A'} (₹${(r.price || r.pricePerNight || 0).toLocaleString()}/night)`,
            }));
          })()}
          placeholder={roomsLoading ? "Loading rooms..." : "Select a room"}
          required
          disabled={loading || roomsLoading}
        />
        <InputField
          label="Check-in Date & Time"
          type="datetime-local"
          value={formData.checkIn}
          onChange={(e) => handleChange('checkIn', e.target.value)}
          required
          disabled={loading}
        />
        <InputField
          label="Check-out Date & Time"
          type="datetime-local"
          value={formData.checkOut}
          onChange={(e) => handleChange('checkOut', e.target.value)}
          required
          disabled={loading}
        />
        {/* Package field hidden as per requirement */}
        {/* <SelectDropdown
          label="Package (Optional)"
          value={formData.packageId}
          onChange={(e) => handleChange('packageId', e.target.value)}
          options={packages}
          placeholder="Select a package"
          disabled={loading}
        /> */}
        <SelectDropdown
          label="Food Package (Optional)"
          value={formData.foodPackageId}
          onChange={(e) => handleChange('foodPackageId', e.target.value)}
          options={availableFoodPackages.map((fp) => ({
            id: fp.id || fp._id,
            name: `${fp.name}${fp.price ? ` (₹${fp.price.toLocaleString()})` : ''}`,
          }))}
          placeholder={foodPackagesLoading ? "Loading food packages..." : "Select a food package"}
          disabled={loading || foodPackagesLoading}
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2" style={{ color: '#2D2D2D' }}>
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional notes or special requests..."
            disabled={loading}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-burgundy focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{
              '--tw-ring-color': '#800020',
            }}
          />
        </div>
      </div>

      {priceBreakdown && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Price Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Room ({priceBreakdown.nights} nights):</span>
              <span className="font-medium">₹{priceBreakdown.roomTotal.toFixed(2)}</span>
            </div>
            {priceBreakdown.packageTotal > 0 && (
              <div className="flex justify-between">
                <span>Package:</span>
                <span className="font-medium">₹{priceBreakdown.packageTotal.toFixed(2)}</span>
              </div>
            )}
            {priceBreakdown.foodTotal > 0 && (
              <div className="flex justify-between">
                <span>Food:</span>
                <span className="font-medium">₹{priceBreakdown.foodTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-burgundy">₹{priceBreakdown.total.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {initialData ? 'Update Booking' : 'Create Booking'}
      </Button>
    </form>
  );
};

