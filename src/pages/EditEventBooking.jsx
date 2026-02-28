import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { eventBookingApi } from '../api/eventBookingApi/eventBookingApi';
import { roomManagementApi } from '../api/roomManagementApi/roomManagementApi';
import { authApi } from '../api/authApi/authApi';
import { useAuthStore } from '../store/authStore';
import { useFormStore } from '../store/formStore';
import { whatsappService } from '../utils/whatsappService';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Card } from '../atoms/Card';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, User, Phone, Mail, Tag, Info, CheckCircle2, Share2, Loader2 } from 'lucide-react';

export default function EditEventBooking() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [hotelId, setHotelId] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [adminsList, setAdminsList] = useState([]);
    const [adminsLoading, setAdminsLoading] = useState(false);
    const [selectedManagers, setSelectedManagers] = useState([]);
    const [successData, setSuccessData] = useState(null);
    const [errors, setErrors] = useState({});

    // Form State
    const [formData, setFormData] = useState({
        eventName: '',
        description: '',
        eventType: '',
        organizerName: '',
        organizerEmail: '',
        organizerPhone: '',
        startDate: '',
        endDate: '',
        roomIds: [],
        advancePaid: '',
        notes: '',
        status: '',
    });

    // Fetch Initial Data
    useEffect(() => {
        const initialize = async () => {
            setPageLoading(true);
            try {
                const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
                if (isSuperAdmin || !user) return;

                // 1. Get Hotel
                const hResponse = await hotelManagementApi.getMyHotel();
                const hotel = hResponse.data || hResponse;
                const hId = hotel._id || hotel.id;

                if (hId) {
                    setHotelId(hId);

                    // 2. Get Rooms
                    setRoomsLoading(true);
                    const roomsRes = await roomManagementApi.getAllRooms(hId);
                    setRooms(roomsRes.rooms || roomsRes.data?.rooms || []);
                    setRoomsLoading(false);

                    // 3. Get Event Details
                    const eventRes = await eventBookingApi.getEventWithAllLinkedBooking(hId, id);
                    const eventData = eventRes.data || eventRes;
                    const event = eventData.event;

                    if (event) {
                        setFormData({
                            eventName: event.name || '',
                            description: event.description || '',
                            eventType: event.type || '',
                            organizerName: event.organizerName || '',
                            organizerEmail: event.organizerEmail || '',
                            organizerPhone: event.organizerPhone || '',
                            startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
                            endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
                            roomIds: event.roomIds || [],
                            advancePaid: event.advancePaid || '',
                            notes: event.notes || '',
                            status: event.status || 'Planned',
                        });
                    }
                }

                // 4. Get Managers
                setAdminsLoading(true);
                const adminsRes = await authApi.getAllSubAdmins();
                const adminsData = adminsRes.data || adminsRes || [];
                setAdminsList(Array.isArray(adminsData) ? adminsData.filter(a => a.whatsappNumber) : []);
                setAdminsLoading(false);

            } catch (error) {
                console.error('Initialization failed:', error);
                toast.error('Failed to load event details');
            } finally {
                setPageLoading(false);
            }
        };
        initialize();
    }, [id, user]);

    const handleChange = (field, value) => {
        // Validate phone number
        if (field === 'organizerPhone') {
            const digitsOnly = value.replace(/\D/g, '');
            if (value && digitsOnly.length < 10) {
                setErrors((prev) => ({ ...prev, organizerPhone: 'Phone number must have at least 10 digits' }));
            } else {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.organizerPhone;
                    return newErrors;
                });
            }
        }
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleRoomToggle = (roomId) => {
        setFormData(prev => {
            const newRoomIds = prev.roomIds.includes(roomId)
                ? prev.roomIds.filter(rid => rid !== roomId)
                : [...prev.roomIds, roomId];
            return { ...prev, roomIds: newRoomIds };
        });
    };

    const handleSubmit = async () => {
        if (!formData.eventName || !formData.startDate || !formData.endDate || formData.roomIds.length === 0 || !formData.organizerName || !formData.organizerPhone) {
            toast.error('Please fill in all required fields and select at least one room');
            return;
        }

        // Phone Validation
        const digitsOnly = formData.organizerPhone.replace(/\D/g, '');
        if (formData.organizerPhone && digitsOnly.length < 10) {
            setErrors((prev) => ({ ...prev, organizerPhone: 'Phone number must have at least 10 digits' }));
            toast.error('Please fix validation errors');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
            };
            const response = await eventBookingApi.updateEvent(hotelId, id, payload);
            const data = response.data || response;
            setSuccessData(data);
            toast.success('Event booking updated successfully');

            // Automatic WhatsApp Sharing to selected managers
            if (selectedManagers.length > 0) {
                selectedManagers.forEach(managerPhone => {
                    whatsappService.shareEventDetailsWithManager(data, managerPhone);
                });
                toast.success('Sent updates to selected managers');
            }
        } catch (error) {
            console.error('Update failed:', error);
            const errorMessage = typeof error === 'string' ? error : (error.response?.data?.message || error.message || 'Failed to update event booking');
            toast.error(errorMessage, { duration: 5000 });
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-[#039E2F]" />
                <p className="mt-4 text-gray-500 font-medium">Loading event details...</p>
            </div>
        );
    }

    if (successData) {
        // Success View (similar to NewEventBooking)
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 animate-in fade-in duration-500">
                <Card className="w-full max-w-2xl p-8 text-center space-y-8 shadow-xl border-t-8 border-t-blue-500">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900">Updated!</h1>
                        <p className="text-gray-500 text-lg">Event <strong>{successData.event?.name}</strong> has been updated successfully.</p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 border border-gray-100">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Event ID</span>
                            <span className="font-bold text-gray-900">#{successData.event?._id}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Organizer</span>
                            <span className="font-semibold text-gray-900">{successData.event?.organizerName}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Rooms Booked</span>
                            <span className="font-semibold text-gray-900">{successData.bookings?.length} Rooms</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center gap-2 h-12"
                            onClick={() => {
                                if (selectedManagers.length > 0) {
                                    selectedManagers.forEach(managerPhone => {
                                        whatsappService.shareEventDetailsWithManager(successData, managerPhone);
                                    });
                                    toast.success('Details shared with managers');
                                } else {
                                    toast.error('No managers selected');
                                }
                            }}
                        >
                            <Share2 className="w-5 h-5" />
                            Share Details
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-12 border-gray-300"
                            onClick={() => navigate('/event-bookings')}
                        >
                            Go to Event List
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/event-bookings')}
                        className="mb-2 p-0 h-auto text-gray-500 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Event Booking</h1>
                    <p className="text-gray-500 text-sm">Update details for event: {formData.eventName}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => window.location.reload()}>Reset</Button>
                    <Button variant="outline" onClick={() => navigate('/event-bookings')}>Close</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Form */}
                <div className="lg:col-span-2 space-y-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

                    {/* Event Information */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-blue-600" />
                            Event Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InputField
                                label="Event Name"
                                value={formData.eventName}
                                onChange={(e) => handleChange('eventName', e.target.value)}
                                required
                            />
                            <SelectDropdown
                                label="Event Type"
                                value={formData.eventType}
                                onChange={(e) => handleChange('eventType', e.target.value)}
                                required
                                options={[
                                    { id: 'Wedding', name: 'Wedding' },
                                    { id: 'Conference', name: 'Conference' },
                                    { id: 'Party', name: 'Party' },
                                    { id: 'Corporate', name: 'Corporate' },
                                    { id: 'Other', name: 'Other' },
                                ]}
                            />
                            <SelectDropdown
                                label="Status"
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                required
                                options={[
                                    { id: 'Planned', name: 'Planned' },
                                    { id: 'Confirmed', name: 'Confirmed' },
                                    { id: 'Cancelled', name: 'Cancelled' },
                                ]}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="Advance Paid (₹)"
                                type="number"
                                value={formData.advancePaid}
                                onChange={(e) => handleChange('advancePaid', e.target.value === '' ? '' : Number(e.target.value))}
                                onWheel={(e) => e.target.blur()}
                                placeholder="Enter amount"
                            />
                            <InputField
                                label="Event Description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Organizer Details */}
                    <div className="space-y-6 pt-4">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Organizer Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <InputField
                                label="Organizer Name"
                                value={formData.organizerName}
                                onChange={(e) => handleChange('organizerName', e.target.value)}
                                required
                            />
                            <InputField
                                label="Organizer Email"
                                type="email"
                                value={formData.organizerEmail}
                                onChange={(e) => handleChange('organizerEmail', e.target.value)}
                            />
                            <InputField
                                label="Organizer Phone"
                                type="tel"
                                value={formData.organizerPhone}
                                onChange={(e) => handleChange('organizerPhone', e.target.value)}
                                required
                                error={errors.organizerPhone}
                                minLength={10}
                            />
                        </div>
                    </div>

                    {/* Scheduling */}
                    <div className="space-y-6 pt-4">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            Scheduling
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="Start Date & Time"
                                type="datetime-local"
                                value={formData.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                required
                            />
                            <InputField
                                label="End Date & Time"
                                type="datetime-local"
                                value={formData.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Manager Selection */}
                    <div className="pt-4 border-t border-gray-100 mt-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-green-600" />
                            Share Updates with Managers
                        </h3>
                        {adminsLoading ? (
                            <p className="text-gray-500 italic">Loading managers...</p>
                        ) : adminsList.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {adminsList.map((manager) => (
                                    <label
                                        key={manager.id || manager._id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${selectedManagers.includes(manager.whatsappNumber)
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300 shadow-sm'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                            checked={selectedManagers.includes(manager.whatsappNumber)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedManagers([...selectedManagers, manager.whatsappNumber]);
                                                } else {
                                                    setSelectedManagers(selectedManagers.filter(num => num !== manager.whatsappNumber));
                                                }
                                            }}
                                        />
                                        <div>
                                            <p className="font-bold text-gray-900">{manager.name}</p>
                                            <p className="text-xs text-gray-500">{manager.whatsappNumber}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No managers found</p>
                        )}
                    </div>
                </div>

                {/* Right Column - Summary */}
                <div className="lg:col-span-1">
                    <Card className="p-6 sticky top-6 border border-gray-100 shadow-xl overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-blue-600" />
                        <h2 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-tight">Booking Summary</h2>

                        <div className="space-y-5 mb-8">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-400 uppercase">Event</span>
                                <span className="font-bold text-gray-800 text-lg leading-tight truncate">{formData.eventName || 'Unnamed Event'}</span>
                            </div>

                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-400 uppercase">Organizer</span>
                                <span className="font-semibold text-gray-700 leading-tight truncate">{formData.organizerName || 'N/A'}</span>
                            </div>

                            <div className="h-px bg-gray-100" />

                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">Selected Rooms</span>
                                <span className="font-black text-blue-600 text-xl">{formData.roomIds.length}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">Advance Paid</span>
                                <span className="font-bold text-gray-900">₹{formData.advancePaid.toLocaleString()}</span>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20"
                            onClick={handleSubmit}
                            loading={loading}
                        >
                            Update Event Booking
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
