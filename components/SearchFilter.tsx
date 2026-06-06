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
          className="input-field pr-10"
          style={{ paddingLeft: '44px' }}
        />

        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
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

  </div>
</div>
  );
}
