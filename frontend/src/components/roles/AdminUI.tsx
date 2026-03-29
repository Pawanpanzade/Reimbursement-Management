import React, { useState, useEffect } from 'react';
import { Users, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button, Input } from '../ui-elements';
import { cn } from '../../lib/utils';
import { apiFetch, getAuthHeaders } from '../../lib/api';

type UserRole = 'admin' | 'manager' | 'employee' | 'cfo' | 'director';
type EditableRole = 'manager' | 'employee';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  managerId?: string | null;
}

export default function AdminUI({ user }: { user: any }) {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as EditableRole,
    managerId: '',
  });

  const managers = users.filter((u) => u.role === 'manager');

  const roleLabel = (role: string): string => {
    if (role === 'admin') return 'Admin';
    if (role === 'manager') return 'Manager';
    if (role === 'employee') return 'Employee';
    if (role === 'cfo') return 'CFO';
    if (role === 'director') return 'Director';
    return role;
  };

  const fetchUsers = () => {
    apiFetch('/api/v1/users', {
      headers: getAuthHeaders(),
    })
    .then(res => res.json())
    .then(payload => setUsers(Array.isArray(payload?.data) ? payload.data : []));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.role === 'employee' && !formData.managerId) {
      alert('Manager is required when role is employee.');
      return;
    }

    const res = await apiFetch('/api/v1/users', {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        managerId: formData.role === 'employee' ? formData.managerId : undefined,
      }),
    });

    const payload = await res.json().catch(() => ({}));

    if (res.ok) {
      setShowAdd(false);
      setFormData({ name: '', email: '', password: '', role: 'employee', managerId: '' });
      fetchUsers();
    } else {
      alert(payload?.message || 'Failed to create user.');
    }
  };

  const handleUpdateUser = async (id: string) => {
    if (formData.role === 'employee' && !formData.managerId) {
      alert('Manager is required when role is employee.');
      return;
    }

    const res = await apiFetch(`/api/v1/users/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ 
        role: formData.role, 
        password: formData.password || undefined,
        name: formData.name,
        managerId: formData.role === 'employee' ? formData.managerId : null,
      }),
    });

    const payload = await res.json().catch(() => ({}));

    if (res.ok) {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'employee', managerId: '' });
      fetchUsers();
    } else {
      alert(payload?.message || 'Failed to update user.');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const res = await apiFetch(`/api/v1/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) fetchUsers();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-zinc-500">System-wide user and role management.</p>
        </div>
        <Button onClick={() => { setShowAdd(true); setEditingUser(null); setFormData({ name: '', email: '', password: '', role: 'employee', managerId: '' }); }} className="flex items-center gap-2">
          <Plus size={18} />
          Add User
        </Button>
      </div>

      <AnimatePresence>
        {(showAdd || editingUser) && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className="bg-zinc-50 border-zinc-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">{editingUser ? `Edit User: ${editingUser.name}` : 'Create New User'}</h3>
                <button onClick={() => { setShowAdd(false); setEditingUser(null); }} className="text-zinc-400 hover:text-black"><X size={20} /></button>
              </div>
              <form onSubmit={editingUser ? (e) => { e.preventDefault(); handleUpdateUser(editingUser.id); } : handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Name</label>
                  <Input required value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                {!editingUser && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-500">Email</label>
                    <Input type="email" required value={formData.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Password {editingUser && '(Optional)'}</label>
                  <Input type="password" required={!editingUser} value={formData.password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Role</label>
                  <select className="w-full px-4 py-2 rounded-lg border border-zinc-200" value={formData.role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, role: e.target.value as EditableRole, managerId: e.target.value === 'employee' ? formData.managerId : '' })}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                {formData.role === 'employee' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-zinc-500">Manager</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-zinc-200"
                      value={formData.managerId}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, managerId: e.target.value })}
                      required
                    >
                      <option value="">Select manager</option>
                      {managers.map((manager) => (
                        <option key={manager.id} value={manager.id}>{manager.name} ({manager.email})</option>
                      ))}
                    </select>
                  </div>
                )}
                <Button type="submit" className="md:col-span-2 mt-4">{editingUser ? 'Update User' : 'Create User'}</Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100">
              <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-400">User</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-400">Role</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-zinc-50/50">
                <td className="px-6 py-4">
                  <p className="font-semibold text-sm">{u.name}</p>
                  <p className="text-xs text-zinc-400">{u.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase", 
                    u.role === 'admin' ? "bg-purple-50 text-purple-600" :
                    u.role === 'manager' ? "bg-blue-50 text-blue-600" :
                    u.role === 'cfo' ? "bg-emerald-50 text-emerald-600" :
                    "bg-zinc-100 text-zinc-600"
                  )}>{roleLabel(u.role)}</span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => { setEditingUser(u); setShowAdd(false); setFormData({ name: u.name, email: u.email, password: '', role: u.role === 'manager' ? 'manager' : 'employee', managerId: u.managerId ?? '' }); }} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-black"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteUser(u.id)} className="p-2 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
