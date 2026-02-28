const Permissions = {
  "super_admin": {
    "dashboard": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "hotels": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "packages": {
      "create": false,
      "read": false,
      "update": false,
      "delete": false
    },
    "bookings": {
      "create": false,
      "read": false,
      "update": false,
      "delete": false
    },
    "admins": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "rooms": {
      "create": false,
      "read": false,
      "update": false,
      "delete": false
    },
    "room_board": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "receipts": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "hotel_management": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "subscriptions": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    }
  },
  "admin": {
    "dashboard": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "hotels": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "packages": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "bookings": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "admins": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "rooms": {
      "create": false,
      "read": true,
      "update": false,
      "delete": false
    },
    "room_board": {
      "create": false,
      "read": true,
      "update": false,
      "delete": false
    },
    "receipts": {
      "create": false,
      "read": true,
      "update": false,
      "delete": false
    },
    "hotel_management": {
      "create": false,
      "read": false,
      "update": false,
      "delete": false
    },
    "subscriptions": {
      "create": false,
      "read": false,
      "update": false,
      "delete": false
    }
  },
  "sub_admin": {
    "dashboard": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "hotels": {
      "create": false,
      "read": false,
      "update": false,
      "delete": false
    },
    "packages": {
      "create": false,
      "read": false,
      "update": false,
      "delete": false
    },
    "bookings": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "admins": {
      "create": true,
      "read": true,
      "update": true,
      "delete": true
    },
    "rooms": {
      "create": false,
      "read": true,
      "update": false,
      "delete": false
    },
    "room_board": {
      "create": true,
      "read": true,
      "update": true,
      "delete": false
    },
    "receipts": {
      "create": true,
      "read": true,
      "update": false,
      "delete": false
    },
    "hotel_management": {
      "create": false,
      "read": false,
      "update": false,
      "delete": false
    },
    "subscriptions": {
      "create": false,
      "read": false,
      "update": false,
      "delete": false
    }
  }
};

/**
 * Normalize role name to match permissions key
 * @param {string} role - User role
 * @returns {string} - Normalized role name
 */
function normalizeRole(role) {
  if (!role) return role;
  // Handle super_admin role variations
  if (role === 'super_admin' || role === 'Super Admin' || role === 'SuperAdmin') {
    return 'super_admin';
  }
  // Convert to lowercase and replace spaces with underscores
  return role.toLowerCase().replace(/\s+/g, '_');
}

/**
 * Check if user has read/view permission for a module
 * @param {string} role - User role (SuperAdmin, Admin, etc.)
 * @param {string} module - Module name (dashboard, bookings, etc.)
 * @returns {boolean} - True if user has read permission
 */
export function hasViewPermissions(role, module) {
  const normalizedRole = normalizeRole(role);
  const rolePermissions = Permissions[normalizedRole];
  if (!rolePermissions) {
    return false;
  }
  const modulePermissions = rolePermissions[module];
  if (!modulePermissions) {
    return false;
  }
  return modulePermissions['read'];
}

/**
 * Check if user has update permission for a module
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {boolean} - True if user has update permission
 */
export function hasUpdatePermissions(role, module) {
  const normalizedRole = normalizeRole(role);
  const rolePermissions = Permissions[normalizedRole];
  if (!rolePermissions) {
    return false;
  }
  const modulePermissions = rolePermissions[module];
  if (!modulePermissions) {
    return false;
  }
  return modulePermissions['update'];
}

/**
 * Check if user has delete permission for a module
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {boolean} - True if user has delete permission
 */
export function hasDeletePermissions(role, module) {
  const normalizedRole = normalizeRole(role);
  const rolePermissions = Permissions[normalizedRole];
  if (!rolePermissions) {
    return false;
  }
  const modulePermissions = rolePermissions[module];
  if (!modulePermissions) {
    return false;
  }
  return modulePermissions['delete'];
}

/**
 * Check if user has create permission for a module
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {boolean} - True if user has create permission
 */
export function hasCreatePermissions(role, module) {
  const normalizedRole = normalizeRole(role);
  const rolePermissions = Permissions[normalizedRole];
  if (!rolePermissions) {
    return false;
  }
  const modulePermissions = rolePermissions[module];
  if (!modulePermissions) {
    return false;
  }
  return modulePermissions['create'];
}

/**
 * Check if user has route access permission for a module
 * Used for route protection - returns true if module exists and has read permission
 * @param {string} role - User role
 * @param {string} module - Module name
 * @returns {boolean} - True if user can access the route
 */
export function hasRoutePermissions(role, module) {
  const normalizedRole = normalizeRole(role);
  const rolePermissions = Permissions[normalizedRole];
  if (rolePermissions?.hasOwnProperty(module)) {
    const modulePermissions = rolePermissions[module];
    if (!modulePermissions) {
      return false;
    }
    return modulePermissions['read'];
  } else {
    return true; // If module not defined in permissions, allow access (backward compatibility)
  }
}

/**
 * Get all modules that a role has read access to
 * @param {string} role - User role
 * @returns {string[]} - Array of module names
 */
export function getAccessibleModules(role) {
  const normalizedRole = normalizeRole(role);
  const rolePermissions = Permissions[normalizedRole];
  if (!rolePermissions) {
    return [];
  }
  return Object.keys(rolePermissions).filter(module =>
    rolePermissions[module]?.read === true
  );
}

export default Permissions;

