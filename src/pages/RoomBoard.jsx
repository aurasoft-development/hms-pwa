import { useEffect, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useRooms } from '../hooks/useRooms';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';
import { CheckinModal } from '../molecules/CheckinModal';
import { CheckoutModal } from '../molecules/CheckoutModal';
import { Bed, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoomBoard() {
  const { bookings, initializeData } = useAppStore();
  const { rooms, updateRoom } = useRooms();
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'vacant':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'occupied':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'dirty':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'out_of_service':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'vacant':
        return 'Vacant';
      case 'occupied':
        return 'Occupied';
      case 'dirty':
        return 'Dirty';
      case 'out_of_service':
        return 'Out of Service';
      default:
        return 'Unknown';
    }
  };

  const handleRoomClick = (room) => {
    if (room.status === 'occupied') {
      // Find booking by room number since new structure uses room number
      const booking = bookings.find((b) => 
        b.roomNumber === room.number || b.roomId === room.id || b.roomId === parseInt(room.id?.replace('r', ''))
      );
      if (booking) {
        setSelectedBooking(booking);
        setSelectedRoom(room);
        setCheckoutModalOpen(true);
      } else {
        toast.error('No booking found for this room');
      }
    } else if (room.status === 'out_of_service') {
      toast.info('This room is out of service');
    }
  };

  const handleCheckoutComplete = () => {
    if (selectedRoom) {
      // Update room status to dirty after checkout
      updateRoom(selectedRoom.id, { status: 'dirty', bookingId: null });
    }
    setCheckoutModalOpen(false);
    setSelectedRoom(null);
    setSelectedBooking(null);
    initializeData();
    toast.success('Check-out completed successfully');
  };

  const handleCheckinComplete = () => {
    setCheckinModalOpen(false);
    initializeData();
    toast.success('Check-in completed successfully');
  };

  const stats = {
    total: rooms.length,
    vacant: rooms.filter((r) => r.status === 'vacant').length,
    occupied: rooms.filter((r) => r.status === 'occupied').length,
    dirty: rooms.filter((r) => r.status === 'dirty').length,
    outOfService: rooms.filter((r) => r.status === 'out_of_service').length,
  };

  // Group rooms by status
  const vacantRooms = rooms.filter((r) => r.status === 'vacant');
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied');
  const dirtyRooms = rooms.filter((r) => r.status === 'dirty');
  const outOfServiceRooms = rooms.filter((r) => r.status === 'out_of_service');

  // Render room card component
  const renderRoomCard = (room) => {
    const booking = bookings.find((b) => 
      b.roomNumber === room.number || 
      b.roomId === room.id || 
      b.roomId === parseInt(room.id?.replace('r', '')) ||
      b.id === room.bookingId
    );

    return (
      <Card
        key={room.id}
        className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
          room.status === 'occupied' ? 'hover:scale-105' : ''
        }`}
        onClick={() => handleRoomClick(room)}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Room {room.number}</h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                room.status
              )}`}
            >
              {getStatusLabel(room.status)}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{room.type}</p>
            <p className="text-sm font-semibold text-gray-900">₹{room.price?.toLocaleString() || room.price}/night</p>
            {room.floor && (
              <p className="text-xs text-gray-500">Floor {room.floor}</p>
            )}
          </div>
          {booking && room.status === 'occupied' && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span className="truncate">{booking.guestName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(booking.checkIn).toLocaleDateString()} -{' '}
                  {new Date(booking.checkOut).toLocaleDateString()}
                </span>
              </div>
              {booking.numberOfGuests && (
                <div className="text-xs text-gray-500 mt-1">
                  {booking.numberOfGuests} {booking.numberOfGuests == 1 ? 'Guest' : 'Guests'}
                </div>
              )}
            </div>
          )}
          {room.status === 'occupied' && (
            <p className="text-xs text-yellow-600 font-medium mt-2">
              Click to checkout
            </p>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Room Board</h1>
          <p className="text-lg text-gray-600">Manage room status and check-in/check-out</p>
        </div>
        <Button onClick={() => setCheckinModalOpen(true)} size="lg">
          Quick Check-in
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Bed className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vacant</p>
              <p className="text-2xl font-bold text-green-600">{stats.vacant}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Bed className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.occupied}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Bed className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dirty</p>
              <p className="text-2xl font-bold text-red-600">{stats.dirty}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Bed className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Service</p>
              <p className="text-2xl font-bold text-gray-600">{stats.outOfService}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Bed className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Section 1: Available Rooms */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-green-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-900">
            Available Rooms ({vacantRooms.length})
          </h2>
        </div>
        {vacantRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {vacantRooms.map((room) => renderRoomCard(room))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No vacant rooms available</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {occupiedRooms.map((room) => renderRoomCard(room))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No occupied rooms</p>
          </Card>
        )}
      </div>

      {/* Section 3: Dirty Rooms */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-red-500 rounded-full"></div>
          <h2 className="text-2xl font-bold text-gray-900">
            Dirty Rooms ({dirtyRooms.length})
          </h2>
        </div>
        {dirtyRooms.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {dirtyRooms.map((room) => renderRoomCard(room))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No dirty rooms</p>
          </Card>
        )}
      </div>

      {/* Section 4: Out of Service Rooms (if any) */}
      {outOfServiceRooms.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gray-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">
              Out of Service Rooms ({outOfServiceRooms.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {outOfServiceRooms.map((room) => renderRoomCard(room))}
          </div>
        </div>
      )}

      {/* Modals */}
      <CheckinModal
        isOpen={checkinModalOpen}
        onClose={() => setCheckinModalOpen(false)}
        onSuccess={handleCheckinComplete}
      />

      {selectedBooking && selectedRoom && (
        <CheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => {
            setCheckoutModalOpen(false);
            setSelectedRoom(null);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
          room={selectedRoom}
          onSuccess={handleCheckoutComplete}
        />
      )}
    </div>
  );
}

