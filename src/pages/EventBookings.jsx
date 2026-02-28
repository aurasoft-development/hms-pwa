import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { eventBookingApi } from '../api/eventBookingApi/eventBookingApi';
import { roomManagementApi } from '../api/roomManagementApi/roomManagementApi';
import { hasViewPermissions, hasCreatePermissions, hasUpdatePermissions, hasDeletePermissions } from '../utils/permissions';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { Modal } from '../atoms/Modal';
import { EventCard } from '../molecules/EventCard';
import { Search, Plus, Calendar, X, Filter, Loader2, Info, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { theme } from '../utils/theme';

export default function EventBookings() {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // State
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hotelId, setHotelId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 9,
        total: 0,
        totalPages: 0,
    });

    // Modal states
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventDetails, setEventDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Fetch Hotel ID
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
            }
        };
        fetchHotelId();
    }, []);

    // Fetch Events
    const fetchEvents = useCallback(async (page = 1) => {
        if (!hotelId) return;
        setLoading(true);
        try {
            const response = await eventBookingApi.getAllEventsWithPagination(hotelId, page, pagination.limit);
            const data = response.data || response;
            setEvents(data.events || []);
            setPagination(prev => ({
                ...prev,
                page: data.currentPage || page,
                total: data.totalEvents || 0,
                totalPages: data.totalPages || 0,
            }));
        } catch (error) {
            console.error('Failed to fetch events:', error);
            toast.error('Failed to load event bookings');
        } finally {
            setLoading(false);
        }
    }, [hotelId, pagination.limit]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Handle View Details
    const handleViewDetails = async (event) => {
        setSelectedEvent(event);
        setIsDetailsModalOpen(true);
        setDetailsLoading(true);
        try {
            const response = await eventBookingApi.getEventWithAllLinkedBooking(hotelId, event._id || event.id);
            setEventDetails(response.data || response);
        } catch (error) {
            console.error('Failed to fetch event details:', error);
            toast.error('Failed to load event details');
        } finally {
            setDetailsLoading(false);
        }
    };

    // Filtered events (simple client-side search for current page)
    const filteredEvents = useMemo(() => {
        if (!searchQuery) return events;
        return events.filter(event =>
            event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.organizerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.organizerPhone?.includes(searchQuery)
        );
    }, [events, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Event Bookings</h1>
                    <p className="text-gray-500 text-sm">Manage group bookings and events</p>
                </div>
                {hasCreatePermissions(user?.role, 'bookings') && (
                    <Button
                        className="w-full sm:w-auto flex items-center justify-center gap-2"
                        onClick={() => navigate('/new-event-booking')}
                    >
                        <Plus className="w-5 h-5" />
                        New Event Booking
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card className="p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by event name or organizer..."
                            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-burgundy focus:border-transparent transition-all duration-200 bg-white hover:border-gray-400 shadow-sm"
                        />
                    </div>
                </div>
            </Card>

            {/* Events List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-burgundy" />
                    <p className="mt-4 text-gray-500">Loading events...</p>
                </div>
            ) : filteredEvents.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEvents.map((event) => (
                            <EventCard
                                key={event._id || event.id}
                                event={event}
                                onView={() => handleViewDetails(event)}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-sm text-gray-600">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                {pagination.total} events
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchEvents(pagination.page - 1)}
                                    disabled={pagination.page === 1 || loading}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fetchEvents(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages || loading}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <Card className="py-20">
                    <div className="flex flex-col items-center justify-center">
                        <Calendar className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">No events found</h3>
                        <p className="text-gray-500 mt-1">Try adjusting your search or create a new event booking.</p>
                    </div>
                </Card>
            )}

            {/* Details Modal */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setEventDetails(null);
                }}
                title={
                    <div className="flex items-center justify-between w-full pr-10">
                        <span>Event Details</span>
                        {eventDetails && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/edit-event-booking/${eventDetails.event?._id || eventDetails.event?.id}`)}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Event
                            </Button>
                        )}
                    </div>
                }
                size="xl"
            >
                {detailsLoading ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-burgundy" />
                        <p className="mt-2 text-sm text-gray-500">Loading linked bookings...</p>
                    </div>
                ) : eventDetails ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Event Name</p>
                                <p className="font-bold text-gray-900">{eventDetails.event?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Organizer</p>
                                <p className="font-bold text-gray-900">{eventDetails.event?.organizerName}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Dates</p>
                                <p className="text-sm">
                                    {new Date(eventDetails.event?.startDate).toLocaleString()} -
                                    {new Date(eventDetails.event?.endDate).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                                <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                    {eventDetails.event?.status}
                                </span>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-3">Linked Room Bookings ({eventDetails.bookings?.length || 0})</h3>
                            <div className="space-y-3">
                                {eventDetails.bookings?.map((booking) => (
                                    <div key={booking._id} className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm">
                                        <div>
                                            <p className="font-semibold">{booking.guestName}</p>
                                            <p className="text-xs text-gray-500">Room ID: {booking.roomId}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-green-600">₹{booking.totalAmount}</p>
                                            <p className="text-xs uppercase text-gray-400">{booking.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>

        </div>
    );
}

