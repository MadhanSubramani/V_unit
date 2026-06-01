// src/components/PackageList.tsx
'use client';

import { Package } from '@/types';
import { ChevronLeft, ChevronRight, Package as PackageIcon } from 'lucide-react';

interface PackageListProps {
  packages: Package[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

const statusStyles = {
  in_process: 'bg-yellow-100 text-yellow-700',
  complete: 'bg-green-100 text-green-700',
  canceled: 'bg-red-100 text-red-700',
};

const statusLabels = {
  in_process: 'In Process',
  complete: 'Complete',
  canceled: 'Canceled',
};

export default function PackageList({
  packages,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
}: PackageListProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PackageIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No packages found</h3>
        <p className="text-gray-500">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
        <div className="col-span-4">Package Name</div>
        <div className="col-span-2">Vendor Code</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Amount</div>
        <div className="col-span-2">Date</div>
      </div>

      {/* Package Items */}
      <div className="divide-y divide-gray-100">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="p-4 md:px-6 md:py-4 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="md:grid md:grid-cols-12 md:gap-4 md:items-center">
              {/* Package Name */}
              <div className="col-span-4 flex items-center gap-3 mb-3 md:mb-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <PackageIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{pkg.name}</p>
                  {pkg.description && (
                    <p className="text-sm text-gray-500 truncate">{pkg.description}</p>
                  )}
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden flex flex-wrap gap-2 mb-2">
                <span className="text-sm text-gray-500">
                  <span className="font-medium">Code:</span> {pkg.vendorCode}
                </span>
                <span className="text-sm text-gray-500">
                  <span className="font-medium">Amount:</span> ${pkg.amount?.toFixed(2) || '0.00'}
                </span>
              </div>

              {/* Vendor Code - Desktop */}
              <div className="col-span-2 hidden md:block">
                <span className="text-sm text-gray-600 font-mono">{pkg.vendorCode}</span>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                    statusStyles[pkg.status]
                  }`}
                >
                  {statusLabels[pkg.status]}
                </span>
              </div>

              {/* Amount - Desktop */}
              <div className="col-span-2 hidden md:block">
                <span className="text-sm font-medium text-gray-900">
                  ${pkg.amount?.toFixed(2) || '0.00'}
                </span>
              </div>

              {/* Date */}
              <div className="col-span-2 mt-2 md:mt-0">
                <span className="text-sm text-gray-500">{formatDate(pkg.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
