// src/components/SearchFilter.tsx
'use client';

import { Search, Calendar, X } from 'lucide-react';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onClearFilters: () => void;
}

export default function SearchFilter({
  searchTerm,
  onSearchChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
}: SearchFilterProps) {
  const hasFilters = searchTerm || fromDate || toDate;

  return (
  <div className="card p-5 shadow-sm border border-gray-200">
  <div className="flex flex-col lg:flex-row lg:items-end gap-4">

    {/* Search */}
    <div className="flex-1">
      <label className="block text-xs font-semibold text-gray-500 mb-2">
        Search
      </label>

     <div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />

  <input
    type="text"
    placeholder="Search packages by name, vendor code..."
    value={searchTerm}
    onChange={(e) => onSearchChange(e.target.value)}
    className="input-field"
    style={{ paddingLeft: '44px' }}
  />
</div>
    </div>

    {/* From Date */}
    <div className="min-w-[180px]">
      <label className="block text-xs font-semibold text-gray-500 mb-2">
        From Date
      </label>

      <input
        type="date"
        value={fromDate}
        onChange={(e) => onFromDateChange(e.target.value)}
        className="input-field"
      />
    </div>

    {/* To Date */}
    <div className="min-w-[180px]">
      <label className="block text-xs font-semibold text-gray-500 mb-2">
        To Date
      </label>

      <input
        type="date"
        value={toDate}
        onChange={(e) => onToDateChange(e.target.value)}
        className="input-field"
      />
    </div>

    {/* Clear Button */}
    {hasFilters && (
      <button
        onClick={onClearFilters}
        className="h-[46px] px-4 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        Clear
      </button>
    )}
  </div>
</div>
  );
}
