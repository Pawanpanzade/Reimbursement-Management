import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Receipt } from 'lucide-react';
import { Card } from '../ui-elements';
import { apiFetch, getAuthHeaders } from '../../lib/api';

interface PendingApprovalTask {
  id: string;
  status: string;
  step: number;
  expense: {
    id: string;
    submittedAmount: number;
    submittedCurrency: string;
    category: string | null;
    description: string;
    date: string;
    employee: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export default function ManagerUI({ user }: { user: any }) {
  const [pending, setPending] = useState<PendingApprovalTask[]>([]);

  const fetchPending = async () => {
    const res = await apiFetch('/api/v1/approvals/pending', {
      headers: getAuthHeaders(),
    });

    const payload = await res.json();
    setPending(Array.isArray(payload?.data) ? payload.data : []);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAction = async (taskId: string, action: 'approve' | 'reject') => {
    const res = await apiFetch(`/api/v1/approvals/${taskId}/action`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: JSON.stringify({ action, comment: `Manager ${action}` }),
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
          pending.map((task) => (
            <Card key={task.id} className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400">
                  <Receipt size={24} />
                </div>
                <div>
                  <p className="font-bold text-lg">{task.expense.description}</p>
                  <p className="text-sm text-zinc-400">
                    Submitted by {task.expense.employee.name} • {task.expense.date} • Step {task.step}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-2xl font-bold">{task.expense.submittedCurrency} {task.expense.submittedAmount}</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">{task.expense.category ?? 'other'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(task.id, 'reject')} className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><XCircle size={20} /></button>
                  <button onClick={() => handleAction(task.id, 'approve')} className="p-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"><CheckCircle2 size={20} /></button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
