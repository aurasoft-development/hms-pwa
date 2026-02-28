import { create } from 'zustand';
import { dbService } from '../utils/dbService';

export const useAppStore = create((set, get) => ({
  // Hotel data
  hotel: null,
  rooms: [],
  foodPackages: [],
  bookings: [],
  admins: [],
  folioItems: [],
  payments: [],

  // Initialize data
  initializeData: async () => {
    const hotel = await dbService.getHotel();
    const rooms = await dbService.getRooms();
    const foodPackages = await dbService.getFoodPackages();
    const bookings = await dbService.getBookings();
    const admins = await dbService.getAdmins();

    set({
      hotel,
      rooms,
      foodPackages,
      bookings,
      admins,
      folioItems: [],
      payments: [],
    });
  },

  // Hotel actions
  updateHotel: async (data) => {
    const hotel = await dbService.updateHotel(data);
    set({ hotel });
    return hotel;
  },

  // Room actions
  addRoom: async (room) => {
    const newRoom = await dbService.addRoom(room);
    set((state) => ({ rooms: [...state.rooms, newRoom] }));
    return newRoom;
  },

  updateRoom: async (id, data) => {
    const updatedRoom = await dbService.updateRoom(id, data);
    set((state) => ({
      rooms: state.rooms.map((r) => (r.id === id ? updatedRoom : r)),
    }));
    return updatedRoom;
  },

  deleteRoom: async (id) => {
    await dbService.deleteRoom(id);
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== id),
    }));
  },

  // Food Package actions
  addFoodPackage: async (foodPkg) => {
    const newFoodPackage = await dbService.addFoodPackage(foodPkg);
    set((state) => ({ foodPackages: [...state.foodPackages, newFoodPackage] }));
    return newFoodPackage;
  },

  updateFoodPackage: async (id, data) => {
    const updatedFoodPackage = await dbService.updateFoodPackage(id, data);
    set((state) => ({
      foodPackages: state.foodPackages.map((fp) =>
        fp.id === id ? updatedFoodPackage : fp
      ),
    }));
    return updatedFoodPackage;
  },

  deleteFoodPackage: async (id) => {
    await dbService.deleteFoodPackage(id);
    set((state) => ({
      foodPackages: state.foodPackages.filter((fp) => fp.id !== id),
    }));
  },

  // Booking actions
  addBooking: async (booking) => {
    const newBooking = await dbService.addBooking(booking);
    set((state) => ({ bookings: [...state.bookings, newBooking] }));
    return newBooking;
  },

  updateBooking: async (id, data) => {
    const updatedBooking = await dbService.updateBooking(id, data);
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === id ? updatedBooking : b)),
    }));
    return updatedBooking;
  },

  deleteBooking: async (id) => {
    await dbService.deleteBooking(id);
    set((state) => ({
      bookings: state.bookings.filter((b) => b.id !== id),
    }));
  },

  // Admin actions
  addAdmin: async (admin) => {
    const newAdmin = await dbService.addAdmin(admin);
    set((state) => ({ admins: [...state.admins, newAdmin] }));
    return newAdmin;
  },

  updateAdmin: async (id, data) => {
    const updatedAdmin = await dbService.updateAdmin(id, data);
    set((state) => ({
      admins: state.admins.map((a) => (a.id === id ? updatedAdmin : a)),
    }));
    return updatedAdmin;
  },

  deleteAdmin: async (id) => {
    await dbService.deleteAdmin(id);
    set((state) => ({
      admins: state.admins.filter((a) => a.id !== id),
    }));
  },

  // Check-in/Check-out actions
  checkIn: async (bookingId, roomId, roomNumber = null) => {
    // Get room from bookings or use roomId directly
    const updateData = {
      status: 'checked-in',
      roomId,
      checkedInAt: new Date().toISOString(),
    };

    // Add roomNumber if provided
    if (roomNumber) {
      updateData.roomNumber = roomNumber;
    }

    const booking = await dbService.updateBooking(bookingId, updateData);
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === bookingId ? booking : b)),
    }));
    return { booking };
  },

  checkOut: async (bookingId, roomId) => {
    const booking = await dbService.updateBooking(bookingId, {
      status: 'checked-out',
      checkedOutAt: new Date().toISOString(),
    });
    const room = await dbService.updateRoom(roomId, {
      status: 'dirty',
      bookingId: null,
    });
    set((state) => ({
      bookings: state.bookings.map((b) => (b.id === bookingId ? booking : b)),
      rooms: state.rooms.map((r) => (r.id === roomId ? room : r)),
    }));
    return { booking, room };
  },

  // Folio Items
  getFolioItems: async (bookingId) => {
    const items = await dbService.getFolioItems(bookingId);
    return items;
  },

  addFolioItem: async (item) => {
    const newItem = await dbService.addFolioItem(item);
    set((state) => ({
      folioItems: [...state.folioItems, newItem],
    }));
    return newItem;
  },

  deleteFolioItem: async (id) => {
    await dbService.deleteFolioItem(id);
    set((state) => ({
      folioItems: state.folioItems.filter((item) => item.id !== id),
    }));
  },

  // Payments
  getPayments: async (bookingId) => {
    const payments = await dbService.getPayments(bookingId);
    return payments;
  },

  addPayment: async (payment) => {
    const newPayment = await dbService.addPayment(payment);
    set((state) => ({
      payments: [...state.payments, newPayment],
    }));
    return newPayment;
  },

  // Global UI State (Managed by Layout)
  GLOBAL_LAYOUT_QR_MODAL_STATUS: false,
  setGlobalQRModalStatus: (isOpen) => set({ GLOBAL_LAYOUT_QR_MODAL_STATUS: isOpen }),
}));

