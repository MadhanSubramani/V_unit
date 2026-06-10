// src/app/dashboard/vendor-code/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Vendor } from '@/types';
import { Search } from 'lucide-react';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const initialFormState = {
  name: '',
  mobile: '',
  mailId: '',
  address: '',
  billingAddress: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobilePattern = /^[0-9]{10,15}$/;

export default function VendorCodePage() {
  const { user } = useAuth();
  const canDelete = user?.role === 'admin';
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [formError, setFormError] = useState('');
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);

  const fetchVendors = async () => {
    setIsLoading(true);
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
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (!trimmedSearch) return vendors;
    return vendors.filter((vendor) =>
      [vendor.name, vendor.mobile, vendor.mailId, vendor.address, vendor.billingAddress]
        .join(' ')
        .toLowerCase()
        .includes(trimmedSearch)
    );
  }, [vendors, searchTerm]);

  const openDrawer = () => {
    setEditingVendorId(null);
    setFormData(initialFormState);
    setFormError('');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingVendorId(null);
    setFormError('');
  };

  const handleInputChange = (field: keyof typeof initialFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Vendor name is required.';
    }
    if (!mobilePattern.test(formData.mobile.trim())) {
      return 'Mobile number must be 10-15 digits.';
    }
    if (!emailPattern.test(formData.mailId.trim())) {
      return 'Please enter a valid email address.';
    }
    if (!formData.address.trim()) {
      return 'Delivery address is required.';
    }
    if (!formData.billingAddress.trim()) {
      return 'Billing address is required.';
    }
    return '';
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        mailId: formData.mailId.trim(),
        address: formData.address.trim(),
        billingAddress: formData.billingAddress.trim(),
        updatedAt: Timestamp.now(),
      };

      if (editingVendorId) {
        const vendorDoc = doc(db, 'vendors', editingVendorId);
        await updateDoc(vendorDoc, payload);
      } else {
        await addDoc(collection(db, 'vendors'), {
          ...payload,
          createdAt: Timestamp.now(),
        });
      }

      await fetchVendors();
      closeDrawer();
    } catch (error) {
      console.error('Error saving vendor:', error);
      setFormError('Unable to save vendor. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendorId(vendor.id);
    setFormData({
      name: vendor.name,
      mobile: vendor.mobile,
      mailId: vendor.mailId,
      address: vendor.address,
      billingAddress: vendor.billingAddress,
    });
    setFormError('');
    setIsDrawerOpen(true);
  };

  const handleDelete = async (vendorId: string) => {
    const confirmed = window.confirm('Delete this vendor? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'vendors', vendorId));
      setVendors((current) => current.filter((vendor) => vendor.id !== vendorId));
    } catch (error) {
      console.error('Error deleting vendor:', error);
      window.alert('Unable to delete vendor. Please try again.');
    }
  };

  return (

<div >
   <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendor Code</h1>
            <p className="mt-2 text-gray-500 max-w-xl">
              Manage application users, roles, and access from one place.
            </p>
          </div>
          <button
           onClick={openDrawer}
            className="btn-primary flex items-center justify-center px-5 py-3"
          >
            Add Vendor
          </button>
        </div>
        <div className='h-5'></div>
   <div className="card p-4">
    
   <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

  {/* Title */}
   <div>
              <h2 className="text-lg font-semibold text-gray-900">Vendor Codes</h2>
              <p className="mt-1 text-sm text-gray-500">Quickly view and manage vendor codes in the system.</p>
            </div>

  {/* Search + Add Button */}
  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">

    <div className="relative w-full md:w-80">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
      />

      <input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search vendors..."
        className="input-field !pl-12"
      />
    </div>

    {/* <button
      id="vendor-open-btn"
      type="button"
      onClick={openDrawer}
      className="relative z-10 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
    >
      <Plus className="w-4 h-4" />
      Vendor
    </button> */}

  </div>

</div>
<div className='h-5' ></div>
    {/* <div className='h-5' ></div> */}

    <div className="md:hidden space-y-4">
  {isLoading ? (
    <div className="card p-6 text-center text-gray-500">
      Loading vendors...
    </div>
  ) : filteredVendors.length === 0 ? (
    <div className="card p-6 text-center text-gray-500">
      No vendors found.
    </div>
  ) : (
    filteredVendors.map((vendor) => (
      <div
        key={vendor.id}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
              {vendor.name?.charAt(0)?.toUpperCase()}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                {vendor.name}
              </h3>

              <p className="text-sm text-gray-500">
                {vendor.mobile}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Email
            </p>
            <p className="text-sm text-gray-800 break-all">
              {vendor.mailId}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
            Delivery  Address
            </p>
            <p className="text-sm text-gray-800">
              {vendor.address}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">
              Billing Address
            </p>
            <p className="text-sm text-gray-800">
              {vendor.billingAddress}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={() => handleEdit(vendor)}
            className="flex-1 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition"
          >
            Edit
          </button>

          {canDelete && (
            <button
              type="button"
              onClick={() => handleDelete(vendor.id)}
              className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 transition"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    ))
  )}
</div>

<div className="hidden md:block card overflow-x-auto border border-gray-200 shadow-sm">
  <table className="min-w-full">
    <thead className="bg-gradient-to-r bg-gray-50 to-indigo-50">
  <tr>
    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600">
      Vendor
    </th>

    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600">
      Mobile
    </th>

    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600">
      Email
    </th>

    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600">
      Delivery Address
    </th>

    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600">
      Billing Address
    </th>

    <th className="w-32 px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600">
      Actions
    </th>
  </tr>
</thead>

    <tbody className="divide-y divide-gray-100 bg-white">
      {isLoading ? (
        <tr>
          <td
            colSpan={6}
            className="px-6 py-10 text-center text-gray-500"
          >
            Loading vendors...
          </td>
        </tr>
      ) : filteredVendors.length === 0 ? (
        <tr>
          <td
            colSpan={6}
            className="px-6 py-10 text-center text-gray-500"
          >
            No vendors found.
          </td>
        </tr>
      ) : (
        filteredVendors.map((vendor) => (
          <tr
            key={vendor.id}
            className="hover:bg-blue-50 transition-colors"
          >
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                {/* <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  {vendor.name?.charAt(0)?.toUpperCase()}
                </div> */}

                <div>
               <p className="font-medium  text-sm text-gray-900">
  {vendor.name
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())}
</p>
                </div>
              </div>
            </td>

            <td className="px-6 py-4 text-sm  text-gray-700">
              {vendor.mobile}
            </td>

            <td className="px-6 py-4 text-sm  text-gray-700">
              {vendor.mailId}
            </td>

          <td className="px-6 py-4 text-sm ">
  <div className="group relative max-w-[220px]">
    <p className="truncate text-gray-700">
      {vendor.address}
    </p>

    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-72 break-words shadow-lg">
      {vendor.address}
    </div>
  </div>
</td>

         <td className="px-6 py-4 text-sm ">
  <div className="group relative max-w-[220px]">
    <p className="truncate text-gray-700">
      {vendor.billingAddress}
    </p>

    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-72 break-words shadow-lg">
      {vendor.billingAddress}
    </div>
  </div>
</td>

     <td className="w-32 px-6 py-4 txt-sm ">
  <div className="flex items-center justify-center gap-2">
    <button
      type="button"
      onClick={() => handleEdit(vendor)}
      className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600"
    >
      Edit
    </button>

    {canDelete && (
      <button
        type="button"
        onClick={() => handleDelete(vendor.id)}
        className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
      >
        Delete
      </button>
    )}
  </div>
</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDrawer}
          />
          <div className="relative ml-auto w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingVendorId ? 'Edit Vendor' : 'Add Vendor'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingVendorId
                    ? 'Update vendor details here.'
                    : 'Create a new vendor record.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vendor Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-field"
                  placeholder="Vendor name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile *</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className="input-field"
                  placeholder="10-15 digit mobile number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  value={formData.mailId}
                  onChange={(e) => handleInputChange('mailId', e.target.value)}
                  className="input-field"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="input-field resize-none"
                  placeholder="Enter delivery address"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Billing Address *</label>
                <textarea
                  value={formData.billingAddress}
                  onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                  className="input-field resize-none"
                  placeholder="Billing address"
                  rows={3}
                  required
                />
              </div>

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="btn-secondary flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-2.5"
                >
                  {editingVendorId ? 'Update Vendor' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  </div>

  
</div>

);
  
}
  