import { Package } from '@/types';
import { toDate } from '@/lib/firestore-dates';

const STAGE_LABELS: Record<string, string> = {
  packageCreated: 'Package Created',
  etd: 'ETD',
  eta: 'ETA',
  clearance: 'Clearance',
  cargoSegregation: 'Cargo Segregation',
  billing: 'Billing',
  payment: 'Payment',
  dispatch: 'Dispatch',
};

function formatAlertDate(value: unknown): string {
  const date = toDate(value);
  if (!date) return '-';
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatFieldDate(value: unknown): string | null {
  const date = toDate(value);
  if (!date) return null;
  return date.toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

function appendStageDetails(lines: string[], stageKey: string, data: Record<string, unknown>) {
  const dateFields: Record<string, string> = {
    etd: 'ETD Details',
    eta: 'ETA Details',
    clearance: 'Clearance Date',
    cargoSegregation: 'Segregation Date',
    billing: 'Billing Date',
    payment: 'Payment Date',
    dispatch: 'Dispatch Date',
  };

  if (data.status) {
    lines.push(`*Status:* ${data.status}`);
  }

  const dateKeys = [
    'estimatedDeparture',
    'shippedOnboardDate',
    'sailedDate',
    'approxArrivalDate',
    'arrivalDate',
    'expectedArrival',
    'clearanceDate',
    'segregationDate',
    'billingDate',
    'paymentDate',
    'dispatchDate',
  ];

  for (const key of dateKeys) {
    const formatted = formatFieldDate(data[key]);
    if (formatted) {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase());
      lines.push(`*${label}:* ${formatted}`);
    }
  }

  if (data.driverName) lines.push(`*Driver:* ${data.driverName}`);
  if (data.driverPhone) lines.push(`*Driver Phone:* ${data.driverPhone}`);
  if (data.truckNo) lines.push(`*Truck No:* ${data.truckNo}`);
  if (data.note) lines.push(`*Note:* ${data.note}`);

  if (dateFields[stageKey] && data.savedAt) {
    lines.push(`*${dateFields[stageKey]} Updated:* ${formatAlertDate(data.savedAt)}`);
  }
}

export function buildWhatsAppAlertMessage(
  pkg: Package,
  stageKey: string,
  stageData: Record<string, unknown>
): string {
  const lines = [
    '📦 *Package Update*',
    '',
    `*Package:* ${pkg.name}`,
    `*Tracking ID:* ${pkg.id.slice(0, 8).toUpperCase()}`,
    `*Vendor:* ${pkg.vendorName || '-'}`,
    `*Current Stage:* ${STAGE_LABELS[stageKey] || stageKey}`,
  ];

  if (pkg.blNo) lines.push(`*BL No:* ${pkg.blNo}`);
  if (pkg.containerNo) lines.push(`*Container No:* ${pkg.containerNo}`);
  if (pkg.packageType) lines.push(`*Package Type:* ${pkg.packageType}`);
  if (pkg.packageCount != null) lines.push(`*Quantity:* ${pkg.packageCount}`);
  if (pkg.weight != null) {
    lines.push(`*Weight:* ${pkg.weight} ${pkg.weightType || 'KG'}`);
  }
  if (pkg.cbm != null) lines.push(`*CBM:* ${pkg.cbm}`);

  lines.push('');
  appendStageDetails(lines, stageKey, stageData);

  if (stageData.savedAt) {
    lines.push(`*Stage Updated:* ${formatAlertDate(stageData.savedAt)}`);
  }
  if (stageData.savedBy) {
    lines.push(`*Updated By:* ${stageData.savedBy}`);
  }

  return lines.join('\n');
}
