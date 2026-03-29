import React from 'react';
import { cn } from '../lib/utils';

export const Button = ({ className, variant = 'primary', ...props }: any) => {
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

export const Input = ({ className, ...props }: any) => (
  <input className={cn('w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all', className)} {...props} />
);

export const Card = ({ children, className }: any) => (
  <div className={cn('bg-white rounded-2xl border border-zinc-100 shadow-sm p-6 relative', className)}>{children}</div>
);
