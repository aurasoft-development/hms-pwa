import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { useRooms } from '../hooks/useRooms';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { InputField } from '../atoms/InputField';
import { SelectDropdown } from '../atoms/SelectDropdown';
import { Card } from '../atoms/Card';
import {
  Plus,
  Trash2,
  Download,
  Receipt,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { downloadInvoice } from '../utils/invoiceService';

export function CheckoutModal({ isOpen, onClose, booking, room, onSuccess }) {
  const { checkOut, getFolioItems, addFolioItem, deleteFolioItem, getPayments, addPayment, hotel } =
    useAppStore();
  const { updateRoom } = useRooms();
  const [folioItems, setFolioItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newFolioItem, setNewFolioItem] = useState({ description: '', amount: '' });
  const [newPayment, setNewPayment] = useState({ amount: '', method: 'cash' });
  const [showAddFolio, setShowAddFolio] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      loadFolioData();
    }
  }, [isOpen, booking]);

  const loadFolioData = async () => {
    if (!booking) return;
    const items = await getFolioItems(booking.id);
    const paymentList = await getPayments(booking.id);
    setFolioItems(items);
    setPayments(paymentList);
  };

  // Calculate totals
  const calculations = useMemo(() => {
    const roomCharges = booking?.totalAmount || 0;
    const extraCharges = folioItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const subtotal = roomCharges + extraCharges;
    const gst = subtotal * 0.18; // 18% GST
    const total = subtotal + gst;
    const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const balance = total - totalPaid;

    return {
      roomCharges,
      extraCharges,
      subtotal,
      gst,
      total,
      totalPaid,
      balance,
    };
  }, [booking, folioItems, payments]);

  const handleAddFolioItem = async () => {
    if (!newFolioItem.description || !newFolioItem.amount) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const item = await addFolioItem({
        bookingId: booking.id,
        description: newFolioItem.description,
        amount: parseFloat(newFolioItem.amount),
      });
      setFolioItems([...folioItems, item]);
      setNewFolioItem({ description: '', amount: '' });
      setShowAddFolio(false);
      toast.success('Folio item added');
    } catch (error) {
      toast.error('Failed to add folio item');
    }
  };

  const handleDeleteFolioItem = async (id) => {
    try {
      await deleteFolioItem(id);
      setFolioItems(folioItems.filter((item) => item.id !== id));
      toast.success('Folio item deleted');
    } catch (error) {
      toast.error('Failed to delete folio item');
    }
  };

  const handleAddPayment = async () => {
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const payment = await addPayment({
        bookingId: booking.id,
        amount: parseFloat(newPayment.amount),
        method: newPayment.method,
      });
      setPayments([...payments, payment]);
      setNewPayment({ amount: '', method: 'cash' });
      setShowAddPayment(false);
      toast.success('Payment added');
    } catch (error) {
      toast.error('Failed to add payment');
    }
  };

  const handleCheckout = async () => {
    if (calculations.balance > 0.01) {
      toast.error('Please clear the balance before checkout');
      return;
    }

    setLoading(true);
    try {
      await checkOut(booking.id, room.id);
      
      // Update room status in Room Management system
      updateRoom(room.id, {
        status: 'dirty',
        bookingId: null,
      });
      
      // Generate invoice JSON
      const invoice = {
        invoiceNumber: `INV-${Date.now()}`,
        bookingId: booking.id,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        roomNumber: room.number,
        roomType: room.type,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        checkedOutAt: new Date().toISOString(),
        hotel: hotel,
        roomCharges: calculations.roomCharges,
        extraCharges: calculations.extraCharges,
        subtotal: calculations.subtotal,
        gst: calculations.gst,
        total: calculations.total,
        folioItems: folioItems,
        payments: payments,
        createdAt: new Date().toISOString(),
      };

      toast.success('Check-out successful!');
      onSuccess(invoice);
    } catch (error) {
      toast.error('Failed to checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = () => {
    const invoice = {
      invoiceNumber: `INV-${Date.now()}`,
      bookingId: booking.id,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      roomNumber: room.number,
      roomType: room.type,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      hotel: hotel,
      roomCharges: calculations.roomCharges,
      extraCharges: calculations.extraCharges,
      subtotal: calculations.subtotal,
      gst: calculations.gst,
      total: calculations.total,
      folioItems: folioItems,
      payments: payments,
    };
    downloadInvoice(invoice);
  };

  if (!booking || !room) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Check-out" size="xl">
      <div className="space-y-6">
        {/* Guest Info */}
        <Card className="p-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Guest Name</p>
              <p className="font-semibold text-gray-900">{booking.guestName}</p>
            </div>
            <div>
              <p className="text-gray-600">Room</p>
              <p className="font-semibold text-gray-900">
                {room.number} - {room.type}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Check-in</p>
              <p className="font-semibold text-gray-900">
                {new Date(booking.checkIn).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Check-out</p>
              <p className="font-semibold text-gray-900">
                {new Date(booking.checkOut).toLocaleDateString()}
              </p>
            </div>
            {booking.numberOfGuests && (
              <div>
                <p className="text-gray-600">Number of Guests</p>
                <p className="font-semibold text-gray-900">{booking.numberOfGuests}</p>
              </div>
            )}
            {booking.purposeOfVisit && (
              <div>
                <p className="text-gray-600">Purpose of Visit</p>
                <p className="font-semibold text-gray-900">{booking.purposeOfVisit}</p>
              </div>
            )}
            {booking.comingFrom && (
              <div>
                <p className="text-gray-600">Coming From</p>
                <p className="font-semibold text-gray-900">{booking.comingFrom}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Folio Summary */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Folio Summary
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddFolio(!showAddFolio)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* Add Folio Item Form */}
          {showAddFolio && (
            <Card className="p-4 mb-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Description"
                  value={newFolioItem.description}
                  onChange={(e) =>
                    setNewFolioItem({ ...newFolioItem, description: e.target.value })
                  }
                  placeholder="e.g., Laundry, Mini Bar"
                />
                <InputField
                  label="Amount"
                  type="number"
                  value={newFolioItem.amount}
                  onChange={(e) =>
                    setNewFolioItem({ ...newFolioItem, amount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddFolio(false);
                    setNewFolioItem({ description: '', amount: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddFolioItem}>
                  Add
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <div className="space-y-3">
              {/* Room Charges */}
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-700">Room Charges</span>
                <span className="font-semibold text-gray-900">
                  ₹{calculations.roomCharges.toFixed(2)}
                </span>
              </div>

              {/* Extra Charges */}
              {folioItems.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Extra Charges</p>
                  <div className="space-y-2">
                    {folioItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-900">
                            ₹{parseFloat(item.amount).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleDeleteFolioItem(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    ₹{calculations.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-medium text-gray-900">
                    ₹{calculations.gst.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-burgundy" style={{ color: '#800020' }}>
                    ₹{calculations.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Payments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-lg font-bold" style={{ color: '#800020' }}>₹</span>
              Payments
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddPayment(!showAddPayment)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Payment
            </Button>
          </div>

          {/* Add Payment Form */}
          {showAddPayment && (
            <Card className="p-4 mb-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Amount"
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) =>
                    setNewPayment({ ...newPayment, amount: e.target.value })
                  }
                  placeholder="0.00"
                />
                <SelectDropdown
                  label="Payment Method"
                  value={newPayment.method}
                  onChange={(e) =>
                    setNewPayment({ ...newPayment, method: e.target.value })
                  }
                  options={[
                    { id: 'cash', name: 'Cash' },
                    { id: 'card', name: 'Card' },
                    { id: 'upi', name: 'UPI' },
                    { id: 'bank_transfer', name: 'Bank Transfer' },
                  ]}
                />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddPayment(false);
                    setNewPayment({ amount: '', method: 'cash' });
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddPayment}>
                  Add
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-4">
            {payments.length > 0 ? (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ₹{parseFloat(payment.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No payments added</p>
            )}

            <div className="pt-3 mt-3 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Paid</span>
                <span className="font-medium text-gray-900">
                  ₹{calculations.totalPaid.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                <span className={calculations.balance > 0.01 ? 'text-red-600' : 'text-green-600'}>
                  Balance
                </span>
                <span
                  className={calculations.balance > 0.01 ? 'text-red-600' : 'text-green-600'}
                >
                  ₹{Math.abs(calculations.balance).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleDownloadInvoice}>
            <Download className="w-4 h-4 mr-2" />
            Download Invoice
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={loading || calculations.balance > 0.01}
              loading={loading}
            >
              Complete Check-out
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

