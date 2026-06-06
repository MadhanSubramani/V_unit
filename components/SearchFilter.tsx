// src/components/SearchFilter.tsx
'use client';

import { Search, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export type SearchType = 'name' | 'vendorName' | 'packageType' | 'blNo' | 'containerNo';

interface SearchFilterProps {
  searchTerm: string;
  searchType: SearchType;
  onSearchChange: (value: string) => void;
  onSearchTypeChange: (type: SearchType) => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onClearFilters: () => void;
}

const SEARCH_TYPES: { value: SearchType; label: string; placeholder: string }[] = [
  { value: 'name',        label: 'Package Name', placeholder: 'Search by package name...' },
  { value: 'vendorName',  label: 'Vendor Name',  placeholder: 'Search by vendor name...' },
  { value: 'blNo',        label: 'BL No',        placeholder: 'Search by BL number...' },
  { value: 'containerNo', label: 'Container No', placeholder: 'Search by container number...' },
  { value: 'packageType', label: 'Package Type', placeholder: 'Search by package type...' }
];

const DEBOUNCE_MS = 1500;

export default function SearchFilter({
  searchTerm,
  searchType,
  onSearchChange,
  onSearchTypeChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
}: SearchFilterProps) {
  // Local input value — updates instantly for UI responsiveness
  const [inputValue, setInputValue] = useState(searchTerm);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentType = SEARCH_TYPES.find((t) => t.value === searchType)!;
  const hasFilters = inputValue || fromDate || toDate;

  // Sync inputValue if parent clears searchTerm (e.g. clearFilters)
  useEffect(() => {
    if (searchTerm === '') setInputValue('');
  }, [searchTerm]);

  const handleInputChange = (value: string) => {
    setInputValue(value);

    // Clear any pending debounce
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (value.trim() === '') {
      // Clear immediately — no need to wait
      onSearchChange('');
      return;
    }

    // Debounce the actual search call by 3 seconds
    debounceTimer.current = setTimeout(() => {
      onSearchChange(value);
    }, DEBOUNCE_MS);
  };

  const handleClear = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setInputValue('');
    onSearchChange('');
  };

  const handleClearAll = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setInputValue('');
    onClearFilters();
  };

  return (
    <div className="card p-5 shadow-sm border border-gray-200">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">

        {/* Search Type + Input */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 mb-2">
            Search
          </label>

          <div className="flex rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 overflow-hidden">
            {/* Type dropdown */}
            <div className="relative shrink-0">
              <select
                value={searchType}
                onChange={(e) => {
                  // Only change type — keep the current search term as-is
                  onSearchTypeChange(e.target.value as SearchType);
                }}
                className="appearance-none h-full pl-3 pr-7 bg-gray-50 text-sm font-medium text-gray-700 focus:outline-none cursor-pointer border-r border-gray-300"
              >
                {SEARCH_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>

            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder={currentType.placeholder}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full h-[42px] pl-9 pr-9 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
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
            max={toDate || undefined}
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
            min={fromDate || undefined}
            onChange={(e) => onToDateChange(e.target.value)}
            className="input-field"
          />
        </div>

      </div>
    </div>
  );
}