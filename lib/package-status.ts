import { Package } from '@/types';
import { formatDisplayAmount, getPackageTotalAmount } from './firestore-dates';

export { formatDisplayAmount, getPackageTotalAmount };

/** Payment is pending when billing is done and payment is missing or status is "pending". */
export function isPaymentPending(pkg: Package): boolean {
  const billingDone = pkg.timeline?.billing?.completed === true;
  if (!billingDone) return false;

  const payment = pkg.timeline?.payment;
  if (!payment) return true;

  return (payment.status?.toLowerCase() ?? '') === 'pending';
}

export function getPackageStatusLabel(pkg: Package): string {
  if (isPaymentPending(pkg)) return 'Payment Pending';

  const labels: Record<string, string> = {
    in_process: 'In Process',
    payment_pending: 'Payment Pending',
    payment_completed: 'Payment Pending',
    operation_completed: 'Operation Completed',
    operation_cancelled: 'Operation Cancelled',
  };

  return labels[pkg.status] ?? pkg.status;
}

export function getPackageStatusColor(pkg: Package): string {
  if (isPaymentPending(pkg)) return 'text-blue-600';

  const colors: Record<string, string> = {
    in_process: 'text-amber-600',
    payment_pending: 'text-blue-600',
    payment_completed: 'text-blue-600',
    operation_completed: 'text-green-600',
    operation_cancelled: 'text-red-600',
  };

  return colors[pkg.status] ?? 'text-gray-600';
}
