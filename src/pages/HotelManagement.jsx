import { useState, useEffect } from 'react';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { authApi } from '../api/authApi/authApi';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Modal } from '../atoms/Modal';
import { ConfirmationDialog } from '../molecules/ConfirmationDialog';
import toast from 'react-hot-toast';
import { Building, Plus, Edit, Trash2, Search, X, Eye, QrCode, Printer, UserPlus, Users, CreditCard, CalendarClock, Zap, Sparkles } from 'lucide-react';
import { theme } from '../utils/theme';
import { QRCodeSVG } from 'qrcode.react';

export default function HotelManagement() {
  const navigate = useNavigate();
  const { user, login } = useAuthStore();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewHotelData, setViewHotelData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrHotelData, setQrHotelData] = useState(null);
  const [users, setUsers] = useState([]);
  const [assignmentState, setAssignmentState] = useState({});
  const [assigningLoading, setAssigningLoading] = useState(null);

  // Trial & Subscription State
  const [isActivateTrialModalOpen, setIsActivateTrialModalOpen] = useState(false);
  const [trialHotel, setTrialHotel] = useState(null);
  const [activateTrialData, setActivateTrialData] = useState({ organization: '', email: '', phone: '', force: false });
  const [isExtendTrialModalOpen, setIsExtendTrialModalOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(7);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Check if user is Super Admin
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fetch hotels
  const fetchHotels = async (page = 1) => {
    setLoading(true);
    try {
      const response = await hotelManagementApi.getAllHotelsWithPagination(page, pagination.limit);
      setHotels(response.data || response.hotels || []);
      setPagination({
        page: response.page || page,
        limit: response.limit || pagination.limit,
        total: response.total || 0,
        totalPages: response.totalPages || Math.ceil((response.total || 0) / pagination.limit),
      });
    } catch (error) {
      toast.error(error || 'Failed to fetch hotels');
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await authApi.getAllUsers();
      console.log('User Fetch Response:', response); // Debug log
      // Handle various response formats
      const userData = response.data || response.users || (Array.isArray(response) ? response : []);
      console.log('Processed Users:', userData); // Debug log
      setUsers(userData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    fetchHotels(1);
    fetchUsers();
  }, []);


  // Open modal for create
  const handleCreate = () => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can create hotels');
      return;
    }
    navigate('/hotel-management/new');
  };

  // Open modal for edit
  const handleEdit = async (hotel) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can edit hotels');
      return;
    }
    navigate(`/hotel-management/edit/${hotel._id || hotel.id}`);
  };

  const handleView = async (hotel) => {
    setViewLoading(true);
    setIsViewModalOpen(true);
    try {
      const response = await hotelManagementApi.getHotelById(hotel._id || hotel.id);
      const hotelData = response.data || response;
      setViewHotelData(hotelData);
    } catch (error) {
      toast.error(error || 'Failed to fetch hotel details');
      setIsViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // Trial Handlers
  const handleOpenActivateTrial = (hotel) => {
    setTrialHotel(hotel);
    setActivateTrialData({
      organization: hotel.name || '',
      email: hotel.email || '',
      phone: hotel.phone || '',
      force: false
    });
    setIsActivateTrialModalOpen(true);
  };

  const submitActivateTrial = async () => {
    if (!trialHotel) return;
    setActionLoading(true);
    try {
      await hotelManagementApi.activateTrial(trialHotel._id || trialHotel.id, activateTrialData);
      toast.success('Trial activated successfully');
      setIsActivateTrialModalOpen(false);
      fetchHotels(pagination.page);
    } catch (error) {
      toast.error(error?.response?.data?.message || error || 'Failed to activate trial');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenExtendTrial = (hotel) => {
    setTrialHotel(hotel);
    setExtendDays(7);
    setIsExtendTrialModalOpen(true);
  };

  const submitExtendTrial = async () => {
    if (!trialHotel) return;
    setActionLoading(true);
    try {
      await hotelManagementApi.extendTrial(trialHotel._id || trialHotel.id, { days: Number(extendDays) });
      toast.success('Trial extended successfully');
      setIsExtendTrialModalOpen(false);
      fetchHotels(pagination.page);
    } catch (error) {
      toast.error(error?.response?.data?.message || error || 'Failed to extend trial');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenUpgradePlan = (hotel) => {
    setTrialHotel(hotel);
    setIsUpgradeModalOpen(true);
  };

  const submitUpgradePlan = async () => {
    if (!trialHotel) return;
    setActionLoading(true);
    try {
      const response = await hotelManagementApi.upgradeTrial(trialHotel._id || trialHotel.id);
      toast.success(response?.message || 'Plan upgraded successfully');
      setIsUpgradeModalOpen(false);
      fetchHotels(pagination.page);
    } catch (error) {
      toast.error(error?.response?.data?.message || error || 'Failed to upgrade plan');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle QR
  const handleQR = (hotel) => {
    setQrHotelData(hotel);
    setIsQRModalOpen(true);
  };

  // const handleAccessHotel = async (hotel) => {
  //   try {
  //     setLoading(true);
  //     const response = await authApi.accessHotelSuperAdminOnly(hotel._id || hotel.id);

  //     // Destructure based on the API response structure: { access_token, user, hotel }
  //     const { access_token, user: userData, hotel: hotelData } = response;

  //     if (access_token) {
  //       // 1. Store the new access token
  //       localStorage.setItem('access_token', access_token);

  //       // 2. Update the auth store with the new user context (role will be 'admin', hotelId will be set)
  //       login(userData, hotelData);

  //       toast.success(`Success! You are now accessing ${hotelData?.name || hotel.name}`);

  //       // 3. Redirect to the hotel dashboard
  //       navigate('/dashboard');
  //     } else {
  //       toast.error('Access token not received');
  //     }
  //   } catch (error) {
  //     toast.error(error || 'Failed to access hotel');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handlePrintQR = () => {
    if (!qrHotelData) return;

    const printWindow = window.open('', '_blank');
    const svgElement = document.getElementById(`hotel-qr-${qrHotelData._id || qrHotelData.id}`);
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const qrDataUrl = canvas.toDataURL('image/png');

      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${qrHotelData.name}</title>
            <style>
              body { 
                font-family: 'Inter', sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                min-height: 100vh;
                margin: 0;
                color: #2D2D2D;
              }
              .container {
                text-align: center;
                padding: 40px;
                border: 2px solid #E5E7EB;
                border-radius: 24px;
                max-width: 500px;
              }
              h1 { color: #1A1A40; margin-bottom: 8px; font-size: 32px; }
              p { color: #6B7280; margin-bottom: 32px; font-size: 18px; }
              .qr-container {
                background: white;
                padding: 24px;
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                display: inline-block;
                margin-bottom: 32px;
              }
              .footer {
                margin-top: 32px;
                font-size: 14px;
                color: #9CA3AF;
              }
              @media print {
                .no-print { display: none; }
                body { min-height: auto; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${qrHotelData.name}</h1>
              <p>Scan to leave a review</p>
              <div class="qr-container">
                <img src="${qrDataUrl}" width="300" height="300" />
              </div>
              <div class="footer">
                Thank you for your visit!
              </div>
            </div>
            <script>
              window.onload = () => {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Handle delete
  const handleDelete = (hotel) => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete hotels');
      return;
    }
    setSelectedHotel(hotel);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedHotel) return;

    if (!isSuperAdmin) {
      toast.error('Only Super Admin can delete hotels');
      setIsDeleteDialogOpen(false);
      setSelectedHotel(null);
      return;
    }

    setLoading(true);
    try {
      await hotelManagementApi.deleteHotel(selectedHotel._id || selectedHotel.id);
      toast.success('Hotel deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedHotel(null);
      fetchHotels(pagination.page);
    } catch (error) {
      toast.error(error || 'Failed to delete hotel');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (hotelId) => {
    const state = assignmentState[hotelId];
    if (!state?.userId) {
      toast.error('Please select a user');
      return;
    }

    setAssigningLoading(hotelId);
    try {
      const selectedUser = users.find(u => u._id === state.userId || u.id === state.userId);
      await authApi.userProfileUpdate(state.userId, {
        hotelId: hotelId,
        role: 'admin', // Default role if dropdown is removed
        name: selectedUser?.name,
        email: selectedUser?.email,
      });
      toast.success('User assigned as Admin successfully');
      // Reset assignment state for this hotel
      setAssignmentState(prev => ({
        ...prev,
        [hotelId]: { userId: '', role: 'admin' }
      }));
    } catch (error) {
      toast.error(error?.message || 'Failed to assign user');
    } finally {
      setAssigningLoading(null);
    }
  };

  // Filter hotels by search query
  const filteredHotels = hotels.filter((hotel) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();

    // Search in name
    if (hotel.name?.toLowerCase().includes(query)) return true;

    // Search in city
    if (hotel.city?.toLowerCase().includes(query)) return true;

    // Search in email
    if (hotel.email?.toLowerCase().includes(query)) return true;

    // Search in address
    if (hotel.address?.toLowerCase().includes(query)) return true;

    // Search in zipCode
    if (hotel.zipCode?.toLowerCase().includes(query)) return true;

    // Search in totalRooms (convert to string for search)
    if (hotel.totalRooms?.toString().includes(query)) return true;

    return false;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
            background: theme.colors.gradients.primary
          }}>
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hotel Management</h1>
            <p className="text-gray-600 mt-1">Manage hotels and their details</p>
          </div>
        </div>
        {isSuperAdmin && (
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Hotel
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search hotels by name, city, email, address, zip code, or total rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            style={{
              '--tw-ring-color': theme.colors.primary.main,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </Card>

      {/* Hotels List */}
      {loading && hotels.length === 0 ? (
        <Card className="py-16">
          <div className="text-center text-gray-500">Loading hotels...</div>
        </Card>
      ) : filteredHotels.length === 0 ? (
        <Card className="py-16">
          <div className="flex flex-col items-center justify-center">
            <Building className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No hotels found' : 'No hotels yet'}
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-4">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by creating your first hotel'}
            </p>
            {!searchQuery && isSuperAdmin && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Hotel
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHotels.map((hotel) => (
            <Card key={hotel._id || hotel.id} hover className="flex flex-col h-full">
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold text-gray-900 mb-0.5">{hotel.name}</h3>
                      {hotel.accessStatus && (
                        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${
                          hotel.accessStatus === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' :
                          hotel.accessStatus === 'trial' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          hotel.accessStatus === 'grace' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                          'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {hotel.accessStatus}
                        </span>
                      )}
                    </div>
                    {hotel.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-1.5">{hotel.description}</p>
                    )}
                    {(hotel.trialStartedAt || hotel.trialEndsAt || hotel.graceEndsAt || hotel.paidActivatedAt) && (
                      <div className="flex flex-col gap-1 mt-1.5">
                        {(hotel.trialStartedAt || hotel.trialEndsAt) && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50/50 border border-blue-100 rounded-md w-fit">
                            <CalendarClock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="text-[11px] font-medium text-blue-800">
                              {hotel.trialStartedAt && (
                                <span className={hotel.trialEndsAt ? "border-r border-blue-200 pr-1.5 mr-1.5" : ""}>
                                  Trial Start: <b>{new Date(hotel.trialStartedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</b>
                                </span>
                              )}
                              {hotel.trialEndsAt && (
                                <span>End: <b>{new Date(hotel.trialEndsAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</b></span>
                              )}
                            </span>
                            {hotel.accessStatus === 'trial' && hotel.trialEndsAt && (
                              <span className={`text-[10px] whitespace-nowrap font-bold px-1.5 py-0.5 rounded ml-1 ${
                                new Date(hotel.trialEndsAt) > new Date() 
                                  ? 'text-blue-700 bg-blue-200/60' 
                                  : 'text-red-700 bg-red-100'
                              }`}>
                                {new Date(hotel.trialEndsAt) > new Date() 
                                  ? `${Math.ceil((new Date(hotel.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))} Days Left`
                                  : 'Expired'}
                              </span>
                            )}
                          </div>
                        )}
                        {hotel.graceEndsAt && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-orange-50/50 border border-orange-100 rounded-md w-fit">
                            <CalendarClock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                            <span className="text-[11px] font-medium text-orange-800">
                              Grace Ends: <b>{new Date(hotel.graceEndsAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</b>
                            </span>
                            {hotel.accessStatus === 'grace' && (
                              <span className={`text-[10px] whitespace-nowrap font-bold px-1.5 py-0.5 rounded ml-1 ${
                                new Date(hotel.graceEndsAt) > new Date() 
                                  ? 'text-orange-700 bg-orange-200/60' 
                                  : 'text-red-700 bg-red-100'
                              }`}>
                                {new Date(hotel.graceEndsAt) > new Date() 
                                  ? `${Math.ceil((new Date(hotel.graceEndsAt) - new Date()) / (1000 * 60 * 60 * 24))} Days Left`
                                  : 'Grace Expired'}
                              </span>
                            )}
                          </div>
                        )}
                        {hotel.paidActivatedAt && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50/50 border border-green-100 rounded-md w-fit mt-0.5">
                            <Zap className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            <span className="text-[11px] font-medium text-green-800">
                              Paid Since: <b>{new Date(hotel.paidActivatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</b>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-sm">
                  <div className="flex items-start gap-1.5 col-span-2">
                    <span className="text-gray-400 mt-0.5 text-xs">📍</span>
                    <span className="text-gray-700 leading-tight text-xs">
                      {[hotel.address, hotel.city, hotel.state, hotel.country].filter(Boolean).join(', ')}
                      {hotel.zipCode && ` - ${hotel.zipCode}`}
                    </span>
                  </div>
                  {hotel.phone && (
                    <div className="flex items-center gap-1.5 break-all">
                      <span className="text-gray-400 text-xs">📞</span>
                      <span className="text-gray-700 text-xs">{hotel.phone}</span>
                    </div>
                  )}
                  {hotel.email && (
                    <div className="flex items-center gap-1.5 break-all">
                      <span className="text-gray-400 text-xs">✉️</span>
                      <span className="text-gray-700 text-xs line-clamp-1" title={hotel.email}>{hotel.email}</span>
                    </div>
                  )}
                  {hotel.website && (
                    <div className="flex items-center gap-1.5 col-span-2 break-all">
                      <span className="text-gray-400 text-xs">🌐</span>
                      <a href={hotel.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs line-clamp-1">
                        {hotel.website}
                      </a>
                    </div>
                  )}
                  {hotel.totalRooms !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 text-xs">🏨</span>
                      <span className="text-gray-700 text-xs">{hotel.totalRooms} Rooms</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Sections */}
              <div className="mt-4 flex flex-col -mx-6 -mb-6">

                {/* Assign Admin (Compact) */}
                {isSuperAdmin && (
                  <div className="bg-gray-50 border-t border-gray-100 px-6 py-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      <Users className="w-3 h-3" /> Assign Admin
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <SelectDropdown
                          placeholder="Select User"
                          options={users.map(u => ({
                            value: u._id || u.id,
                            label: `${u.name || 'User'} (${u.email})`
                          }))}
                          value={assignmentState[hotel._id]?.userId || ''}
                          onChange={(e) => setAssignmentState(prev => ({
                            ...prev,
                            [hotel._id]: { ...prev[hotel._id], userId: e.target.value, role: 'admin' }
                          }))}
                          className="text-xs min-h-[32px] py-1"
                        />
                      </div>
                      <Button
                        className=""
                        size="sm"
                        style={{ height: '38px' }}
                        loading={assigningLoading === hotel._id}
                        onClick={() => handleAssignUser(hotel._id)}
                      >
                        <UserPlus className="w-3.5 h-3.5  text-black" /> Assign
                      </Button>
                    </div>
                  </div>
                )}

                {/* Subscription Actions */}
                {isSuperAdmin && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-purple-100 px-6 py-2.5 flex items-center justify-between">
                    <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Subscription
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenActivateTrial(hotel)}
                        className="px-2 py-1.5 text-green-700 hover:bg-green-200/50 bg-green-100/50 border border-green-300 rounded-md transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        title="Activate Trial"
                      >
                        <Zap className="w-3 h-3" /> Trial
                      </button>
                      <button
                        onClick={() => handleOpenExtendTrial(hotel)}
                        className="px-2 py-1.5 text-blue-700 hover:bg-blue-200/50 bg-blue-100/50 border border-blue-300 rounded-md transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        title="Extend Trial"
                      >
                        <CalendarClock className="w-3 h-3" /> Extend
                      </button>
                      <button
                        onClick={() => handleOpenUpgradePlan(hotel)}
                        
                        className="px-2 py-1.5 text-purple-700 hover:bg-purple-200/50 bg-purple-100/50 border border-purple-300 rounded-md transition-colors flex items-center gap-1 text-[11px] font-semibold"
                        title="Upgrade Plan"
                      >
                        <CreditCard className="w-3 h-3" /> Upgrade
                      </button>
                    </div>
                  </div>
                )}

                {/* Standard Actions */}
                <div className="border-t border-gray-100 px-6 py-3 flex gap-2 bg-white rounded-b-2xl">
                  <Button variant="outline" size="sm" onClick={() => handleView(hotel)} className="flex-1 text-xs py-1.5 h-auto">
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleQR(hotel)} className="flex-1 text-xs py-1.5 h-auto">
                    <QrCode className="w-3.5 h-3.5 mr-1" /> QR
                  </Button>
                  {isSuperAdmin && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(hotel)} className="flex-1 text-xs py-1.5 h-auto">
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(hotel)} className="px-3 h-auto py-1.5 min-w-0" title="Delete Hotel">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} hotels
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchHotels(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchHotels(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}


      {/* View Hotel Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewHotelData(null);
        }}
        title="Hotel Details"
        size="xl"
      >
        {viewLoading ? (
          <div className="py-16 text-center text-gray-500">Loading hotel details...</div>
        ) : viewHotelData ? (
          <div className="space-y-6">
            {/* Hotel Header */}
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{viewHotelData.name}</h2>
              {viewHotelData.description && (
                <p className="text-gray-600">{viewHotelData.description}</p>
              )}
            </div>

            {/* Hotel Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location</h3>
                <div className="space-y-3">
                  {viewHotelData.address && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="text-gray-900 mt-1">{viewHotelData.address}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {viewHotelData.city && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">City</label>
                        <p className="text-gray-900 mt-1">{viewHotelData.city}</p>
                      </div>
                    )}
                    {viewHotelData.state && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">State</label>
                        <p className="text-gray-900 mt-1">{viewHotelData.state}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {viewHotelData.country && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Country</label>
                        <p className="text-gray-900 mt-1">{viewHotelData.country}</p>
                      </div>
                    )}
                    {viewHotelData.zipCode && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Zip Code</label>
                        <p className="text-gray-900 mt-1">{viewHotelData.zipCode}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact</h3>
                <div className="space-y-3">
                  {viewHotelData.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900 mt-1">{viewHotelData.phone}</p>
                    </div>
                  )}
                  {viewHotelData.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900 mt-1">
                        <a
                          href={`mailto:${viewHotelData.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {viewHotelData.email}
                        </a>
                      </p>
                    </div>
                  )}
                  {viewHotelData.website && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Website</label>
                      <p className="text-gray-900 mt-1">
                        <a
                          href={viewHotelData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {viewHotelData.website}
                        </a>
                      </p>
                    </div>
                  )}
                  {viewHotelData.totalRooms !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Rooms</label>
                      <p className="text-gray-900 mt-1">{viewHotelData.totalRooms} Rooms</p>
                    </div>
                  )}
                  {viewHotelData.googleReviewLink && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Google Review Link</label>
                      <p className="text-gray-900 mt-1">
                        <a
                          href={viewHotelData.googleReviewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {viewHotelData.googleReviewLink}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {(viewHotelData.createdAt || viewHotelData.updatedAt || viewHotelData.trialEndsAt || viewHotelData.accessStatus) && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Subscription & Additional Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {viewHotelData.accessStatus && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Access Status</label>
                      <p className="text-gray-900 mt-1 capitalize font-medium">
                        {viewHotelData.accessStatus}
                      </p>
                    </div>
                  )}
                  {viewHotelData.trialEndsAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Trial Ends At</label>
                      <p className="text-gray-900 mt-1">
                        {new Date(viewHotelData.trialEndsAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {viewHotelData.graceEndsAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Grace Ends At</label>
                      <p className="text-gray-900 mt-1">
                        {new Date(viewHotelData.graceEndsAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {viewHotelData.createdAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created At</label>
                      <p className="text-gray-900 mt-1">
                        {new Date(viewHotelData.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {viewHotelData.updatedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="text-gray-900 mt-1">
                        {new Date(viewHotelData.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewHotelData(null);
                }}
              >
                Close
              </Button>
              {isSuperAdmin && (
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEdit({ _id: viewHotelData._id || viewHotelData.id });
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Hotel
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">No hotel data found</div>
        )}
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setQrHotelData(null);
        }}
        title="Hotel QR Code"
        size="md"
      >
        {qrHotelData && (
          <div className="flex flex-col items-center gap-4 py-2 transform scale-[0.85] origin-top">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <QRCodeSVG
                id={`hotel-qr-${qrHotelData._id || qrHotelData.id}`}
                value={`${window.location.origin}/#/review?hotelId=${qrHotelData._id || qrHotelData.id}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900">{qrHotelData.name}</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Guests can scan this QR code to be redirected to your hotel's review and rating page.
              </p>
            </div>

            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const url = `${window.location.origin}/#/review?hotelId=${qrHotelData._id || qrHotelData.id}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Review URL copied to clipboard');
                }}
              >
                Copy Link
              </Button>
              <Button
                className="flex-1"
                onClick={handlePrintQR}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print QR Code
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedHotel(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Hotel"
        message={`Are you sure you want to delete "${selectedHotel?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Activate Trial Modal */}
      <Modal
        isOpen={isActivateTrialModalOpen}
        onClose={() => {
          setIsActivateTrialModalOpen(false);
          setTrialHotel(null);
        }}
        title={`Activate Trial for ${trialHotel?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <InputField
            label="Organization Name"
            value={activateTrialData.organization}
            onChange={(e) => setActivateTrialData({ ...activateTrialData, organization: e.target.value })}
            placeholder="Enter organization name"
          />
          <InputField
            label="Email Address"
            type="email"
            value={activateTrialData.email}
            onChange={(e) => setActivateTrialData({ ...activateTrialData, email: e.target.value })}
            placeholder="Enter email address"
          />
          <InputField
            label="Phone Number"
            value={activateTrialData.phone}
            onChange={(e) => setActivateTrialData({ ...activateTrialData, phone: e.target.value })}
            placeholder="Enter phone number"
          />
          <label className="flex items-center gap-2 mt-4 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              checked={activateTrialData.force}
              onChange={(e) => setActivateTrialData({ ...activateTrialData, force: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {`Force activation (Overrides existing plan)`}
          </label>
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsActivateTrialModalOpen(false);
                setTrialHotel(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={submitActivateTrial} loading={actionLoading}>
              Activate Trial
            </Button>
          </div>
        </div>
      </Modal>

      {/* Extend Trial Modal */}
      <Modal
        isOpen={isExtendTrialModalOpen}
        onClose={() => {
          setIsExtendTrialModalOpen(false);
          setTrialHotel(null);
        }}
        title={`Extend Trial for ${trialHotel?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Enter the number of days to extend the existing trial.
          </p>
          <InputField
            label="Extension Days"
            type="number"
            min="1"
            value={extendDays}
            onChange={(e) => setExtendDays(e.target.value)}
            placeholder="Number of days"
          />
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsExtendTrialModalOpen(false);
                setTrialHotel(null);
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={submitExtendTrial} loading={actionLoading}>
              Extend Trial
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upgrade Plan Confirmation */}
      <ConfirmationDialog
        isOpen={isUpgradeModalOpen}
        onClose={() => {
          setIsUpgradeModalOpen(false);
          setTrialHotel(null);
        }}
        onConfirm={submitUpgradePlan}
        title="Upgrade to Paid Plan"
        message={`Are you sure you want to upgrade "${trialHotel?.name}" to a paid plan? This will transition the hotel from trial status to paid status.`}
        confirmText={actionLoading ? "Upgrading..." : "Upgrade Plan"}
        cancelText="Cancel"
      />
    </div >
  );
}
