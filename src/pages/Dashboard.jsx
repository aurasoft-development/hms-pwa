import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { superAdminDashboardApi } from '../api/dashboardApi/superAdminDashboardApi';
import { hasViewPermissions, hasCreatePermissions } from '../utils/permissions';
import { DashboardStats } from '../organisms/DashboardStats';
import { BookingCard } from '../molecules/BookingCard';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { StatCard } from '../molecules/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, Users, TrendingUp, ArrowRight, Clock, Sparkles, Building2, Sun, Moon, Coffee } from 'lucide-react';
import { RupeeIcon } from '../atoms/RupeeIcon';
import { safeDate } from '../utils/dateUtils';
import { format } from 'date-fns';
import { theme } from '../utils/theme';

export default function Dashboard() {
  const navigate = useNavigate();
  const { bookings, initializeData } = useAppStore();
  const { user } = useAuthStore();
  const [hotelName, setHotelName] = useState('');
  const [superAdminStats, setSuperAdminStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Fetch super admin dashboard stats
  useEffect(() => {
    const fetchSuperAdminStats = async () => {
      const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
      if (!isSuperAdmin) return;

      if (!hasViewPermissions(user?.role, 'dashboard')) return;

      setLoadingStats(true);
      try {
        const response = await superAdminDashboardApi.getSuperAdminDashboardStats();
        // Handle both response.data and direct response
        const stats = response.data || response;
        setSuperAdminStats(stats);
      } catch (error) {
        console.error('Failed to fetch super admin dashboard stats:', error);
        // Don't show error toast, just silently fail
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      fetchSuperAdminStats();
    }
  }, [user]);

  // Fetch hotel name for admin/subadmin users
  useEffect(() => {
    const fetchHotelName = async () => {
      // Only fetch for admin/subadmin, not for super_admin
      const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
      if (isSuperAdmin) return;

      try {
        const response = await hotelManagementApi.getMyHotel();
        const hotel = response.data || response;
        if (hotel?.name) {
          setHotelName(hotel.name);
        }
      } catch (error) {
        console.error('Failed to fetch hotel:', error);
        // Don't show error toast, just silently fail
      }
    };

    if (user) {
      fetchHotelName();
    }
  }, [user]);

  // Admin-specific stats (for Admin role)
  const adminStats = useMemo(() => {
    const activeBookings = bookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'checked-in'
    );

    const todayRevenue = bookings
      .filter((b) => {
        if (!b.createdAt) return false;
        const bookingDate = safeDate(b.createdAt);
        if (!bookingDate) return false;
        const today = new Date().toDateString();
        return bookingDate.toDateString() === today;
      })
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const thisMonthRevenue = bookings
      .filter((b) => {
        if (!b.createdAt) return false;
        const bookingDate = safeDate(b.createdAt);
        if (!bookingDate) return false;
        const now = new Date();
        return bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Get recent bookings (last 5, sorted by date)
    const recentBookings = [...bookings]
      .sort((a, b) => {
        const dateA = safeDate(a.createdAt) || new Date(0);
        const dateB = safeDate(b.createdAt) || new Date(0);
        return dateB - dateA;
      })
      .slice(0, 5);

    return {
      totalBookings: bookings.length,
      activeBookings: activeBookings.length,
      todayRevenue,
      totalRevenue,
      thisMonthRevenue,
      recentBookings,
    };
  }, [bookings]);

  // SuperAdmin chart data
  const chartData = useMemo(() => {
    return bookings.slice(0, 10).map((booking) => ({
      name: booking.guestName,
      amount: booking.totalAmount,
    }));
  }, [bookings]);

  const recentBookings = useMemo(() => {
    return bookings.slice(-5).reverse();
  }, [bookings]);

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
  const showSuperAdminFeatures = isSuperAdmin && hasViewPermissions(user?.role, 'dashboard');

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: Sun };
    if (hour < 17) return { text: 'Good Afternoon', icon: Coffee };
    return { text: 'Good Evening', icon: Moon };
  };

  const greeting = getTimeBasedGreeting();
  const GreetingIcon = greeting.icon;
  const userName = user?.name || '';

  return (
    <div className="space-y-8">
      {/* Modern Welcome Section */}
      <Card className="overflow-hidden border-0 shadow-xl">
        <div
          className="relative p-5 sm:p-6"
          style={{
            background: 'linear-gradient(135deg, #039E2F 0%, #027a24 50%, #039E2F 100%)',
            backgroundSize: '200% 200%',
          }}
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
            <Sparkles className="w-full h-full" style={{ color: '#FFFFFF' }} />
          </div>
          <div className="absolute bottom-0 left-0 w-32 h-32 opacity-10">
            <Building2 className="w-full h-full" style={{ color: '#FFFFFF' }} />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="p-2 rounded-xl shadow-lg"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <GreetingIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white/90 text-xs font-semibold uppercase tracking-wider">
                    {greeting.text}
                  </p>
                  {userName && (
                    <p className="text-white text-base font-medium mt-0.5">
                      {userName}
                    </p>
                  )}
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {isSuperAdmin
                  ? "Welcome Back!"
                  : hotelName
                    ? `Welcome to ${hotelName}`
                    : "Welcome Back!"
                }
              </h1>

              <p className="text-white/90 text-sm sm:text-base font-medium max-w-2xl">
                {isSuperAdmin
                  ? "Here's what's happening across all your hotels today."
                  : `Here's your overview for ${format(new Date(), 'EEEE, MMMM d, yyyy')}`
                }
              </p>
            </div>

            {/* Icon Badge */}
            <div
              className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl flex-shrink-0"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      {showSuperAdminFeatures ? (
        // SuperAdmin Dashboard Stats
        <DashboardStats superAdminStats={superAdminStats} loading={loadingStats} />
      ) : (
        // Admin Dashboard Stats
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Bookings"
            value={adminStats.totalBookings}
            icon={Calendar}
            subtitle="All time"
            gradient={true}
          />
          <StatCard
            title="Active Bookings"
            value={adminStats.activeBookings}
            icon={Users}
            subtitle="Currently active"
            gradient={true}
          />
          <StatCard
            title="Today's Revenue"
            value={`₹${adminStats.todayRevenue.toFixed(2)}`}
            icon={RupeeIcon}
            subtitle="Today"
            gradient={true}
          />
          <StatCard
            title="This Month"
            value={`₹${adminStats.thisMonthRevenue.toFixed(2)}`}
            icon={TrendingUp}
            subtitle="Monthly revenue"
            gradient={true}
          />
        </div>
      )}

      {/* SuperAdmin: Charts and Recent Bookings Grid */}
      {showSuperAdminFeatures ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
              <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#F5E6D3', color: '#800020' }}>
                {recentBookings.length} New
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} showActions={false} />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5E6D3' }}>
                    <Calendar className="w-8 h-8" style={{ color: '#800020' }} />
                  </div>
                  <p className="text-gray-500">No bookings yet</p>
                </div>
              )}
            </div>
          </Card> */}

          {/* <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Revenue Chart</h2>
              <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#F5E6D3', color: '#800020' }}>
                Analytics
              </div>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    stroke="#E5E7EB"
                  />
                  <YAxis 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    stroke="#E5E7EB"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    radius={[8, 8, 0, 0]}
                    style={{ fill: '#800020' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F5E6D3' }}>
                  <Calendar className="w-8 h-8" style={{ color: '#800020' }} />
                </div>
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </Card> */}
        </div>
      ) : (
        // Admin: Recent Bookings Section
        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-6 h-6" style={{ color: '#039E2F' }} />
                Recent Bookings
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Latest {adminStats.recentBookings.length} booking{adminStats.recentBookings.length !== 1 ? 's' : ''}
              </p>
            </div>
            {adminStats.recentBookings.length > 0 && (
              <Button
                variant="outline"
                onClick={() => navigate('/bookings')}
                className="flex items-center gap-2"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {adminStats.recentBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminStats.recentBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onView={hasViewPermissions(user?.role, 'receipts') ? (booking) => navigate(`/receipt/${booking.id}`) : null}
                  showActions={false}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.background.tertiary} 0%, rgba(0,168,232,0.1) 100%)`
                }}
              >
                <Calendar className="w-10 h-10" style={{ color: '#039E2F' }} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-500 text-center max-w-md mb-4">
                Get started by creating your first booking. Click the "New Booking" button above to begin.
              </p>
              {hasCreatePermissions(user?.role, 'bookings') && (
                <Button onClick={() => navigate('/new-booking')}>
                  Create First Booking
                </Button>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

