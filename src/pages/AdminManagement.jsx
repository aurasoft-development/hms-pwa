import { AdminList } from '../organisms/AdminList';

export default function AdminManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
        <p className="text-gray-600 mt-1">Manage admin users</p>
      </div>

      <AdminList />
    </div>
  );
}

