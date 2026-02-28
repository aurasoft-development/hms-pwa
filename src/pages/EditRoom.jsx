import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomManagementApi } from '../api/roomManagementApi/roomManagementApi';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { useAuthStore } from '../store/authStore';
import { useFormStore } from '../store/formStore';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Card } from '../atoms/Card';
import { Wifi, Tv, Wind, Refrigerator, ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { theme } from '../utils/theme';

const AVAILABLE_AMENITIES = [
    { id: 'AC', label: 'AC', icon: Wind },
    { id: 'TV', label: 'TV', icon: Tv },
    { id: 'WiFi', label: 'WiFi', icon: Wifi },
    { id: 'Mini Bar', label: 'Mini Bar', icon: Refrigerator },
    { id: 'Mini Fridge', label: 'Mini Fridge', icon: Refrigerator },
];

const ROOM_TYPES = [
    { id: 'single', name: 'Single' },
    { id: 'double', name: 'Double' },
    { id: 'suite', name: 'Suite' },
    { id: 'deluxe', name: 'Deluxe' },
    { id: 'family', name: 'Family' },
];

const ROOM_STATUSES = [
    { id: 'available', name: 'Available' },
    { id: 'occupied', name: 'Occupied' },
    { id: 'maintenance', name: 'Maintenance' },
    { id: 'reserved', name: 'Reserved' },
];

export default function EditRoom() {
    const { id } = useParams();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [hotelId, setHotelId] = useState(null);
    const [room, setRoom] = useState(null);
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    const { setFormData: setPersistentData, clearFormData, getFormData } = useFormStore();
    const [formData, setFormData] = useState({
        type: '',
        floor: '',
        price: '',
        status: '',
        amenities: [],
        description: '',
        maxOccupancy: '',
        number: '',
    });

    useEffect(() => {
        if (!fetching && id) {
            setPersistentData(`editRoom_${id}`, formData);
        }
    }, [formData, id, fetching, setPersistentData]);

    // Fetch Hotel ID and Room Data
    useEffect(() => {
        const initData = async () => {
            try {
                // 1. Get Hotel ID
                const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
                if (isSuperAdmin || !user) return;

                const hotelResponse = await hotelManagementApi.getMyHotel();
                const hotel = hotelResponse.data || hotelResponse;
                const hId = hotel._id || hotel.id;

                if (!hId) throw new Error('Hotel ID not found');
                setHotelId(hId);

                // 2. Get Room Details
                if (id) {
                    const roomResponse = await roomManagementApi.getRoomById(hId, id);
                    const roomData = roomResponse.data || roomResponse;
                    setRoom(roomData);

                    // Initialize Form
                    const apiData = {
                        type: roomData.type || roomData.roomType || '',
                        floor: roomData.floor || 1,
                        price: roomData.price || roomData.pricePerNight || '',
                        status: roomData.status || 'available',
                        amenities: roomData.amenities || [],
                        description: roomData.description || '',
                        maxOccupancy: roomData.maxOccupancy || 2,
                        number: roomData.number || roomData.roomNumber || '',
                    };

                    const savedData = getFormData(`editRoom_${id}`, null);
                    setFormData(savedData || apiData);
                    setMaintenanceMode(roomData.status === 'maintenance');
                }
            } catch (error) {
                console.error('Failed to load data:', error);
                toast.error('Failed to load room details');
                navigate('/room-management');
            } finally {
                setFetching(false);
            }
        };

        initData();
    }, [id, navigate]);

    useEffect(() => {
        if (maintenanceMode) {
            setFormData((prev) => ({ ...prev, status: 'maintenance' }));
        }
    }, [maintenanceMode]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (field === 'status' && value !== 'maintenance') {
            setMaintenanceMode(false);
        }
    };

    const handleAmenityToggle = (amenityId) => {
        setFormData((prev) => {
            const amenities = prev.amenities.includes(amenityId)
                ? prev.amenities.filter((a) => a !== amenityId)
                : [...prev.amenities, amenityId];
            return { ...prev, amenities };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hotelId || !id) return;

        if (!formData.type || !formData.price) {
            toast.error('Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            // Transform UI data back to API format (matching RoomManagement.jsx logic)
            const payload = {
                roomNumber: formData.number,
                roomType: formData.type,
                pricePerNight: parseFloat(formData.price),
                status: formData.status,
                amenities: formData.amenities,
                description: formData.description,
                maxOccupancy: parseInt(formData.maxOccupancy) || 2,
            };

            await roomManagementApi.updateRoom(hotelId, id, payload);
            toast.success('Room updated successfully');
            clearFormData(`editRoom_${id}`);
            navigate('/room-management');
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update room');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#ECF3F3]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#039E2F]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/room-management')}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </Button>
                    <div>
                        <p className="text-sm text-gray-500">Room Edit</p>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {formData.type} No.{formData.number}
                        </h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            clearFormData(`editRoom_${id}`);
                            navigate('/room-management');
                        }}
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={loading}
                        className="bg-[#039E2F] hover:bg-[#027a24] text-white flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Room Details Section */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Room Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Room Price */}
                        <InputField
                            label="Price per Night (₹)"
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleChange('price', e.target.value)}
                            placeholder="Enter price"
                            required
                            min="0"
                            step="100"
                            className="bg-gray-50 border-gray-200"
                        />

                        {/* Room Status */}
                        <SelectDropdown
                            label="Room Status"
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            options={ROOM_STATUSES}
                            className="bg-gray-50 border-gray-200"
                            disabled={maintenanceMode}
                        />

                        {/* Room Type */}
                        <SelectDropdown
                            label="Room Type"
                            value={formData.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            options={ROOM_TYPES}
                            className="bg-gray-50 border-gray-200"
                        />

                        {/* Room Number */}
                        <InputField
                            label="Room Number"
                            value={formData.number}
                            disabled
                            className="bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500"
                        />

                        {/* Room Status (Extra from screenshot replaced with existing Maintenance Mode logic) or Capacity */}
                        {/* Max Occupancy */}
                        <InputField
                            label="Max Occupancy"
                            type="number"
                            value={formData.maxOccupancy}
                            onChange={(e) => handleChange('maxOccupancy', e.target.value)}
                            placeholder="e.g., 2"
                            required
                            min="1"
                            className="bg-gray-50 border-gray-200"
                        />

                        {/* Floor */}
                        <InputField
                            label="Floor"
                            type="number"
                            value={formData.floor}
                            onChange={(e) => handleChange('floor', e.target.value)}
                            placeholder="Enter floor"
                            min="1"
                            className="bg-gray-50 border-gray-200"
                        />

                        {/* Maintenance Mode Toggle */}
                        <div className="col-span-1 md:col-span-2 space-y-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Maintenance Mode
                            </label>
                            <div
                                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                style={{ borderColor: maintenanceMode ? '#039E2F' : undefined }}
                            >
                                <span className="text-sm text-gray-500">Set room as Out of Service</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={maintenanceMode}
                                        onChange={(e) => {
                                            setMaintenanceMode(e.target.checked);
                                            if (e.target.checked) {
                                                handleChange('status', 'maintenance');
                                            }
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div
                                        className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${maintenanceMode ? '' : 'bg-gray-200'}`}
                                        style={{
                                            backgroundColor: maintenanceMode ? '#039E2F' : undefined,
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Description (Full width) */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                                style={{ '--tw-ring-color': '#039E2F' }}
                                placeholder="Enter room description..."
                            />
                        </div>
                    </div>
                </Card>

                {/* Room Amenities Section */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Room Amenities</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {AVAILABLE_AMENITIES.map((amenity) => {
                            const Icon = amenity.icon;
                            const isSelected = formData.amenities.includes(amenity.id);
                            return (
                                <label
                                    key={amenity.id}
                                    className={`
                            group flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200
                            ${isSelected
                                            ? 'border-[#039E2F] bg-[#039E2F]/5'
                                            : 'border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }
                        `}
                                >
                                    <div className={`p-1.5 rounded-md ${isSelected ? 'bg-[#039E2F] text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'}`}>
                                        {isSelected ? (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <Icon className="w-3.5 h-3.5" />
                                        )}
                                    </div>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-[#039E2F]' : 'text-gray-500 group-hover:text-gray-700'}`}>
                                        {amenity.label}
                                    </span>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={isSelected}
                                        onChange={() => handleAmenityToggle(amenity.id)}
                                    />
                                </label>
                            );
                        })}
                    </div>
                </Card>

                {/* Bottom Actions */}
                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            clearFormData(`editRoom_${id}`);
                            navigate('/room-management');
                        }}
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={loading}
                        className="bg-[#039E2F] hover:bg-[#027a24] text-white flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
}
