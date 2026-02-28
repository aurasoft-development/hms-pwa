import { useState } from 'react';
import { PackageList } from '../organisms/PackageList';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';
import { Tabs } from '../molecules/Tabs';
import { theme } from '../utils/theme';

export default function PackageManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Food Package Management</h1>
        <p className="text-gray-600 mt-1">Manage all available food packages here.</p>
      </div>

      <PackageList type="food" />
    </div>
  );
}

