import { differenceInCalendarDays } from 'date-fns';
import { safeDate } from './dateUtils';

export const calculateBookingPrice = (roomPrice, checkIn, checkOut, packagePrice = 0, foodPackagePrice = 0) => {
  const checkInDate = safeDate(checkIn);
  const checkOutDate = safeDate(checkOut);

  if (!checkInDate || !checkOutDate) {
    return {
      nights: 0,
      roomTotal: 0,
      packageTotal: 0,
      foodTotal: 0,
      total: 0,
    };
  }

  const nights = Math.max(0, differenceInCalendarDays(checkOutDate, checkInDate));
  const roomTotal = roomPrice * nights;
  const packageTotal = packagePrice * nights;
  const foodTotal = foodPackagePrice * nights;
  const total = roomTotal + packageTotal + foodTotal;

  return {
    nights,
    roomTotal,
    packageTotal,
    foodTotal,
    total,
  };
};

