import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi/authApi';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { ConfirmationDialog } from '../molecules/ConfirmationDialog';
import { Edit, Trash2, Plus, User } from 'lucide-react';
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

  // Check if current user is super_admin
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
  const canCreateAdmin = isSuperAdmin || user?.role === 'admin';

  // Fetch admins based on user role
  const fetchAdmins = async () => {
    try {
      setLoading(true);
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
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <User className="w-6 h-6 text-[#039E2F]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{admin.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{admin.email}</p>
                      {admin.hotel && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                          {admin.hotel.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#039E2F]/10 text-[#039E2F] capitalize border border-[#039E2F]/20">
                    {admin.role ? admin.role.replace('_', ' ') : 'Admin'}
                  </span>
                </div>
              </div>
              {canCreateAdmin && (
                <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(admin)}
                    className="flex-1 border-gray-200 hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  {/* <Button

                    size="sm"
                    onClick={() => handleDelete(admin)}
                    className="flex-1 bg-white text-red-600 border border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button> */}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

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
