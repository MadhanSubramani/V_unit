'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Operation } from '@/types';

export default function OperationsPage() {
  const [operationType, setOperationType] = useState<'Billing' | 'Payment' | 'Cargo Segregation' | 'Clearance' | 'Dispatch Status' | 'Package'>('Billing');
  const [statusInput, setStatusInput] = useState('');
  const [statuses, setStatuses] = useState<string[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [showAddOperation, setShowAddOperation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const allOperationTypes: Operation['type'][] = ['Billing', 'Payment', 'Cargo Segregation', 'Clearance', 'Dispatch Status', 'Package'];
  const availableCreateTypes = allOperationTypes.filter(
    (type) => !operations.some((operation) => operation.type === type)
  );
  const availableTypes = editingOperation
    ? Array.from(new Set([...availableCreateTypes, editingOperation.type]))
    : availableCreateTypes;

  const fetchOperations = useCallback(async () => {
    setIsLoading(true);
    try {
      const operationsRef = collection(db, 'operations');
      const q = query(operationsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          status: Array.isArray(data.status) ? data.status : [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        } as Operation;
      });

      setOperations(list);
    } catch (error) {
      console.error('Error fetching operations:', error);
      setErrorMessage('Unable to load operations. Check Firestore access.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const resetForm = () => {
    setOperationType('Billing');
    setStatusInput('');
    setStatuses([]);
    setEditingOperation(null);
    setErrorMessage('');
  };

  const handleAddStatus = () => {
    const value = statusInput.trim();
    if (!value) return;
    if (statuses.includes(value)) {
      setErrorMessage('Status already added.');
      return;
    }
    setStatuses((current) => [...current, value]);
    setStatusInput('');
    setErrorMessage('');
  };

  const handleRemoveStatus = (index: number) => {
    setStatuses((current) => current.filter((_, i) => i !== index));
  };

  const handleEditOperation = (operation: Operation) => {
    setEditingOperation(operation);
    setOperationType(operation.type);
    setStatuses(operation.status);
    setStatusInput('');
    setShowAddOperation(true);
    setErrorMessage('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (statuses.length === 0) {
      setErrorMessage('Please add at least one status item.');
      return;
    }

    setIsSaving(true);
    try {
      const operationsSnapshot = await getDocs(collection(db, 'operations'));
      const typeExists = operationsSnapshot.docs.some((docSnap) => {
        const data = docSnap.data();
        if (editingOperation) {
          return docSnap.id !== editingOperation.id && data.type === operationType;
        }
        return data.type === operationType;
      });

      if (typeExists) {
        setErrorMessage(`An operation with type "${operationType}" already exists.`);
        setIsSaving(false);
        return;
      }

      if (editingOperation) {
        await updateDoc(doc(db, 'operations', editingOperation.id), {
          type: operationType,
          status: statuses,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(collection(db, 'operations'), {
          type: operationType,
          status: statuses,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      resetForm();
      setShowAddOperation(false);
      await fetchOperations();
    } catch (error) {
      console.error('Error saving operation:', error);
      setErrorMessage('Failed to save operation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    if (!confirm('Are you sure you want to delete this operation?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'operations', operationId));
      await fetchOperations();
    } catch (error) {
      console.error('Error deleting operation:', error);
      setErrorMessage('Failed to delete operation.');
    }
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operations</h1>
            <p className="mt-2 text-gray-500 max-w-xl">
              Manage operation entries with Billing, Payment, Cargo Segregation, Clearance, Dispatch Status, and Package types.
            </p>
          </div>
          {availableCreateTypes.length > 0 && (
            <button
              onClick={() => {
                resetForm();
                setOperationType(availableCreateTypes[0]);
                setShowAddOperation(true);
              }}
              className="btn-primary flex items-center justify-center px-5 py-3"
            >
              Add Operation
            </button>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Operation directory</h2>
              <p className="mt-1 text-sm text-gray-500">Quickly view and manage operations in Firestore.</p>
            </div>
            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              {operations.length === 1 ? 'Total Operation: 1' : `Total Operations: ${operations.length}`}
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="p-6 text-center">Loading operations...</div>
            ) : operations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No operations found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Created At
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {operations.map((operation) => (
                      <tr key={operation.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                          {operation.type}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {operation.status.join(', ') || '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                          {formatDate(operation.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEditOperation(operation)}
                              className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteOperation(operation.id)}
                              className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
            )}
          </div>
        </div>
      </div>

      {showAddOperation && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setShowAddOperation(false)}
          />

          <div className="fixed top-0 right-0 z-50 h-full w-full md:w-1/2 bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b p-6">
                <h2 className="text-xl font-semibold">
                  {editingOperation ? 'Edit Operation' : 'Add Operation'}
                </h2>
                <button
                  onClick={() => setShowAddOperation(false)}
                  className="text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 space-y-5 p-6">
                <div>
                  <label className="mb-2 block font-medium">Type</label>
                  {availableTypes.length === 0 ? (
                    <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                      All operation types already exist.
                    </div>
                  ) : (
                    <select
                      value={operationType}
                      onChange={(e) => setOperationType(e.target.value as Operation['type'])}
                      className="w-full rounded-lg border px-3 py-2"
                    >
                      {availableTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="mb-2 block font-medium">Status</label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                      placeholder="Add a status item"
                    />
                    <button
                      type="button"
                      onClick={handleAddStatus}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      Add status
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {statuses.map((status, index) => (
                    <button
                      key={`${status}-${index}`}
                      type="button"
                      onClick={() => handleRemoveStatus(index)}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
                    >
                      {status}
                      <span className="font-bold">×</span>
                    </button>
                  ))}
                </div>

                {errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <div className="border-t pt-6">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddOperation(false)}
                      className="rounded-lg border px-4 py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || (!editingOperation && availableTypes.length === 0)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : editingOperation ? 'Update Operation' : 'Save Operation'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
  