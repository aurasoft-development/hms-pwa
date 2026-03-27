import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Printer, Download, ExternalLink, CalendarClock, Zap, AlertCircle } from 'lucide-react';
import { theme } from '../utils/theme';
import { hotelManagementApi } from '../api/hotelManagementAPI/hotelManagementApi';

export default function HotelInfo() {
  const { hotel, updateHotel } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    googleReviewLink: '',
  });
  const [loading, setLoading] = useState(false);
  const [realHotel, setRealHotel] = useState(null);

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name || '',
        address: hotel.address || '',
        phone: hotel.phone || '',
        email: hotel.email || '',
        googleReviewLink: hotel.googleReviewLink || '',
      });
    }
  }, [hotel]);

  useEffect(() => {
    const fetchRealHotel = async () => {
      try {
        const response = await hotelManagementApi.getMyHotel();
        const hotelData = response.data || response;
        if (hotelData) {
          setRealHotel(hotelData);
        }
      } catch (error) {
        console.error('Failed to fetch real hotel data:', error);
      }
    };
    fetchRealHotel();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateHotel(formData);
      toast.success('Hotel information updated successfully');
    } catch (error) {
      toast.error('Failed to update hotel information');
    } finally {
      setLoading(false);
    }
  };

  const reviewUrl = `${window.location.origin}/#/review?hotelId=${hotel?._id || hotel?.id}`;

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    const svgElement = document.getElementById('hotel-qr-code');
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

      const qrDataUrl = canvas.toDataURL('image/png');

      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${formData.name}</title>
            <style>
              body { 
                font-family: 'Inter', sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                min-height: 100vh;
                margin: 0;
                color: #2D2D2D;
              }
              .container {
                text-align: center;
                padding: 40px;
                border: 2px solid #E5E7EB;
                border-radius: 24px;
                max-width: 500px;
              }
              h1 { color: #1A1A40; margin-bottom: 8px; font-size: 32px; }
              p { color: #6B7280; margin-bottom: 32px; font-size: 18px; }
              .qr-container {
                background: white;
                padding: 24px;
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                display: inline-block;
                margin-bottom: 32px;
              }
              .footer {
                margin-top: 32px;
                font-size: 14px;
                color: #9CA3AF;
              }
              @media print {
                .no-print { display: none; }
                body { min-height: auto; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${formData.name}</h1>
              <p>Scan to leave a review</p>
              <div class="qr-container">
                <img src="${qrDataUrl}" width="300" height="300" />
              </div>
              <div class="footer">
                Thank you for your visit!
              </div>
            </div>
            <script>
              window.onload = () => {
                window.print();
                // window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hotel Information</h1>
          <p className="text-gray-600 mt-1">Manage your hotel details</p>
        </div>
        
        {/* Subscription Status Badge */}
        {realHotel && realHotel.accessStatus && (
          <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
            <div className={`p-2 rounded-lg ${
              realHotel.accessStatus === 'paid' ? 'bg-green-100 text-green-600' :
              realHotel.accessStatus === 'trial' ? 'bg-blue-100 text-blue-600' :
              realHotel.accessStatus === 'grace' ? 'bg-orange-100 text-orange-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {realHotel.accessStatus === 'paid' ? <Zap className="w-5 h-5" /> : 
               realHotel.accessStatus === 'trial' ? <CalendarClock className="w-5 h-5" /> : 
               <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 capitalize">
                  {realHotel.accessStatus} Plan
                </span>
                {realHotel.accessStatus === 'trial' && realHotel.trialEndsAt && new Date(realHotel.trialEndsAt) > new Date() && (
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {Math.ceil((new Date(realHotel.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))} Days Left
                  </span>
                )}
                {realHotel.accessStatus === 'grace' && realHotel.graceEndsAt && new Date(realHotel.graceEndsAt) > new Date() && (
                  <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    {Math.ceil((new Date(realHotel.graceEndsAt) - new Date()) / (1000 * 60 * 60 * 24))} Days Left
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-0.5 mt-1 text-xs text-gray-500">
                {realHotel.trialStartedAt && (
                  <span>Trial Start: {new Date(realHotel.trialStartedAt).toLocaleDateString('en-GB')}</span>
                )}
                {realHotel.trialEndsAt && (
                  <span>Trial End: {new Date(realHotel.trialEndsAt).toLocaleDateString('en-GB')}</span>
                )}
                {realHotel.graceEndsAt && (
                  <span>Grace Ends: {new Date(realHotel.graceEndsAt).toLocaleDateString('en-GB')}</span>
                )}
                {realHotel.paidActivatedAt && (
                  <span>Paid Since: {new Date(realHotel.paidActivatedAt).toLocaleDateString('en-GB')}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Hotel Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
            <InputField
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              disabled={loading}
            />
            <InputField
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              disabled={loading}
            />
            <InputField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
            <div className="md:col-span-2">
              <InputField
                label="Google Review Link"
                type="url"
                value={formData.googleReviewLink}
                onChange={(e) => setFormData({ ...formData, googleReviewLink: e.target.value })}
                disabled={loading}
                placeholder="e.g., https://search.google.com/local/writereview?placeid=..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="md:flex items-center gap-8 p-4">
          <div className="flex-shrink-0 flex flex-col items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="relative group">
              <QRCodeSVG
                id="hotel-qr-code"
                value={reviewUrl}
                size={200}
                level="H"
                includeMargin={true}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                <QrCode className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handlePrintQR}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>

          <div className="mt-6 md:mt-0 flex-1 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                QR Code Review System
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Active</span>
              </h2>
              <p className="text-gray-600 mt-2">
                Every hotel has a unique QR code. Print this QR code and place it at your reception, rooms, or restaurant.
                When guests scan this code, they will be redirected to your hotel's review and rating page.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-2">Your Review URL</label>
              <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-300">
                <code className="text-burgundy flex-1 truncate text-sm font-mono" style={{ color: '#800020' }}>
                  {reviewUrl}
                </code>
                <a
                  href={reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-500"
                  title="Open review link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Download & Print</p>
                  <p className="text-sm text-gray-500">Print the high-quality QR code for display.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Guest Scan</p>
                  <p className="text-sm text-gray-500">Guests scan code with their smartphone.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}