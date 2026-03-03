import { format } from 'date-fns';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { useAuthStore } from '../store/authStore';
import { Calendar, User, Phone, MapPin, Eye, Tag, Users, Edit, Trash2 } from 'lucide-react';
import { theme } from '../utils/theme';

export const EventCard = ({ event, onView, onEdit, onDelete }) => {
    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'planned':
                return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
            case 'confirmed':
                return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' };
            case 'cancelled':
                return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' };
            default:
                return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500' };
        }
    };

    const statusStyle = getStatusStyle(event.status);

    return (
        <Card hover className="overflow-hidden relative border-t-4" style={{ borderTopColor: statusStyle.dot === 'bg-blue-500' ? '#3B82F6' : statusStyle.dot === 'bg-green-500' ? '#10B981' : '#F59E0B' }}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{event.name}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                            <Tag className="w-3 h-3" />
                            <span className="truncate">{event.type}</span>
                        </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                        {event.status}
                    </span>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 gap-3 border-y py-3 border-gray-100">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Organizer</p>
                            <p className="text-sm font-medium text-gray-800 truncate">{event.organizerName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold">Event Dates</p>
                            <p className="text-xs font-medium text-gray-800">
                                {format(new Date(event.startDate), 'MMM dd, HH:mm')} - {format(new Date(event.endDate), 'MMM dd, HH:mm')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 pt-1">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-semibold">Advance Paid</p>
                        <p className="text-sm font-bold text-burgundy" style={{ color: '#800020' }}>₹{event.advancePaid?.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onView} className="flex-1 flex items-center justify-center gap-2">
                            <Eye className="w-4 h-4" />
                            View
                        </Button>
                        <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50">
                            <Edit className="w-4 h-4" />
                            Edit
                        </Button>
                        {onDelete && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(event);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 border-red-200 text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};
