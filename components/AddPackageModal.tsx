// src/components/AddPackageModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, Loader2 } from 'lucide-react';
import { Package, AuthUser, Vendor } from '@/types';


interface AddPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingPackage?: Package | null;
  currentUser: AuthUser | null;
}

const packageTypeOptions = [
  { value: 'Cartons', label: 'Cartons' },
  { value: 'Pallets', label: 'Pallets' },
  { value: 'Rolls', label: 'Rolls' },
  { value: 'Drums', label: 'Drums' },
];

export default function AddPackageModal({
  isOpen,
  onClose,
  onSuccess,
  editingPackage,
  currentUser,
}: AddPackageModalProps) {
  const [name, setName] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [status, setStatus] = useState<Package['status']>('in_process');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [cbm, setCbm] = useState('');
  const [packageType, setPackageType] = useState('');
  const [packageCount, setPackageCount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const resetForm = () => {
    setName('');
    setVendorId('');
    setStatus('in_process');
    setDescription('');
    setWeight('');
    setCbm('');
    setPackageType('');
    setPackageCount('');
    setError('');
  };

  const fetchVendors = async () => {
    try {
      const vendorsRef = collection(db, 'vendors');
      const q = query(vendorsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const loadedVendors: Vendor[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedVendors.push({
          id: docSnap.id,
          name: data.name || '',
          mobile: data.mobile || '',
          mailId: data.mailId || '',
          address: data.address || '',
          billingAddress: data.billingAddress || '',
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      });

      setVendors(loadedVendors);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Unable to load vendors. Please try again.');
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (editingPackage) {
      setName(editingPackage.name || '');
      setVendorId(
        editingPackage.vendorId ||
          vendors.find((vendor) => vendor.name === editingPackage.vendorName)?.id ||
          ''
      );
      setStatus(editingPackage.status || 'in_process');
      setDescription(editingPackage.description || '');
      setWeight(editingPackage.weight?.toString() || '');
      setCbm(editingPackage.cbm?.toString() || '');
      setPackageType(editingPackage.packageType || '');
      setPackageCount(editingPackage.packageCount?.toString() || '');
      setError('');
    } else {
      resetForm();
    }
  }, [editingPackage, isOpen, vendors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const selectedVendor = vendors.find((vendor) => vendor.id === vendorId);

    if (!name.trim() || !vendorId || !selectedVendor) {
      setError('Package name and vendor selection are required.');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        vendorId: selectedVendor.id,
        vendorCode: selectedVendor.id,
        vendorName: selectedVendor.name,
        status: editingPackage ? status : 'in_process',
        description: description.trim(),
        weight: weight ? parseFloat(weight) : undefined,
        cbm: cbm ? parseFloat(cbm) : undefined,
        packageType: packageType || undefined,
        packageCount: packageCount ? parseInt(packageCount, 10) : undefined,
        updatedAt: Timestamp.now(),
        updatedBy: currentUser?.username || 'Unknown',
      } as any;

      if (editingPackage) {
        await updateDoc(doc(db, 'packages', editingPackage.id), payload);
      } else {
        await addDoc(collection(db, 'packages'), {
          ...payload,
          status: 'in_process',
          createdAt: Timestamp.now(),
          createdBy: currentUser?.username || 'Unknown',
        });
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving package:', err);
      setError('Failed to save package. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingPackage ? 'Edit Package' : 'Add New Package'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Package Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Enter package name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Vendor *
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type of Packages
              </label>
              <select
                value={packageType}
                onChange={(e) => setPackageType(e.target.value)}
                className="input-field"
              >
                <option value="">Select package type</option>
                {packageTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                No. of Packages
              </label>
              <input
                type="number"
                value={packageCount}
                onChange={(e) => setPackageCount(e.target.value)}
                className="input-field"
                placeholder="Enter package count"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Weight (kg)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input-field"
                placeholder="Enter weight"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                CBM (cubic meters)
              </label>
              <input
                type="number"
                value={cbm}
                onChange={(e) => setCbm(e.target.value)}
                className="input-field"
                placeholder="Enter CBM"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
              placeholder="Describe this package"
              rows={4}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full sm:w-auto py-2.5 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : editingPackage ? (
                'Update Package'
              ) : (
                'Add Package'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
