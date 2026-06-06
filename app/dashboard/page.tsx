// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  limit,
  startAfter,
  getCountFromServer,
  QueryDocumentSnapshot,
  DocumentData,
  where,
  Timestamp,
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

type StatusFilter = 'in_process' | 'payment_completed' | 'operation_completed' | 'operation_cancelled' | null;

export default function DashboardHome() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [showTimelineDrawer, setShowTimelineDrawer] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>(null);

  const pageCursors = useRef<Map<number, QueryDocumentSnapshot<DocumentData>>>(new Map());

  const [stats, setStats] = useState({
    inProcess: 0,
    paymentCompleted: 0,
    operationCompleted: 0,
    operationCancelled: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchStats = useCallback(async () => {
    const ref = collection(db, 'packages');
    const [inProcess, paymentCompleted, operationCompleted, operationCancelled] =
      await Promise.all([
        getCountFromServer(query(ref, where('status', '==', 'in_process'))),
        getCountFromServer(query(ref, where('status', '==', 'payment_completed'))),
        getCountFromServer(query(ref, where('status', '==', 'operation_completed'))),
        getCountFromServer(query(ref, where('status', '==', 'operation_cancelled'))),
      ]);

    setStats({
      inProcess: inProcess.data().count,
      paymentCompleted: paymentCompleted.data().count,
      operationCompleted: operationCompleted.data().count,
      operationCancelled: operationCancelled.data().count,
    });
  }, []);

  const buildBaseConstraints = useCallback(() => {
    const constraints: Parameters<typeof query>[1][] = [orderBy('createdAt', 'desc')];

    // Status filter from card click
    if (activeStatus) {
      constraints.push(where('status', '==', activeStatus));
    }

    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(from)));
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(to)));
    }

    return constraints;
  }, [activeStatus, fromDate, toDate]);

  const fetchPage = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const packagesRef = collection(db, 'packages');
        const baseConstraints = buildBaseConstraints();

        const countSnap = await getCountFromServer(query(packagesRef, ...baseConstraints));
        setTotalCount(countSnap.data().count);

        const pageConstraints = [...baseConstraints, limit(ITEMS_PER_PAGE)];

        if (page > 1) {
          const cursor = pageCursors.current.get(page);
          if (cursor) pageConstraints.push(startAfter(cursor));
        }

        const snap = await getDocs(query(packagesRef, ...pageConstraints));

        if (!snap.empty) {
          const lastDoc = snap.docs[snap.docs.length - 1];
          pageCursors.current.set(page + 1, lastDoc);
        }

        const fetched: Package[] = snap.docs.map((d) =>
          normalizePackageFromFirestore(d.id, d.data() as Record<string, unknown>)
        );

        const filtered = searchTerm
          ? fetched.filter((pkg) => {
              const s = searchTerm.toLowerCase();
              return (
                pkg.name.toLowerCase().includes(s) ||
                (pkg.vendorName || pkg.vendorCode || '').toLowerCase().includes(s) ||
                pkg.description?.toLowerCase().includes(s) ||
                pkg.packageType?.toLowerCase().includes(s) ||
                pkg.createdBy?.toLowerCase().includes(s) ||
                pkg.updatedBy?.toLowerCase().includes(s)
              );
            })
          : fetched;

        setPackages(filtered);
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [buildBaseConstraints, searchTerm]
  );

  // Reset cursors + page when any filter changes
  useEffect(() => {
    pageCursors.current.clear();
    setCurrentPage(1);
  }, [searchTerm, fromDate, toDate, activeStatus]);

  useEffect(() => {
    fetchPage(currentPage);
  }, [currentPage, fetchPage]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Toggle status filter — clicking the same card again deselects it
  const handleStatusCardClick = (status: StatusFilter) => {
    setActiveStatus((prev) => (prev === status ? null : status));
  };

  const handleEditPackage = (pkg: Package) => {
    setEditingPackage(pkg);
    setShowAddModal(true);
  };

  const handleDeletePackage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'packages', id));
      setDeleteId(null);
      pageCursors.current.clear();
      setCurrentPage(1);
      await Promise.all([fetchPage(1), fetchStats()]);
    } catch (error) {
      console.error('Error deleting package:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setActiveStatus(null);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900">Delete Package</h3>
            </div>
            <p className="text-gray-700 mb-6">
              This action cannot be undone. Are you sure you want to delete this package?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 btn-secondary py-2">
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
          onClick={() => handleStatusCardClick('in_process')}
          isActive={activeStatus === 'in_process'}
        />
        <StatsCard
          title="Payment Completed"
          count={stats.paymentCompleted}
          icon={ShieldCheck}
          color="blue"
          isLoading={isLoading}
          onClick={() => handleStatusCardClick('payment_completed')}
          isActive={activeStatus === 'payment_completed'}
        />
        <StatsCard
          title="Operation Completed"
          count={stats.operationCompleted}
          icon={CheckCircle}
          color="green"
          isLoading={isLoading}
          onClick={() => handleStatusCardClick('operation_completed')}
          isActive={activeStatus === 'operation_completed'}
        />
        <StatsCard
          title="Operation Cancelled"
          count={stats.operationCancelled}
          icon={XCircle}
          color="red"
          isLoading={isLoading}
          onClick={() => handleStatusCardClick('operation_cancelled')}
          isActive={activeStatus === 'operation_cancelled'}
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

      {/* Results Count + Active Filter Badge */}
      {!isLoading && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">
            Showing {packages.length} of {totalCount} packages
          </p>
          {activeStatus && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {activeStatus.replace(/_/g, ' ')}
              <button
                onClick={() => setActiveStatus(null)}
                className="ml-1 hover:text-red-500 font-bold"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Package List */}
      <PackageList
        packages={packages}
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
        onSuccess={() => {
          pageCursors.current.clear();
          setCurrentPage(1);
          fetchPage(1);
          fetchStats();
        }}
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
        onRefresh={() => fetchPage(currentPage)}
      />
    </div>
  );
}