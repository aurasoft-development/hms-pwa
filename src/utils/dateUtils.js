// Safe date utility functions

export const safeDate = (dateValue) => {
  if (!dateValue) return null;
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  // If it's a string, try to parse it
  if (typeof dateValue === 'string') {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
};

export const formatSafeDate = (dateValue, formatFn, fallback = 'N/A') => {
  const date = safeDate(dateValue);
  if (!date) return fallback;
  
  try {
    return formatFn(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return fallback;
  }
};

export const isValidDate = (dateValue) => {
  const date = safeDate(dateValue);
  return date !== null;
};

