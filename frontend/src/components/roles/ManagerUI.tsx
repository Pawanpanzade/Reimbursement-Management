import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Receipt, User, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button, Input } from '../ui-elements';
import { cn } from '../../lib/utils';

interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  status: string;
  userId: string;
  createdAt: string;
}

export default function ManagerUI({ user }: { user: any }) {
  const [pending, setPending] = useState<Expense[]>([]);

  const fetchPending = () => {
    fetch('/api/expenses/pending', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setPending(data));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (id: string, action: 'Approve' | 'Reject') => {
    const res = await fetch(`/api/expenses/${id}/action`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ action, comment: `Manager ${action}` })
    });
    if (res.ok) fetchPending();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
        <p className="text-zinc-500">Review and approve initial expense claims from your team.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pending.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-zinc-100">
            <CheckCircle2 className="mx-auto text-zinc-200 mb-4" size={48} />
            <p className="text-zinc-400 font-medium">All caught up! No pending approvals.</p>
          </div>
        ) : (
          pending.map(exp => (
            <Card key={exp.id} className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400">
                  <Receipt size={24} />
                </div>
                <div>
                  <p className="font-bold text-lg">{exp.description}</p>
                  <p className="text-sm text-zinc-400">Submitted by User ID: {exp.userId} • {exp.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-2xl font-bold">{exp.currency} {exp.amount}</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">{exp.category}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(exp.id, 'Reject')} className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><XCircle size={20} /></button>
                  <button onClick={() => handleAction(exp.id, 'Approve')} className="p-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"><CheckCircle2 size={20} /></button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
