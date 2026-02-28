/**
 * Safely extracts a string ID from a potential populated object or Mongoose object.
 * @param {string|object} id - The ID to extract.
 * @returns {string} - The extracted string ID.
 */
export const extractId = (id) => {
    if (!id) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object') {
        // Check for common ID properties
        const extracted = id._id || id.id;
        if (extracted) {
            // Recursively extract if nested
            return typeof extracted === 'object' ? extractId(extracted) : String(extracted);
        }
        // If it's an object but doesn't have _id or id, it might be a Mongoose ObjectId
        // often calling .toString() works, but in plain objects it gives [object Object]
        // So we return empty string if no clear ID is found to avoid [object Object]
        return '';
    }
    return String(id);
};
