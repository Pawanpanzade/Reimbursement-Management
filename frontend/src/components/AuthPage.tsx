import React, { useState } from 'react';
import { Card, Button, Input } from './ui-elements';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
}

export default function AuthPage({ onLogin }: { onLogin: (token: string, user: User) => void }) {
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
    const endpoint = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/signup';
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
        alert(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-4 text-xl">O</div>
          <h1 className="text-2xl font-bold tracking-tight">Odoo Reimburse</h1>
          <p className="text-zinc-500 mt-2">{isLogin ? 'Sign in to your account' : 'Create your company account'}</p>
        </div>

        <Card className="shadow-xl shadow-black/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Full Name</label>
                  <Input required value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Company Name</label>
                  <Input required value={formData.companyName} onChange={(e: any) => setFormData({ ...formData, companyName: e.target.value })} placeholder="Acme Corp" />
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Email Address</label>
              <Input type="email" required value={formData.email} onChange={(e: any) => setFormData({ ...formData, email: e.target.value })} placeholder="name@company.com" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Password</label>
              <Input type="password" required value={formData.password} onChange={(e: any) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full py-3 flex items-center justify-center gap-2" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-100 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-medium text-zinc-500 hover:text-black transition-colors">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
