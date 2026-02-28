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
  Download,
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
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [openDropdowns, setOpenDropdowns] = useState(['Bookings']); // Default bookings open
  const { GLOBAL_LAYOUT_QR_MODAL_STATUS, setGlobalQRModalStatus, hotel, initializeData } = useAppStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const hotelName = useMemo(() => hotel?.name || '', [hotel]);

  // Use the new status
  const isQRModalOpen = GLOBAL_LAYOUT_QR_MODAL_STATUS;
  const setIsQRModalOpen = setGlobalQRModalStatus;
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

  // Handle route changes - close sidebar on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const menu = document.getElementById('user-profile-menu');
      if (menu && !menu.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Fetch hotel data for Admin/Sub Admin users
  useEffect(() => {
    const fetchHotelData = async () => {
      const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';
      if (isSuperAdmin || !user) return;

      // Check store first
      const storeHotel = useAppStore.getState().hotel;
      if (storeHotel) return;

      try {
        const response = await hotelManagementApi.getMyHotel();
        const fetchedHotel = response.data || response;
        if (fetchedHotel) {
          useAppStore.setState({ hotel: fetchedHotel }); // Sync with store
        }
      } catch (error) {
        console.error('Failed to fetch hotel data:', error);
      }
    };

    if (user) {
      fetchHotelData();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handlePrintQR = () => {
    if (!hotelData) {
      toast.error('Hotel data not loaded');
      return;
    }

    const svgElement = document.getElementById('layout-hotel-print-qr');
    if (!svgElement) {
      toast.error('QR code not ready. Please try again.');
      return;
    }

    const svgContent = new XMLSerializer().serializeToString(svgElement);
    const iframe = document.getElementById('print-iframe');
    const doc = iframe.contentWindow.document;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hotel QR Print</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Outfit', sans-serif; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh;
              text-align: center;
              color: #1A1A40;
              background-color: white;
            }
            .container {
              padding: 60px;
              width: 100%;
              max-width: 600px;
            }
            h1 { font-size: 40px; margin-bottom: 12px; font-weight: 700; color: #1A1A40; }
            p { font-size: 22px; color: #64748B; margin-bottom: 50px; }
            .qr-box { 
              padding: 32px;
              border: 1px solid #E2E8F0;
              border-radius: 40px;
              background: white;
              display: inline-block;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            svg { width: 350px; height: 350px; display: block; }
            .footer { margin-top: 50px; font-size: 18px; color: #94A3B8; font-weight: 500; }
            @media print {
              @page { margin: 0; }
              body { min-height: auto; }
              .container { max-width: none; box-shadow: none; border: none; }
              .qr-box { box-shadow: none; border: 1px solid #EEE; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${hotel.name}</h1>
            <p>Scan to Rate & Review</p>
            <div class="qr-box">${svgContent}</div>
            <div class="footer">Thank you for your visit!</div>
          </div>
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(() => {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const handleDownloadQR = () => {
    if (!hotelData) {
      toast.error('Hotel data not loaded');
      return;
    }

    const svgElement = document.getElementById('layout-hotel-print-qr');
    if (!svgElement) {
      toast.error('QR code element not found');
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = 1200; // High resolution
        canvas.height = 1200;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw centered
        const size = 1000;
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;
        ctx.drawImage(img, x, y, size, size);

        // Add text
        ctx.fillStyle = '#1A1A40';
        ctx.font = 'bold 60px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(hotel.name, canvas.width / 2, 100);
        ctx.font = '40px Inter, sans-serif';
        ctx.fillText('Scan to Rate & Review', canvas.width / 2, 1150);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `${hotel.name.replace(/\s+/g, '_')}_Review_QR.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success('QR Code downloaded successfully');
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download QR code');
    }
  };

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin';

  // Get panel title based on role
  const panelTitle = user?.role === 'Super Admin' ? 'SuperAdmin Panel' : 'Admin Panel';

  // Get icon for header based on role
  const HeaderIcon = user?.role === 'Super Admin' ? Building2 : LayoutDashboard;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#ECF3F3]">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
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
              <h1 className="text-lg sm:text-xl font-bold text-[#1A1A40] truncate max-w-[120px] sm:max-w-none">
                {user?.role === 'super_admin' || user?.role === 'Super Admin' || user?.role === 'SuperAdmin'
                  ? 'Hotel Management'
                  : hotelName || 'Hotel Management'}
              </h1>
              <p className="text-xs text-[#1A1A40]/80 mt-0.5 hidden sm:block">{panelTitle}</p>
            </div>
          </div>

          {/* Desktop Toggle Sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-2 rounded-xl text-[#1A1A40] hover:bg-[#1A1A40]/5 transition-colors mr-2"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <Menu className="w-5 h-5" />
          </button>

        </div>

        {/* Right Section: Actions + User Profile */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          {!isSuperAdmin && hotel && (
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsQRModalOpen(true)}
                className="flex items-center gap-2"
                style={{ backgroundColor: '#039E2F', borderColor: '#039E2F' }}
              >
                <QrCode className="w-4 h-4" />
                <span className="text-xs sm:text-sm whitespace-nowrap">View QR</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintQR}
                className="hidden sm:flex items-center gap-2"
                style={{ borderColor: '#039E2F', color: '#039E2F' }}
              >
                <Printer className="w-4 h-4" />
                <span className="hidden md:inline">Print QR</span>
              </Button>
            </div>
          )}


          <div className="relative" id="user-profile-menu">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 rounded-xl bg-[#1A1A40]/5 hover:bg-[#1A1A40]/10 backdrop-blur-sm transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-[#1A1A40] flex-shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-[#1A1A40] truncate max-w-[100px]">{user?.name}</p>
                <p className="text-xs text-[#1A1A40]/80">{user?.role}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#1A1A40]/60 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                  <p className="text-sm font-semibold text-[#1A1A40] truncate">{user?.name}</p>
                  <p className="text-xs text-[#1A1A40]/80">{user?.role}</p>
                </div>

                {!isSuperAdmin && hotel && (
                  <div className="lg:hidden border-b border-gray-50">
                    <button
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        // Open instantly on touch start to beat any synthesized clicks
                        setIsQRModalOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <QrCode className="w-4 h-4 text-[#039E2F]" />
                      <span>View QR Code</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadQR();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Download className="w-4 h-4 text-[#039E2F]" />
                      <span>Download QR Code</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintQR();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Printer className="w-4 h-4 text-[#039E2F]" />
                      <span>Print QR Code</span>
                    </button>
                  </div>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content Area (Sidebar + Main) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            transition-all duration-300 flex flex-col border-r h-full bg-[#ECF3F3]
            ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 lg:w-20'}
          `}
          style={{ borderColor: 'rgba(26, 26, 64, 0.1)' }}
        >
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                            onClick={() => navigate(sub.path)}
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
        <main className="flex-1 overflow-y-auto bg-[#ECF3F3] p-4 sm:p-6 lg:p-8">
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
        {hotel && (
          <div className="flex flex-col items-center gap-4 py-2 transform scale-[0.85] origin-top">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <QRCodeSVG
                id="header-hotel-qr"
                value={`${window.location.origin}/#/review?hotelId=${hotel._id || hotel.id}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-[#1A1A40]">{hotel.name}</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Guests can scan this QR code to quickly rate and review your hotel.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const url = `${window.location.origin}/#/review?hotelId=${hotel._id || hotel.id}`;
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
                onClick={() => window.open(`/#/review?hotelId=${hotel._id || hotel.id}`, '_blank')}
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

      {/* Hidden iframe for reliable printing */}
      <iframe id="print-iframe" style={{ display: 'none' }} title="Print QR" />

      {/* Hidden QR for instant printing/access - Using opacity instead of display:none for better reliability */}
      {!isSuperAdmin && hotel && (
        <div style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }} aria-hidden="true">
          <QRCodeSVG
            id="layout-hotel-print-qr"
            value={`${window.location.origin}/#/review?hotelId=${hotel._id || hotel.id}`}
            size={400} // Larger source for better print quality
            level="H"
            includeMargin={true}
          />
        </div>
      )}
    </div>
  );
}