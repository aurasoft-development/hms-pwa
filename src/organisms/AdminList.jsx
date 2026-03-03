import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi/authApi';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { Modal } from '../atoms/Modal';
import { ConfirmationDialog } from '../molecules/ConfirmationDialog';
import { Edit, Trash2, Plus, User, Eye, Building, Mail, Phone, Shield, Info, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { theme } from '../utils/theme';

export const AdminList = () => {
  const { deleteAdmin } = useAppStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewAdminData, setViewAdminData] = useState(null);
  const [hotelMap, setHotelMap] = useState({});

  // Check if current user is super_admin
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
  const canCreateAdmin = isSuperAdmin || user?.role === 'admin';

  // Fetch admins based on user role
  const fetchAdmins = async () => {
    try {
      setLoading(true);

      // Fetch hotels first to create a mapping
      try {
        const hotelResponse = await hotelManagementApi.getAllHotels();
        const hotels = hotelResponse.data || hotelResponse.hotels || (Array.isArray(hotelResponse) ? hotelResponse : []);
        const mapping = {};
        hotels.forEach(h => {
          mapping[h._id || h.id] = h.name;
        });
        setHotelMap(mapping);
      } catch (err) {
        console.error('Failed to fetch hotels for mapping:', err);
      }

      let data;
      if (isSuperAdmin) {
        // Super admin can see all admins
        data = await authApi.getAllUsers();
      } else {
        // Regular admin sees sub-admins
        data = await authApi.getAllSubAdmins();
      }
      setAdmins(data?.data || data || []);
    } catch (error) {
      toast.error('Failed to fetch admins');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [user]);

  const handleCreate = () => {
    navigate('/admins/new');
  };

  const handleEdit = (admin) => {
    navigate(`/admins/edit/${admin.id || admin._id}`, { state: { admin } });
  };

  const handleView = (admin) => {
    setViewAdminData(admin);
    setIsViewModalOpen(true);
  };

  // const handleDelete = (admin) => {
  //   setSelectedAdmin(admin);
  //   setIsDeleteDialogOpen(true);
  // };

  const confirmDelete = async () => {
    if (!selectedAdmin) return;

    try {
      await deleteAdmin(selectedAdmin.id || selectedAdmin._id);
      toast.success('Admin deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error(error);
      toast.error(error || 'Failed to delete admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#039E2F] mx-auto mb-4" />
          <p className="text-gray-600">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isSuperAdmin ? 'All Admins' : 'Sub Admins'}
        </h2>
        {canCreateAdmin && (
          <Button onClick={handleCreate} className="bg-[#039E2F] hover:bg-[#027a24] text-white">
            <Plus className="w-4 h-4 mr-2" />
            {isSuperAdmin ? 'Add Admin' : 'Add Sub Admin'}
          </Button>
        )}
      </div>

      {admins.length === 0 ? (
        <Card className="p-8 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Admins Found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first admin user</p>
          {canCreateAdmin && (
            <Button onClick={handleCreate} className="bg-[#039E2F] hover:bg-[#027a24] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Admin
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {admins.map((admin) => (
            <Card key={admin.id || admin._id} hover className="flex flex-col h-full border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex-1 p-2">
                {/* Header with Role in top-right */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0">
                      <User className="w-6 h-6 text-[#039E2F]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{admin.name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                        <p className="truncate">{admin.email}</p>
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-[#039E2F]/10 text-[#039E2F] uppercase tracking-wider border border-[#039E2F]/20">
                    {admin.role ? admin.role.replace('_', ' ') : 'Admin'}
                  </span>
                </div>

                <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 mb-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    {admin.role?.toLowerCase().includes('super') ? (
                      <Globe className="w-3 h-3 text-blue-500" />
                    ) : (
                      <Building className="w-3 h-3" />
                    )}
                    {admin.role?.toLowerCase().includes('super') ? 'Access Level' : 'Assigned Hotel'}
                  </p>
                  {admin.role?.toLowerCase().includes('super') ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
                      <p className="text-sm font-semibold text-blue-600">
                        System Wide Access
                      </p>
                    </div>
                  ) : admin.hotel || admin.hotelId ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                      <p className="text-sm font-semibold text-gray-700 truncate">
                        {admin.hotel?.name || hotelMap[admin.hotel] || hotelMap[admin.hotelId] || 'Assigned'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No hotel assigned</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(admin)}
                  className="flex-1 min-w-[70px] border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  View
                </Button>
                {canCreateAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(admin)}
                    className="flex-1 min-w-[70px] border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 mr-1.5" />
                    Edit
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* View Admin Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewAdminData(null);
        }}
        title="Admin Details"
        size="md"
      >
        {viewAdminData && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                <User className="w-8 h-8 text-[#039E2F]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewAdminData.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-[#039E2F]/10 text-[#039E2F] uppercase border border-[#039E2F]/20">
                    {viewAdminData.role?.replace('_', ' ') || 'Admin'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-blue-50 rounded-lg text-blue-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-semibold text-gray-700">{viewAdminData.email}</p>
                  </div>
                </div>

                {viewAdminData.phone && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-1 bg-green-50 rounded-lg text-green-600">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</p>
                      <p className="text-sm font-semibold text-gray-700">{viewAdminData.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1 bg-purple-50 rounded-lg text-purple-600">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Permissions Level</p>
                    <p className="text-sm font-semibold text-gray-700 capitalize">
                      {viewAdminData.role?.includes('super') ? 'Full System Access' : 'Hotel Specific Managed Access'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className={`rounded-2xl p-4 border ${viewAdminData.role?.toLowerCase().includes('super') ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      {viewAdminData.role?.toLowerCase().includes('super') ? (
                        <Globe className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <Building className="w-3.5 h-3.5" />
                      )}
                      {viewAdminData.role?.toLowerCase().includes('super') ? 'System Access' : 'Assigned Hotel Property'}
                    </p>
                    {viewAdminData.role?.toLowerCase().includes('super') ? (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Globe className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-blue-700 uppercase tracking-tight">Full System Privileges</p>
                          <p className="text-xs text-blue-500 mt-0.5 font-medium italic">Can manage all hotels and platform settings</p>
                        </div>
                      </div>
                    ) : viewAdminData.hotel || viewAdminData.hotelId ? (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Building className="w-5 h-5 text-[#039E2F]" />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-gray-900">
                            {viewAdminData.hotel?.name || hotelMap[viewAdminData.hotel] || hotelMap[viewAdminData.hotelId] || 'Assigned'}
                          </p>
                          {viewAdminData.hotel?.city && (
                            <p className="text-xs text-gray-500 mt-0.5">{viewAdminData.hotel.city}, {viewAdminData.hotel.state}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400 italic text-sm py-2">
                        <Info className="w-4 h-4" />
                        No hotel assigned to this administrator
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button onClick={() => setIsViewModalOpen(false)}>Close Details</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedAdmin(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Admin"
        message={`Are you sure you want to delete "${selectedAdmin?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};
