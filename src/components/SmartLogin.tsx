import React, { useState } from 'react';
import { AppUser } from '../types';
import { ShieldAlert, User, Lock, Smartphone, Monitor, ChevronRight } from 'lucide-react';

interface SmartLoginProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
}

export default function SmartLogin({ users, onLoginSuccess }: SmartLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Empty by default for a clean production feel
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false); // Collapsed by default

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const trimmedUser = username.trim().toLowerCase();
      // Apply disguise: if no @, add @benamar.local
      const emailToSearch = trimmedUser.includes('@') ? trimmedUser : `${trimmedUser}@benamar.local`;

      const foundUser = users.find(u => u.email.toLowerCase() === emailToSearch);

      if (!foundUser) {
        setError('❌ خطأ في اسم المستخدم أو كلمة المرور (الحساب غير مسجل في قاعدة البيانات)');
        setIsLoading(false);
        return;
      }

      if (!foundUser.isActive) {
        setError('⚠️ هذا الحساب معطل حالياً من قبل إدارة الفروع');
        setIsLoading(false);
        return;
      }

      // Check user password (default to 'admin123' for admins, '123456' for default workers, or custom password)
      const expectedPassword = foundUser.password || (foundUser.role === 'admin' ? 'admin123' : '123456');
      if (password !== expectedPassword) {
        setError('❌ كلمة المرور غير صحيحة. يرجى مراجعة الإدارة.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onLoginSuccess(foundUser);
    }, 600);
  };

  const handleQuickLogin = (user: AppUser) => {
    if (!user.isActive) {
      setError('⚠️ هذا الحساب معطل حالياً من قبل إدارة الفروع');
      return;
    }
    setError('');
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-[#000839] flex flex-col items-center justify-center p-4 md:p-8 select-none">
      {/* Background ambient decorative shapes */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-[#76BC21]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-[#050E46]/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative backdrop-blur-md z-10">
        
        {/* Brand logo header matching Algerian corporate theme */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-[#76BC21] text-white px-6 py-3 rounded-2xl font-bold text-xl tracking-wider shadow-lg mb-4 transform hover:scale-105 transition-all duration-300">
            LES FRÈRES BEN AMAR
            <span className="block text-xs font-medium tracking-normal text-white/90 mt-1">FBM · نظام إدارة المؤسسة</span>
          </div>
          <p className="text-slate-400 text-sm mt-1 font-medium">نظام الموارد والعمليات الميدانية للكمبيوتر والهاتف</p>
        </div>

        {/* Responsive view guide alert badge */}
        <div className="mb-6 flex items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Monitor className="w-4 h-4" />
            <span>عرض مكتبي ممتاز</span>
          </div>
          <div className="text-slate-500">|</div>
          <div className="flex items-center gap-1.5 text-lime-400 font-bold">
            <Smartphone className="w-4 h-4 animate-bounce" />
            <span>شاشة هاتف ذكي متجاوبة</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-right text-sm font-medium text-slate-300">اسم المستخدم (الموظف)</label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76BC21]">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: yacine أو ali"
                dir="ltr"
                className="w-full bg-[#000839] border border-slate-700 focus:border-[#76BC21] rounded-xl pr-11 pl-4 py-3 text-white text-right focus:outline-none transition-all duration-200 placeholder-slate-600"
                required
              />
            </div>
            {/* Disguise dynamic preview hint */}
            {username && (
              <p className="text-left text-xs text-slate-500 font-mono mt-1 pr-1" dir="ltr">
                👉 Resolves to: {username.trim().toLowerCase().includes('@') ? username.trim().toLowerCase() : `${username.trim().toLowerCase()}@benamar.local`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-right text-sm font-medium text-slate-300">كلمة المرور</label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76BC21]">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                dir="ltr"
                className="w-full bg-[#000839] border border-slate-700 focus:border-[#76BC21] rounded-xl pr-11 pl-4 py-3 text-white focus:outline-none transition-all duration-200 placeholder-slate-600"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-200 p-3 rounded-xl text-xs text-right flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#76BC21] hover:bg-[#62a118] text-[#000839] font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-[#76BC21]/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-[#000839] border-t-transparent rounded-full animate-spin"></span>
            ) : (
              'تسجيل الدخول للنظام الآمن'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
