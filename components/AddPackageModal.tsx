// src/components/AddPackageModal.tsx
'use client';

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, Loader2 } from 'lucide-react';

interface AddPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPackageModal({
  isOpen,
  onClose,
  onSuccess,
}: AddPackageModalProps) {
  const [name, setName] = useState('');
  const [vendorCode, setVendorCode] = useState('');
  const [status, setStatus] = useState<'in_process' | 'complete' | 'canceled'>('in_process');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setVendorCode('');
    setStatus('in_process');
    setDescription('');
    setAmount('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await addDoc(collection(db, 'packages'), {
        name,
        vendorCode,
        status,
        description,
        amount: amount ? parseFloat(amount) : 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding package:', err);
      setError('Failed to add package. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Add New Package</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
              Vendor Code *
            </label>
            <input
              type="text"
              value={vendorCode}
              onChange={(e) => setVendorCode(e.target.value)}
              className="input-field"
              placeholder="Enter vendor code"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="input-field"
            >
              <option value="in_process">In Process</option>
              <option value="complete">Complete</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field"
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
              placeholder="Enter description"
              rows={3}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
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
