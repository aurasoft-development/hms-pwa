// SQLite database service using better-sqlite3
// For Electron, we'll use a mock implementation that stores data in localStorage
// In production, you'd use better-sqlite3 with Electron's node integration

class DatabaseService {
  constructor() {
    this.init();
  }

  init() {
    // Initialize default data if not exists
    const existingDB = localStorage.getItem('hotel_db');
    if (!existingDB) {
      const defaultData = {
        hotel: {
          id: 1,
          name: 'Grand Hotel',
          address: '123 Main Street, City',
          phone: '+1234567890',
          email: 'info@grandhotel.com',
          logo: null,
        },
        rooms: [
          {
            id: 1,
            number: '101',
            type: 'Deluxe',
            price: 150,
            facilities: ['WiFi', 'TV', 'AC', 'Mini Bar'],
            available: true,
            status: 'vacant', // vacant, occupied, dirty
            bookingId: null,
          },
          {
            id: 2,
            number: '102',
            type: 'Standard',
            price: 100,
            facilities: ['WiFi', 'TV', 'AC'],
            available: true,
            status: 'vacant',
            bookingId: null,
          },
          {
            id: 3,
            number: '103',
            type: 'Suite',
            price: 250,
            facilities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi'],
            available: true,
            status: 'vacant',
            bookingId: null,
          },
          {
            id: 4,
            number: '201',
            type: 'Deluxe',
            price: 150,
            facilities: ['WiFi', 'TV', 'AC', 'Mini Bar'],
            available: true,
            status: 'occupied',
            bookingId: 1001,
          },
          {
            id: 5,
            number: '202',
            type: 'Standard',
            price: 100,
            facilities: ['WiFi', 'TV', 'AC'],
            available: true,
            status: 'dirty',
            bookingId: null,
          },
          {
            id: 6,
            number: '301',
            type: 'Suite',
            price: 250,
            facilities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Jacuzzi'],
            available: true,
            status: 'vacant',
            bookingId: null,
          },
        ],
        foodPackages: [
          { id: 1, name: 'Breakfast', price: 20, type: 'breakfast' },
          { id: 2, name: 'Half Board', price: 40, type: 'half' },
          { id: 3, name: 'Full Board', price: 60, type: 'full' },
        ],
        bookings: [
          {
            id: 1001,
            guestName: 'John Doe',
            guestEmail: 'john@example.com',
            guestPhone: '+1234567890',
            roomId: 4,
            roomType: 'Deluxe',
            roomNumber: '201',
            checkIn: '2024-01-15',
            checkOut: '2024-01-18',
            status: 'checked-in',
            totalAmount: 450,
            createdAt: '2024-01-10T10:00:00Z',
            checkedInAt: '2024-01-15T14:00:00Z',
          },
          {
            id: 1002,
            guestName: 'Jane Smith',
            guestEmail: 'jane@example.com',
            guestPhone: '+1987654321',
            roomId: null,
            roomType: 'Standard',
            checkIn: '2024-01-20',
            checkOut: '2024-01-22',
            status: 'confirmed',
            totalAmount: 200,
            createdAt: '2024-01-12T14:00:00Z',
          },
        ],
        folioItems: [],
        payments: [],
        admins: [
          {
            id: 1,
            username: 'admin',
            password: 'admin123', // In production, hash this
            name: 'Admin User',
            email: 'admin@hotel.com',
            role: 'Admin',
            whatsappNumber: '8305912893',
          },
        ],
        users: [
          {
            id: 1,
            username: 'superadmin',
            password: 'superadmin123', // In production, hash this
            name: 'Super Admin',
            email: 'superadmin@hotel.com',
            role: 'SuperAdmin',
            whatsappNumber: '8305912893',
          },
        ],
      };
      localStorage.setItem('hotel_db', JSON.stringify(defaultData));
    } else {
      // Migrate existing data - ensure rooms have status field
      try {
        const db = JSON.parse(existingDB);
        if (db.rooms && Array.isArray(db.rooms)) {
          let needsUpdate = false;
          db.rooms = db.rooms.map((room) => {
            if (!room.status) {
              needsUpdate = true;
              // Determine status from available field or set default
              room.status = room.available === false ? 'occupied' : 'vacant';
            }
            if (!room.number) {
              needsUpdate = true;
              room.number = `R${room.id}`;
            }
            return room;
          });
          if (needsUpdate) {
            this.saveDB(db);
          }
        }
      } catch (e) {
        console.error('Error migrating room data:', e);
      }
    }
  }

  getDB() {
    return JSON.parse(localStorage.getItem('hotel_db') || '{}');
  }

  saveDB(data) {
    localStorage.setItem('hotel_db', JSON.stringify(data));
  }

  // Hotel
  async getHotel() {
    const db = this.getDB();
    return db.hotel || null;
  }

  async updateHotel(data) {
    const db = this.getDB();
    db.hotel = { ...db.hotel, ...data };
    this.saveDB(db);
    return db.hotel;
  }

  // Rooms
  async getRooms() {
    const db = this.getDB();
    const rooms = db.rooms || [];
    // Ensure all rooms have status field (migration for old data)
    return rooms.map((room) => {
      if (!room.status) {
        // If status is missing, determine it from available field
        room.status = room.available === false ? 'occupied' : 'vacant';
      }
      // Ensure number field exists
      if (!room.number) {
        room.number = `R${room.id}`;
      }
      return room;
    });
  }

  async addRoom(room) {
    const db = this.getDB();
    const newRoom = {
      id: Date.now(),
      ...room,
      available: true,
      status: room.status || 'vacant',
      bookingId: room.bookingId || null,
      number: room.number || `R${Date.now()}`,
    };
    db.rooms.push(newRoom);
    this.saveDB(db);
    return newRoom;
  }

  async updateRoom(id, data) {
    const db = this.getDB();
    const index = db.rooms.findIndex((r) => r.id === id);
    if (index !== -1) {
      db.rooms[index] = { ...db.rooms[index], ...data };
      this.saveDB(db);
      return db.rooms[index];
    }
    return null;
  }

  async deleteRoom(id) {
    const db = this.getDB();
    db.rooms = db.rooms.filter((r) => r.id !== id);
    this.saveDB(db);
  }

  // Food Packages
  async getFoodPackages() {
    const db = this.getDB();
    return db.foodPackages || [];
  }

  async addFoodPackage(foodPkg) {
    const db = this.getDB();
    const newFoodPackage = { id: Date.now(), ...foodPkg };
    db.foodPackages.push(newFoodPackage);
    this.saveDB(db);
    return newFoodPackage;
  }

  async updateFoodPackage(id, data) {
    const db = this.getDB();
    const index = db.foodPackages.findIndex((fp) => fp.id === id);
    if (index !== -1) {
      db.foodPackages[index] = { ...db.foodPackages[index], ...data };
      this.saveDB(db);
      return db.foodPackages[index];
    }
    return null;
  }

  async deleteFoodPackage(id) {
    const db = this.getDB();
    db.foodPackages = db.foodPackages.filter((fp) => fp.id !== id);
    this.saveDB(db);
  }

  // Bookings
  async getBookings() {
    const db = this.getDB();
    return db.bookings || [];
  }

  async addBooking(booking) {
    const db = this.getDB();
    const newBooking = {
      id: Date.now(),
      ...booking,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    };
    db.bookings.push(newBooking);
    this.saveDB(db);
    return newBooking;
  }

  async updateBooking(id, data) {
    const db = this.getDB();
    const index = db.bookings.findIndex((b) => b.id === id);
    if (index !== -1) {
      db.bookings[index] = { ...db.bookings[index], ...data };
      this.saveDB(db);
      return db.bookings[index];
    }
    return null;
  }

  async deleteBooking(id) {
    const db = this.getDB();
    db.bookings = db.bookings.filter((b) => b.id !== id);
    this.saveDB(db);
  }

  // Admins
  async getAdmins() {
    const db = this.getDB();
    return db.admins || [];
  }

  async addAdmin(admin) {
    const db = this.getDB();
    const newAdmin = {
      id: Date.now(),
      ...admin,
      role: 'Admin',
    };
    db.admins.push(newAdmin);
    this.saveDB(db);
    return newAdmin;
  }

  async updateAdmin(id, data) {
    const db = this.getDB();
    const index = db.admins.findIndex((a) => a.id === id);
    if (index !== -1) {
      db.admins[index] = { ...db.admins[index], ...data };
      this.saveDB(db);
      return db.admins[index];
    }
    return null;
  }

  async deleteAdmin(id) {
    const db = this.getDB();
    db.admins = db.admins.filter((a) => a.id !== id);
    this.saveDB(db);
  }

  // Folio Items
  async getFolioItems(bookingId) {
    const db = this.getDB();
    const items = db.folioItems || [];
    return items.filter((item) => item.bookingId === bookingId);
  }

  async addFolioItem(item) {
    const db = this.getDB();
    if (!db.folioItems) db.folioItems = [];
    const newItem = {
      id: Date.now(),
      ...item,
      createdAt: new Date().toISOString(),
    };
    db.folioItems.push(newItem);
    this.saveDB(db);
    return newItem;
  }

  async deleteFolioItem(id) {
    const db = this.getDB();
    if (!db.folioItems) db.folioItems = [];
    db.folioItems = db.folioItems.filter((item) => item.id !== id);
    this.saveDB(db);
  }

  // Payments
  async getPayments(bookingId) {
    const db = this.getDB();
    const payments = db.payments || [];
    return payments.filter((payment) => payment.bookingId === bookingId);
  }

  async addPayment(payment) {
    const db = this.getDB();
    if (!db.payments) db.payments = [];
    const newPayment = {
      id: Date.now(),
      ...payment,
      createdAt: new Date().toISOString(),
    };
    db.payments.push(newPayment);
    this.saveDB(db);
    return newPayment;
  }

  // Auth
  async authenticate(username, password) {
    const db = this.getDB();
    const user =
      db.users.find((u) => u.username === username && u.password === password) ||
      db.admins.find((u) => u.username === username && u.password === password);
    return user ? { ...user, password: undefined } : null;
  }
}

export const dbService = new DatabaseService();

