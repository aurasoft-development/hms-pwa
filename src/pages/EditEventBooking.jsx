import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { eventBookingApi } from '../api/eventBookingApi/eventBookingApi';
import { roomManagementApi } from '../api/roomManagementApi/roomManagementApi';
import { authApi } from '../api/authApi/authApi';
import { useAuthStore } from '../store/authStore';
import { whatsappService } from '../utils/whatsappService';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Card } from '../atoms/Card';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, User, Phone, Mail, Tag, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { ManagerShareSelection } from '../organisms/ManagerShareSelection';
import { useFormStore } from '../store/formStore';

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
    const { setFormData: setPersistentData, clearFormData, getFormData } = useFormStore();
    const [selectedManagers, setSelectedManagers] = useState(() => getFormData(`editEventBooking_${id}_managers`, []));

    useEffect(() => {
        if (id) {
            setPersistentData(`editEventBooking_${id}_managers`, selectedManagers);
        }
    }, [selectedManagers, id, setPersistentData]);
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
                            roomIds: (event.roomIds && event.roomIds.length > 0)
                                ? event.roomIds
                                : (eventData.bookings ? eventData.bookings.map(b => b.roomId || b.room?._id).filter(Boolean) : []),
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
                            onClick={() => whatsappService.shareEventReceipt(successData, successData.event?.organizerPhone)}
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
                                        whatsappService.shareEventDetailsWithManager(successData, managerPhone);
                                    });
                                    toast.success('Shared with managers');
                                } else {
                                    toast.error('No managers selected');
                                }
                            }}
                        >
                            Resend to Manager(s)
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-12 border-gray-300"
                            onClick={() => navigate('/event-bookings')}
                        >
                            Go to Event List
                        </Button>
                    </div>
                </Card >
            </div >
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
                                    { id: 'planned', name: 'Planned' },
                                    { id: 'ongoing', name: 'ongoing' },
                                    { id: 'completed', name: 'completed' },
                                    { id: 'cancelled', name: 'cancelled' },
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

                    {/* Room Multi-selection Grid Section */}
                    <div className="space-y-6 pt-4">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-600" />
                            Room Multi-selection (Mandatory)
                        </h3>
                        {roomsLoading ? (
                            <div className="py-10 text-center text-gray-400 italic">Loading rooms...</div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                                {rooms.map((room) => (
                                    <div
                                        key={room._id}
                                        onClick={() => handleRoomToggle(room._id)}
                                        className={`
                                            cursor-pointer p-4 rounded-xl border-2 text-center transition-all duration-200 transform hover:scale-105 shadow-sm
                                            ${formData.roomIds.includes(room._id)
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                                                : 'bg-white text-gray-700 border-transparent hover:border-blue-600/30'
                                            }
                                        `}
                                    >
                                        <span className="block text-xs font-bold uppercase opacity-60 mb-1">Room</span>
                                        <span className="text-lg font-extrabold">{room.roomNumber}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Manager Selection Section */}
                    <ManagerShareSelection
                        selectedManagers={selectedManagers}
                        setSelectedManagers={setSelectedManagers}
                        title="Share Updates with Managers"
                    />
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
