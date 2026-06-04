// src/components/PackageCard.tsx
'use client';

import { Package } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  Package as PackageIcon,
  Edit3,
  Trash2,
} from 'lucide-react';

interface PackageListProps {
  packages: Package[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  onEdit: (pkg: Package) => void;
  onDelete: (packageId: string) => void;
  canDelete: boolean;
  onTrack?: (pkg: Package) => void;
}

const statusStyles = {
  in_process: 'bg-yellow-100 text-yellow-700',
  payment_completed: 'bg-blue-100 text-blue-700',
  operation_completed: 'bg-green-100 text-green-700',
  operation_cancelled: 'bg-red-100 text-red-700',
};
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
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
  onEdit,
  onDelete,
  canDelete,
  onTrack,
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
//     <div className="card overflow-hidden">
//       {/* Table Header */}
//      <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
//   <div className="col-span-2">Package</div>
//   <div className="col-span-3">Description</div>
//   <div className="col-span-2">Vendor</div>
//   <div className="col-span-1 text-center">Type</div>
//   <div className="col-span-1 text-center">Qty</div>
//   <div className="col-span-1 text-center">Weight</div>
//   <div className="col-span-1 text-center">CBM</div>
//   <div className="col-span-1 text-center">Status</div>
// </div>
//       {/* Package Items */}
//       <div className="divide-y divide-gray-100">
//         {packages.map((pkg) => (
//           <div
//             key={pkg.id}
//             className="p-4 md:px-6 md:py-4 hover:bg-gray-50 transition-colors duration-200"
//           >
//             <div className="md:grid md:grid-cols-12 md:gap-4 md:items-center">
//               <div className="col-span-3 min-w-0">
//                 <div className="flex items-start gap-3 mb-3 md:mb-0">
//                   <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
//                     <PackageIcon className="w-5 h-5 text-blue-600" />
//                   </div>
//                   <div className="min-w-0">
//                     <p
//                       className="font-medium text-gray-900 truncate"
//                       title={pkg.name}
//                     >
//                       {pkg.name}
//                     </p>
//                     {pkg.description ? (
//                       <p
//                         className="text-sm text-gray-500 truncate mt-1"
//                         title={pkg.description}
//                       >
//                         {pkg.description}
//                       </p>
//                     ) : (
//                       <p className="text-sm text-gray-400 mt-1">No description</p>
//                     )}
//                   </div>
//                 </div>
//                 <div className="text-xs text-gray-400 space-y-1">
//                   {pkg.createdBy && (
//                     <p title={`Created by ${pkg.createdBy}`}>Created by {pkg.createdBy}</p>
//                   )}
//                   {pkg.updatedBy && (
//                     <p title={`Updated by ${pkg.updatedBy}`}>Updated by {pkg.updatedBy}</p>
//                   )}
//                 </div>
//               </div>

//               <div className="col-span-2 hidden md:block">
//                 <span
//                   className="text-sm text-gray-600 font-mono block truncate"
//                   title={pkg.vendorName || pkg.vendorCode || '-'}
//                 >
//                   {pkg.vendorName || pkg.vendorCode || '-'}
//                 </span>
//               </div>

//               <div className="col-span-1 hidden md:block">
//                 <span className="text-sm text-gray-700 truncate" title={pkg.packageType || '-'}>
//                   {pkg.packageType || '-'}
//                 </span>
//               </div>

//               <div className="col-span-1 hidden md:block">
//                 <span className="text-sm text-gray-700">
//                   {pkg.packageCount ?? '-'}
//                 </span>
//               </div>

//               <div className="col-span-1 hidden md:block">
//                 <span className="text-sm text-gray-700">
//                   {pkg.weight != null ? `${pkg.weight} kg` : '-'}
//                 </span>
//               </div>

//               <div className="col-span-1 hidden md:block">
//                 <span className="text-sm text-gray-700">
//                   {pkg.cbm != null ? pkg.cbm : '-'}
//                 </span>
//               </div>

//               <div className="col-span-2">
//                 <span
//                   className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
//                     statusStyles[pkg.status]
//                   }`}
//                 >
//                   {statusLabels[pkg.status]}
//                 </span>
//               </div>

//               <div className="col-span-2 mt-4 md:mt-0 flex flex-wrap justify-end gap-2">
//                 <button
//                   onClick={() => onEdit(pkg)}
//                   className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
//                 >
//                   <Edit3 className="w-3.5 h-3.5" />
//                   Edit
//                 </button>
//                 {canDelete && (
//                   <button
//                     onClick={() => onDelete(pkg.id)}
//                     className="inline-flex items-center gap-2 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
//                   >
//                     <Trash2 className="w-3.5 h-3.5" />
//                     Delete
//                   </button>
//                 )}
//               </div>

//               <div className="md:hidden flex flex-col gap-2 mt-4">
//                 <div className="flex flex-wrap gap-3 text-sm text-gray-500">
//                   <span title={`Type: ${pkg.packageType || '-'}`}>Type: {pkg.packageType || '-'}</span>
//                   <span title={`Qty: ${pkg.packageCount ?? '-'}`}>Qty: {pkg.packageCount ?? '-'}</span>
//                   <span title={`Weight: ${pkg.weight != null ? pkg.weight + ' kg' : '-'}`}>Weight: {pkg.weight != null ? pkg.weight + ' kg' : '-'}</span>
//                   <span title={`CBM: ${pkg.cbm != null ? pkg.cbm : '-'}`}>CBM: {pkg.cbm != null ? pkg.cbm : '-'}</span>
//                 </div>
//                 <div className="flex flex-wrap gap-2 items-center">
//                   <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium text-gray-700 bg-gray-100">
//                     {statusLabels[pkg.status]}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
//           <p className="text-sm text-gray-500">
//             Page {currentPage} of {totalPages}
//           </p>
//           <div className="flex gap-2">
//             <button
//               onClick={() => onPageChange(currentPage - 1)}
//               disabled={currentPage === 1}
//               className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               <ChevronLeft className="w-4 h-4" />
//             </button>
//             <button
//               onClick={() => onPageChange(currentPage + 1)}
//               disabled={currentPage === totalPages}
//               className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               <ChevronRight className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
<div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
  <table className="w-full table-fixed">
    <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
      <tr>
        <th className="w-[15%] px-4 py-4 text-left text-xs font-bold uppercase text-gray-600">
          Package
        </th>

        <th className="w-[25%] px-4 py-4 text-left text-xs font-bold uppercase text-gray-600">
          Description
        </th>

        <th className="w-[15%] px-4 py-4 text-left text-xs font-bold uppercase text-gray-600">
          Vendor
        </th>

        <th className="w-[10%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
          Type
        </th>

        <th className="w-[8%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
          Qty
        </th>

        <th className="w-[10%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
          Weight
        </th>

        <th className="w-[7%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
          CBM
        </th>

        <th className="w-[10%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
          Status
        </th>

        <th className="w-[10%] px-4 py-4 text-center text-xs font-bold uppercase text-gray-600">
          Actions
        </th>
      </tr>
    </thead>

    <tbody className="divide-y divide-gray-100">
      {packages.map((pkg) => (
        <tr
          key={pkg.id}
          onClick={() => onTrack?.(pkg)}
          className="hover:bg-blue-50 transition-colors cursor-pointer"
        >
          {/* Package */}
          <td className="px-4 py-4">
  <span
    className="font-medium text-gray-900 truncate block"
    title={pkg.name}
  >
    {pkg.name}
  </span>
  </td>

 <td className="px-6 py-4 text-sm ">
  <div className="group relative max-w-[220px]">
    <p className="truncate text-gray-700">
      {pkg.description }
    </p>

    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 w-72 break-words shadow-lg">
      {pkg.description }
    </div>
  </div>
</td>

          {/* Vendor */}
          <td className="px-4 py-4">
            <div
              className="truncate text-sm text-gray-700"
              title={pkg.vendorName || pkg.vendorCode}
            >
              {pkg.vendorName || pkg.vendorCode || '-'}
            </div>
          </td>

          {/* Type */}
          <td className="px-4 py-4 text-center text-sm text-gray-700">
            {pkg.packageType || '-'}
          </td>

          {/* Qty */}
          <td className="px-4 py-4 text-center text-sm text-gray-700">
            {pkg.packageCount ?? '-'}
          </td>

          {/* Weight */}
          <td className="px-4 py-4 text-center text-sm text-gray-700">
            {pkg.weight ? `${pkg.weight} kg` : '-'}
          </td>

          {/* CBM */}
          <td className="px-4 py-4 text-center text-sm text-gray-700">
            {pkg.cbm ?? '-'}
          </td>

          {/* Status */}
        <td className="px-4 py-4 text-center">
  <span
    className={`text-sm font-semibold ${statusColors[pkg.status]}`}
  >
    {statusLabels[pkg.status]}
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
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                title="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(pkg.id);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
  );
}
