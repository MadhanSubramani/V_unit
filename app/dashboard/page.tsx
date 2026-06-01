// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Package } from '@/types';
import StatsCard from '@/components/StatsCard';
import SearchFilter from '@/components/SearchFilter';
import PackageList from '@/components/PackageCard';
import AddPackageModal from '@/components/AddPackageModal';
import { Clock, CheckCircle, XCircle, Plus } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function DashboardHome() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    inProcess: 0,
    complete: 0,
    canceled: 0,
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
      let complete = 0;
      let canceled = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const pkg: Package = {
          id: doc.id,
          name: data.name,
          status: data.status,
          vendorCode: data.vendorCode,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          description: data.description,
          amount: data.amount,
        };
        fetchedPackages.push(pkg);

        if (pkg.status === 'in_process') inProcess++;
        else if (pkg.status === 'complete') complete++;
        else if (pkg.status === 'canceled') canceled++;
      });

      setPackages(fetchedPackages);
      setStats({ inProcess, complete, canceled });
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
          pkg.vendorCode.toLowerCase().includes(search) ||
          pkg.description?.toLowerCase().includes(search)
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

  // Pagination
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
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Add Package
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="In Process"
          count={stats.inProcess}
          icon={Clock}
          color="yellow"
          isLoading={isLoading}
        />
        <StatsCard
          title="Complete"
          count={stats.complete}
          icon={CheckCircle}
          color="green"
          isLoading={isLoading}
        />
        <StatsCard
          title="Canceled"
          count={stats.canceled}
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
      />

      {/* Add Package Modal */}
      <AddPackageModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchPackages}
      />
    </div>
  );
}
