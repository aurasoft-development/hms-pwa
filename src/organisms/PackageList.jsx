import { useState, useEffect, useCallback } from 'react';
import { packagesApi } from '../api/packagesApi/packagesApi';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { useAuthStore } from '../store/authStore';
import { useFormStore } from '../store/formStore';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';
import { InputField } from '../atoms/InputField';
import { ConfirmationDialog } from '../molecules/ConfirmationDialog';
import { Edit, Trash2, Plus, Package, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { theme } from '../utils/theme';

const AVAILABLE_MEALS = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Tea',
  'Coffee',
];

export const PackageList = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hotelId, setHotelId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const { setFormData: setPersistentData, clearFormData, getFormData } = useFormStore();
  const initialFormData = {
    name: '',
    price: '',
    description: '',
    meals: [],
  };

  const [formData, setFormData] = useState(() => {
    return getFormData(`newFoodPackage`, initialFormData);
  });

  useEffect(() => {
    // Only persist if it's a "New" package (selectedItem is null)
    if (!selectedItem && isModalOpen) {
      setPersistentData(`newFoodPackage`, formData);
    } else if (selectedItem && isModalOpen) {
      setPersistentData(`editFoodPackage_${selectedItem._id || selectedItem.id}`, formData);
    }
  }, [formData, selectedItem, isModalOpen, setPersistentData]);

  // Check if user is SuperAdmin
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';

  // Get hotelId on component mount (only for non-SuperAdmin users)
  useEffect(() => {
    if (isSuperAdmin) {
      // SuperAdmin doesn't need hotelId
      return;
    }

    const fetchHotelId = async () => {
      try {
        const response = await hotelManagementApi.getMyHotel();
        const hotel = response.data || response;
        if (hotel?._id || hotel?.id) {
          setHotelId(hotel._id || hotel.id);
        }
      } catch (error) {
        console.error('Failed to fetch hotel:', error);
        toast.error('Failed to load hotel information');
      }
    };
    fetchHotelId();
  }, [isSuperAdmin]);

  // Fetch packages
  const fetchPackages = useCallback(async (page = 1) => {
    // For SuperAdmin, don't require hotelId
    if (!isSuperAdmin && !hotelId) return;

    setLoading(true);
    try {
      let response;

      if (isSuperAdmin) {
        // Use API without hotelId for SuperAdmin
        response = await packagesApi.getAllPackagesWithOutHotelId(
          page,
          pagination.limit,
          undefined // isActive filter
        );
      } else {
        // Use API with hotelId for regular admin
        response = await packagesApi.getAllPackagesWithPagination(
          hotelId,
          page,
          pagination.limit,
          undefined // isActive filter
        );
      }

      const packagesData = response.packages || response.data || response || [];
      // Filter by type if needed (room packages vs food packages)
      // For now, we'll show all packages and let the type prop determine the view
      setItems(Array.isArray(packagesData) ? packagesData : []);
      setPagination({
        page: response.page || page,
        limit: response.limit || pagination.limit,
        total: response.total || packagesData.length,
        totalPages: response.totalPages || Math.ceil((response.total || packagesData.length) / pagination.limit),
      });
    } catch (error) {
      toast.error(error || 'Failed to fetch packages');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId, pagination.limit, isSuperAdmin]);

  useEffect(() => {
    // For SuperAdmin, fetch immediately; for others, wait for hotelId
    if (isSuperAdmin || hotelId) {
      fetchPackages(1);
    }
  }, [hotelId, fetchPackages, isSuperAdmin]);

  const handleOpenModal = async (item = null) => {
    if (item) {
      setSelectedItem(item);
      const editKey = `editFoodPackage_${item._id || item.id}`;
      const savedEditData = getFormData(editKey, null);

      if (savedEditData) {
        setFormData(savedEditData);
      } else if (!isSuperAdmin && hotelId) {
        try {
          const response = await packagesApi.getPackageById(hotelId, item._id || item.id);
          const packageData = response.data || response;
          setFormData({
            name: packageData.name || '',
            price: packageData.price?.toString() || '',
            description: packageData.description || '',
            meals: packageData.meals || [],
          });
        } catch (error) {
          console.error('Failed to fetch package details:', error);
          // Fallback to item data
          setFormData({
            name: item.name || '',
            price: item.price?.toString() || '',
            description: item.description || '',
            meals: item.meals || [],
          });
        }
      } else {
        // For SuperAdmin or when hotelId is not available, use item data directly
        setFormData({
          name: item.name || '',
          price: item.price?.toString() || '',
          description: item.description || '',
          meals: item.meals || [],
        });
      }
    } else {
      setSelectedItem(null);
      const savedNewData = getFormData(`newFoodPackage`, initialFormData);
      setFormData(savedNewData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Don't clear store here, as we want it to persist even if they close and re-open (per user request: "until cancel or submit")
    // Wait, typically "Close" or "Cancel" button on a modal is "Cancel".
    // I specify it in the button click handler.
    setSelectedItem(null);
    setFormData(initialFormData);
  };

  const handleView = async (item) => {
    // For SuperAdmin, we can view without hotelId; for others, hotelId is required
    if (!isSuperAdmin && !hotelId) return;

    setViewLoading(true);
    setIsViewModalOpen(true);
    try {
      // For SuperAdmin, we might not have hotelId, so use item data directly
      if (isSuperAdmin) {
        setSelectedItem(item);
      } else {
        const response = await packagesApi.getPackageById(hotelId, item._id || item.id);
        const packageData = response.data || response;
        setSelectedItem(packageData);
      }
    } catch (error) {
      toast.error(error || 'Failed to fetch package details');
      setIsViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleSubmit = async () => {
    // For non-SuperAdmin, hotelId is required
    if (!isSuperAdmin && !hotelId) {
      toast.error('Hotel ID is required');
      return;
    }

    if (!formData.name || !formData.price) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price) || 0,
        description: formData.description,
        meals: formData.meals
      };

      if (selectedItem) {
        // Update - SuperAdmin might need different handling
        if (isSuperAdmin && selectedItem.hotelId) {
          await packagesApi.updatePackage(
            selectedItem.hotelId,
            selectedItem._id || selectedItem.id,
            payload
          );
        } else if (!isSuperAdmin && hotelId) {
          await packagesApi.updatePackage(
            hotelId,
            selectedItem._id || selectedItem.id,
            payload
          );
        } else {
          toast.error('Unable to update package. Missing hotel information.');
          return;
        }
        toast.success(`Food Package updated successfully`);
      } else {
        if (isSuperAdmin) {
          toast.error('SuperAdmin cannot create packages without hotel context');
          return;
        }
        await packagesApi.createPackage(hotelId, payload);
        toast.success(`Food Package created successfully`);
      }

      handleCloseModal();
      fetchPackages(pagination.page);
    } catch (error) {
      toast.error(error || `Failed to ${selectedItem ? 'update' : 'create'} ${type === 'package' ? 'package' : 'food package'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    // For SuperAdmin, use hotelId from the item; for others, use current hotelId
    const targetHotelId = isSuperAdmin ? (selectedItem.hotelId || selectedItem.hotel?._id || selectedItem.hotel?.id) : hotelId;

    if (!targetHotelId) {
      toast.error('Unable to delete package. Missing hotel information.');
      return;
    }

    setLoading(true);
    try {
      await packagesApi.deletePackage(targetHotelId, selectedItem._id || selectedItem.id);
      toast.success(`Food Package deleted successfully`);
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
      fetchPackages(pagination.page);
    } catch (error) {
      toast.error(error || 'Failed to delete package');
    } finally {
      setLoading(false);
    }
  };

  const handleMealToggle = (meal) => {
    setFormData((prev) => {
      const meals = prev.meals.includes(meal)
        ? prev.meals.filter((m) => m !== meal)
        : [...prev.meals, meal];
      return { ...prev, meals };
    });
  };

  // Only show "No Hotel Found" for non-SuperAdmin users
  if (!isSuperAdmin && !hotelId && !loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Card className="p-8 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Hotel Found</h3>
          <p className="text-gray-500">Please ensure you have a hotel assigned to your account.</p>
        </Card>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-burgundy mx-auto mb-4"
            style={{ borderBottomColor: theme.colors.primary.main }}
          />
          <p className="text-gray-600">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Food Packages
        </h2>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Food Package
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Packages Found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first food package</p>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Food Package
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <Card key={item._id || item.id} hover className="flex flex-col h-full">
                <div className="flex items-start gap-3  flex-1">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.background.tertiary }}>
                    <Package className="w-5 h-5" style={{ color: theme.colors.primary.main }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-2xl font-bold mt-1" style={{ color: theme.colors.primary.main }}>₹{item.price?.toLocaleString() || item.price}</p>
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    )}
                    {item.meals && item.meals.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Meals:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.meals.map((meal, index) => (
                            <span
                              key={index}
                              className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {meal}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.isActive !== undefined && (
                      <span className={`inline-block px-2 py-1 text-xs rounded mt-2 ${item.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(item)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenModal(item)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(item)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Card className="mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} packages
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPackages(pagination.page - 1)}
                    disabled={pagination.page === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPackages(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedItem ? `Edit Food Package` : `Add New Food Package`}
        size="md"
      >
        <div className="space-y-4">
          <InputField
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Full Board, Half Board"
            required
            disabled={loading}
          />
          <InputField
            label="Price (₹)"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00"
            required
            disabled={loading}
            min="0"
            step="0.01"
          />
          <InputField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="e.g., Includes breakfast, lunch, and dinner"
            disabled={loading}
          />

          {/* Meals selection */}
          <div className="mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Meals
              </label>
              <div className="grid grid-cols-2 gap-3">
                {AVAILABLE_MEALS.map((meal) => {
                  const isSelected = formData.meals.includes(meal);
                  return (
                    <label
                      key={meal}
                      className={`flex items-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${isSelected
                        ? ''
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      style={{
                        borderColor: isSelected ? theme.colors.primary.main : undefined,
                        backgroundColor: isSelected ? `${theme.colors.primary.main}10` : undefined,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleMealToggle(meal)}
                        className="w-4 h-4 border-gray-300 rounded focus:ring-2"
                        style={{
                          accentColor: theme.colors.primary.main,
                          '--tw-ring-color': theme.colors.primary.main,
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {meal}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => {
              if (selectedItem) {
                clearFormData(`editFoodPackage_${selectedItem._id || selectedItem.id}`);
              } else {
                clearFormData(`newFoodPackage`);
              }
              handleCloseModal();
            }} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {selectedItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedItem(null);
        }}
        title="Package Details"
        size="md"
      >
        {viewLoading ? (
          <div className="py-16 text-center text-gray-500">Loading package details...</div>
        ) : selectedItem ? (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedItem.name}</h2>
              {selectedItem.description && (
                <p className="text-gray-600">{selectedItem.description}</p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Price</label>
                <p className="text-gray-900 mt-1 text-xl font-bold">₹{selectedItem.price?.toLocaleString() || selectedItem.price || 0}</p>
              </div>

              {selectedItem.meals && selectedItem.meals.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Meals</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.meals.map((meal, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                      >
                        {meal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.isActive !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900 mt-1">
                    <span className={`px-2 py-1 rounded text-sm ${selectedItem.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      {selectedItem.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              )}

              {selectedItem.createdAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(selectedItem.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedItem(null);
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenModal(selectedItem);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Package
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-500">No package data available</div>
        )}
      </Modal>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={confirmDelete}
        title={`Delete Food Package`}
        message={`Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};
