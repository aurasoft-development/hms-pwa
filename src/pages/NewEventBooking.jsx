import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { eventBookingApi } from '../api/eventBookingApi/eventBookingApi';
import { roomManagementApi } from '../api/roomManagementApi/roomManagementApi';
import { useAuthStore } from '../store/authStore';
import { useFormStore } from '../store/formStore';
import { whatsappService } from '../utils/whatsappService';
import { authApi } from '../api/authApi/authApi';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Card } from '../atoms/Card';
import toast from 'react-hot-toast';
import { ArrowLeft, Calendar, User, Phone, Mail, Tag, Info, CheckCircle2 } from 'lucide-react';
import { ManagerShareSelection } from '../organisms/ManagerShareSelection';

export default function NewEventBooking() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const { setFormData: setPersistentData, clearFormData, getFormData } = useFormStore();

    const [loading, setLoading] = useState(false);
    const [hotelId, setHotelId] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [selectedManagers, setSelectedManagers] = useState(() => getFormData('newEventBookingManagers', []));

    useEffect(() => {
        setPersistentData('newEventBookingManagers', selectedManagers);
    }, [selectedManagers, setPersistentData]);

    const [successData, setSuccessData] = useState(null);

    // Form State
    const initialFormData = {
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
    };

    const [formData, setFormData] = useState(() => getFormData('newEventBooking', initialFormData));
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setPersistentData('newEventBooking', formData);
    }, [formData, setPersistentData]);

    // Fetch Hotel ID and Rooms
    useEffect(() => {
        const initialize = async () => {
            try {
                const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
                if (isSuperAdmin || !user) return;

                const response = await hotelManagementApi.getMyHotel();
                const hotel = response.data || response;
                const id = hotel._id || hotel.id;
                if (id) {
                    setHotelId(id);
                    setRoomsLoading(true);
                    const roomsRes = await roomManagementApi.getAllRooms(id);
                    setRooms(roomsRes.rooms || roomsRes.data?.rooms || []);
                    setRoomsLoading(false);
                }
            } catch (error) {
                console.error('Initialization failed:', error);
                toast.error('Failed to initialize page');
            }
        };
        initialize();
    }, []);

    const handleChange = (field, value) => {
        // Validate phone number
        if (field === 'organizerPhone') {
            // Remove non-digit characters for validation
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
                ? prev.roomIds.filter(id => id !== roomId)
                : [...prev.roomIds, roomId];
            return { ...prev, roomIds: newRoomIds };
        });
    };

    const handleSubmit = async () => {
        if (!formData.eventName || !formData.startDate || !formData.endDate || formData.roomIds.length === 0 || !formData.organizerName || !formData.organizerPhone) {
            toast.error('Please fill in all required fields and select at least one room');
            return;
        }

        // Validate phone number before submission
        const digitsOnly = formData.organizerPhone.replace(/\D/g, '');
        if (formData.organizerPhone && digitsOnly.length < 10) {
            setErrors((prev) => ({ ...prev, organizerPhone: 'Phone number must have at least 10 digits' }));
            toast.error('Please fix the validation errors before submitting');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
            };
            const response = await eventBookingApi.createBulkEventBooking(hotelId, payload);
            const data = response.data || response;
            setSuccessData(data);
            toast.success('Event booking created successfully');
            clearFormData('newEventBooking');

            // Automatic WhatsApp Sharing to selected managers
            if (selectedManagers.length > 0) {
                selectedManagers.forEach(managerPhone => {
                    whatsappService.shareEventDetailsWithManager(data, managerPhone);
                });
                toast.success('Sent details to selected managers');
                clearFormData('newEventBookingManagers');
            }
        } catch (error) {
            console.error('Failed to create event:', error);
            const errorMessage = typeof error === 'string' ? error : (error.response?.data?.message || error.message || 'Failed to create event');
            toast.error(errorMessage, { duration: 5000 });
        } finally {
            setLoading(false);
        }
    };

    if (successData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 animate-in fade-in duration-500">
                <Card className="w-full max-w-2xl p-8 text-center space-y-8 shadow-xl border-t-8 border-t-green-500">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                            <CheckCircle2 className="w-12 h-12" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900">Booking Successful!</h1>
                        <p className="text-gray-500 text-lg">Event <strong>{successData.event?.name}</strong> has been booked successfully.</p>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 border border-gray-100">

                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Organizer</span>
                            <span className="font-semibold text-gray-900">{successData.event?.organizerName}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-gray-500">Rooms Booked</span>
                            <span className="font-semibold text-gray-900">{successData.bookings?.length} Rooms</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-gray-900 font-bold">Advance Paid</span>
                            <span className="text-xl font-bold text-green-600">₹{successData.event?.advancePaid?.toLocaleString()}</span>
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
                    <h1 className="text-3xl font-bold text-gray-900">New Event Booking</h1>
                    <p className="text-gray-500 text-sm">Create a multi-room reservation for an event</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => {
                        clearFormData('newEventBooking');
                        window.location.reload();
                    }}>Reset</Button>
                    <Button variant="outline" onClick={() => navigate('/event-bookings')}>Close</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Form */}
                <div className="lg:col-span-2 space-y-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">

                    {/* Event Details Section */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-green-600" style={{ color: '#039E2F' }} />
                            Event Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InputField
                                label="Event Name"
                                value={formData.eventName}
                                onChange={(e) => handleChange('eventName', e.target.value)}
                                required
                                placeholder="e.g. Smith Wedding"
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
                                placeholder="Select event type"
                            />
                            <InputField
                                label="Advance Paid (₹)"
                                type="number"
                                value={formData.advancePaid}
                                onChange={(e) => handleChange('advancePaid', e.target.value === '' ? '' : Number(e.target.value))}
                                onWheel={(e) => e.target.blur()}
                                placeholder="Enter amount"
                            />
                        </div>
                        <InputField
                            label="Event Description"
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Brief description of the event..."
                        />
                    </div>

                    {/* Organizer Details Section */}
                    <div className="space-y-6 pt-4">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <User className="w-5 h-5 text-green-600" style={{ color: '#039E2F' }} />
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
                                placeholder="optional@example.com"
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

                    {/* Scheduling Section */}
                    <div className="space-y-6 pt-4">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-600" style={{ color: '#039E2F' }} />
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

                    {/* Room Selection Grid Section */}
                    <div className="space-y-6 pt-4">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                            <Info className="w-5 h-5 text-green-600" style={{ color: '#039E2F' }} />
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
                                                ? 'bg-green-600 text-white border-green-600 shadow-green-500/20'
                                                : 'bg-white text-gray-700 border-transparent hover:border-green-600/30'
                                            }
                            `}
                                        style={formData.roomIds.includes(room._id) ? { backgroundColor: '#039E2F', borderColor: '#039E2F' } : {}}
                                    >
                                        <span className="block text-xs font-bold uppercase opacity-60 mb-1">Room</span>
                                        <span className="text-lg font-extrabold">{room.roomNumber}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {formData.roomIds.length > 0 && (
                            <p className="text-sm font-semibold text-green-600 mt-2" style={{ color: '#039E2F' }}>
                                {formData.roomIds.length} rooms selected for this event
                            </p>
                        )}
                    </div>

                    {/* Manager Selection Section */}
                    <ManagerShareSelection
                        selectedManagers={selectedManagers}
                        setSelectedManagers={setSelectedManagers}
                        title="Share Booking with Managers"
                    />

                    {/* Notes Section */}
                    <div className="pt-4">
                        <label className="block text-sm font-semibold mb-2 text-gray-800">
                            Additional Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="e.g. VIP guest, extra beds required..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200 bg-white"
                            style={{ '--tw-ring-color': '#039E2F' }}
                        />
                    </div>

                    {/* Manager Selection Section */}
                    {/* <div className="pt-4 border-t border-gray-100 mt-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Share2 className="w-5 h-5 text-green-600" style={{ color: '#039E2F' }} />
                            Share with Managers
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
                            <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed">
                                <p className="text-sm text-gray-500 italic">No managers found with WhatsApp numbers</p>
                            </div>
                        )}
                    </div> */}
                </div>

                {/* Right Column - Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 sticky top-6 border border-gray-100 shadow-xl overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-2 bg-green-600" style={{ backgroundColor: '#039E2F' }} />
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
                                <span className="font-black text-green-600 text-xl" style={{ color: '#039E2F' }}>{formData.roomIds.length}</span>
                            </div>

                            <div className="flex justify-between items-center text-gray-700">
                                <span className="font-medium">Advance Paid</span>
                                <span className="font-bold text-gray-900">₹{formData.advancePaid.toLocaleString()}</span>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="w-full text-white h-12 text-base font-bold uppercase tracking-wider transition-all hover:brightness-110 shadow-lg shadow-green-500/20"
                            style={{ backgroundColor: '#039E2F' }}
                            onClick={handleSubmit}
                            loading={loading}
                        >
                            Confirm Event Booking
                        </Button>

                        <p className="mt-4 text-[10px] text-gray-400 text-center uppercase font-bold px-4 leading-relaxed">
                            By confirming, you will create room bookings for all selected rooms.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
