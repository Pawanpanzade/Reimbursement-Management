import React, { useState, useEffect, useRef } from 'react';
import { Receipt, History, Plus, Camera, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button, Input } from '../ui-elements';
import { cn } from '../../lib/utils';
import { scanReceipt } from '../../services/aiService';
import { apiFetch, getAuthHeaders } from '../../lib/api';

interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export default function EmployeeUI({ user }: { user: any }) {
  const [view, setView] = useState<'history' | 'submit'>('history');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchExpenses = () => {
    apiFetch('/api/v1/expenses/my', {
      headers: getAuthHeaders(),
    })
    .then(res => res.json())
    .then(payload => setExpenses(Array.isArray(payload?.data) ? payload.data : []));
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const data = await scanReceipt(base64);
      if (data) {
        setFormData({
          amount: data.amount?.toString() || '',
          currency: data.currency || 'USD',
          category: data.category || 'Food',
          description: data.description || data.merchant || '',
          date: data.date || new Date().toISOString().split('T')[0]
        });
      }
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch('/api/v1/expenses', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setView('history');
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Dashboard</h1>
          <p className="text-zinc-500">Manage your expense claims and reimbursements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'history' ? 'primary' : 'secondary'} onClick={() => setView('history')} className="flex items-center gap-2"><History size={18} /> History</Button>
          <Button variant={view === 'submit' ? 'primary' : 'secondary'} onClick={() => setView('submit')} className="flex items-center gap-2"><Plus size={18} /> New Claim</Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'history' ? (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="p-0 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-400">Date</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-400">Description</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-400">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-zinc-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {expenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-zinc-50/50">
                      <td className="px-6 py-4 text-sm">{exp.date}</td>
                      <td className="px-6 py-4 text-sm font-medium">{exp.description}</td>
                      <td className="px-6 py-4 text-sm font-bold">{exp.currency} {exp.amount}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase", 
                          exp.status === 'Approved' ? "bg-emerald-50 text-emerald-600" :
                          exp.status === 'Rejected' ? "bg-red-50 text-red-600" :
                          "bg-amber-50 text-amber-600"
                        )}>{exp.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="submit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto">
            <Card className="space-y-8">
              <div className="flex items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl p-8 bg-zinc-50/50 hover:bg-zinc-50 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScan} />
                <div className="text-center">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Camera className="text-zinc-400" size={24} />
                  </div>
                  <p className="font-semibold text-sm">Scan Receipt</p>
                  <p className="text-xs text-zinc-400 mt-1">AI will auto-fill the form</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-600">Amount</label>
                    <Input type="number" placeholder="0.00" required value={formData.amount} onChange={(e: any) => setFormData({ ...formData, amount: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-600">Currency</label>
                    <select className="w-full px-4 py-2 rounded-lg border border-zinc-200" value={formData.currency} onChange={(e: any) => setFormData({ ...formData, currency: e.target.value })}>
                      <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-600">Description</label>
                  <textarea className="w-full px-4 py-2 rounded-lg border border-zinc-200 min-h-[100px]" placeholder="What was this for?" required value={formData.description} onChange={(e: any) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>{loading ? 'Processing...' : 'Submit Claim'}</Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
