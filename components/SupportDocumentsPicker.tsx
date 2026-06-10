'use client';

import { useRef } from 'react';
import { Paperclip, X, FileText, FileSpreadsheet, ImageIcon } from 'lucide-react';
import { SupportDocument } from '@/types';
import { getFileCategory, SUPPORT_DOCUMENT_ACCEPT } from '@/lib/file-utils';

export interface PendingSupportFile {
  id: string;
  file: File;
}

interface SupportDocumentsPickerProps {
  pendingFiles: PendingSupportFile[];
  existingDocuments?: SupportDocument[];
  onAddFiles: (files: File[]) => void;
  onRemovePending: (id: string) => void;
  disabled?: boolean;
}

function FileIcon({ name, type }: { name: string; type?: string }) {
  const category = getFileCategory(name, type);
  if (category === 'image') return <ImageIcon className="w-3.5 h-3.5" />;
  if (category === 'excel') return <FileSpreadsheet className="w-3.5 h-3.5" />;
  return <FileText className="w-3.5 h-3.5" />;
}

export default function SupportDocumentsPicker({
  pendingFiles,
  existingDocuments = [],
  onAddFiles,
  onRemovePending,
  disabled = false,
}: SupportDocumentsPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onAddFiles(files);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-gray-700">
          Support Documents
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <Paperclip className="w-4 h-4" />
          Add files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={SUPPORT_DOCUMENT_ACCEPT}
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </div>

      <p className="text-xs text-gray-500">
        Upload images, PDF, or Excel files (.jpg, .png, .pdf, .xls, .xlsx, .csv)
      </p>

      {(existingDocuments.length > 0 || pendingFiles.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {existingDocuments.map((doc) => (
            <span
              key={doc.url}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200"
            >
              <FileIcon name={doc.name} type={doc.type} />
              <span className="max-w-[160px] truncate">{doc.name}</span>
            </span>
          ))}

          {pendingFiles.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"
            >
              <FileIcon name={item.file.name} type={item.file.type} />
              <span className="max-w-[160px] truncate">{item.file.name}</span>
              <button
                type="button"
                onClick={() => onRemovePending(item.id)}
                disabled={disabled}
                className="hover:text-red-600"
                aria-label={`Remove ${item.file.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
