import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Bed, Edit, Wifi, Tv, Wind, Refrigerator, Eye, Trash2 } from 'lucide-react';

const STATUS_COLORS = {
  available: 'bg-green-100 text-green-800 border-green-300',
  occupied: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  maintenance: 'bg-gray-100 text-gray-800 border-gray-300',
  reserved: 'bg-blue-100 text-blue-800 border-blue-300',
};

const STATUS_LABELS = {
  available: 'Available',
  occupied: 'Occupied',
  maintenance: 'Maintenance',
  reserved: 'Reserved',
};

const AMENITY_ICONS = {
  AC: Wind,
  TV: Tv,
  WiFi: Wifi,
  'Mini Fridge': Refrigerator,
};

export function RoomCard({ room, onEdit, onView, onDelete, onStatusUpdate }) {
  const statusColor = STATUS_COLORS[room.status] || STATUS_COLORS.vacant;
  const statusLabel = STATUS_LABELS[room.status] || 'Unknown';

  return (
    <Card className="p-5 hover:shadow-xl transition-all duration-200 border-slate-200 flex flex-col h-full">
      <div className="flex flex-col flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bed className="w-5 h-5 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Room {room.number || room.roomNumber}</h3>
            </div>
            <p className="text-sm text-gray-600">Floor {room.floor}</p>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <select
              value={room.status}
              onChange={(e) => onStatusUpdate && onStatusUpdate(room, e.target.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor} text-center appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500`}
              style={{
                backgroundImage: 'none', // Remove default arrow for cleaner look
                textAlignLast: 'center'
              }}
              disabled={!onStatusUpdate}
            >
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key} className="bg-white text-gray-900">
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Type:</span>
            <span className="text-sm font-semibold text-gray-900">{room.type}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Price:</span>
            <span className="text-sm font-semibold text-gray-900">₹{(room.price || room.pricePerNight || 0).toLocaleString()}/night</span>
          </div>
        </div>

        {/* Amenities */}
        {room.amenities && room.amenities.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Amenities:</p>
            <div className="flex flex-wrap gap-2">
              {room.amenities.map((amenity, index) => {
                const Icon = AMENITY_ICONS[amenity] || Bed;
                return (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                  >
                    <Icon className="w-3 h-3" />
                    {amenity}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
        {onView && (
          <Button
            variant="outline"
            onClick={() => onView(room)}
            className="flex-1"
            size="sm"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
        )}
        {onEdit && (
          <Button
            variant="outline"
            onClick={() => onEdit(room)}
            className="flex-1"
            size="sm"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="danger"
            onClick={() => onDelete(room)}
            className="flex-1"
            size="sm"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        )}
      </div>
    </Card>
  );
}

