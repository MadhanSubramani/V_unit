// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Package } from '@/types';
import { normalizePackageFromFirestore } from '@/lib/firestore-dates';
import { useAuth } from '@/context/AuthContext';
import StatsCard from '@/components/StatsCard';
import SearchFilter from '@/components/SearchFilter';
import PackageList from '@/components/PackageCard';
import AddPackageModal from '@/components/AddPackageModal';
import PackageTimelineDrawer from '@/components/PackageTimelineDrawer';
import { Clock, CheckCircle, XCircle, ShieldCheck, Plus, AlertCircle } from 'lucide-react';

const ITEMS_PER_PAGE = 5;

export default function DashboardHome() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [showTimelineDrawer, setShowTimelineDrawer] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    inProcess: 0,
    paymentCompleted: 0,
    operationCompleted: 0,
    operationCancelled: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    try {
      const packagesRef = collection(db, 'packages');
      const q = query(packagesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const fetchedPackages: Package[] = [];
      let inProcess = 0;
      let paymentCompleted = 0;
      let operationCompleted = 0;
      let operationCancelled = 0;

      querySnapshot.forEach((docSnap) => {
        const pkg = normalizePackageFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        );
        fetchedPackages.push(pkg);

        if (pkg.status === 'in_process') inProcess++;
        else if (pkg.status === 'payment_completed') paymentCompleted++;
        else if (pkg.status === 'operation_completed') operationCompleted++;
        else if (pkg.status === 'operation_cancelled') operationCancelled++;
      });

      setPackages(fetchedPackages);
      setStats({ inProcess, paymentCompleted, operationCompleted, operationCancelled });
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Apply filters
  useEffect(() => {
    let filtered = [...packages];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(search) ||
          (pkg.vendorName || pkg.vendorCode || '')
            .toLowerCase()
            .includes(search) ||
          pkg.description?.toLowerCase().includes(search) ||
          pkg.packageType?.toLowerCase().includes(search) ||
          pkg.createdBy?.toLowerCase().includes(search) ||
          pkg.updatedBy?.toLowerCase().includes(search)
      );
    }

    // Date filters
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      filtered = filtered.filter((pkg) => pkg.createdAt >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((pkg) => pkg.createdAt <= to);
    }

    setFilteredPackages(filtered);
    setCurrentPage(1);
  }, [packages, searchTerm, fromDate, toDate]);

  const handleEditPackage = (pkg: Package) => {
    setEditingPackage(pkg);
    setShowAddModal(true);
  };

  const handleDeletePackage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'packages', id));
      setDeleteId(null);
      await fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

  const totalPages = Math.ceil(filteredPackages.length / ITEMS_PER_PAGE);
  const paginatedPackages = filteredPackages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const clearFilters = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your packages and track status</p>
        </div>
        <button
          onClick={() => {
            setEditingPackage(null);
            setShowAddModal(true);
          }}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Add Package
        </button>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">

            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900">
                Delete Package
              </h3>
            </div>

            <p className="text-gray-700 mb-6">
              This action cannot be undone. Are you sure you want to delete this package?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 btn-secondary py-2"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDeletePackage(deleteId)}
                className="flex-1 btn-primary py-2 bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard
          title="In Process"
          count={stats.inProcess}
          icon={Clock}
          color="yellow"
          isLoading={isLoading}
        />
        <StatsCard
          title="Payment Completed"
          count={stats.paymentCompleted}
          icon={ShieldCheck}
          color="blue"
          isLoading={isLoading}
        />
        <StatsCard
          title="Operation Completed"
          count={stats.operationCompleted}
          icon={CheckCircle}
          color="green"
          isLoading={isLoading}
        />
        <StatsCard
          title="Operation Cancelled"
          count={stats.operationCancelled}
          icon={XCircle}
          color="red"
          isLoading={isLoading}
        />
      </div>

      {/* Search and Filters */}
      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onClearFilters={clearFilters}
      />

      {/* Results Count */}
      {!isLoading && (
        <p className="text-sm text-gray-500">
          Showing {paginatedPackages.length} of {filteredPackages.length} packages
        </p>
      )}

      {/* Package List */}
      <PackageList
        packages={paginatedPackages}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        isLoading={isLoading}
        onEdit={handleEditPackage}
        onDelete={(id) => setDeleteId(id)}
        canDelete={user?.role === 'admin'}
        onTrack={(pkg) => {
          setSelectedPackage(pkg);
          setShowTimelineDrawer(true);
        }}
      />

      {/* Add Package Modal */}
      <AddPackageModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchPackages}
        editingPackage={editingPackage}
        currentUser={user}
      />

      {/* Package Timeline Drawer */}
      <PackageTimelineDrawer
        isOpen={showTimelineDrawer}
        onClose={() => {
          setShowTimelineDrawer(false);
          setSelectedPackage(null);
        }}
        package={selectedPackage}
        currentUser={user}
        onRefresh={fetchPackages}
      />
    </div>
  );
}
