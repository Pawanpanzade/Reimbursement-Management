import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  History, 
  Users, 
  Settings, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Camera, 
  LogOut,
  ChevronRight,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Menu,
  X,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { scanReceipt } from './services/aiService';

// --- Types ---
type Role = 'Admin' | 'Manager' | 'Employee' | 'CFO';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
}

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

// --- Components ---

const Button = ({ className, variant = 'primary', ...props }: any) => {
  const variants = {
    primary: 'bg-black text-white hover:bg-zinc-800',
    secondary: 'bg-white text-black border border-zinc-200 hover:bg-zinc-50',
    ghost: 'hover:bg-zinc-100 text-zinc-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  return (
    <button 
      className={cn('px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50', variants[variant as keyof typeof variants], className)} 
      {...props} 
    />
  );
};

const Input = ({ className, ...props }: any) => (
  <input className={cn('w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all', className)} {...props} />
);

const Card = ({ children, className }: any) => (
  <div className={cn('bg-white rounded-2xl border border-zinc-100 shadow-sm p-6', className)}>{children}</div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [view, setView] = useState<'dashboard' | 'submit' | 'history' | 'approvals' | 'users'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auth check
  useEffect(() => {
    if (token) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) return <AuthPage onLogin={(t, u) => { setToken(t); setUser(u); }} />;

  return (
    <div className="flex h-screen bg-[#F9F9F9] text-zinc-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-zinc-100 flex flex-col z-20"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold">O</div>
          {isSidebarOpen && <span className="font-bold text-lg tracking-tight">Odoo Reimburse</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={view === 'dashboard'} onClick={() => setView('dashboard')} collapsed={!isSidebarOpen} />
          <NavItem icon={<Receipt size={20} />} label="Submit Expense" active={view === 'submit'} onClick={() => setView('submit')} collapsed={!isSidebarOpen} />
          <NavItem icon={<History size={20} />} label="My History" active={view === 'history'} onClick={() => setView('history')} collapsed={!isSidebarOpen} />
          
          {(user?.role === 'Manager' || user?.role === 'CFO' || user?.role === 'Admin') && (
            <NavItem icon={<CheckCircle2 size={20} />} label="Approvals" active={view === 'approvals'} onClick={() => setView('approvals')} collapsed={!isSidebarOpen} />
          )}
          
          {user?.role === 'Admin' && (
            <NavItem icon={<Users size={20} />} label="User Management" active={view === 'users'} onClick={() => setView('users')} collapsed={!isSidebarOpen} />
          )}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-zinc-100 flex items-center justify-between px-8">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-500">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-zinc-400">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-zinc-400">
              {user?.name?.[0]}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {view === 'dashboard' && <Dashboard user={user} />}
              {view === 'submit' && <SubmitExpense onComplete={() => setView('history')} />}
              {view === 'history' && <ExpenseHistory />}
              {view === 'approvals' && <ApprovalsList />}
              {view === 'users' && <UserManagement />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Sub-Views ---

function NavItem({ icon, label, active, onClick, collapsed }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-xl transition-all group",
        active ? "bg-black text-white shadow-lg shadow-black/10" : "text-zinc-500 hover:bg-zinc-100"
      )}
    >
      <span className={cn("transition-colors", active ? "text-white" : "group-hover:text-black")}>{icon}</span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  );
}

function Dashboard({ user }: { user: User | null }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}</h1>
        <p className="text-zinc-500">Here's what's happening with your reimbursements today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">Total Reimbursed</p>
            <p className="text-3xl font-bold">$12,450.00</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
            <TrendingUp size={14} />
            <span>+12% from last month</span>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">Pending Claims</p>
            <p className="text-3xl font-bold">4</p>
          </div>
          <p className="text-xs text-zinc-400">Awaiting manager approval</p>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">Rejected Claims</p>
            <p className="text-3xl font-bold">1</p>
          </div>
          <p className="text-xs text-zinc-400">Needs your attention</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="font-bold text-lg mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-100 transition-colors">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Business Lunch - Client X</p>
                    <p className="text-xs text-zinc-400">Food & Dining • 2 hours ago</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">$45.00</p>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Pending</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-black text-white border-none relative overflow-hidden">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xl mb-2">Need a quick scan?</h3>
              <p className="text-zinc-400 text-sm max-w-[240px]">Use our AI-powered OCR to automatically extract details from your receipts.</p>
            </div>
            <Button variant="secondary" className="w-fit mt-6 flex items-center gap-2">
              <Camera size={18} />
              Start Scanning
            </Button>
          </div>
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
        </Card>
      </div>
    </div>
  );
}

function SubmitExpense({ onComplete }: { onComplete: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Submit Expense</h1>
        <p className="text-zinc-500">Fill in the details or scan a receipt to auto-populate.</p>
      </div>

      <Card className="space-y-8">
        <div className="flex items-center justify-center border-2 border-dashed border-zinc-200 rounded-2xl p-8 bg-zinc-50/50 hover:bg-zinc-50 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScan} />
          <div className="text-center">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Camera className="text-zinc-400" size={24} />
            </div>
            <p className="font-semibold text-sm">Scan Receipt</p>
            <p className="text-xs text-zinc-400 mt-1">Click to upload or take a photo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-600">Amount</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                required 
                value={formData.amount}
                onChange={(e: any) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-600">Currency</label>
              <select 
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                value={formData.currency}
                onChange={(e: any) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>INR</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-600">Category</label>
            <select 
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5"
              value={formData.category}
              onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
            >
              <option>Food</option>
              <option>Travel</option>
              <option>Supplies</option>
              <option>Utilities</option>
              <option>Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-600">Description</label>
            <textarea 
              className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[100px]"
              placeholder="What was this expense for?"
              required
              value={formData.description}
              onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-600">Date</label>
            <Input 
              type="date" 
              required 
              value={formData.date}
              onChange={(e: any) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full py-4 text-lg" disabled={loading}>
            {loading ? 'Processing...' : 'Submit Claim'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function ExpenseHistory() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    fetch('/api/expenses/my', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setExpenses(data));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense History</h1>
          <p className="text-zinc-500">View and track all your submitted claims.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">Export CSV</Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Description</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Category</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Amount</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4 text-sm whitespace-nowrap">{exp.date}</td>
                <td className="px-6 py-4 text-sm font-medium">{exp.description}</td>
                <td className="px-6 py-4 text-sm text-zinc-500">{exp.category}</td>
                <td className="px-6 py-4 text-sm font-bold">{exp.currency} {exp.amount}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    exp.status === 'Approved' ? "bg-emerald-50 text-emerald-600" :
                    exp.status === 'Rejected' ? "bg-red-50 text-red-600" :
                    "bg-amber-50 text-amber-600"
                  )}>
                    {exp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ApprovalsList() {
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/expenses/pending', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setPending(data));
  }, []);

  const handleAction = async (id: string, action: 'Approve' | 'Reject') => {
    const res = await fetch(`/api/expenses/${id}/action`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ action, comment: 'Processed via dashboard' })
    });
    if (res.ok) setPending(pending.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
        <p className="text-zinc-500">Review and process expense claims from your team.</p>
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
                  <p className="text-xs text-blue-600 font-medium">
                    Step {exp.currentApproverStep + 1}: {exp.currentApproverStep === 0 ? 'Manager Review' : 'CFO Approval'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-2xl font-bold">{exp.currency} {exp.amount}</p>
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold">{exp.category}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction(exp.id, 'Reject')}
                    className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                  <button 
                    onClick={() => handleAction(exp.id, 'Approve')}
                    className="p-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Employee' as Role
  });

  useEffect(() => {
    fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setUsers(data));
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers([...users, newUser]);
        setShowAdd(false);
        setFormData({ name: '', email: '', password: '', role: 'Employee' });
      } else {
        alert('Failed to add user');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-zinc-500">Manage employees, managers, CFOs, and their roles.</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2">
          <Plus size={18} />
          Add User
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-100">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Name</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Email</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Role</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium">{u.name}</td>
                <td className="px-6 py-4 text-sm text-zinc-500">{u.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    u.role === 'Admin' ? "bg-purple-50 text-purple-600" :
                    u.role === 'Manager' ? "bg-blue-50 text-blue-600" :
                    u.role === 'CFO' ? "bg-green-50 text-green-600" :
                    "bg-zinc-100 text-zinc-600"
                  )}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <Button variant="ghost" className="text-xs">Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Add User Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Add New User</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-zinc-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-600">Full Name</label>
                <Input required value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-600">Email (Username)</label>
                <Input type="email" required value={formData.email} onChange={(e: any) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-600">Password</label>
                <Input type="password" required value={formData.password} onChange={(e: any) => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-600">Role</label>
                <select 
                  required 
                  value={formData.role} 
                  onChange={(e: any) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="CFO">CFO</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Adding...' : 'Add User'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

// --- Auth Page ---

function AuthPage({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    companyName: '',
    currency: 'USD'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.token, data.user);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6">O</div>
          <h1 className="text-4xl font-bold tracking-tight">Odoo Reimburse</h1>
          <p className="text-zinc-500 mt-2">Professional expense management simplified.</p>
        </div>

        <Card className="p-8">
          <div className="flex bg-zinc-100 p-1 rounded-xl mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={cn("flex-1 py-2 rounded-lg font-semibold text-sm transition-all", isLogin ? "bg-white shadow-sm text-black" : "text-zinc-500")}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={cn("flex-1 py-2 rounded-lg font-semibold text-sm transition-all", !isLogin ? "bg-white shadow-sm text-black" : "text-zinc-500")}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-600">Full Name</label>
                  <Input required value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-600">Company Name</label>
                  <Input required value={formData.companyName} onChange={(e: any) => setFormData({ ...formData, companyName: e.target.value })} />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-600">Email Address</label>
              <Input type="email" required value={formData.email} onChange={(e: any) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-600">Password</label>
              <Input type="password" required value={formData.password} onChange={(e: any) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            
            <Button type="submit" className="w-full py-4 mt-4" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>
        </Card>

        <p className="text-center text-xs text-zinc-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
