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
import { Building, Plus, Edit, Trash2, Search, X, Eye, QrCode, Printer, UserPlus, Users } from 'lucide-react';
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

  // Handle QR
  const handleQR = (hotel) => {
    setQrHotelData(hotel);
    setIsQRModalOpen(true);
  };

  const handleAccessHotel = async (hotel) => {
    try {
      setLoading(true);
      const response = await authApi.accessHotelSuperAdminOnly(hotel._id || hotel.id);

      // Destructure based on the API response structure: { access_token, user, hotel }
      const { access_token, user: userData, hotel: hotelData } = response;

      if (access_token) {
        // 1. Store the new access token
        localStorage.setItem('access_token', access_token);

        // 2. Update the auth store with the new user context (role will be 'admin', hotelId will be set)
        login(userData, hotelData);

        toast.success(`Success! You are now accessing ${hotelData?.name || hotel.name}`);

        // 3. Redirect to the hotel dashboard
        navigate('/dashboard');
      } else {
        toast.error('Access token not received');
      }
    } catch (error) {
      toast.error(error || 'Failed to access hotel');
    } finally {
      setLoading(false);
    }
  };

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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{hotel.name}</h3>
                    {hotel.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{hotel.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">📍</span>
                    <span className="text-gray-700">
                      {[hotel.address, hotel.city, hotel.state, hotel.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                  {hotel.zipCode && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">📮</span>
                      <span className="text-gray-700">{hotel.zipCode}</span>
                    </div>
                  )}
                  {hotel.phone && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">📞</span>
                      <span className="text-gray-700">{hotel.phone}</span>
                    </div>
                  )}
                  {hotel.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">✉️</span>
                      <span className="text-gray-700">{hotel.email}</span>
                    </div>
                  )}
                  {hotel.website && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">🌐</span>
                      <a
                        href={hotel.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {hotel.website}
                      </a>
                    </div>
                  )}
                  {hotel.totalRooms !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">🏨</span>
                      <span className="text-gray-700">{hotel.totalRooms} Rooms</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Manage Access Section - Fixed to bottom */}
              {isSuperAdmin && (
                <div className="pt-4 border-t space-y-3 bg-gray-50/50 -mx-6 px-6 py-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5" />
                    Assign Admin/Sub-Admin
                  </div>
                  <SelectDropdown
                    placeholder="Select User to Assign"
                    options={users.map(u => ({
                      value: u._id || u.id,
                      label: `${u.name || 'No Name'} (${u.email}) • [${u.role?.toUpperCase() || 'USER'}]`
                    }))}
                    value={assignmentState[hotel._id]?.userId || ''}
                    onChange={(e) => setAssignmentState(prev => ({
                      ...prev,
                      [hotel._id]: { ...prev[hotel._id], userId: e.target.value, role: 'admin' }
                    }))}
                    className="text-sm"
                  />
                  <Button
                    className="w-full"
                    size="sm"
                    loading={assigningLoading === hotel._id}
                    onClick={() => handleAssignUser(hotel._id)}
                  >
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Assign as Hotel Admin
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(hotel)}
                  className="flex-1 min-w-[80px]"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQR(hotel)}
                  className="flex-1 min-w-[80px]"
                >
                  <QrCode className="w-4 h-4 mr-1" />
                  QR Code
                </Button>
                {isSuperAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAccessHotel(hotel)}
                      className="flex-1 min-w-[80px] bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    >
                      <Building className="w-4 h-4 mr-1" />
                      Access
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(hotel)}
                      className="flex-1 min-w-[80px]"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(hotel)}
                      className="flex-1 min-w-[80px]"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </>
                )}
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
            {(viewHotelData.createdAt || viewHotelData.updatedAt) && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
    </div >
  );
}
