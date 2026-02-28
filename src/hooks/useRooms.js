import { useState, useEffect } from 'react';

// Default 25-room dummy data
const DEFAULT_ROOMS = [
  { "id": "r101", "number": "101", "type": "Standard", "floor": 1, "price": 1500, "status": "vacant", "amenities": ["AC", "TV"] },
  { "id": "r102", "number": "102", "type": "Standard", "floor": 1, "price": 1500, "status": "vacant", "amenities": ["AC"] },
  { "id": "r103", "number": "103", "type": "Deluxe", "floor": 1, "price": 2000, "status": "occupied", "amenities": ["AC", "TV", "WiFi"] },
  { "id": "r104", "number": "104", "type": "Standard", "floor": 1, "price": 1500, "status": "dirty", "amenities": ["AC"] },
  { "id": "r105", "number": "105", "type": "Suite", "floor": 1, "price": 3500, "status": "vacant", "amenities": ["AC", "TV", "WiFi", "Mini Fridge"] },
  { "id": "r201", "number": "201", "type": "Standard", "floor": 2, "price": 1600, "status": "vacant", "amenities": ["AC", "TV"] },
  { "id": "r202", "number": "202", "type": "Deluxe", "floor": 2, "price": 2100, "status": "vacant", "amenities": ["AC", "TV", "WiFi"] },
  { "id": "r203", "number": "203", "type": "Suite", "floor": 2, "price": 3600, "status": "occupied", "amenities": ["AC", "TV", "WiFi", "Mini Fridge"] },
  { "id": "r204", "number": "204", "type": "Standard", "floor": 2, "price": 1600, "status": "dirty", "amenities": ["AC"] },
  { "id": "r205", "number": "205", "type": "Deluxe", "floor": 2, "price": 2200, "status": "vacant", "amenities": ["AC", "TV", "WiFi"] },
  { "id": "r301", "number": "301", "type": "Standard", "floor": 3, "price": 1700, "status": "vacant", "amenities": ["AC"] },
  { "id": "r302", "number": "302", "type": "Deluxe", "floor": 3, "price": 2200, "status": "vacant", "amenities": ["AC", "TV"] },
  { "id": "r303", "number": "303", "type": "Suite", "floor": 3, "price": 3800, "status": "occupied", "amenities": ["AC", "TV", "WiFi", "Mini Fridge"] },
  { "id": "r304", "number": "304", "type": "Standard", "floor": 3, "price": 1700, "status": "dirty", "amenities": ["AC", "TV"] },
  { "id": "r305", "number": "305", "type": "Deluxe", "floor": 3, "price": 2300, "status": "vacant", "amenities": ["AC", "WiFi"] },
  { "id": "r401", "number": "401", "type": "Standard", "floor": 4, "price": 1800, "status": "vacant", "amenities": ["AC"] },
  { "id": "r402", "number": "402", "type": "Deluxe", "floor": 4, "price": 2400, "status": "vacant", "amenities": ["AC", "TV", "WiFi"] },
  { "id": "r403", "number": "403", "type": "Suite", "floor": 4, "price": 4000, "status": "dirty", "amenities": ["AC", "TV", "WiFi", "Mini Fridge"] },
  { "id": "r404", "number": "404", "type": "Standard", "floor": 4, "price": 1800, "status": "occupied", "amenities": ["AC"] },
  { "id": "r405", "number": "405", "type": "Deluxe", "floor": 4, "price": 2500, "status": "vacant", "amenities": ["AC", "TV"] },
  { "id": "r501", "number": "501", "type": "Suite", "floor": 5, "price": 4200, "status": "vacant", "amenities": ["AC", "TV", "WiFi", "Mini Fridge"] },
  { "id": "r502", "number": "502", "type": "Standard", "floor": 5, "price": 1900, "status": "dirty", "amenities": ["AC"] },
  { "id": "r503", "number": "503", "type": "Deluxe", "floor": 5, "price": 2600, "status": "vacant", "amenities": ["AC", "TV"] },
  { "id": "r504", "number": "504", "type": "Suite", "floor": 5, "price": 4500, "status": "occupied", "amenities": ["AC", "WiFi", "Mini Fridge"] },
  { "id": "r505", "number": "505", "type": "Deluxe", "floor": 5, "price": 2700, "status": "vacant", "amenities": ["AC", "TV", "WiFi"] }
];

const STORAGE_KEY = 'pms_rooms';

export function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load rooms from localStorage or use default data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedRooms = JSON.parse(stored);
        setRooms(parsedRooms);
      } else {
        // Initialize with default data
        setRooms(DEFAULT_ROOMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ROOMS));
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      setRooms(DEFAULT_ROOMS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a room
  const updateRoom = (roomId, updatedData) => {
    setRooms((prevRooms) => {
      const updated = prevRooms.map((room) =>
        room.id === roomId ? { ...room, ...updatedData } : room
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return {
    rooms,
    loading,
    updateRoom,
  };
}

