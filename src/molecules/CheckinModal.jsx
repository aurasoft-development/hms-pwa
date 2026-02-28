import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { useRooms } from '../hooks/useRooms';
import { dbService } from '../utils/dbService';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { Search, User, Phone, Calendar, Bed, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export function CheckinModal({ isOpen, onClose, onSuccess }) {
  const { bookings, checkIn, initializeData } = useAppStore();
  const { rooms, updateRoom } = useRooms();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      initializeData();
      setSearchQuery('');
      setSelectedBooking(null);
      setSelectedRoomId(null);
    }
  }, [isOpen, initializeData]);

  // Filter bookings that are confirmed and not checked-in
  const availableBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'pending'
    );
  }, [bookings]);

  // Search bookings
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return availableBookings.filter(
      (booking) =>
        booking.guestName?.toLowerCase().includes(query) ||
        booking.guestPhone?.includes(query) ||
        booking.guestEmail?.toLowerCase().includes(query) ||
        booking.id?.toString().includes(query)
    );
  }, [searchQuery, availableBookings]);

  // Get available rooms (vacant) + booked room if exists
  const availableRooms = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];
    
    // Filter vacant/dirty rooms - handle cases where status might be undefined
    const vacantRooms = rooms.filter((r) => {
      if (!r) return false;
      // If status is explicitly set, use it
      if (r.status !== undefined && r.status !== null) {
        return r.status === 'vacant' || r.status === 'dirty';
      }
      // Fallback: if status is not set but available is true, consider it vacant
      return r.available === true;
    });

    // If a booking is selected, find the booked room and put it first
    if (selectedBooking) {
      const bookedRoom = rooms.find((r) => 
        r.id === selectedBooking.roomId || 
        r.id === selectedBooking.roomId?.toString() ||
        r.number === selectedBooking.roomNumber ||
        r.id?.toString() === selectedBooking.roomId?.toString()
      );

      if (bookedRoom) {
        // Remove booked room from vacant list if it exists there
        const otherRooms = vacantRooms.filter((r) => r.id !== bookedRoom.id);
        // Put booked room first (even if not vacant), then other available rooms
        return [bookedRoom, ...otherRooms];
      }
    }

    return vacantRooms;
  }, [rooms, selectedBooking]);

  const handleBookingSelect = (booking) => {
    setSelectedBooking(booking);
    // Auto-select the room that was booked for this guest
    if (booking.roomId || booking.roomNumber) {
      // Find room by ID or room number
      const bookedRoom = rooms.find((r) => 
        r.id === booking.roomId || 
        r.id === booking.roomId?.toString() ||
        r.number === booking.roomNumber ||
        r.id?.toString() === booking.roomId?.toString()
      );
      if (bookedRoom) {
        setSelectedRoomId(bookedRoom.id);
      } else {
        setSelectedRoomId(null);
      }
    } else {
      setSelectedRoomId(null);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedBooking || !selectedRoomId) {
      toast.error('Please select a booking and room');
      return;
    }

    setLoading(true);
    try {
      const selectedRoom = rooms.find((r) => r.id === selectedRoomId || r.id === selectedRoomId.toString());
      
      if (!selectedRoom) {
        toast.error('Room not found');
        setLoading(false);
        return;
      }

      // Update booking with room info (using appStore) - include roomNumber
      await checkIn(selectedBooking.id, selectedRoom.id, selectedRoom.number);
      
      // Update room status in Room Management system
      updateRoom(selectedRoom.id, {
        status: 'occupied',
        bookingId: selectedBooking.id,
      });

      // Refresh data to show updated room number
      await initializeData();

      toast.success('Check-in successful!');
      onSuccess();
    } catch (error) {
      toast.error('Failed to check-in. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quick Check-in" size="xl">
      <div className="space-y-6">
        {/* Search Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Booking
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, or booking ID"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-burgundy focus:border-transparent"
              style={{ '--tw-ring-color': '#800020' }}
            />
          </div>
        </div>

        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
            {searchResults.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {searchResults.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => handleBookingSelect(booking)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedBooking?.id === booking.id
                        ? 'bg-burgundy bg-opacity-10 border-l-4'
                        : 'hover:bg-gray-50'
                    }`}
                    style={{
                      borderLeftColor:
                        selectedBooking?.id === booking.id ? '#800020' : 'transparent',
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-900">
                            {booking.guestName}
                          </span>
                          {selectedBooking?.id === booking.id && (
                            <Check className="w-4 h-4 text-burgundy" style={{ color: '#800020' }} />
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3" />
                            <span>{booking.guestPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(booking.checkIn).toLocaleDateString()} -{' '}
                              {new Date(booking.checkOut).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Room Type:</span> {booking.roomType}
                          </div>
                          {booking.roomNumber && (
                            <div>
                              <span className="font-medium">Booked Room:</span> {booking.roomNumber}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Booking ID:</span> #{booking.id}
                          </div>
                          {booking.numberOfGuests && (
                            <div>
                              <span className="font-medium">Guests:</span> {booking.numberOfGuests}
                            </div>
                          )}
                          {booking.purposeOfVisit && (
                            <div>
                              <span className="font-medium">Purpose:</span> {booking.purposeOfVisit}
                            </div>
                          )}
                          {booking.comingFrom && (
                            <div>
                              <span className="font-medium">Coming From:</span> {booking.comingFrom}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No bookings found</p>
              </div>
            )}
          </div>
        )}

        {/* Selected Booking Info */}
        {selectedBooking && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Selected Booking</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Guest:</span> {selectedBooking.guestName}
              </p>
              <p>
                <span className="font-medium">Phone:</span> {selectedBooking.guestPhone}
              </p>
              <p>
                <span className="font-medium">Check-in:</span>{' '}
                {new Date(selectedBooking.checkIn).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Check-out:</span>{' '}
                {new Date(selectedBooking.checkOut).toLocaleDateString()}
              </p>
              {selectedBooking.roomNumber && (
                <p>
                  <span className="font-medium">Booked Room:</span>{' '}
                  <span className="text-blue-600 font-semibold">Room {selectedBooking.roomNumber}</span>
                </p>
              )}
              {selectedBooking.numberOfGuests && (
                <p>
                  <span className="font-medium">Number of Guests:</span> {selectedBooking.numberOfGuests}
                </p>
              )}
              {selectedBooking.purposeOfVisit && (
                <p>
                  <span className="font-medium">Purpose of Visit:</span> {selectedBooking.purposeOfVisit}
                </p>
              )}
              {selectedBooking.comingFrom && (
                <p>
                  <span className="font-medium">Coming From:</span> {selectedBooking.comingFrom}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Room Selection */}
        {selectedBooking && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Room
            </label>
            <p className="text-xs text-gray-500 mb-3">
              {selectedBooking.roomNumber 
                ? `Booked Room: ${selectedBooking.roomNumber} (pre-selected). You can change if needed.`
                : 'Select a room for check-in'}
            </p>
            {availableRooms.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {availableRooms.map((room) => {
                  // Check if this is the booked room
                  const isBookedRoom = selectedBooking && (
                    room.id === selectedBooking.roomId || 
                    room.id === selectedBooking.roomId?.toString() ||
                    room.number === selectedBooking.roomNumber ||
                    room.id?.toString() === selectedBooking.roomId?.toString()
                  );
                  const isSelected = selectedRoomId === room.id;
                  const roomStatus = room.status || 'vacant';
                  const isAvailable = roomStatus === 'vacant' || roomStatus === 'dirty';
                  const canSelect = isAvailable || isBookedRoom; // Can select if available OR if it's the booked room

                  return (
                    <div
                      key={room.id}
                      onClick={() => {
                        if (canSelect) {
                          setSelectedRoomId(room.id);
                        }
                      }}
                      className={`p-4 border-2 rounded-xl transition-all ${
                        !canSelect
                          ? 'opacity-60 cursor-not-allowed'
                          : 'cursor-pointer'
                      } ${
                        isSelected
                          ? 'border-burgundy bg-burgundy bg-opacity-10'
                          : isBookedRoom
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        borderColor: isSelected 
                          ? '#800020' 
                          : isBookedRoom 
                          ? '#3b82f6' 
                          : undefined,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bed className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold text-gray-900">Room {room.number}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-burgundy" style={{ color: '#800020' }} />
                        )}
                      </div>
                      {isBookedRoom && (
                        <div className="mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold">
                            Booked Room
                          </span>
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        <p>{room.type}</p>
                        <p className="font-medium text-gray-900">₹{room.price?.toLocaleString() || room.price}/night</p>
                        {room.floor && (
                          <p className="text-xs text-gray-500">Floor {room.floor}</p>
                        )}
                      </div>
                      <div className="mt-2">
                        {isBookedRoom && roomStatus !== 'vacant' && roomStatus !== 'dirty' ? (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-semibold">
                            Booked ({roomStatus})
                          </span>
                        ) : roomStatus === 'vacant' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                            Vacant
                          </span>
                        ) : roomStatus === 'dirty' ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-semibold">
                            Dirty
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-semibold">
                            {roomStatus}
                          </span>
                        )}
                      </div>
                      {isBookedRoom && !isAvailable && (
                        <p className="text-xs text-orange-600 mt-1 font-medium">
                          Room is booked but currently {roomStatus}. You can still select it or choose another room.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 border border-gray-200 rounded-xl text-center">
                <p className="text-gray-500 mb-2">No vacant rooms available</p>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Total rooms: {rooms.length}</p>
                  <p>
                    Vacant: {rooms.filter((r) => (r.status || (r.available === true ? 'vacant' : 'occupied')) === 'vacant').length} | 
                    Occupied: {rooms.filter((r) => (r.status || 'vacant') === 'occupied').length} | 
                    Dirty: {rooms.filter((r) => (r.status || 'vacant') === 'dirty').length}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleCheckIn}
            disabled={!selectedBooking || !selectedRoomId || loading}
            loading={loading}
          >
            Check In
          </Button>
        </div>
      </div>
    </Modal>
  );
}

