import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { hasViewPermissions } from '../utils/permissions';
import { useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Building2,
  Package,
  Calendar,
  Users,
  LogOut,
  Menu,
  Bed,
  Home,
  Building,
  CreditCard,
  QrCode,
  Printer,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { theme } from '../utils/theme';

// All possible menu items - permissions will filter which ones to show
const allMenuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, module: 'dashboard' },
  {
    label: 'Bookings',
    icon: Calendar,
    module: 'bookings',
    subItems: [
      { path: '/bookings', label: 'Room Bookings', module: 'bookings', relatedPaths: ['/new-booking'] },
      { path: '/event-bookings', label: 'Event Bookings', module: 'bookings', relatedPaths: ['/new-event-booking'] },
    ]
  },
  // { path: '/room-board', label: 'Room Board', icon: Bed, module: 'room_board' },
  { path: '/room-management', label: 'Room Management', icon: Home, module: 'rooms' },
  // { path: '/hotel-info', label: 'Hotel Info', icon: Building2, module: 'hotels' },
  { path: '/hotel-management', label: 'Hotel Management', icon: Building, module: 'hotel_management' },
  { path: '/packages', label: 'Food Packages', icon: Package, module: 'packages' },
  { path: '/subscriptions', label: 'Subscriptions', icon: CreditCard, module: 'subscriptions' },
  { path: '/admins', label: 'Admin Management', icon: Users, module: 'admins' },
  { path: '/receipt/:id', label: 'Receipt', icon: Calendar, module: 'receipts', hidden: true }, // Hidden from menu but accessible via route
];






export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hotelData: cachedHotelData, logout } = useAuthStore();
  const { initializeData } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024); // Hidden on mobile by default
  const [openDropdowns, setOpenDropdowns] = useState(['Bookings']); // Default bookings open
  const [hotelName, setHotelName] = useState('');
  const [hotelData, setHotelData] = useState(cachedHotelData || null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  console.log(user, 'user user ');

  // Filter menu items based on permissions
  const menuItems = useMemo(() => {
    if (!user?.role) return [];

    return allMenuItems.filter(item => {
      // Skip hidden items
      if (item.hidden) return false;

      // Check if user has view permission for this module
      return hasViewPermissions(user.role, item.module);
    }).map(item => {
      if (item.subItems) {
        return {
          ...item,
          subItems: item.subItems.filter(sub => hasViewPermissions(user.role, sub.module))
        };
      }
      return item;
    });
  }, [user?.role]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Fetch hotel name for Admin/Sub Admin users
  useEffect(() => {
    const fetchHotelName = async () => {
      // Check if user is Admin or Sub Admin (not Super Admin)
      const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
      if (isSuperAdmin || !user) return;

      // Use cached data if available (e.g., when SuperAdmin accesses a hotel)
      if (cachedHotelData) {
        setHotelData(cachedHotelData);
        if (cachedHotelData.name) {
          setHotelName(cachedHotelData.name);
        }
        return;
      }

      try {
        const response = await hotelManagementApi.getMyHotel();
        const hotel = response.data || response;
        if (hotel) {
          setHotelData(hotel);
          if (hotel.name) {
            setHotelName(hotel.name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch hotel name:', error);
        // Don't show error toast, just silently fail
      }
    };

    if (user) {
      fetchHotelName();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handlePrintQR = () => {
    if (!hotelData) return;

    const svgElement = document.getElementById('header-hotel-qr');
    if (!svgElement) {
      toast.error('QR element not found');
      return;
    }

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

      const qrImage = canvas.toDataURL('image/png');

      // Use a hidden iframe for better mobile print support
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.write(`
        <html>
          <head>
            <title>Print QR Code - ${hotelData.name}</title>
            <style>
              body { 
                font-family: 'Inter', sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0;
                text-align: center;
              }
              .container { 
                padding: 40px; 
                border: 2px solid #EEE; 
                border-radius: 24px;
                max-width: 400px;
              }
              h1 { color: #1A1A40; margin-bottom: 8px; font-size: 28px; }
              p { color: #666; margin-bottom: 32px; font-size: 18px; }
              img { width: 300px; height: 300px; margin-bottom: 24px; }
              .footer { color: #888; font-size: 14px; margin-top: 24px; }
              @media print {
                body { height: auto; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${hotelData.name}</h1>
              <p>Scan to leave a review</p>
              <img src="${qrImage}" />
              <div class="footer">Thank you for visiting us!</div>
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  setTimeout(() => {
                    window.parent.document.body.removeChild(window.frameElement);
                  }, 100);
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';

  // Get panel title based on role
  const panelTitle = user?.role === 'Super Admin' ? 'SuperAdmin Panel' : 'Admin Panel';

  // Get icon for header based on role
  const HeaderIcon = user?.role === 'Super Admin' ? Building2 : LayoutDashboard;

  return (
    <div className="flex flex-col absolute inset-0 h-full w-full overflow-hidden" style={{ backgroundColor: '#ECF3F3' }}>
      {/* Top Header - Full Width */}
      <header className="flex-none h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10" style={{ borderColor: 'rgba(26, 26, 64, 0.1)' }}>
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-[#1A1A40] hover:bg-[#1A1A40]/5 transition-colors lg:hidden"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>



          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(26, 26, 64, 0.1)' }}>
              <HeaderIcon className="w-6 h-6 text-[#1A1A40]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[#1A1A40]">
                {user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin'
                  ? 'Hotel Management'
                  : hotelName || 'Hotel Management'}
              </h1>
              <p className="text-xs text-[#1A1A40]/80 mt-0.5">{panelTitle}</p>
            </div>
          </div>

          {/* Desktop Toggle Sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-2 rounded-xl text-[#1A1A40] hover:bg-[#1A1A40]/5 transition-colors"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>

        </div>

        {/* Right Section: QR Actions + User Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {!isSuperAdmin && hotelData && (
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQRModalOpen(true)}
                className="flex items-center justify-center px-3 py-2 min-w-0"
                style={{ borderColor: '#039E2F', color: '#039E2F' }}
                title="View QR Code"
              >
                <QrCode className="w-4 h-4" />
                <span className="ml-2">View QR</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsQRModalOpen(true);
                  setTimeout(handlePrintQR, 500);
                }}
                className="flex items-center justify-center px-3 py-2 min-w-0"
                title="Print QR Code"
              >
                <Printer className="w-4 h-4" />
                <span className="ml-2">Print QR</span>
              </Button>
            </div>
          )}


          <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#1A1A40]/5 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-[#1A1A40] flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-right hidden sm:block min-w-0">
              <p className="text-sm font-semibold text-[#1A1A40] truncate max-w-[120px]">{user?.name}</p>
              <p className="text-xs text-[#1A1A40]/80 truncate max-w-[120px]">{user?.role}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content Area (Sidebar + Main) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Backdrop Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-[#1A1A40]/20 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:relative inset-y-0 left-0 transition-all duration-300 flex flex-col border-r h-full bg-[#ECF3F3] z-30
            ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 w-20'}
          `}
          style={{ borderColor: 'rgba(26, 26, 64, 0.1)' }}
        >
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {/* Mobile QR Actions Section */}
            {!isSuperAdmin && hotelData && sidebarOpen && (
              <div className="lg:hidden mb-6 space-y-2 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-2">QR Actions</p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsQRModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2"
                    style={{ borderColor: '#039E2F', color: '#039E2F' }}
                  >
                    <QrCode className="w-4 h-4" />
                    View QR Code
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsQRModalOpen(true);
                      setTimeout(handlePrintQR, 500);
                    }}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print QR Code
                  </Button>
                </div>
              </div>
            )}

            {menuItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isDropdownOpen = openDropdowns.includes(item.label);

              const isActive = item.path ? (
                location.pathname === item.path ||
                location.pathname.startsWith(item.path + '/') ||
                (item.path.includes(':id') && location.pathname.startsWith(item.path.split(':')[0])) ||
                (item.relatedPaths && item.relatedPaths.some(path => location.pathname.startsWith(path)))
              ) : (
                hasSubItems && item.subItems.some(sub =>
                  location.pathname === sub.path ||
                  location.pathname.startsWith(sub.path + '/') ||
                  (sub.relatedPaths && sub.relatedPaths.some(p => location.pathname.startsWith(p)))
                )
              );

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => {
                      if (hasSubItems) {
                        setOpenDropdowns(prev =>
                          prev.includes(item.label)
                            ? prev.filter(l => l !== item.label)
                            : [...prev, item.label]
                        );
                        if (!sidebarOpen) setSidebarOpen(true);
                      } else {
                        navigate(item.path);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }
                    }}
                    className={`
                      w-full flex items-center transition-all duration-200 rounded-xl
                      ${sidebarOpen ? 'px-4 py-3 gap-3' : 'px-0 py-3 justify-center'}
                      ${isActive && !hasSubItems
                        ? 'text-white shadow-sm bg-[#039E2F]'
                        : 'text-[#1A1A40]/70 hover:text-[#1A1A40] hover:bg-[#1A1A40]/5'
                      }
                    `}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    <div className={`flex items-center justify-center rounded-lg ${isActive && !hasSubItems ? 'bg-[#1A1A40]/10' : 'bg-transparent'} ${sidebarOpen ? 'w-10 h-10' : 'w-12 h-12'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {sidebarOpen && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="font-medium truncate">{item.label}</span>
                        {hasSubItems && (
                          isDropdownOpen ? <ChevronDown className="w-4 h-4 ml-1 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 ml-1 flex-shrink-0" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Sub Items */}
                  {hasSubItems && isDropdownOpen && sidebarOpen && (
                    <div className="ml-10 space-y-1 animate-in slide-in-from-top-1 duration-200">
                      {item.subItems.map((sub) => {
                        const isSubActive = location.pathname === sub.path ||
                          location.pathname.startsWith(sub.path + '/') ||
                          (sub.relatedPaths && sub.relatedPaths.some(p => location.pathname.startsWith(p)));

                        return (
                          <button
                            key={sub.path}
                            onClick={() => {
                              navigate(sub.path);
                              if (window.innerWidth < 1024) setSidebarOpen(false);
                            }}
                            className={`
                              w-full flex items-center px-4 py-2 gap-3 transition-all duration-200 rounded-lg text-sm
                              ${isSubActive
                                ? 'text-[#039E2F] font-bold bg-[#039E2F]/10'
                                : 'text-[#1A1A40]/60 hover:text-[#1A1A40] hover:bg-[#1A1A40]/5'
                              }
                            `}
                          >
                            <span className="truncate">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t" style={{ borderColor: 'rgba(26, 26, 64, 0.1)' }}>
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center transition-all duration-200 rounded-xl
                ${sidebarOpen ? 'px-4 py-3 gap-3' : 'px-0 py-3 justify-center'}
                text-[#1A1A40]/70 hover:text-[#1A1A40] hover:bg-[#1A1A40]/5
              `}
              title={!sidebarOpen ? 'Logout' : ''}
            >
              <div className={`flex items-center justify-center rounded-lg bg-transparent ${sidebarOpen ? 'w-10 h-10' : 'w-12 h-12'}`}>
                <LogOut className="w-5 h-5" />
              </div>
              {sidebarOpen && (
                <span className="font-medium truncate">Logout</span>
              )}
            </button>
          </div>
        </aside>

        {/* Main Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#ECF3F3] p-6">
          <Outlet />
        </main>
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        title="Hotel Review QR Code"
        size="md"
      >
        {hotelData && (
          <div className="flex flex-col items-center gap-4 py-2 transform scale-[0.85] origin-top">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <QRCodeSVG
                id="header-hotel-qr"
                value={`${window.location.origin}/#/review?hotelId=${hotelData._id || hotelData.id}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-[#1A1A40]">{hotelData.name}</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Guests can scan this QR code to quickly rate and review your hotel.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const url = `${window.location.origin}/#/review?hotelId=${hotelData._id || hotelData.id}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Review URL copied to clipboard');
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`/#/review?hotelId=${hotelData._id || hotelData.id}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Page
              </Button>
              <Button
                variant="primary"
                className="w-full"
                onClick={handlePrintQR}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print QR Code
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}