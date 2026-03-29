import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  History, 
  Users, 
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import AuthPage from './components/AuthPage';
import AdminUI from './components/roles/AdminUI';
import EmployeeUI from './components/roles/EmployeeUI';
import ManagerUI from './components/roles/ManagerUI';
import CFOUI from './components/roles/CFOUI';
import DirectorUI from './components/roles/DirectorUI';

// --- Types ---
type Role = 'Admin' | 'Manager' | 'Employee' | 'CFO' | 'Director';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
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

  if (!token) return <AuthPage onLogin={(t, u) => { setToken(t); setUser(u as any); }} />;

  const renderRoleUI = () => {
    if (!user) return null;
    switch (user.role) {
      case 'Admin': return <AdminUI user={user} />;
      case 'Employee': return <EmployeeUI user={user} />;
      case 'Manager': return <ManagerUI user={user} />;
      case 'CFO': return <CFOUI user={user} />;
      case 'Director': return <DirectorUI user={user} />;
      default: return <EmployeeUI user={user} />;
    }
  };

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
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={true} 
            collapsed={!isSidebarOpen} 
          />
          
          {user?.role === 'Admin' && (
            <NavItem 
              icon={<Users size={20} />} 
              label="User Management" 
              active={false} 
              collapsed={!isSidebarOpen} 
            />
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
              <p className="text-xs text-zinc-400 flex items-center justify-end gap-1">
                {user?.role === 'Admin' && <ShieldCheck size={12} className="text-purple-600" />}
                {user?.role}
              </p>
            </div>
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-zinc-400">
              <UserCircle size={24} />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={user?.role}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderRoleUI()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

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
