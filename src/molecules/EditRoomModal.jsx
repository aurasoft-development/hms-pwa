import { useState, useEffect } from 'react';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Card } from '../atoms/Card';
import { Wifi, Tv, Wind, Refrigerator, Bed } from 'lucide-react';
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
  { id: 'vacant', name: 'Vacant' },
  { id: 'occupied', name: 'Occupied' },
  { id: 'dirty', name: 'Dirty' },
  { id: 'out_of_service', name: 'Out of Service' },
];

export function EditRoomModal({ isOpen, onClose, room, onUpdate }) {
  const [formData, setFormData] = useState({
    type: '',
    floor: '',
    price: '',
    status: '',
    amenities: [],
    description: '',
    maxOccupancy: '',
  });
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room) {
      setFormData({
        type: room.type || room.roomType || '',
        floor: room.floor || 1,
        price: room.price || room.pricePerNight || '',
        status: room.status || 'vacant',
        amenities: room.amenities || [],
        description: room.description || '',
        maxOccupancy: room.maxOccupancy || 2,
      });
      setMaintenanceMode(room.status === 'out_of_service' || room.status === 'maintenance');
    }
  }, [room]);

  useEffect(() => {
    if (maintenanceMode) {
      setFormData((prev) => ({ ...prev, status: 'out_of_service' }));
    }
  }, [maintenanceMode]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'status' && value !== 'out_of_service') {
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
    
    if (!formData.type || !formData.price) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const updatedRoom = {
        ...room,
        type: formData.type,
        roomType: formData.type,
        floor: parseInt(formData.floor) || 1,
        price: parseFloat(formData.price),
        pricePerNight: parseFloat(formData.price),
        status: formData.status,
        amenities: formData.amenities,
        description: formData.description,
        maxOccupancy: parseInt(formData.maxOccupancy) || 2,
      };

      onUpdate(room.id, updatedRoom);
      // Don't show success here as handleUpdate in parent will show it
    } catch (error) {
      toast.error('Failed to update room');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!room) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Room" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Room Number (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Room Number
          </label>
          <input
            type="text"
            value={room.number || room.roomNumber}
            disabled
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Room number cannot be changed</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Room Type */}
          <SelectDropdown
            label="Room Type"
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            options={ROOM_TYPES}
            placeholder="Select room type"
            required
          />

          {/* Floor */}
          <InputField
            label="Floor"
            type="number"
            value={formData.floor}
            onChange={(e) => handleChange('floor', e.target.value)}
            placeholder="Enter floor number"
            min="1"
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
          />

          {/* Price */}
          <InputField
            label="Price per Night (₹)"
            type="number"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            placeholder="Enter price"
            required
            min="0"
            step="100"
          />
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Spacious room with city view"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            style={{
              '--tw-ring-color': theme.colors.primary.main,
            }}
          />
        </div>

        {/* Status */}
        <SelectDropdown
          label="Room Status"
          value={formData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          options={ROOM_STATUSES}
          placeholder="Select status"
          required
          disabled={maintenanceMode}
        />

        {/* Maintenance Toggle */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maintenance Mode
              </label>
              <p className="text-xs text-gray-500">
                Enable to set room status to "Out of Service"
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => {
                  setMaintenanceMode(e.target.checked);
                  if (e.target.checked) {
                    handleChange('status', 'out_of_service');
                  }
                }}
                className="sr-only peer"
              />
              <div 
                className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${maintenanceMode ? '' : 'bg-gray-200'}`}
                style={{ 
                  backgroundColor: maintenanceMode ? theme.colors.primary.main : undefined,
                  '--tw-ring-color': theme.colors.primary.main,
                }}
              />
            </label>
          </div>
        </Card>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Amenities
          </label>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_AMENITIES.map((amenity) => {
              const Icon = amenity.icon;
              const isSelected = formData.amenities.includes(amenity.id);
              return (
                <label
                  key={amenity.id}
                  className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                    isSelected
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
                    onChange={() => handleAmenityToggle(amenity.id)}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2"
                    style={{ 
                      accentColor: theme.colors.primary.main,
                      '--tw-ring-color': theme.colors.primary.main,
                    }}
                  />
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    {amenity.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

