import { useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { StatCard } from '../molecules/StatCard';
import { Card } from '../atoms/Card';
import { Spinner } from '../atoms/Spinner';
import { Calendar, Users, TrendingUp, Building2, CreditCard, MapPin, Mail, Phone, User } from 'lucide-react';
import { RupeeIcon } from '../atoms/RupeeIcon';
import { theme } from '../utils/theme';

export const DashboardStats = ({ superAdminStats, loading }) => {
  const { bookings, rooms } = useAppStore();

  // Default admin dashboard stats (existing logic) - MUST be called before any conditional returns
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
    const activeBookings = bookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'checked-in'
    ).length;
    const occupancyRate = rooms.length > 0
      ? ((activeBookings / rooms.length) * 100).toFixed(1)
      : 0;

    return {
      totalBookings,
      totalRevenue,
      activeBookings,
      occupancyRate,
    };
  }, [bookings, rooms]);

  // If superAdminStats is provided, show super admin dashboard
  if (superAdminStats !== null && superAdminStats !== undefined) {
    return (
      <div className="space-y-6">
        {/* Super Admin Stats Cards */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Total Hotels"
                value={superAdminStats.totalHotels || 0}
                icon={Building2}
                subtitle="Registered hotels"
                gradient={true}
              />
              <StatCard
                title="Total Revenue"
                value={`₹${(superAdminStats.totalRevenue || 0).toFixed(2)}`}
                icon={RupeeIcon}
                subtitle="All time revenue"
                gradient={true}
              />
              <StatCard
                title="Active Subscriptions"
                value={superAdminStats.activeSubscriptions || 0}
                icon={CreditCard}
                subtitle="Active subscriptions"
                gradient={true}
              />
            </div>

            {/* Hotels List */}
            {superAdminStats.hotels && superAdminStats.hotels.length > 0 && (
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-6 h-6" style={{ color: theme.colors.primary.main }} />
                      Hotels Overview
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {superAdminStats.hotels.length} hotel{superAdminStats.hotels.length !== 1 ? 's' : ''} registered
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {superAdminStats.hotels.map((item, index) => {
                    const hotel = item.hotel || item;
                    const admin = item.admin || {};
                    return (
                      <Card key={hotel._id || hotel.id || index} hover className="border-2 hover:border-opacity-50" style={{ borderColor: theme.colors.primary.main, borderOpacity: 0.1 }}>
                        <div className="space-y-4">
                          {/* Hotel Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{hotel.name}</h3>
                              {hotel.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">{hotel.description}</p>
                              )}
                            </div>
                            {hotel.isActive && (
                              <span 
                                className="px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                                style={{ backgroundColor: theme.colors.background.tertiary, color: theme.colors.primary.main }}
                              >
                                Active
                              </span>
                            )}
                          </div>

                          {/* Hotel Details */}
                          <div className="space-y-2 text-sm">
                            {hotel.address && (
                              <div className="flex items-start gap-2 text-gray-600">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: theme.colors.primary.main }} />
                                <span className="line-clamp-2">
                                  {hotel.address}
                                  {hotel.city && `, ${hotel.city}`}
                                  {hotel.state && `, ${hotel.state}`}
                                  {hotel.zipCode && ` ${hotel.zipCode}`}
                                </span>
                              </div>
                            )}
                            {hotel.phone && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone className="w-4 h-4 flex-shrink-0" style={{ color: theme.colors.primary.main }} />
                                <span>{hotel.phone}</span>
                              </div>
                            )}
                            {hotel.email && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="w-4 h-4 flex-shrink-0" style={{ color: theme.colors.primary.main }} />
                                <span className="truncate">{hotel.email}</span>
                              </div>
                            )}
                            {hotel.totalRooms && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: theme.colors.primary.main }} />
                                <span>{hotel.totalRooms} rooms</span>
                              </div>
                            )}
                          </div>

                          {/* Admin Info */}
                          {admin.name && (
                            <div className="pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 flex-shrink-0" style={{ color: theme.colors.primary.main }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</p>
                                  <p className="text-sm font-medium text-gray-900 truncate">{admin.name}</p>
                                  {admin.email && (
                                    <p className="text-xs text-gray-500 truncate">{admin.email}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Bookings"
        value={stats.totalBookings}
        icon={Calendar}
        subtitle="All time"
        gradient={true}
      />
      <StatCard
        title="Total Revenue"
        value={`₹${stats.totalRevenue.toFixed(2)}`}
        icon={RupeeIcon}
        subtitle="All time"
        gradient={true}
      />
      <StatCard
        title="Active Bookings"
        value={stats.activeBookings}
        icon={Users}
        subtitle="Currently active"
        gradient={true}
      />
      <StatCard
        title="Occupancy Rate"
        value={`${stats.occupancyRate}%`}
        icon={TrendingUp}
        subtitle="Current occupancy"
        gradient={true}
      />
    </div>
  );
};

