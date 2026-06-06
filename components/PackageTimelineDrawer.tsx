'use client';

import { useState, useEffect, useRef } from 'react';
import {
  doc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  formatDateForInput,
  normalizePackageFromFirestore,
} from '@/lib/firestore-dates';
import { Package, Operation, AuthUser, ETDData, ETAData } from '@/types';
import {
  X,
  CheckCircle,
  Circle,
  Lock,
  Bell,
  AlertCircle,
  Check,
  Trash2,
  Loader2,
} from 'lucide-react';

interface PackageTimelineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  package: Package | null;
  currentUser: AuthUser | null;
  onRefresh: () => void;
}

const STAGES = [
  { id: 'packageCreated', label: 'Package Created' },
  { id: 'etd', label: 'ETD' },
  { id: 'eta', label: 'ETA' },
  { id: 'clearance', label: 'Clearance' },
  { id: 'cargoSegregation', label: 'Cargo Segregation' },
  { id: 'billing', label: 'Billing' },
  { id: 'payment', label: 'Payment' },
  { id: 'dispatch', label: 'Dispatch' },
];

const dateToTimestamp = (date: Date | undefined | null): Timestamp | undefined => {
  if (!date) return undefined;
  try {
    return Timestamp.fromDate(date instanceof Date ? date : new Date(date));
  } catch {
    return undefined;
  }
};

export default function PackageTimelineDrawer({
  isOpen,
  onClose,
  package: pkg,
  currentUser,
  onRefresh,
}: PackageTimelineDrawerProps) {
  const [activeStage, setActiveStage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [operationsList, setOperationsList] = useState<Operation[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [localPackage, setLocalPackage] = useState<Package | null>(pkg);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const timeline = localPackage?.timeline || {};

  const isStageCompletedWithTimeline = (timelineObj: any, stageIndex: number): boolean => {
    const stage = STAGES[stageIndex];
    if (stageIndex === 0) return timelineObj.packageCreated?.completed || false;
    if (stage.id === 'etd') return timelineObj.etd?.completed || timelineObj.etdEta?.completed || false;
    if (stage.id === 'eta') return timelineObj.eta?.completed || timelineObj.etdEta?.completed || false;
    if (stage.id === 'clearance') return timelineObj.clearance?.completed || false;
    if (stage.id === 'cargoSegregation')
      return timelineObj.cargoSegregation?.completed || false;
    if (stage.id === 'billing') return timelineObj.billing?.completed || false;
    if (stage.id === 'payment') return timelineObj.payment?.completed || false;
    if (stage.id === 'dispatch') return timelineObj.dispatch?.completed || false;
    return false;
  };

  const isStageCompleted = (stageIndex: number): boolean => {
    return isStageCompletedWithTimeline(timeline, stageIndex);
  };

  const isStageUnlocked = (stageIndex: number): boolean => {
    if (stageIndex === 0) return true;
    return isStageCompleted(stageIndex - 1);
  };

  const getActiveStageFromTimeline = (): number => {
    for (let i = 0; i < STAGES.length; i++) {
      if (!isStageCompleted(i) && isStageUnlocked(i)) {
        return i;
      }
    }
    return STAGES.length - 1;
  };

  const moveToNextStage = () => {
    const nextStage = activeStage + 1;
    if (nextStage < STAGES.length && isStageUnlocked(nextStage)) {
      setActiveStage(nextStage);
    }
  };

  const fetchUpdatedPackage = async (): Promise<Package | null> => {
    if (!pkg?.id) return null;
    try {
      const docRef = doc(db, 'packages', pkg.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const updatedPkg = normalizePackageFromFirestore(
          docSnap.id,
          docSnap.data() as Record<string, unknown>
        );
        setLocalPackage(updatedPkg);
        return updatedPkg;
      }
    } catch (err) {
      console.error('Error fetching updated package:', err);
    }
    return null;
  };

  useEffect(() => {
    if (isOpen) {
      setInitialLoadComplete(false);

      const initializeDrawer = async () => {
        // Fetch latest package data from Firebase
        const updatedPkg = await fetchUpdatedPackage();
        const pkgToUse = updatedPkg || pkg;
        setLocalPackage(pkgToUse);

        // Fetch operations
        await fetchOperations();

        // Calculate and set active stage based on updated data
        if (pkgToUse?.timeline) {
          const timelineToUse = pkgToUse.timeline || {};

          // Check which stage is the first uncompleted but unlocked one
          for (let i = 0; i < STAGES.length; i++) {
            if (!isStageCompletedWithTimeline(timelineToUse, i)) {
              setActiveStage(i);
              break;
            }
          }
        } else {
          setActiveStage(0);
        }

        setInitialLoadComplete(true);
      };

      initializeDrawer();
    } else {
      setLocalPackage(null);
      setInitialLoadComplete(false);
    }
  }, [isOpen, pkg?.id]);

  const fetchOperations = async () => {
    try {
      const opsRef = collection(db, 'operations');
      const snapshot = await getDocs(opsRef);
      const ops: Operation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        ops.push({
          id: docSnap.id,
          type: data.type,
          status: Array.isArray(data.status) ? data.status : [],
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        });
      });
      setOperationsList(ops);
    } catch (err) {
      console.error('Error fetching operations:', err);
    }
  };

  const getStageIcon = (stageIndex: number) => {
    if (isStageCompleted(stageIndex))
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (isStageUnlocked(stageIndex))
      return <Circle className="w-5 h-5 text-blue-500" />;
    return <Lock className="w-5 h-5 text-gray-300" />;
  };

  const handleStageClick = (index: number) => {
    if (isStageUnlocked(index)) {
      setActiveStage(index);
    }
  };

  if (!isOpen || !localPackage) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />

      <div className="relative w-full max-w-[600px] h-full bg-white shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{localPackage.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Tracking #{localPackage.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {successMessage && (
          <div className="px-6 py-3 bg-green-50 border-b border-green-200 text-green-700 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Timeline Sidebar */}
          <div className="w-48 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            {STAGES.map((stage, index) => (
              <button
                key={stage.id}
                onClick={() => handleStageClick(index)}
                disabled={!isStageUnlocked(index)}
                className={`w-full px-4 py-4 border-l-4 transition-colors text-left ${
                  activeStage === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-transparent hover:bg-gray-100'
                } ${!isStageUnlocked(index) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getStageIcon(index)}
                  <span className="text-sm font-medium text-gray-900">
                    {stage.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 ml-7">
                  {isStageCompleted(index) ? 'Completed' : 'Pending'}
                </p>
              </button>
            ))}
          </div>

          {/* Stage Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {!initialLoadComplete ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-500">Loading package data...</p>
                </div>
              ) : activeStage === 0 ? (
                <StagePackageCreated
                  key={`created-${localPackage.id}-${localPackage.updatedAt.getTime()}`}
                  pkg={localPackage}
                  timeline={timeline}
                  currentUser={currentUser}
                  onSave={async (data) => {
                    try {
                      setLoading(true);
                      await updateDoc(doc(db, 'packages', localPackage.id), {
                        name: data.name,
                        description: data.description,
                        packageType: data.packageType,
                        packageCount: data.packageCount,
                        weight: data.weight,
                        cbm: data.cbm,
                        vendorId: data.vendorId,
                        vendorName: data.vendorName,
                        vendorCode: data.vendorCode,
                        'timeline.packageCreated': {
                          completed: true,
                          savedAt: Timestamp.now(),
                          savedBy: currentUser?.username,
                        },
                        updatedAt: Timestamp.now(),
                        updatedBy: currentUser?.username,
                      });
                      setSuccessMessage('Package details saved successfully');
                      setTimeout(() => setSuccessMessage(''), 3000);
                      onRefresh();
                      await fetchUpdatedPackage();
                      moveToNextStage();
                    } catch (err) {
                      console.error('Error saving package:', err);
                      setErrorMessage('Failed to save package details');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  isLoading={loading}
                />
              ) : activeStage === 1 ? (
                <StageETD
                  key={`etd-${localPackage.id}-${localPackage.updatedAt.getTime()}`}
                  timeline={timeline}
                  currentUser={currentUser}
                  onSave={async (data) => {
                    try {
                      setLoading(true);
                      const etdUpdate: any = {
                        note: data.note || '',
                        completed: true,
                        savedAt: Timestamp.now(),
                        savedBy: currentUser?.username,
                      };
                      if (data.estimatedDeparture) etdUpdate.estimatedDeparture = dateToTimestamp(data.estimatedDeparture);
                      if (data.shippedOnboardDate) etdUpdate.shippedOnboardDate = dateToTimestamp(data.shippedOnboardDate);
                      if (data.sailedDate) etdUpdate.sailedDate = dateToTimestamp(data.sailedDate);
                      
                      await updateDoc(doc(db, 'packages', localPackage.id), {
                        'timeline.etd': etdUpdate,
                        updatedAt: Timestamp.now(),
                        updatedBy: currentUser?.username,
                      });
                      setSuccessMessage('ETD saved successfully');
                      setTimeout(() => setSuccessMessage(''), 3000);
                      onRefresh();
                      await fetchUpdatedPackage();
                      moveToNextStage();
                    } catch (err) {
                      console.error('Error saving ETD:', err);
                      setErrorMessage('Failed to save ETD');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  isLoading={loading}
                />
              ) : activeStage === 2 ? (
                <StageETA
                  key={`eta-${localPackage.id}-${localPackage.updatedAt.getTime()}`}
                  timeline={timeline}
                  currentUser={currentUser}
                  onSave={async (data) => {
                    try {
                      setLoading(true);
                      const etaUpdate: any = {
                        note: data.note || '',
                        completed: true,
                        savedAt: Timestamp.now(),
                        savedBy: currentUser?.username,
                      };
                      if (data.approxArrivalDate) etaUpdate.approxArrivalDate = dateToTimestamp(data.approxArrivalDate);
                      if (data.arrivalDate) etaUpdate.arrivalDate = dateToTimestamp(data.arrivalDate);
                      if (data.status) etaUpdate.status = data.status;
                      
                      await updateDoc(doc(db, 'packages', localPackage.id), {
                        'timeline.eta': etaUpdate,
                        updatedAt: Timestamp.now(),
                        updatedBy: currentUser?.username,
                      });
                      setSuccessMessage('ETA saved successfully');
                      setTimeout(() => setSuccessMessage(''), 3000);
                      onRefresh();
                      await fetchUpdatedPackage();
                      moveToNextStage();
                    } catch (err) {
                      console.error('Error saving ETA:', err);
                      setErrorMessage('Failed to save ETA');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  isLoading={loading}
                />
              ) : activeStage === 3 ? (
                <StageClearance
                  key={`clearance-${localPackage.id}-${localPackage.updatedAt.getTime()}`}
                  timeline={timeline}
                  currentUser={currentUser}
                  operations={operationsList}
                  onSave={async (data) => {
                    try {
                      setLoading(true);
                      const clearanceUpdate: any = {
                        status: data.status || '',
                        note: data.note || '',
                        completed: true,
                        savedAt: Timestamp.now(),
                        savedBy: currentUser?.username,
                      };
                      if (data.clearanceDate) clearanceUpdate.clearanceDate = dateToTimestamp(data.clearanceDate);
                      
                      await updateDoc(doc(db, 'packages', localPackage.id), {
                        'timeline.clearance': clearanceUpdate,
                        updatedAt: Timestamp.now(),
                        updatedBy: currentUser?.username,
                      });
                      setSuccessMessage('Clearance saved successfully');
                      setTimeout(() => setSuccessMessage(''), 3000);
                      onRefresh();
                      await fetchUpdatedPackage();
                      moveToNextStage();
                    } catch (err) {
                      console.error('Error saving clearance:', err);
                      setErrorMessage('Failed to save clearance');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  isLoading={loading}
                />
              ) : activeStage === 4 ? (
                <StageCargoSegregation
                  key={`cargo-${localPackage.id}-${localPackage.updatedAt.getTime()}`}
                  timeline={timeline}
                  currentUser={currentUser}
                  operations={operationsList}
                  onSave={async (data) => {
                    try {
                      setLoading(true);
                      const cargoUpdate: any = {
                        status: data.status || '',
                        note: data.note || '',
                        completed: true,
                        savedAt: Timestamp.now(),
                        savedBy: currentUser?.username,
                      };
                      if (data.segregationDate) cargoUpdate.segregationDate = dateToTimestamp(data.segregationDate);
                      
                      await updateDoc(doc(db, 'packages', localPackage.id), {
                        'timeline.cargoSegregation': cargoUpdate,
                        updatedAt: Timestamp.now(),
                        updatedBy: currentUser?.username,
                      });
                      setSuccessMessage('Cargo Segregation saved successfully');
                      setTimeout(() => setSuccessMessage(''), 3000);
                      onRefresh();
                      await fetchUpdatedPackage();
                      moveToNextStage();
                    } catch (err) {
                      console.error('Error saving cargo segregation:', err);
                      setErrorMessage('Failed to save cargo segregation');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  isLoading={loading}
                />
              ) : activeStage === 5 ? (
                <StageBilling
                  key={`billing-${localPackage.id}-${localPackage.updatedAt.getTime()}`}
                  timeline={timeline}
                  currentUser={currentUser}
                  operations={operationsList}
                  onSave={async (data) => {
                    try {
                      setLoading(true);
                      const billingUpdate: any = {
                        status: data.status || '',
                        note: data.note || '',
                        completed: true,
                        savedAt: Timestamp.now(),
                        savedBy: currentUser?.username,
                      };
                      if (data.billingDate) billingUpdate.billingDate = dateToTimestamp(data.billingDate);
                      
                      await updateDoc(doc(db, 'packages', localPackage.id), {
                        'timeline.billing': billingUpdate,
                        updatedAt: Timestamp.now(),
                        updatedBy: currentUser?.username,
                      });
                      setSuccessMessage('Billing saved successfully');
                      setTimeout(() => setSuccessMessage(''), 3000);
                      onRefresh();
                      await fetchUpdatedPackage();
                      moveToNextStage();
                    } catch (err) {
                      console.error('Error saving billing:', err);
                      setErrorMessage('Failed to save billing');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  isLoading={loading}
                />
              ) : activeStage === 6 ? (
                <StagePayment
                  key={`payment-${localPackage.id}-${localPackage.updatedAt.getTime()}`}
                  timeline={timeline}
                  currentUser={currentUser}
                  operations={operationsList}
                  onSave={async (data) => {
                    try {
                      setLoading(true);
                      const paymentUpdate: any = {
                        status: data.status || '',
                        note: data.note || '',
                        completed: true,
                        savedAt: Timestamp.now(),
                        savedBy: currentUser?.username,
                      };
                      if (data.paymentDate) paymentUpdate.paymentDate = dateToTimestamp(data.paymentDate);
                      
                      await updateDoc(doc(db, 'packages', localPackage.id), {
                        'timeline.payment': paymentUpdate,
                        updatedAt: Timestamp.now(),
                        updatedBy: currentUser?.username,
                      });
                      setSuccessMessage('Payment saved successfully');
                      setTimeout(() => setSuccessMessage(''), 3000);
                      onRefresh();
                      await fetchUpdatedPackage();
                      moveToNextStage();
                    } catch (err) {
                      console.error('Error saving payment:', err);
                      setErrorMessage('Failed to save payment');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  isLoading={loading}
                />
              ) : activeStage === 7 ? (
                <StageDispatch
                  key={`dispatch-${localPackage.id}-${localPackage.updatedAt.getTime()}`}
                  pkg={localPackage}
                  timeline={timeline}
                  currentUser={currentUser}
                  operations={operationsList}
                  onSave={async (data) => {
                    try {
                      setLoading(true);
                      const dispatchUpdate: any = {
                        status: data.status || '',
                        driverName: data.driverName || '',
                        driverPhone: data.driverPhone || '',
                        note: data.note || '',
                        completed: true,
                        savedAt: Timestamp.now(),
                        savedBy: currentUser?.username,
                        truckNo: data.truckNo || '',
                      };
                      if (data.dispatchDate) dispatchUpdate.dispatchDate = dateToTimestamp(data.dispatchDate);
                      
                      await updateDoc(doc(db, 'packages', localPackage.id), {
                        'timeline.dispatch': dispatchUpdate,
                        updatedAt: Timestamp.now(),
                        updatedBy: currentUser?.username,
                      });
                      setSuccessMessage('Dispatch saved successfully');
                      setTimeout(() => setSuccessMessage(''), 3000);
                      onRefresh();
                      await fetchUpdatedPackage();
                      moveToNextStage();
                    } catch (err) {
                      console.error('Error saving dispatch:', err);
                      setErrorMessage('Failed to save dispatch');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onMarkComplete={async () => {
                    try {
                      setLoading(true);
                      await updateDoc(doc(db, 'packages', localPackage.id), {
                        status: 'operation_completed',
                        completedAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                        updatedBy: currentUser?.username,
                      });
                      setSuccessMessage(
                        'Package marked as completed successfully'
                      );
                      setTimeout(() => setSuccessMessage(''), 3000);
                      onRefresh();
                      await fetchUpdatedPackage();
                    } catch (err) {
                      console.error('Error marking package complete:', err);
                      setErrorMessage('Failed to mark package as completed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onCancel={async () => {
                    if (!cancelReason.trim()) {
                      setErrorMessage('Cancellation reason is required');
                      return;
                    }
                    try {
                      setLoading(true);
                      await updateDoc(doc(db, 'packages', localPackage.id), {
                        status: 'operation_cancelled',
                        cancelReason: cancelReason.trim(),
                        cancelledAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                        updatedBy: currentUser?.username,
                      });
                      setSuccessMessage(
                        'Package cancelled successfully'
                      );
                      setCancelReason('');
                      setShowCancelDialog(false);
                      setTimeout(() => {
                        setSuccessMessage('');
                        onClose();
                      }, 2000);
                      onRefresh();
                      await fetchUpdatedPackage();
                    } catch (err) {
                      console.error('Error cancelling package:', err);
                      setErrorMessage('Failed to cancel package');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  isLoading={loading}
                />
              ) : null}
            </div>
          </div>
        </div>

        {/* Cancel Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <h3 className="text-lg font-bold text-gray-900">
                  Cancel Package
                </h3>
              </div>
              <p className="text-gray-700 mb-4">
                This action cannot be undone. Please provide a reason for cancellation.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                className="input-field w-full mb-4"
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 btn-secondary py-2"
                >
                  Keep Package
                </button>
                <button
                  onClick={() => {
                    setShowCancelDialog(false);
                    // Call the cancel handler
                  }}
                  className="flex-1 btn-primary py-2 bg-red-600 hover:bg-red-700"
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stage Components (simplified for brevity - you'll expand each)

function StagePackageCreated({
  pkg,
  timeline,
  currentUser,
  onSave,
  isLoading,
}: {
  pkg: Package;
  timeline: any;
  currentUser: AuthUser | null;
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: pkg.name || '',
    description: pkg.description || '',
    packageType: pkg.packageType || '',
    packageCount: pkg.packageCount || '',
    weightType: pkg.weightType || 'KG',
    weight: pkg.weight || '',
    cbm: pkg.cbm || '',
    vendorId: pkg.vendorId || '',
    vendorName: pkg.vendorName || '',
    vendorCode: pkg.vendorCode || '',
    vendorDeliveryAddress: pkg.vendorDeliveryAddress || '',
    vendorBillingAddress: pkg.vendorBillingAddress || '',
  });

  useEffect(() => {
    setFormData({
      name: pkg.name || '',
      description: pkg.description || '',
      packageType: pkg.packageType || '',
      packageCount: pkg.packageCount || '',
      weightType: pkg.weightType || 'KG',
      weight: pkg.weight || '',
      cbm: pkg.cbm || '',
      vendorId: pkg.vendorId || '',
      vendorName: pkg.vendorName || '',
      vendorCode: pkg.vendorCode || '',
      vendorDeliveryAddress: pkg.vendorDeliveryAddress || '',
      vendorBillingAddress: pkg.vendorBillingAddress || '',
    });
  }, [pkg]);

  const packageTypeOptions = [
    { value: 'Cartons', label: 'Cartons' },
    { value: 'Pallets', label: 'Pallets' },
    { value: 'Rolls', label: 'Rolls' },
    { value: 'Drums', label: 'Drums' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Stage 1:</strong> Review and edit package details. Once saved,
          this stage will be completed and Stage 2 (ETD/ETA) will be unlocked.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-gray-900">Vendor details</p>
            <p className="text-sm text-gray-700">
              <strong>Vendor:</strong> {formData.vendorName || formData.vendorCode || '-'}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Delivery Address:</strong> {formData.vendorDeliveryAddress || '-'}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Billing Address:</strong> {formData.vendorBillingAddress || '-'}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Package Name
          </label>
          <input
            type="text"
            value={formData.name}
            disabled
            className="input-field bg-gray-100"
            placeholder="Package name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description
          </label>
          <textarea
            value={formData.description}
            disabled
            className="input-field resize-none bg-gray-100"
            rows={3}
            placeholder="Package description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Package Type
            </label>
            <input
              type="text"
              value={formData.packageType}
              disabled
              className="input-field bg-gray-100"
              placeholder="Package Type"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Quantity
            </label>
            <input
              type="number"
              value={formData.packageCount}
              disabled
              className="input-field bg-gray-100"
              placeholder="Qty"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Weight Type
            </label>
            <input
              type="text"
              value={formData.weightType}
              disabled
              className="input-field bg-gray-100"
              placeholder="Weight Type"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Weight
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.weight}
              disabled
              className="input-field bg-gray-100"
              placeholder="Weight"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              CBM
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.cbm}
              disabled
              className="input-field bg-gray-100"
              placeholder="CBM"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <p className="font-medium text-gray-900">Read-Only Information:</p>
          <p className="text-gray-600">
            <strong>Created:</strong> {pkg.createdAt?.toLocaleDateString()} by{' '}
            {pkg.createdBy || 'Unknown'}
          </p>
        </div>

        <button
          onClick={() => onSave(formData)}
          disabled={isLoading}
          className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save & Continue
            </>
          )}
        </button>
      </div>

      {timeline.packageCreated?.completed && (
        <AlertCustomerButton stage="packageCreated" data={timeline.packageCreated} />
      )}
    </div>
  );
}

function StageETD({
  timeline,
  currentUser,
  onSave,
  isLoading,
}: {
  timeline: any;
  currentUser: AuthUser | null;
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
}) {
  const etdData = timeline.etd || timeline.etdEta || {};

  const [formData, setFormData] = useState({
    estimatedDeparture: formatDateForInput(etdData.estimatedDeparture),
    shippedOnboardDate: formatDateForInput(etdData.shippedOnboardDate),
    sailedDate: formatDateForInput(etdData.sailedDate),
    note: etdData.note || '',
  });

  useEffect(() => {
    const etd = timeline.etd || timeline.etdEta || {};
    setFormData({
      estimatedDeparture: formatDateForInput(etd.estimatedDeparture),
      shippedOnboardDate: formatDateForInput(etd.shippedOnboardDate),
      sailedDate: formatDateForInput(etd.sailedDate),
      note: etd.note || '',
    });
  }, [timeline]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.estimatedDeparture) {
      newErrors.estimatedDeparture = 'Estimated Departure is required';
    }
    if (formData.estimatedDeparture && !formData.shippedOnboardDate) {
      newErrors.shippedOnboardDate = 'Please fill in Estimated Departure first';
    }
    if (
      formData.shippedOnboardDate &&
      !formData.sailedDate
    ) {
      newErrors.sailedDate = 'Please fill in Shipped Onboard Date first';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateForm()) {
      await onSave({
        estimatedDeparture: formData.estimatedDeparture
          ? new Date(formData.estimatedDeparture)
          : undefined,
        shippedOnboardDate: formData.shippedOnboardDate
          ? new Date(formData.shippedOnboardDate)
          : undefined,
        sailedDate: formData.sailedDate
          ? new Date(formData.sailedDate)
          : undefined,
        note: formData.note,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Stage 2 (ETD):</strong> Enter ETD dates. Fields unlock sequentially
          - fill in each field before moving to the next.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Estimated Time of Departure *
          </label>
          <input
            type="date"
            value={formData.estimatedDeparture}
            onChange={(e) =>
              setFormData({ ...formData, estimatedDeparture: e.target.value })
            }
            className="input-field"
          />
          {errors.estimatedDeparture && (
            <p className="text-red-500 text-sm mt-1">{errors.estimatedDeparture}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Shipped Onboard Date
            {!formData.estimatedDeparture && (
              <span className="text-gray-400 ml-1">(fill above first)</span>
            )}
          </label>
          <input
            type="date"
            value={formData.shippedOnboardDate}
            onChange={(e) =>
              setFormData({
                ...formData,
                shippedOnboardDate: e.target.value,
              })
            }
            className="input-field"
            disabled={!formData.estimatedDeparture}
          />
          {errors.shippedOnboardDate && (
            <p className="text-red-500 text-sm mt-1">{errors.shippedOnboardDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Sailed Date
            {!formData.shippedOnboardDate && (
              <span className="text-gray-400 ml-1">(fill above first)</span>
            )}
          </label>
          <input
            type="date"
            value={formData.sailedDate}
            onChange={(e) =>
              setFormData({ ...formData, sailedDate: e.target.value })
            }
            className="input-field"
            disabled={!formData.shippedOnboardDate}
          />
          {errors.sailedDate && (
            <p className="text-red-500 text-sm mt-1">{errors.sailedDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Common Note
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="input-field resize-none"
            rows={3}
            placeholder="Add any notes about this stage..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save & Continue
            </>
          )}
        </button>
      </div>

      {(timeline.etd?.completed || timeline.etdEta?.completed) && (
        <AlertCustomerButton stage="etd" data={timeline.etd || timeline.etdEta} />
      )}
    </div>
  );
}

function StageETA({
  timeline,
  currentUser,
  onSave,
  isLoading,
}: {
  timeline: any;
  currentUser: AuthUser | null;
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
}) {
  const etaData = timeline.eta || timeline.etdEta || {};

  const [formData, setFormData] = useState({
    approxArrivalDate: formatDateForInput(etaData.approxArrivalDate || etaData.expectedArrival),
    arrivalDate: formatDateForInput(etaData.arrivalDate),
    note: etaData.note || '',
  });

  useEffect(() => {
    const eta = timeline.eta || timeline.etdEta || {};
    setFormData({
      approxArrivalDate: formatDateForInput(eta.approxArrivalDate || eta.expectedArrival),
      arrivalDate: formatDateForInput(eta.arrivalDate),
      note: eta.note || '',
    });
  }, [timeline]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.approxArrivalDate) {
      newErrors.approxArrivalDate = 'Approximate Date of Arrival is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateForm()) {
      await onSave({
        approxArrivalDate: formData.approxArrivalDate
          ? new Date(formData.approxArrivalDate)
          : undefined,
        arrivalDate: formData.arrivalDate
          ? new Date(formData.arrivalDate)
          : undefined,
        status: formData.approxArrivalDate ? 'In Transit' : '',
        note: formData.note,
      });
    }
  };

  const hasApproxDate = !!formData.approxArrivalDate;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Stage 3 (ETA):</strong> Enter Approximate Date of Arrival. Arrival Date will be enabled once Approximate Date of Arrival is filled.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Approx Date of Arrival *
          </label>
          <input
            type="date"
            value={formData.approxArrivalDate}
            onChange={(e) =>
              setFormData({ ...formData, approxArrivalDate: e.target.value })
            }
            className="input-field"
          />
          {errors.approxArrivalDate && (
            <p className="text-red-500 text-sm mt-1">{errors.approxArrivalDate}</p>
          )}
        </div>

        {hasApproxDate && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 animate-pulse">
              In Transit
            </span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Arrival Date
            {!hasApproxDate && (
              <span className="text-gray-400 ml-1">(fill App Date of Arrival first)</span>
            )}
          </label>
          <input
            type="date"
            value={formData.arrivalDate}
            onChange={(e) =>
              setFormData({ ...formData, arrivalDate: e.target.value })
            }
            className="input-field"
            disabled={!hasApproxDate}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Common Note
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="input-field resize-none"
            rows={3}
            placeholder="Add any notes about this stage..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save & Continue
            </>
          )}
        </button>
      </div>

      {(timeline.eta?.completed || timeline.etdEta?.completed) && (
        <AlertCustomerButton stage="eta" data={timeline.eta || timeline.etdEta} />
      )}
    </div>
  );
}

function StageClearance({
  timeline,
  currentUser,
  operations,
  onSave,
  isLoading,
}: {
  timeline: any;
  currentUser: AuthUser | null;
  operations: Operation[];
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
}) {
  const clearanceData = timeline.clearance || {};
  const clearanceOps = operations.find((op) => op.type === 'Clearance');
  const statusOptions = clearanceOps?.status || [];

  const [formData, setFormData] = useState({
    status: clearanceData.status || statusOptions[0] || '',
    clearanceDate: formatDateForInput(clearanceData.clearanceDate),
    note: clearanceData.note || '',
  });

  useEffect(() => {
    const c = timeline.clearance || {};
    setFormData({
      status: c.status || statusOptions[0] || '',
      clearanceDate: formatDateForInput(c.clearanceDate),
      note: c.note || '',
    });
  }, [timeline.clearance, statusOptions]);

  const handleSave = () =>
    onSave({
      status: formData.status,
      note: formData.note,
      clearanceDate: formData.clearanceDate
        ? new Date(formData.clearanceDate)
        : undefined,
    });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Stage 3:</strong> Select clearance status and date. Once saved,
          you'll be able to alert the customer and proceed to Cargo Segregation.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Clearance Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="input-field"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Clearance Date
          </label>
          <input
            type="date"
            value={formData.clearanceDate}
            onChange={(e) =>
              setFormData({ ...formData, clearanceDate: e.target.value })
            }
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Common Note
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="input-field resize-none"
            rows={3}
            placeholder="Add any notes about this stage..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save & Continue
            </>
          )}
        </button>
      </div>

      {timeline.clearance?.completed && (
        <AlertCustomerButton stage="clearance" data={timeline.clearance} />
      )}
    </div>
  );
}

function StageCargoSegregation({
  timeline,
  currentUser,
  operations,
  onSave,
  isLoading,
}: {
  timeline: any;
  currentUser: AuthUser | null;
  operations: Operation[];
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
}) {
  const cargoData = timeline.cargoSegregation || {};
  const cargoOps = operations.find((op) => op.type === 'Cargo Segregation');
  const statusOptions = cargoOps?.status || [];

  const [formData, setFormData] = useState({
    status: cargoData.status || statusOptions[0] || '',
    segregationDate: formatDateForInput(cargoData.segregationDate),
    note: cargoData.note || '',
  });

  useEffect(() => {
    const c = timeline.cargoSegregation || {};
    setFormData({
      status: c.status || statusOptions[0] || '',
      segregationDate: formatDateForInput(c.segregationDate),
      note: c.note || '',
    });
  }, [timeline.cargoSegregation, statusOptions]);

  const handleSave = () =>
    onSave({
      status: formData.status,
      note: formData.note,
      segregationDate: formData.segregationDate
        ? new Date(formData.segregationDate)
        : undefined,
    });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Stage 4:</strong> Record cargo segregation status and date.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Cargo Segregation Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="input-field"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Segregation Date
          </label>
          <input
            type="date"
            value={formData.segregationDate}
            onChange={(e) =>
              setFormData({ ...formData, segregationDate: e.target.value })
            }
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Common Note
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="input-field resize-none"
            rows={3}
            placeholder="Add any notes about this stage..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save & Continue
            </>
          )}
        </button>
      </div>

      {timeline.cargoSegregation?.completed && (
        <AlertCustomerButton stage="cargoSegregation" data={timeline.cargoSegregation} />
      )}
    </div>
  );
}

function StageBilling({
  timeline,
  currentUser,
  operations,
  onSave,
  isLoading,
}: {
  timeline: any;
  currentUser: AuthUser | null;
  operations: Operation[];
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
}) {
  const billingData = timeline.billing || {};
  const billingOps = operations.find((op) => op.type === 'Billing');
  const statusOptions = billingOps?.status || [];

  const [formData, setFormData] = useState({
    status: billingData.status || statusOptions[0] || '',
    billingDate: formatDateForInput(billingData.billingDate),
    note: billingData.note || '',
  });

  useEffect(() => {
    const b = timeline.billing || {};
    setFormData({
      status: b.status || statusOptions[0] || '',
      billingDate: formatDateForInput(b.billingDate),
      note: b.note || '',
    });
  }, [timeline.billing, statusOptions]);

  const handleSave = () =>
    onSave({
      status: formData.status,
      note: formData.note,
      billingDate: formData.billingDate ? new Date(formData.billingDate) : undefined,
    });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Stage 5:</strong> Record billing status and date.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Billing Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="input-field"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Billing Date
          </label>
          <input
            type="date"
            value={formData.billingDate}
            onChange={(e) =>
              setFormData({ ...formData, billingDate: e.target.value })
            }
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Common Note
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="input-field resize-none"
            rows={3}
            placeholder="Add any notes about this stage..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save & Continue
            </>
          )}
        </button>
      </div>

      {timeline.billing?.completed && (
        <AlertCustomerButton stage="billing" data={timeline.billing} />
      )}
    </div>
  );
}

function StagePayment({
  timeline,
  currentUser,
  operations,
  onSave,
  isLoading,
}: {
  timeline: any;
  currentUser: AuthUser | null;
  operations: Operation[];
  onSave: (data: any) => Promise<void>;
  isLoading: boolean;
}) {
  const paymentData = timeline.payment || {};
  const paymentOps = operations.find((op) => op.type === 'Payment');
  const statusOptions = paymentOps?.status || [];

  const [formData, setFormData] = useState({
    status: paymentData.status || statusOptions[0] || '',
    paymentDate: formatDateForInput(paymentData.paymentDate),
    note: paymentData.note || '',
  });

  useEffect(() => {
    const p = timeline.payment || {};
    setFormData({
      status: p.status || statusOptions[0] || '',
      paymentDate: formatDateForInput(p.paymentDate),
      note: p.note || '',
    });
  }, [timeline.payment, statusOptions]);

  const handleSave = () =>
    onSave({
      status: formData.status,
      note: formData.note,
      paymentDate: formData.paymentDate ? new Date(formData.paymentDate) : undefined,
    });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Stage 6:</strong> Record payment status and date.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="input-field"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Payment Date
          </label>
          <input
            type="date"
            value={formData.paymentDate}
            onChange={(e) =>
              setFormData({ ...formData, paymentDate: e.target.value })
            }
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Common Note
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="input-field resize-none"
            rows={3}
            placeholder="Add any notes about this stage..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save & Continue
            </>
          )}
        </button>
      </div>

      {timeline.payment?.completed && (
        <AlertCustomerButton stage="payment" data={timeline.payment} />
      )}
    </div>
  );
}

function StageDispatch({
  pkg,
  timeline,
  currentUser,
  operations,
  onSave,
  onMarkComplete,
  onCancel,
  isLoading,
}: {
  pkg: Package;
  timeline: any;
  currentUser: AuthUser | null;
  operations: Operation[];
  onSave: (data: any) => Promise<void>;
  onMarkComplete: () => Promise<void>;
  onCancel: () => Promise<void>;
  isLoading: boolean;
}) {
  const dispatchData = timeline.dispatch || {};
  const dispatchOps = operations.find((op) => op.type === 'Dispatch Status');
  const statusOptions = dispatchOps?.status || [];

  const [formData, setFormData] = useState({
    status: dispatchData.status || statusOptions[0] || '',
    driverName: dispatchData.driverName || '',
    driverPhone: dispatchData.driverPhone || '',
    truckNo: dispatchData.truckNo || '',
    dispatchDate: formatDateForInput(dispatchData.dispatchDate),
    note: dispatchData.note || '',
  });

  useEffect(() => {
    const d = timeline.dispatch || {};
    setFormData({
      status: d.status || statusOptions[0] || '',
      driverName: d.driverName || '',
      driverPhone: d.driverPhone || '',
      truckNo: d.truckNo || '',
      dispatchDate: formatDateForInput(d.dispatchDate),
      note: d.note || '',
    });
  }, [timeline.dispatch, statusOptions]);

  const handleSave = () =>
    onSave({
      status: formData.status,
      driverName: formData.driverName,
      driverPhone: formData.driverPhone,
      note: formData.note,
      truckNo: formData.truckNo,
      dispatchDate: formData.dispatchDate
        ? new Date(formData.dispatchDate)
        : undefined,
    });

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isDispatched = formData.status === 'Dispatched';

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Stage 7 (Final):</strong> Record dispatch details. Driver
          information is required only when status is "Dispatched".
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Dispatch Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="input-field"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Dispatch Date
          </label>
          <input
            type="date"
            value={formData.dispatchDate}
            onChange={(e) =>
              setFormData({ ...formData, dispatchDate: e.target.value })
            }
            className="input-field"
          />
        </div>

        {isDispatched && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Driver Name *
              </label>
              <input
                type="text"
                value={formData.driverName}
                onChange={(e) =>
                  setFormData({ ...formData, driverName: e.target.value })
                }
                className="input-field"
                placeholder="Enter driver name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Driver Phone *
              </label>
              <input
                type="tel"
                value={formData.driverPhone}
                onChange={(e) =>
                  setFormData({ ...formData, driverPhone: e.target.value })
                }
                className="input-field"
                placeholder="Enter driver phone"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Truck No *
              </label>
              <input
                type="text"
                value={formData.truckNo}
                onChange={(e) =>
                  setFormData({ ...formData, truckNo: e.target.value })
                }
                className="input-field"
                placeholder="Enter truck number"
                required
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Common Note
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            className="input-field resize-none"
            rows={3}
            placeholder="Add any notes about this stage..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading || (isDispatched && (!formData.driverName || !formData.driverPhone || !formData.truckNo))}
          className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save & Continue
            </>
          )}
        </button>
      </div>

      {timeline.dispatch?.completed && (
        <>
          <AlertCustomerButton stage="dispatch" data={timeline.dispatch} />

          {isDispatched && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Final Actions:</p>
              <button
                onClick={onMarkComplete}
                disabled={isLoading || pkg.status === 'operation_completed'}
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
                Mark Complete
              </button>
              <button
                onClick={() => setShowCancelDialog(true)}
                disabled={isLoading || pkg.status === 'operation_cancelled'}
                className="w-full btn-secondary py-2.5 flex items-center justify-center gap-2 text-red-600 border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                Cancel Package
              </button>
            </div>
          )}
        </>
      )}

      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold text-gray-900">Cancel Package</h3>
            </div>
            <p className="text-gray-700 mb-4">
              This action cannot be undone. Please provide a reason for cancellation.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              className="input-field w-full mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 btn-secondary py-2"
              >
                Keep Package
              </button>
              <button
                onClick={async () => {
                  if (cancelReason.trim()) {
                    setShowCancelDialog(false);
                    await onCancel();
                  }
                }}
                className="flex-1 btn-primary py-2 bg-red-600 hover:bg-red-700"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertCustomerButton({
  stage,
  data,
}: {
  stage: string;
  data: any;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAlert = () => {
    console.log(`Alerting customer for stage: ${stage}`, data);
    setShowConfirm(false);
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="w-full btn-secondary py-2.5 flex items-center justify-center gap-2 border-blue-200"
      >
        <Bell className="w-4 h-4 text-blue-600" />
        Alert Customer
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Send Update to Customer?
            </h3>
            <p className="text-gray-600 mb-4">
              This will send a notification to the customer about the {stage} stage.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 btn-secondary py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAlert}
                className="flex-1 btn-primary py-2"
              >
                Send Update
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
