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
    <div className="card p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search packages by name, vendor code..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className="input-field pl-10 w-full sm:w-44"
              />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                className="input-field pl-10 w-full sm:w-44"
              />
            </div>
          </div>

          {hasFilters && (
            <div className="flex items-end">
              <button
                onClick={onClearFilters}
                className="btn-secondary flex items-center gap-1 h-[42px]"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
