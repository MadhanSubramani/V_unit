export type SupportFileCategory = 'image' | 'pdf' | 'excel';

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const PDF_EXTENSIONS = ['pdf'];
const EXCEL_EXTENSIONS = ['xls', 'xlsx', 'csv'];

export const SUPPORT_DOCUMENT_ACCEPT =
  'image/jpeg,image/png,image/gif,image/webp,application/pdf,.pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,.xls,.xlsx,.csv';

export function getFileCategory(fileName: string, mimeType?: string): SupportFileCategory {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mime = (mimeType || '').toLowerCase();

  if (
    mime.startsWith('image/') ||
    IMAGE_EXTENSIONS.includes(ext)
  ) {
    return 'image';
  }
  if (mime === 'application/pdf' || PDF_EXTENSIONS.includes(ext)) {
    return 'pdf';
  }
  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime === 'text/csv' ||
    EXCEL_EXTENSIONS.includes(ext)
  ) {
    return 'excel';
  }
  return 'pdf';
}

export function formatWhatsAppPhone(mobile?: string): string | null {
  if (!mobile) return null;
  const digits = mobile.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}
