'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface User {
  id: string;
  username?: string;
  userId?: string;
  createdAt?: any;
  role?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddUser, setShowAddUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    username: '',
    password: '',
    role: 'user',
  });

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
  });

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];

      // If no users found, use sample data for UI
      if (usersList.length === 0) {
        setUsers([]);
      } else {
        setUsers(usersList);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNextUserId = async () => {
    const snapshot = await getDocs(collection(db, 'users'));

    if (snapshot.empty) {
      return 'U0001';
    }

    const userIds = snapshot.docs
      .map((doc) => doc.data().userId)
      .filter(Boolean);

    const maxNumber = Math.max(
      ...userIds.map((id: string) =>
        parseInt(id.replace('U', ''), 10)
      )
    );

    return `U${String(maxNumber + 1).padStart(4, '0')}`;
  };

  const handleSaveUser = async () => {
    if (!formData.username.trim()) {
      alert('Username is required');
      return;
    }

    if (!formData.password.trim()) {
      alert('Password is required');
      return;
    }

    try {
      setSaving(true);

      // Check if username already exists
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usernameExists = usersSnapshot.docs.some(
        (doc) =>
          doc.data().username?.toLowerCase() ===
          formData.username.toLowerCase() &&
          doc.data().role === formData.role
      );

      if (usernameExists) {
        alert('Username with this role already exists. Please choose a different username or role.');
        setSaving(false);
        return;
      }

      const userId = await generateNextUserId();

      await addDoc(collection(db, 'users'), {
        username: formData.username,
        password: formData.password,
        role: formData.role,
        userId,
        createdAt: new Date(),
      });

      setFormData({
        username: '',
        password: '',
        role: 'user',
      });

      setShowAddUser(false);

      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert(
        'Failed to create user. Check Firestore permissions.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      alert('User deleted successfully');
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    if (!editFormData.username.trim()) {
      alert('Username is required');
      return;
    }

    if (!editFormData.password.trim()) {
      alert('Password is required');
      return;
    }

    try {
      setSaving(true);

      // Check if username already exists (excluding current user)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usernameExists = usersSnapshot.docs.some(
        (doc) =>
          doc.id !== editingUser.id &&
          doc.data().username?.toLowerCase() ===
            editFormData.username.toLowerCase() &&
          doc.data().role === editFormData.role
      );

      if (usernameExists) {
        alert('Username with this role already exists. Please choose a different username or role.');
        setSaving(false);
        return;
      }

      await updateDoc(doc(db, 'users', editingUser.id), {
        username: editFormData.username,
        password: editFormData.password,
        role: editFormData.role,
      });

      alert('User updated successfully');
      setShowEditUser(false);
      setEditingUser(null);
      setEditFormData({
        username: '',
        password: '',
        role: 'user',
      });
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="mt-2 text-gray-500 max-w-xl">
              Manage application users, roles, and access from one place.
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({
                username: '',
                password: '',
                role: 'user',
              });
              setShowAddUser(true);
            }}
            className="btn-primary flex items-center justify-center px-5 py-3"
          >
            Add User
          </button>
        </div>

        <div className="card overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">User directory</h2>
              <p className="mt-1 text-sm text-gray-500">Quickly view and manage users in the system.</p>
            </div>
            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              {users.length === 1 ? 'Total User: 1' : `Total Users: ${users.length}`}
            </div>
          </div>
          <div className="p-6">
          {loading ? (
            <div className="p-6 text-center">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No users found
            </div>
          ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Username
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Role
                      </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  User ID
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
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                          {user.username || '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {user.role || '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                          {user.userId || '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                          { user.createdAt
                            ? user.createdAt.toDate().toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setEditFormData({
                                  username: user.username || '',
                                  password: '',
                                  role: user.role || 'user',
                                });
                                setShowEditUser(true);
                              }}
                              className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
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

      {showAddUser && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setShowAddUser(false)}
          />

          <div className="fixed top-0 right-0 z-50 h-full w-full md:w-1/2 bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b p-6">
                <h2 className="text-xl font-semibold">
                  Add User
                </h2>

                <button
                  onClick={() =>
                    setShowAddUser(false)
                  }
                  className="text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 space-y-5 p-6">
                <div>
                  <label className="mb-2 block font-medium">
                    Username
                  </label>

                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Password
                  </label>

                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Enter password"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Role
                  </label>

                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option value="admin">
                      Admin
                    </option>
                    <option value="user">
                      User
                    </option>
                  </select>
                </div>
              </div>

              <div className="border-t p-6">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() =>
                      setShowAddUser(false)
                    }
                    className="rounded-lg border px-4 py-2"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSaveUser}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving
                      ? 'Saving...'
                      : 'Save User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}



      {showEditUser && editingUser && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setShowEditUser(false)}
          />

          <div className="fixed top-0 right-0 z-50 h-full w-full md:w-1/2 bg-white shadow-xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b p-6">
                <h2 className="text-xl font-semibold">
                  Edit User
                </h2>

                <button
                  onClick={() =>
                    setShowEditUser(false)
                  }
                  className="text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 space-y-5 p-6">
                <div>
                  <label className="mb-2 block font-medium">
                    Username
                  </label>

                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        username: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Password
                  </label>

                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        password: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-medium">
                    Role
                  </label>

                  <select
                    value={editFormData.role}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        role: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border px-3 py-2"
                  >
                    <option value="admin">
                      Admin
                    </option>
                    <option value="user">
                      User
                    </option>
                  </select>
                </div>
              </div>

              <div className="border-t p-6">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() =>
                      setShowEditUser(false)
                    }
                    className="rounded-lg border px-4 py-2"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleEditUser}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving
                      ? 'Updating...'
                      : 'Update User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}