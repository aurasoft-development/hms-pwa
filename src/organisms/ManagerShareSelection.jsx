import { useState, useEffect } from 'react';
import { authApi } from '../api/authApi/authApi';

/**
 * ManagerShareSelection - Reusable component to select managers for WhatsApp sharing
 * 
 * @param {Array} selectedManagers - Array of strings (WhatsApp numbers)
 * @param {Function} setSelectedManagers - Function to update the parent state
 * @param {string} title - Optional title, defaults to "Share with Managers"
 */
export const ManagerShareSelection = ({ selectedManagers, setSelectedManagers, title = "Share with Managers" }) => {
    const [adminsList, setAdminsList] = useState([]);
    const [adminsLoading, setAdminsLoading] = useState(false);

    useEffect(() => {
        const fetchAdmins = async () => {
            setAdminsLoading(true);
            try {
                const response = await authApi.getAllUsers();
                const data = response.data || response || [];
                // Filter out those with whatsapp numbers
                const staff = data.filter(a => a.whatsappNumber);
                setAdminsList(staff);

                // If it's the first load and nothing is selected, pre-select default if available
                if (selectedManagers.length === 0) {
                    const defaultManager = staff.find(s => s.whatsappNumber === "8305912893");
                    if (defaultManager) {
                        setSelectedManagers([defaultManager.whatsappNumber]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch admins:', error);
            } finally {
                setAdminsLoading(false);
            }
        };
        fetchAdmins();
    }, []);

    const toggleManager = (whatsappNumber) => {
        if (selectedManagers.includes(whatsappNumber)) {
            setSelectedManagers(selectedManagers.filter(num => num !== whatsappNumber));
        } else {
            setSelectedManagers([...selectedManagers, whatsappNumber]);
        }
    };

    return (
        <div className="pt-4 border-t border-gray-100 mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
            {adminsLoading ? (
                <p className="text-gray-500 italic">Loading managers...</p>
            ) : adminsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {adminsList.map((manager) => (
                        <label
                            key={manager.id || manager._id}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${selectedManagers.includes(manager.whatsappNumber)
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300 shadow-sm'
                                }`}
                        >
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                checked={selectedManagers.includes(manager.whatsappNumber)}
                                onChange={() => toggleManager(manager.whatsappNumber)}
                            />
                            <div>
                                <p className="font-semibold text-gray-800">{manager.name}</p>
                                <p className="text-xs text-gray-500">{manager.whatsappNumber}</p>
                            </div>
                        </label>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed">
                    <p className="text-sm text-gray-500 italic">No managers found with WhatsApp numbers. Add them in Admin Management.</p>
                </div>
            )}
        </div>
    );
};
