import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';
import { InputField } from '../atoms/InputField';
import { ConfirmationDialog } from '../molecules/ConfirmationDialog';
import { Edit, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export const RoomList = () => {
  const { rooms, addRoom, updateRoom, deleteRoom } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    price: '',
    facilities: '',
  });

  const handleOpenModal = (room = null) => {
    if (room) {
      setSelectedRoom(room);
      setFormData({
        type: room.type,
        price: room.price.toString(),
        facilities: room.facilities.join(', '),
      });
    } else {
      setSelectedRoom(null);
      setFormData({ type: '', price: '', facilities: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
    setFormData({ type: '', price: '', facilities: '' });
  };

  const handleSubmit = () => {
    const roomData = {
      type: formData.type,
      price: parseFloat(formData.price),
      facilities: formData.facilities.split(',').map((f) => f.trim()).filter(Boolean),
    };

    if (selectedRoom) {
      updateRoom(selectedRoom.id, roomData);
      toast.success('Room updated successfully');
    } else {
      addRoom(roomData);
      toast.success('Room added successfully');
    }
    handleCloseModal();
  };

  const handleDelete = (room) => {
    setSelectedRoom(room);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteRoom(selectedRoom.id);
    toast.success('Room deleted successfully');
    setIsDeleteDialogOpen(false);
    setSelectedRoom(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Rooms</h2>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card key={room.id} hover>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{room.type}</h3>
                <p className="text-2xl font-bold text-burgundy mt-1">${room.price}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                room.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {room.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Facilities:</p>
              <div className="flex flex-wrap gap-2">
                {room.facilities.map((facility, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenModal(room)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(room)}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedRoom ? 'Edit Room' : 'Add New Room'}
        size="md"
      >
        <div className="space-y-4">
          <InputField
            label="Room Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="e.g., Deluxe, Standard, Suite"
            required
          />
          <InputField
            label="Price per Night"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00"
            required
          />
          <InputField
            label="Facilities (comma-separated)"
            value={formData.facilities}
            onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
            placeholder="e.g., WiFi, TV, AC, Mini Bar"
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {selectedRoom ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedRoom(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone."
      />
    </div>
  );
};

