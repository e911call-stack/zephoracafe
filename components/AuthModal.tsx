import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Loader2, Mail, Lock, User, Phone, ArrowLeft, Send } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, language }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const t = TRANSLATIONS[language];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isResetMode) {
        // Handle Password Reset
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin, // Redirect back to app
        });
        if (resetError) throw resetError;
        setSuccessMsg(t.resetEmailSent);
      } else if (isSignUp) {
        // Register standard customer
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              role: 'customer' // STRICTLY CUSTOMER
            }
          }
        });
        if (signUpError) throw signUpError;
        alert(language === 'ar' ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!');
        onSuccess();
      } else {
        // Login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
        onSuccess();
      }
      
      if (!isResetMode) onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Login/Signup Labels
  const labels = {
    en: {
      login: "Login",
      signup: "Create Account",
      email: "Email Address",
      password: "Password",
      name: "Full Name",
      phone: "Phone Number",
      submitLogin: "Sign In",
      submitSignup: "Sign Up",
      switchSignup: "Don't have an account? Sign Up",
      switchLogin: "Already have an account? Sign In"
    },
    ar: {
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      name: "الاسم الكامل",
      phone: "رقم الهاتف",
      submitLogin: "دخول",
      submitSignup: "تسجيل",
      switchSignup: "ليس لديك حساب؟ سجل الآن",
      switchLogin: "لديك حساب بالفعل؟ دخول"
    }
  };

  const authT = labels[language];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white w-full max-w-md relative shadow-2xl animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-gray-400 hover:text-black z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
             {isResetMode ? (
                <div className="relative">
                    <button 
                        onClick={() => { setIsResetMode(false); setError(''); setSuccessMsg(''); }} 
                        className="absolute left-0 top-1 text-gray-400 hover:text-black rtl:right-0 rtl:left-auto"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl font-bold uppercase tracking-widest">{t.resetPassword}</h2>
                </div>
             ) : (
                <h2 className="text-2xl font-bold uppercase tracking-widest">{isSignUp ? authT.signup : authT.login}</h2>
             )}
            <div className="h-1 w-12 bg-black mx-auto mt-2" />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 text-sm mb-4 border border-red-100 text-center">
              {error}
            </div>
          )}
          
          {successMsg && (
            <div className="bg-green-50 text-green-600 p-3 text-sm mb-4 border border-green-100 text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && !isResetMode && (
              <>
                <div className="relative">
                   <User className="absolute left-3 rtl:right-3 top-3 w-4 h-4 text-gray-400" />
                   <input 
                     type="text" 
                     placeholder={authT.name}
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     required={isSignUp}
                     className="w-full p-2.5 pl-10 rtl:pr-10 border border-gray-300 focus:outline-none focus:border-black text-sm"
                   />
                </div>
                <div className="relative">
                   <Phone className="absolute left-3 rtl:right-3 top-3 w-4 h-4 text-gray-400" />
                   <input 
                     type="tel" 
                     placeholder={authT.phone}
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                     required={isSignUp}
                     className="w-full p-2.5 pl-10 rtl:pr-10 border border-gray-300 focus:outline-none focus:border-black text-sm"
                   />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 rtl:right-3 top-3 w-4 h-4 text-gray-400" />
              <input 
                type="email" 
                placeholder={authT.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2.5 pl-10 rtl:pr-10 border border-gray-300 focus:outline-none focus:border-black text-sm"
              />
            </div>

            {!isResetMode && (
                <div className="relative">
                <Lock className="absolute left-3 rtl:right-3 top-3 w-4 h-4 text-gray-400" />
                <input 
                    type="password" 
                    placeholder={authT.password}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-2.5 pl-10 rtl:pr-10 border border-gray-300 focus:outline-none focus:border-black text-sm"
                />
                </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-3 font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  isResetMode ? t.sendResetLink : (isSignUp ? authT.submitSignup : authT.submitLogin)
              )}
            </button>
          </form>

          {!isResetMode && (
             <div className="mt-4 flex flex-col items-center gap-3">
                {!isSignUp && (
                    <button 
                        onClick={() => { setIsResetMode(true); setError(''); setSuccessMsg(''); }}
                        className="text-xs text-gray-400 hover:text-black"
                    >
                        {t.forgotPassword}
                    </button>
                )}
                
                <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                className="text-xs text-gray-500 hover:text-black underline mt-2"
                >
                {isSignUp ? authT.switchLogin : authT.switchSignup}
                </button>
             </div>
          )}
          
          {isResetMode && (
              <div className="mt-6 text-center">
                 <button 
                    onClick={() => { setIsResetMode(false); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-gray-500 hover:text-black underline"
                 >
                    {t.backToLogin}
                 </button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};