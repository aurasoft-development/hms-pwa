import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function CreateRoom() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [hotelId, setHotelId] = useState(null);

    const { setFormData: setPersistentData, clearFormData, getFormData } = useFormStore();
    const initialFormData = {
        roomNumber: '',
        roomType: '',
        pricePerNight: '',
        description: '',
        amenities: [],
        maxOccupancy: '',
    };

    const [formData, setFormData] = useState(() => getFormData('createRoom', initialFormData));

    useEffect(() => {
        setPersistentData('createRoom', formData);
    }, [formData, setPersistentData]);

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
                } else {
                    toast.error('No hotel found');
                    navigate('/room-management');
                }
            } catch (error) {
                console.error('Failed to fetch hotel:', error);
                toast.error('Failed to load hotel information');
                navigate('/room-management');
            }
        };
        fetchHotelId();
    }, [navigate]);

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
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
        if (!hotelId) return;

        if (!formData.roomNumber || !formData.roomType || !formData.pricePerNight || !formData.maxOccupancy) {
            toast.error('Please fill all required fields');
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
            clearFormData('createRoom');
            navigate('/room-management');
        } catch (error) {
            console.error('Create failed:', error);
            toast.error('Failed to create room');
        } finally {
            setLoading(false);
        }
    };

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
                        <p className="text-sm text-gray-500">Room Management</p>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Create New Room
                        </h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            clearFormData('createRoom');
                            navigate('/room-management');
                        }}
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={loading}
                        className="bg-[#039E2F] hover:bg-[#027a24] text-white flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Create Room
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Room Details Section */}
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Room Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* Room Number */}
                        <InputField
                            label="Room Number"
                            value={formData.roomNumber}
                            onChange={(e) => handleChange('roomNumber', e.target.value)}
                            placeholder="e.g., 101"
                            required
                            className="bg-gray-50 border-gray-200"
                        />

                        {/* Room Type */}
                        <SelectDropdown
                            label="Room Type"
                            value={formData.roomType}
                            onChange={(e) => handleChange('roomType', e.target.value)}
                            options={ROOM_TYPES}
                            className="bg-gray-50 border-gray-200"
                            placeholder="Select room type"
                            required
                        />

                        {/* Price */}
                        <InputField
                            label="Price per Night (₹)"
                            type="number"
                            value={formData.pricePerNight}
                            onChange={(e) => handleChange('pricePerNight', e.target.value)}
                            placeholder="e.g., 5000"
                            required
                            min="0"
                            className="bg-gray-50 border-gray-200"
                        />

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

                        {/* Description (Full width) */}
                        <div className="col-span-1 md:col-span-2 lg:col-span-4 space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                                style={{ '--tw-ring-color': '#039E2F' }}
                                placeholder="Spacious room with city view"
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
                            clearFormData('createRoom');
                            navigate('/room-management');
                        }}
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={loading}
                        className="bg-[#039E2F] hover:bg-[#027a24] text-white flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Create Room
                    </Button>
                </div>
            </div>
        </div>
    );
}
