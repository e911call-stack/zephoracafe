import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Loader2, ArrowLeft, UserPlus, Shield, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
}

// Professional admin emails - configure these in Supabase Dashboard
// Go to Authentication > Users > Invite users
const ADMIN_EMAILS = [
  'admin@zephora.com',
  'manager@zephora.com'
];

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onCancel }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // SIGN IN - Use Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Any user created in the Supabase Dashboard is allowed in.
        if (data.user) onSuccess();

      } else {
        // SIGN UP - Only allow invited users or configure in Supabase
        // For security, we disable public signup by default
        throw new Error("Admin registration is disabled. Please use the login form or invite new admins from Supabase Dashboard.");
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 border border-gray-200 shadow-xl max-w-md w-full relative">
        <button 
          onClick={onCancel}
          className="absolute top-4 left-4 text-gray-400 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
           <div className="bg-black text-white p-3 rounded-full inline-flex items-center justify-center mb-4">
             {isLogin ? <Lock className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
           </div>
           <h2 className="text-2xl font-bold uppercase tracking-widest">Admin Access</h2>
           <p className="text-gray-500 text-sm mt-2">
             {isLogin ? 'Enter your credentials to manage the restaurant.' : 'Sign in to your admin account.'}
           </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 text-sm mb-4 border border-red-100 text-center font-medium">
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="bg-green-50 text-green-600 p-3 text-sm mb-4 border border-green-100 text-center font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-none focus:outline-none focus:border-black transition-colors"
              placeholder="admin@zephora.com"
            />
          </div>
          
          <div className="relative">
            <label className="block text-xs font-bold uppercase mb-1">Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-none focus:outline-none focus:border-black transition-colors pr-12"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-black"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-black text-white py-3 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Protected by Supabase Authentication
            </p>
        </div>
      </div>
    </div>
  );
};
