import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BarChart3, Users, Receipt, TrendingUp } from 'lucide-react';
import { Card } from '../ui-elements';
import { cn } from '../../lib/utils';

export default function DirectorUI({ user }: { user: any }) {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    fetch('/api/v1/expenses/stats', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setStats(data));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <LayoutDashboard className="text-blue-600" size={32} />
          Director Dashboard
        </h1>
        <p className="text-zinc-500">Executive oversight of company-wide expense activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-600 text-white border-none">
          <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Total Reimbursed</p>
          <p className="text-3xl font-bold mt-2">${stats.total.toLocaleString()}</p>
          <TrendingUp className="absolute top-4 right-4 opacity-20" size={48} />
        </Card>
        <Card className="bg-white">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Pending Claims</p>
          <p className="text-3xl font-bold mt-2 text-amber-600">{stats.pending}</p>
          <Clock className="absolute top-4 right-4 opacity-10" size={48} />
        </Card>
        <Card className="bg-white">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Approved Claims</p>
          <p className="text-3xl font-bold mt-2 text-emerald-600">{stats.approved}</p>
          <CheckCircle2 className="absolute top-4 right-4 opacity-10" size={48} />
        </Card>
        <Card className="bg-white">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Rejected Claims</p>
          <p className="text-3xl font-bold mt-2 text-red-600">{stats.rejected}</p>
          <XCircle className="absolute top-4 right-4 opacity-10" size={48} />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><BarChart3 size={18} /> Spending by Category</h3>
          </div>
          <div className="p-6 space-y-4">
            {['Travel', 'Food', 'Software', 'Office'].map(cat => (
              <div key={cat} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{cat}</span>
                  <span className="text-zinc-400">$2,400</span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><Users size={18} /> Top Claimants</h3>
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 font-bold">U{i}</div>
                  <div>
                    <p className="font-bold text-sm">User {i}</p>
                    <p className="text-xs text-zinc-400">Employee</p>
                  </div>
                </div>
                <p className="font-bold text-sm">$1,200</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

import { Clock, CheckCircle2, XCircle } from 'lucide-react';
