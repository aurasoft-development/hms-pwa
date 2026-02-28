import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomManagementApi } from '../api/roomManagementApi/roomManagementApi';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { bookingApi } from '../api/bookingApi/bookingApi';
import { useAuthStore } from '../store/authStore';
import { RoomCard } from '../molecules/RoomCard';
import { EditRoomModal } from '../molecules/EditRoomModal';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Modal } from '../atoms/Modal';
import { InputField } from '../atoms/InputField';
import { ConfirmationDialog } from '../molecules/ConfirmationDialog';
import { Search, Filter, X, Plus, Eye, Trash2, Building, History, Calendar as CalendarIcon, User as UserIcon, Phone as PhoneIcon, Mail as MailIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { theme } from '../utils/theme';

// Status mapping: API status -> UI status
const STATUS_MAPPING = {
  'available': 'available',
  'occupied': 'occupied',
  'maintenance': 'maintenance',
  'reserved': 'reserved',
};

// Reverse mapping: UI status -> API status
const REVERSE_STATUS_MAPPING = {
  'available': 'available',
  'occupied': 'occupied',
  'maintenance': 'maintenance',
  'reserved': 'reserved',
};

const ROOM_TYPES = [
  { id: '', name: 'All Types' },
  { id: 'single', name: 'Single' },
  { id: 'double', name: 'Double' },
  { id: 'suite', name: 'Suite' },
  { id: 'deluxe', name: 'Deluxe' },
  { id: 'family', name: 'Family' },
];

const ROOM_STATUSES = [
  { id: '', name: 'All Statuses' },
  { id: 'available', name: 'Available' },
  { id: 'occupied', name: 'Occupied' },
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'reserved', name: 'Reserved' },
];

const AVAILABLE_AMENITIES = [
  { id: 'WiFi', label: 'WiFi' },
  { id: 'AC', label: 'AC' },
  { id: 'TV', label: 'TV' },
  { id: 'Mini Bar', label: 'Mini Bar' },
  { id: 'Mini Fridge', label: 'Mini Fridge' },
];

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
    status: STATUS_MAPPING[apiRoom.status] || apiRoom.status || 'available',
    isActive: apiRoom.isActive !== undefined ? apiRoom.isActive : true,
    floor: apiRoom.floor || 1, // Default floor if not provided
    ...apiRoom, // Keep all original fields
  };
};

// Transform UI room to API format
const transformRoomToAPI = (uiRoom) => {
  return {
    roomNumber: uiRoom.number || uiRoom.roomNumber,
    roomType: uiRoom.type || uiRoom.roomType,
    pricePerNight: uiRoom.price || uiRoom.pricePerNight,
    description: uiRoom.description || '',
    amenities: uiRoom.amenities || [],
    maxOccupancy: uiRoom.maxOccupancy || 2,
    status: REVERSE_STATUS_MAPPING[uiRoom.status] || uiRoom.status || 'available',
  };
};

export default function RoomManagement() {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hotelId, setHotelId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [bookingHistory, setBookingHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [isAvailabilitySearch, setIsAvailabilitySearch] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [formData, setFormData] = useState({
    roomNumber: '',
    roomType: '',
    pricePerNight: '',
    description: '',
    amenities: [],
    maxOccupancy: '',
  });

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

  // Fetch rooms
  const fetchRooms = useCallback(async (page = 1) => {
    if (!hotelId) return;

    setLoading(true);
    try {
      const response = await roomManagementApi.getAllRoomsWithPagination(
        hotelId,
        page,
        pagination.limit,
        typeFilter || undefined,
        statusFilter || undefined
      );

      const roomsData = response.rooms || response.data || [];
      const transformedRooms = roomsData.map(transformRoomFromAPI);

      setRooms(transformedRooms);
      setPagination({
        page: response.page || page,
        limit: response.limit || pagination.limit,
        total: response.total || 0,
        totalPages: response.totalPages || Math.ceil((response.total || 0) / pagination.limit),
      });
    } catch (error) {
      toast.error(error || 'Failed to fetch rooms');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId, pagination.limit, typeFilter, statusFilter]);

  useEffect(() => {
    if (hotelId) {
      fetchRooms(1);
    }
  }, [hotelId, fetchRooms]);

  // Reset form
  const resetForm = () => {
    setFormData({
      roomNumber: '',
      roomType: '',
      pricePerNight: '',
      description: '',
      amenities: [],
      maxOccupancy: '',
    });
    setSelectedRoom(null);
  };

  // Handle create
  const handleCreate = () => {
    navigate('/room-management/new');
  };

  const navigate = useNavigate();

  // Handle edit
  const handleEdit = (room) => {
    navigate(`/room-management/edit/${room.id || room._id}`);
  };

  // Handle view
  const handleView = async (room) => {
    if (!hotelId) return;

    setViewLoading(true);
    setIsViewModalOpen(true);
    setActiveTab('details'); // Reset to details tab
    try {
      const response = await roomManagementApi.getRoomById(hotelId, room.id);
      const roomData = response.data || response;
      setSelectedRoom(transformRoomFromAPI(roomData));

      // Also fetch history immediately or on tab switch? Let's fetch it now for smoother UX
      fetchRoomHistory(room.id);
    } catch (error) {
      toast.error(error || 'Failed to fetch room details');
      setIsViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const fetchRoomHistory = async (roomId) => {
    if (!hotelId || !roomId) return;

    setHistoryLoading(true);
    try {
      // Fetch history for the last 6 months to 6 months ahead by default
      const start = new Date();
      start.setMonth(start.getMonth() - 6);
      const end = new Date();
      end.setMonth(end.getMonth() + 6);

      const response = await bookingApi.getBookingHistory(
        roomId,
        start.toISOString(),
        end.toISOString(),
        hotelId
      );
      setBookingHistory(response.data || response || []);
    } catch (error) {
      console.error('Failed to fetch booking history:', error);
      setBookingHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Handle delete
  const handleDelete = (room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRoom || !hotelId) return;

    setLoading(true);
    try {
      await roomManagementApi.deleteRoom(hotelId, selectedRoom.id);
      toast.success('Room deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedRoom(null);
      fetchRooms(pagination.page);
    } catch (error) {
      toast.error(error || 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  // Handle create submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!hotelId) {
      toast.error('Hotel ID is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        roomNumber: formData.roomNumber,
        roomType: formData.roomType,
        pricePerNight: parseInt(formData.pricePerNight) || 0,
        description: formData.description,
        amenities: formData.amenities,
        maxOccupancy: parseInt(formData.maxOccupancy) || 2,
      };

      await roomManagementApi.createRoom(hotelId, payload);
      toast.success('Room created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      fetchRooms(pagination.page);
    } catch (error) {
      toast.error(error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  // Handle update
  const handleUpdate = async (roomId, updatedData) => {
    if (!hotelId) return;

    setLoading(true);
    try {
      const apiData = transformRoomToAPI(updatedData);
      await roomManagementApi.updateRoom(hotelId, roomId, apiData);
      toast.success('Room updated successfully');
      setIsEditModalOpen(false);
      setSelectedRoom(null);
      fetchRooms(pagination.page);
    } catch (error) {
      toast.error(error || 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  // Handle quick status update
  const handleQuickStatusUpdate = async (room, newUiStatus) => {
    if (!hotelId || !room) return;

    setLoading(true);
    try {
      const apiStatus = REVERSE_STATUS_MAPPING[newUiStatus] || newUiStatus;
      await roomManagementApi.updateRoomStatus(room.id || room._id, apiStatus);
      toast.success('Room status updated');
      fetchRooms(pagination.page);
    } catch (error) {
      toast.error(error || 'Failed to update room status');
    } finally {
      setLoading(false);
    }
  };

  // Handle availability search
  const handleCheckAvailability = async () => {
    if (!hotelId) return;
    if (!checkInDate || !checkOutDate) {
      toast.error('Please select both check-in and check-out dates');
      return;
    }

    setLoading(true);
    try {
      const response = await roomManagementApi.getAvailableRoomsForDateRange(
        hotelId,
        checkInDate,
        checkOutDate,
        typeFilter || undefined
      );

      const roomsData = response.data || response || [];
      const transformedRooms = roomsData.map(transformRoomFromAPI);

      setRooms(transformedRooms);
      setIsAvailabilitySearch(true);
      // Reset pagination info as availability API might not be paginated or structured the same
      setPagination({
        page: 1,
        limit: roomsData.length,
        total: roomsData.length,
        totalPages: 1
      });

      toast.success(`Found ${transformedRooms.length} available rooms`);
    } catch (error) {
      console.error('Failed to fetch available rooms:', error);
      toast.error('Failed to fetch available rooms');
    } finally {
      setLoading(false);
    }
  };

  // Filter function to apply search
  const applyFilters = useCallback((roomList) => {
    let filtered = roomList;

    // Search by room number
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((room) =>
        (room.number || room.roomNumber || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery]);

  // Group rooms by status
  const availableRooms = useMemo(() => {
    return applyFilters(rooms.filter((r) => r.status === 'available'));
  }, [rooms, applyFilters]);

  const occupiedRooms = useMemo(() => {
    return applyFilters(rooms.filter((r) => r.status === 'occupied'));
  }, [rooms, applyFilters]);

  const maintenanceRooms = useMemo(() => {
    return applyFilters(rooms.filter((r) => r.status === 'maintenance'));
  }, [rooms, applyFilters]);

  const reservedRooms = useMemo(() => {
    return applyFilters(rooms.filter((r) => r.status === 'reserved'));
  }, [rooms, applyFilters]);

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('');
    setStatusFilter('');
    setCheckInDate('');
    setCheckOutDate('');
    setIsAvailabilitySearch(false);
    if (hotelId) {
      fetchRooms(1);
    }
  };

  const hasActiveFilters = searchQuery.trim() || typeFilter || statusFilter || checkInDate || checkOutDate || isAvailabilitySearch;

  // Statistics
  const stats = useMemo(() => {
    return {
      total: rooms.length,
      available: rooms.filter((r) => r.status === 'available').length,
      occupied: rooms.filter((r) => r.status === 'occupied').length,
      maintenance: rooms.filter((r) => r.status === 'maintenance').length,
      reserved: rooms.filter((r) => r.status === 'reserved').length,
    };
  }, [rooms]);

  const handleAmenityToggle = (amenityId) => {
    setFormData((prev) => {
      const amenities = prev.amenities.includes(amenityId)
        ? prev.amenities.filter((a) => a !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities };
    });
  };

  if (!hotelId && !loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Hotel Found</h3>
          <p className="text-gray-500">Please ensure you have a hotel assigned to your account.</p>
        </Card>
      </div>
    );
  }

  if (loading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy mx-auto mb-4"
            style={{ borderBottomColor: theme.colors.primary.main }}
          />
          <p className="text-gray-600">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Room Management</h1>
          <p className="text-lg text-gray-600">Manage and update room information</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total Rooms</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Available</p>
            <p className="text-2xl font-bold text-green-600">{stats.available}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Occupied</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.occupied}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Maintenance</p>
            <p className="text-2xl font-bold text-red-600">{stats.maintenance}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Reserved</p>
            <p className="text-2xl font-bold text-blue-600">{stats.reserved}</p>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Search & Filters</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-end">
            {/* Search */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Search Rooms</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Room number..."
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent text-sm"
                  style={{ '--tw-ring-color': theme.colors.primary.main }}
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

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Room Type</label>
              <SelectDropdown
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={ROOM_TYPES}
                placeholder="All Types"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Current Status</label>
              <SelectDropdown
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={ROOM_STATUSES}
                placeholder="All Statuses"
                disabled={isAvailabilitySearch}
              />
            </div>

            {/* Date Filters */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Check-in</label>
              <InputField
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Check-out</label>
              <InputField
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="py-2"
              />
            </div>

            <div className="xl:col-span-2">
              <Button
                onClick={handleCheckAvailability}
                className="w-full h-[45px] text-sm font-bold uppercase tracking-wide"
                loading={loading}
              >
                Find Available Rooms
              </Button>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{rooms.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{pagination.total}</span> rooms
              </p>
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Section 1: Available Rooms */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-green-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-900">
            Available Rooms ({availableRooms.length})
          </h2>
        </div>
        {availableRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {availableRooms.map((room) => (
              <RoomCard key={room.id} room={room} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} onStatusUpdate={handleQuickStatusUpdate} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">
              {hasActiveFilters ? 'No available rooms match your filters' : 'No available rooms'}
            </p>
          </Card>
        )}
      </div>

      {/* Section 2: Occupied Rooms */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-yellow-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-900">
            Occupied Rooms ({occupiedRooms.length})
          </h2>
        </div>
        {occupiedRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {occupiedRooms.map((room) => (
              <RoomCard key={room.id} room={room} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} onStatusUpdate={handleQuickStatusUpdate} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">
              {hasActiveFilters ? 'No occupied rooms match your filters' : 'No occupied rooms'}
            </p>
          </Card>
        )}
      </div>

      {/* Section 3: Reserved Rooms */}
      {reservedRooms.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">
              Reserved Rooms ({reservedRooms.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reservedRooms.map((room) => (
              <RoomCard key={room.id} room={room} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} onStatusUpdate={handleQuickStatusUpdate} />
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Maintenance Rooms */}
      {maintenanceRooms.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gray-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">
              Maintenance Rooms ({maintenanceRooms.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {maintenanceRooms.map((room) => (
              <RoomCard key={room.id} room={room} onEdit={handleEdit} onView={handleView} onDelete={handleDelete} onStatusUpdate={handleQuickStatusUpdate} />
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} rooms
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRooms(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRooms(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create Room Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create New Room"
        size="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Room Number"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              required
              disabled={loading}
              placeholder="e.g., 101"
            />
            <SelectDropdown
              label="Room Type"
              value={formData.roomType}
              onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
              options={ROOM_TYPES.filter(t => t.id !== '')}
              placeholder="Select room type"
              required
            />
            <InputField
              label="Price Per Night (₹)"
              type="number"
              value={formData.pricePerNight}
              onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
              required
              disabled={loading}
              placeholder="e.g., 5000"
              min="0"
            />
            <InputField
              label="Max Occupancy"
              type="number"
              value={formData.maxOccupancy}
              onChange={(e) => setFormData({ ...formData, maxOccupancy: e.target.value })}
              required
              disabled={loading}
              placeholder="e.g., 2"
              min="1"
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={loading}
                placeholder="Spacious room with city view"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{
                  '--tw-ring-color': theme.colors.primary.main,
                }}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {AVAILABLE_AMENITIES.map((amenity) => {
                  const isSelected = formData.amenities.includes(amenity.id);
                  return (
                    <label
                      key={amenity.id}
                      className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${isSelected
                        ? ''
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      style={{
                        borderColor: isSelected ? theme.colors.primary.main : undefined,
                        backgroundColor: isSelected ? `${theme.colors.primary.main}10` : undefined,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleAmenityToggle(amenity.id)}
                        className="w-4 h-4 border-gray-300 rounded focus:ring-2"
                        style={{
                          accentColor: theme.colors.primary.main,
                          '--tw-ring-color': theme.colors.primary.main,
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {amenity.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Room
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {selectedRoom && (
        <EditRoomModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRoom(null);
          }}
          room={selectedRoom}
          onUpdate={handleUpdate}
        />
      )}

      {/* View Room Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedRoom(null);
        }}
        title="Room Details"
        size="xl"
      >
        {viewLoading ? (
          <div className="py-16 text-center text-gray-500">Loading room details...</div>
        ) : selectedRoom ? (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Room {selectedRoom.number || selectedRoom.roomNumber}
                  </h2>
                  <p className="text-gray-500 text-sm">Floor {selectedRoom.floor} • {selectedRoom.type}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${STATUS_MAPPING[selectedRoom.status] === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {selectedRoom.status}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-6 border-b">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'details' ? 'text-burgundy' : 'text-gray-400 hover:text-gray-600'}`}
                  style={{ color: activeTab === 'details' ? theme.colors.primary.main : undefined }}
                >
                  Room Details
                  {activeTab === 'details' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-burgundy" style={{ backgroundColor: theme.colors.primary.main }} />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative flex items-center gap-2 ${activeTab === 'history' ? 'text-burgundy' : 'text-gray-400 hover:text-gray-600'}`}
                  style={{ color: activeTab === 'history' ? theme.colors.primary.main : undefined }}
                >
                  <History className="w-4 h-4" />
                  Booking History
                  {activeTab === 'history' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-burgundy" style={{ backgroundColor: theme.colors.primary.main }} />
                  )}
                </button>
              </div>
            </div>

            {activeTab === 'details' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Room Type</p>
                        <p className="font-bold text-gray-900 capitalize">{selectedRoom.type}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Price / Night</p>
                        <p className="font-bold text-gray-900">₹{(selectedRoom.price || selectedRoom.pricePerNight || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Max Occupancy</p>
                        <p className="font-bold text-gray-900">{selectedRoom.maxOccupancy} Guests</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Floor</p>
                        <p className="font-bold text-gray-900">{selectedRoom.floor}</p>
                      </div>
                    </div>
                  </div>

                  {selectedRoom.description && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h3>
                      <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl italic">
                        "{selectedRoom.description}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Amenities
                    </h3>
                    {selectedRoom.amenities && selectedRoom.amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedRoom.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-4 py-2 bg-white border border-gray-100 shadow-sm text-gray-700 rounded-xl text-xs font-semibold"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm italic">No amenities listed for this room.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-2 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-burgundy mb-4" style={{ borderBottomColor: theme.colors.primary.main }} />
                    <p className="text-gray-500 text-sm font-medium">Fetching booking history...</p>
                  </div>
                ) : bookingHistory.length > 0 ? (
                  <div className="space-y-3">
                    {bookingHistory.map((booking) => (
                      <div key={booking._id} className="group bg-white border border-gray-100 rounded-2xl p-4 hover:border-burgundy/30 hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-burgundy/5 transition-colors">
                              <UserIcon className="w-6 h-6 text-gray-400 group-hover:text-burgundy transition-colors" style={{ color: theme.colors.primary.main }} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-gray-900 truncate">{booking.guestName}</h4>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <PhoneIcon className="w-3 h-3" /> {booking.guestPhone}
                                </span>
                                {booking.guestEmail && (
                                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <MailIcon className="w-3 h-3" /> {booking.guestEmail}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'checked_out' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                              {booking.status}
                            </span>
                            <p className="text-sm font-black text-burgundy" style={{ color: theme.colors.primary.main }}>
                              ₹{booking.totalAmount?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Check-In</p>
                            <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mt-0.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-burgundy/50" />
                              {new Date(booking.checkInDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Check-Out</p>
                            <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5 mt-0.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-burgundy/50" />
                              {new Date(booking.checkOutDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Event / Note</p>
                            <p className="text-xs text-gray-500 truncate mt-0.5 italic">
                              {booking.eventId ? 'Part of Event' : booking.notes || 'No notes'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                    <CalendarIcon className="w-12 h-12 text-gray-300 mb-4" />
                    <h4 className="text-lg font-bold text-gray-400">No Booking History</h4>
                    <p className="text-gray-500 text-sm">This room hasn't been booked in the selected period.</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedRoom(null);
                }}
                className="rounded-xl border-gray-200"
              >
                Close
              </Button>
              {activeTab === 'details' && (
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEdit(selectedRoom);
                  }}
                  className="rounded-xl shadow-lg shadow-burgundy/10"
                >
                  Edit Room
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">No room data available</div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedRoom(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Room"
        message={`Are you sure you want to delete Room "${selectedRoom?.number || selectedRoom?.roomNumber}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
