import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Receipt, ShieldCheck } from 'lucide-react';
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

export default function CFOUI({ user }: { user: any }) {
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
      body: JSON.stringify({ action, comment: `CFO ${action}` }),
    });
    if (res.ok) fetchPending();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-emerald-600" size={32} />
          CFO Dashboard
        </h1>
        <p className="text-zinc-500">Final review and disbursement authorization for expense claims.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {pending.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-zinc-100">
            <CheckCircle2 className="mx-auto text-zinc-200 mb-4" size={48} />
            <p className="text-zinc-400 font-medium">All caught up! No pending disbursements.</p>
          </div>
        ) : (
          pending.map((task) => (
            <Card key={task.id} className="flex items-center justify-between border-emerald-100 bg-emerald-50/10">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <Receipt size={24} />
                </div>
                <div>
                  <p className="font-bold text-lg">{task.expense.description}</p>
                  <p className="text-sm text-zinc-400">Submitted by {task.expense.employee.name} • {task.expense.date}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">Manager Approved</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-700">{task.expense.submittedCurrency} {task.expense.submittedAmount}</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">{task.expense.category ?? 'other'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(task.id, 'reject')} className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><XCircle size={20} /></button>
                  <button onClick={() => handleAction(task.id, 'approve')} className="p-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"><CheckCircle2 size={20} /></button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
