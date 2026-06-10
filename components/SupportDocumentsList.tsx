'use client';

import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import { SupportDocument } from '@/types';

interface SupportDocumentsListProps {
  documents?: SupportDocument[];
}

function downloadFile(doc: SupportDocument) {
  const link = document.createElement('a');
  link.href = doc.url;
  link.download = doc.name;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function SupportDocumentsList({ documents }: SupportDocumentsListProps) {
  if (!documents?.length) return null;

  const images = documents.filter((doc) => doc.type === 'image');
  const files = documents.filter((doc) => doc.type !== 'image');

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-900">Support Documents</p>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {images.map((doc) => (
            <button
              key={doc.url}
              type="button"
              onClick={() => downloadFile(doc)}
              className="group text-left rounded-xl border border-gray-200 overflow-hidden hover:border-blue-300 transition-colors"
            >
              <img
                src={doc.url}
                alt={doc.name}
                className="w-full h-32 object-cover bg-gray-50"
              />
              <div className="px-3 py-2 text-xs text-gray-600 truncate flex items-center gap-1">
                <Download className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                {doc.name}
              </div>
            </button>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((doc) => (
            <button
              key={doc.url}
              type="button"
              onClick={() => downloadFile(doc)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors text-left"
            >
              {doc.type === 'excel' ? (
                <FileSpreadsheet className="w-5 h-5 text-green-600 shrink-0" />
              ) : (
                <FileText className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span className="flex-1 text-sm text-gray-800 truncate">{doc.name}</span>
              <Download className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
