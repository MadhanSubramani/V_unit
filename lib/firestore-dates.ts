import { Timestamp } from 'firebase/firestore';
import {
  Package,
  PackageTimeline,
  TimelineStage,
  ETDETAData,
  ClearanceData,
  CargoSegregationData,
  BillingData,
  PaymentData,
  DispatchData,
} from '@/types';

/** Convert Firestore Timestamp, Date, ISO string, or { seconds } to Date */
export function toDate(value: unknown): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : value;
  }
  if (value instanceof Timestamp) {
    const d = value.toDate();
    return isNaN(d.getTime()) ? undefined : d;
  }
  if (typeof value === 'object' && value !== null) {
    const v = value as { toDate?: () => Date; seconds?: number };
    if (typeof v.toDate === 'function') {
      const d = v.toDate();
      return isNaN(d.getTime()) ? undefined : d;
    }
    if (typeof v.seconds === 'number') {
      const d = new Date(v.seconds * 1000);
      return isNaN(d.getTime()) ? undefined : d;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

/** Format for HTML input[type=date] */
export function formatDateForInput(value: unknown): string {
  const date = toDate(value);
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeStage<T extends TimelineStage>(
  stage: T | undefined,
  dateFields: string[]
): T | undefined {
  if (!stage) return undefined;
  const out: any = { ...stage } as T & Record<string, unknown>;
  if ('savedAt' in out && out.savedAt != null) {
    out.savedAt = toDate(out.savedAt);
  }
  for (const field of dateFields) {
    if (field in out && out[field] != null) {
      out[field] = toDate(out[field]);
    }
  }
  return out as T;
}

export function normalizeTimeline(
  raw: Record<string, unknown> | undefined
): PackageTimeline | undefined {
  if (!raw) return undefined;

  return {
    packageCreated: normalizeStage(
      raw.packageCreated as TimelineStage,
      []
    ),
    etdEta: normalizeStage(
      raw.etdEta as ETDETAData,
      [
        'estimatedDeparture',
        'shippedOnboardDate',
        'sailedDate',
        'expectedArrival',
      ]
    ),
    clearance: normalizeStage(
      raw.clearance as ClearanceData,
      ['clearanceDate']
    ),
    cargoSegregation: normalizeStage(
      raw.cargoSegregation as CargoSegregationData,
      ['segregationDate']
    ),
    billing: normalizeStage(
      raw.billing as BillingData,
      ['billingDate']
    ),
    payment: normalizeStage(
      raw.payment as PaymentData,
      ['paymentDate']
    ),
    dispatch: normalizeStage(
      raw.dispatch as DispatchData,
      ['dispatchDate']
    ),
  };
}

export function normalizePackageFromFirestore(
  id: string,
  data: Record<string, unknown>
): Package {
  return {
    id,
    name: data.name as string,
    status: data.status as Package['status'],
    vendorId: data.vendorId as string | undefined,
    vendorCode: data.vendorCode as string | undefined,
    vendorName: data.vendorName as string | undefined,
    description: data.description as string | undefined,
    amount: data.amount as number | undefined,
    weight: data.weight as number | undefined,
    cbm: data.cbm as number | undefined,
    packageType: data.packageType as string | undefined,
    packageCount: data.packageCount as number | undefined,
    blNo: data.blNo as string | undefined,
    containerNo: data.containerNo as string | undefined,
    amountPerCbm: data.amountPerCbm as number | undefined,
    totalAmount: data.totalAmount as number | undefined,
    weightType: data.weightType as 'KG' | 'TON' | undefined,
    vendorDeliveryAddress: data.vendorDeliveryAddress as string | undefined,
    vendorBillingAddress: data.vendorBillingAddress as string | undefined,
    createdBy: data.createdBy as string | undefined,
    updatedBy: data.updatedBy as string | undefined,
    cancelReason: data.cancelReason as string | undefined,
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
    completedAt: toDate(data.completedAt),
    cancelledAt: toDate(data.cancelledAt),
    timeline: normalizeTimeline(data.timeline as Record<string, unknown> | undefined),
  };
}
