import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { useFormStore } from '../store/formStore';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { Card } from '../atoms/Card';
import { ArrowLeft, Save, Building, MapPin, Phone, Mail, Globe, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { theme } from '../utils/theme';

export default function CreateHotel() {
    const navigate = useNavigate();
    const { setFormData, clearFormData, getFormData } = useFormStore();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const initialFormData = {
        name: '',
        description: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        phone: '',
        email: '',
        website: '',
        totalRooms: '',
        googleReviewLink: '',
    };

    const [formData, setFormDataLocal] = useState(() => getFormData('createHotel', initialFormData));

    // Update store when local state changes
    useEffect(() => {
        setFormData('createHotel', formData);
    }, [formData, setFormData]);

    const handleChange = (field, value) => {
        // Validate phone
        if (field === 'phone') {
            const digitsOnly = value.replace(/\D/g, '');
            if (value && digitsOnly.length < 10) {
                setErrors(prev => ({ ...prev, phone: 'Phone number must have at least 10 digits' }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.phone;
                    return newErrors;
                });
            }
        }
        setFormDataLocal((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.name || !formData.totalRooms || !formData.address || !formData.city || !formData.state || !formData.country || !formData.zipCode || !formData.phone || !formData.email) {
            toast.error('Please fill all required fields');
            return;
        }

        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.phone;
            return newErrors;
        });

        setLoading(true);
        try {
            const payload = {
                ...formData,
                totalRooms: parseInt(formData.totalRooms) || 0,
            };

            await hotelManagementApi.createHotel(payload);
            toast.success('Hotel created successfully');
            clearFormData('createHotel');
            navigate('/hotel-management');
        } catch (error) {
            console.error('Create failed:', error);
            toast.error(error || 'Failed to create hotel');
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
                        onClick={() => navigate('/hotel-management')}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </Button>
                    <div>
                        <p className="text-sm text-gray-500">Hotel Management</p>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Create New Hotel
                        </h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                            clearFormData('createHotel');
                            navigate('/hotel-management');
                        }}
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={loading}
                        onClick={handleSubmit}
                        className="bg-[#039E2F] hover:bg-[#027a24] text-white flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Create Hotel
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Section */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <Building className="w-5 h-5 text-[#039E2F]" />
                        <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            label="Hotel Name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="e.g., Grand Hotel"
                            required
                            className="bg-gray-50 border-gray-200"
                        />

                        <InputField
                            label="Total Rooms"
                            type="number"
                            value={formData.totalRooms}
                            onChange={(e) => handleChange('totalRooms', e.target.value)}
                            placeholder="e.g., 50"
                            required
                            min="0"
                            className="bg-gray-50 border-gray-200"
                        />
                    </div>
                </Card>

                {/* Location Section */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <MapPin className="w-5 h-5 text-[#039E2F]" />
                        <h2 className="text-lg font-bold text-gray-900">Location</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Address</label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                rows={2}
                                required
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                                style={{ '--tw-ring-color': '#039E2F' }}
                                placeholder="123 Street, Area"
                            />
                        </div>

                        <InputField
                            label="City"
                            value={formData.city}
                            onChange={(e) => handleChange('city', e.target.value)}
                            placeholder="e.g., Mumbai"
                            required
                            className="bg-gray-50 border-gray-200"
                        />

                        <InputField
                            label="State"
                            value={formData.state}
                            onChange={(e) => handleChange('state', e.target.value)}
                            placeholder="e.g., Maharashtra"
                            required
                            className="bg-gray-50 border-gray-200"
                        />

                        <InputField
                            label="Country"
                            value={formData.country}
                            onChange={(e) => handleChange('country', e.target.value)}
                            placeholder="e.g., India"
                            required
                            className="bg-gray-50 border-gray-200"
                        />

                        <InputField
                            label="Zip Code"
                            value={formData.zipCode}
                            onChange={(e) => handleChange('zipCode', e.target.value)}
                            placeholder="e.g., 400001"
                            required
                            className="bg-gray-50 border-gray-200"
                        />
                    </div>
                </Card>

                {/* Contact Section */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <Phone className="w-5 h-5 text-[#039E2F]" />
                        <h2 className="text-lg font-bold text-gray-900">Contact & Web</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InputField
                            label="Phone Number"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="e.g., 9876543210"
                            required
                            error={errors.phone}
                            className="bg-gray-50 border-gray-200"
                        />

                        <InputField
                            label="Email Address"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="e.g., contact@hotel.com"
                            required
                            className="bg-gray-50 border-gray-200"
                        />

                        <InputField
                            label="Website"
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleChange('website', e.target.value)}
                            placeholder="e.g., https://hotel.com"
                            className="bg-gray-50 border-gray-200"
                        />
                    </div>
                </Card>

                {/* Additional Info Section */}
                <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                        <Info className="w-5 h-5 text-[#039E2F]" />
                        <h2 className="text-lg font-bold text-gray-900">Additional Information</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none"
                                style={{ '--tw-ring-color': '#039E2F' }}
                                placeholder="Tell something about the hotel..."
                            />
                        </div>

                        <InputField
                            label="Google Review Link"
                            type="url"
                            value={formData.googleReviewLink}
                            onChange={(e) => handleChange('googleReviewLink', e.target.value)}
                            placeholder="https://g.page/r/your-id/review"
                            className="bg-gray-50 border-gray-200"
                        />
                    </div>
                </Card>

                {/* Bottom Actions */}
                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                            clearFormData('createHotel');
                            navigate('/hotel-management');
                        }}
                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={loading}
                        className="bg-[#039E2F] hover:bg-[#027a24] text-white flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Create Hotel
                    </Button>
                </div>
            </form>
        </div>
    );
}
