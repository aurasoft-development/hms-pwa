import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi/authApi';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { useAuthStore } from '../store/authStore';
import { useFormStore } from '../store/formStore';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Card } from '../atoms/Card';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CreateAdmin() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [hotels, setHotels] = useState([]);
    const [hotelsLoading, setHotelsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Check if current user is super_admin
    const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
    const canCreateAdmin = isSuperAdmin || user?.role === 'admin';

    const { setFormData: setPersistentData, clearFormData, getFormData } = useFormStore();
    const initialFormData = {
        name: '',
        email: '',
        password: '',
        role: 'admin',
        hotelId: '',
        phone: '',
    };

    const [formData, setFormData] = useState(() => getFormData('createAdmin', initialFormData));

    useEffect(() => {
        setPersistentData('createAdmin', formData);
    }, [formData, setPersistentData]);

    // Role options based on user role
    const getRoleOptions = () => {
        if (isSuperAdmin) {
            return [
                { id: 'admin', name: 'Admin' },
                { id: 'sub_admin', name: 'Sub Admin' },
            ];
        } else if (user?.role === 'admin') {
            return [
                { id: 'sub_admin', name: 'Sub Admin' },
            ];
        }
        return [
            { id: 'sub_admin', name: 'Sub Admin' },
        ];
    };

    // Fetch hotels for dropdown
    useEffect(() => {
        const fetchHotels = async () => {
            if (!isSuperAdmin && !canCreateAdmin) return;

            try {
                setHotelsLoading(true);
                const response = await hotelManagementApi.getAllHotels();
                const hotelsData = response.data || response.hotels || response || [];
                // Transform hotels to dropdown format
                const hotelOptions = Array.isArray(hotelsData)
                    ? hotelsData.map(hotel => ({
                        id: hotel._id || hotel.id,
                        name: hotel.name || 'Unnamed Hotel'
                    }))
                    : [];
                setHotels(hotelOptions);
            } catch (error) {
                console.error('Failed to fetch hotels:', error);
                toast.error('Failed to load hotels');
            } finally {
                setHotelsLoading(false);
            }
        };

        fetchHotels();
    }, [isSuperAdmin, canCreateAdmin]);

    const handleChange = (field, value) => {
        // Validate phone
        if (field === 'phone') {
            const digitsOnly = value.replace(/\D/g, '');
            if (value && digitsOnly.length < 10) {
                setErrors(prev => ({ ...prev, phone: 'Phone number must have at least 10 digits' }));
            } else if (value && digitsOnly.length > 10) {
                setErrors(prev => ({ ...prev, phone: 'Phone number cannot be more than 10 digits' }));
            } else {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.phone;
                    return newErrors;
                });
            }
        }
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.password) {
            toast.error('Please fill all required fields');
            return;
        }

        // Validate phone number (exactly 10 digits)
        const phoneDigits = formData.phone?.replace(/\D/g, '');
        if (formData.phone && phoneDigits.length !== 10) {
            const errorMsg = phoneDigits.length < 10
                ? 'Phone number must have at least 10 digits'
                : 'Phone number cannot be more than 10 digits';
            toast.error(errorMsg);
            setErrors(prev => ({ ...prev, phone: errorMsg }));
            return;
        }

        // For super_admin and admin, hotelId is required when creating
        if (canCreateAdmin && !formData.hotelId) {
            toast.error('Please select a hotel');
            return;
        }

        setLoading(true);
        try {
            const registerData = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                password: formData.password,
                phone: formData.phone,
                ...(formData.hotelId && { hotelId: formData.hotelId }),
            };

            await authApi.register(registerData);
            toast.success('Admin created successfully');
            clearFormData('createAdmin');
            navigate('/admins');
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Failed to create admin');
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
                        onClick={() => navigate('/admins')}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </Button>
                    <div>
                        <p className="text-sm text-gray-500">Admin Management</p>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isSuperAdmin ? 'Add New Admin' : 'Add New Sub Admin'}
                        </h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            clearFormData('createAdmin');
                            navigate('/admins');
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
                        Create Admin
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Admin Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <InputField
                            label="Full Name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="John Doe"
                            required
                            className="bg-gray-50 border-gray-200"
                        />

                        {/* Email */}
                        <InputField
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="admin@hotel.com"
                            required
                            className="bg-gray-50 border-gray-200"
                        />

                        {/* Password */}
                        <InputField
                            label="Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            required
                            placeholder="Enter password"
                            className="bg-gray-50 border-gray-200"
                        />

                        {/* Role */}
                        <SelectDropdown
                            label="Role"
                            value={formData.role}
                            onChange={(e) => handleChange('role', e.target.value)}
                            options={getRoleOptions()}
                            required
                            className="bg-gray-50 border-gray-200"
                        />

                        {/* Hotel Selection */}
                        {canCreateAdmin && (
                            <SelectDropdown
                                label="Hotel"
                                value={formData.hotelId}
                                onChange={(e) => handleChange('hotelId', e.target.value)}
                                options={[
                                    { id: '', name: 'Select a hotel' },
                                    ...hotels.map(hotel => ({ id: hotel.id, name: hotel.name }))
                                ]}
                                required
                                disabled={hotelsLoading}
                                placeholder={hotelsLoading ? 'Loading hotels...' : 'Select a hotel'}
                                className="bg-gray-50 border-gray-200"
                            />
                        )}

                        {/* WhatsApp Number */}
                        <InputField
                            label="Mobile Number"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="e.g. XXXXXX8787"
                            error={errors.phone}
                            className="bg-gray-50 border-gray-200"
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
}
