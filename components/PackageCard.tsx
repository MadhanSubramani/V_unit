// src/components/PackageCard.tsx
'use client';

import { Package } from '@/types';
import { Package as PackageIcon, Edit3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface PackageListProps {
  packages: Package[];
  isLoading: boolean;
  onEdit: (pkg: Package) => void;
  onDelete: (packageId: string) => void;
  canDelete: boolean;
  onTrack?: (pkg: Package) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}
const statusColors = {
  in_process: 'text-amber-600',
  payment_completed: 'text-blue-600',
  operation_completed: 'text-green-600',
  operation_cancelled: 'text-red-600',
};


const statusLabels = {
  in_process: 'In Process',
  payment_completed: 'Payment Completed',
  operation_completed: 'Operation Completed',
  operation_cancelled: 'Operation Cancelled',
};

export default function PackageList({
  packages,
  isLoading,
  onEdit,
  onDelete,
  canDelete,
  onTrack,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: PackageListProps) {
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
  <>
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full table-fixed">
        <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <tr>
            <th className="w-[12%] px-4 py-4 text-left text-xs font-bold uppercase text-gray-600">
              Package
            </th>

            <th className="w-[20%] px-4 py-4 text-left text-xs font-bold uppercase text-gray-600">
              Description
            </th>

            <th className="w-[12%] px-4 py-4 text-left text-xs font-bold uppercase text-gray-600">
              Vendor
            </th>

            <th className="w-[10%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
              BL No
            </th>

            <th className="w-[10%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
              Container No
            </th>

            <th className="w-[10%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
              Type
            </th>

            <th className="w-[6%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
              Qty
            </th>

            <th className="w-[8%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
              Weight
            </th>

            <th className="w-[6%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
              CBM
            </th>

            <th className="w-[8%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
              Status
            </th>

            <th className="w-[8%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {packages.map((pkg) => (
            <tr
              key={pkg.id}
              onClick={() => onTrack?.(pkg)}
              className="cursor-pointer transition-colors hover:bg-blue-50"
            >
              {/* Package */}
              <td className="px-4 py-4">
                <span
                  className="block truncate font-medium text-gray-900"
                  title={pkg.name}
                >
                  {pkg.name}
                </span>
              </td>

              {/* Description */}
              <td className="px-6 py-4 text-sm">
                <div className="group relative max-w-[220px]">
                  <p className="truncate text-gray-700">
                    {pkg.description || "-"}
                  </p>

                  {pkg.description && (
                    <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-72 break-words rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                      {pkg.description}
                    </div>
                  )}
                </div>
              </td>

              {/* Vendor */}
              <td className="px-4 py-4">
                <div
                  className="truncate text-sm text-gray-700"
                  title={pkg.vendorName || pkg.vendorCode}
                >
                  {pkg.vendorName || pkg.vendorCode || "-"}
                </div>
              </td>

              {/* BL No */}
              <td className="px-4 py-4 text-center text-sm text-gray-700">
                {pkg.blNo || "-"}
              </td>

              {/* Container No */}
              <td className="px-4 py-4 text-center text-sm text-gray-700">
                {pkg.containerNo || "-"}
              </td>

              {/* Type */}
              <td className="px-4 py-4 text-center text-sm text-gray-700">
                {pkg.packageType || "-"}
              </td>

              {/* Qty */}
              <td className="px-4 py-4 text-center text-sm text-gray-700">
                {pkg.packageCount ?? "-"}
              </td>

              {/* Weight */}
              <td className="px-4 py-4 text-center text-sm text-gray-700">
                {pkg.weight != null ? `${pkg.weight} kg` : "-"}
              </td>

              {/* CBM */}
              <td className="px-4 py-4 text-center text-sm text-gray-700">
                {pkg.cbm ?? "-"}
              </td>

              {/* Status */}
              <td className="px-4 py-4 text-center">
                <span
                  className={`text-sm font-semibold ${statusColors[pkg.status as keyof typeof statusColors]}`}
                >
                  {statusLabels[pkg.status as keyof typeof statusLabels]}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-4">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(pkg);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                    title="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pkg.id);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {totalPages > 1 && (
      <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <p className="text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
            )
            .map((page) => (
              <button
                key={page}
                onClick={() => onPageChange?.(page)}
                className={`h-9 min-w-[36px] rounded-lg px-3 text-sm ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
          ))}

          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )}
  </>
);
}
