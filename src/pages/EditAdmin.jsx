import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { authApi } from '../api/authApi/authApi';
import { useAuthStore } from '../store/authStore';
import { useFormStore } from '../store/formStore';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Card } from '../atoms/Card';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditAdmin() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuthStore();
    const { updateAdmin } = useAppStore(); // Using store action as per AdminList logic

    const [loading, setLoading] = useState(false);
    const [hotels, setHotels] = useState([]);
    const [hotelsLoading, setHotelsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Try to get admin data from location state first (if navigated from list)
    // detailed fetch might be needed if deep linking, but for now we rely on list passing or simple init
    const { setFormData: setPersistentData, clearFormData, getFormData } = useFormStore();
    const [isInitialized, setIsInitialized] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'admin',
        password: '',
        hotelId: '',
        phone: '',
    });

    useEffect(() => {
        if (isInitialized && id) {
            setPersistentData(`editAdmin_${id}`, formData);
        }
    }, [formData, id, isInitialized, setPersistentData]);

    // Check if current user is super_admin
    const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
    const canCreateAdmin = isSuperAdmin || user?.role === 'admin';

    // Role options
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

    // Initialize data
    useEffect(() => {
        if (location.state?.admin) {
            const admin = location.state.admin;
            const apiData = {
                name: admin.name || '',
                email: admin.email || '',
                role: admin.role || 'admin',
                hotelId: admin.hotelId || admin.hotel?._id || admin.hotel?.id || '',
                phone: admin.phone || '',
                password: '',
            };

            const savedData = getFormData(`editAdmin_${id}`, null);
            setFormData(savedData || apiData);
            setIsInitialized(true);
        } else {
            // If no state, we might want to fetch or redirect. 
            // Since getAdminById isn't explicitly visible in the snippets, we'll redirect if no state for safety 
            // or just advise user to go back.
            // real implementation would fetch.
            // For this refactor, we assume navigation from list.
            if (!location.state?.admin) {
                toast.error('Admin details not found. Please select from the list.');
                navigate('/admins');
            }
        }
    }, [location.state, navigate, id, getFormData]);

    // Fetch hotels for dropdown
    useEffect(() => {
        const fetchHotels = async () => {
            if (!isSuperAdmin && !canCreateAdmin) return;

            try {
                setHotelsLoading(true);
                const response = await hotelManagementApi.getAllHotels();
                const hotelsData = response.data || response.hotels || response || [];
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
        if (!formData.name || !formData.email) {
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

        setLoading(true);
        try {
            const adminData = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                phone: formData.phone,
                hotelId: formData.hotelId,
            };

            // Only add password if it's not empty
            if (formData.password) {
                adminData.password = formData.password;
            }

            await authApi.userProfileUpdate(id, adminData);
            toast.success('Admin updated successfully');
            clearFormData(`editAdmin_${id}`);
            navigate('/admins');
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Failed to update admin');
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
                        onClick={() => {
                            clearFormData(`editAdmin_${id}`);
                            navigate('/admins');
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </Button>
                    <div>
                        <p className="text-sm text-gray-500">Admin Management</p>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Edit Admin
                        </h1>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => {
                            clearFormData(`editAdmin_${id}`);
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
                        Save Changes
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
                                disabled={hotelsLoading} // Often read-only or careful when editing, but allowed in modal logic? Modal didn't explicitly forbid, so keeping enabled.
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

                        {/* Password */}
                        <InputField
                            label="Password (Leave blank to keep current)"
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            placeholder="••••••••"
                            className="bg-gray-50 border-gray-200"
                        />
                    </div>
                </Card>
            </div>
        </div>
    );
}
