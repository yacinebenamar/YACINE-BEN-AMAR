import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, ShieldCheck, Factory, Car } from 'lucide-react';
import FBMLogo from './FBMLogo';
import { AppUser } from '../types';

interface SmartLoginProps {
  users?: AppUser[];
  onLogin: (user: AppUser) => void;
}

export default function SmartLogin({ users = [], onLogin }: SmartLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'worker'>('admin');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    await new Promise(resolve => setTimeout(resolve, 800));

    let targetRole = selectedRole;
    
    // Attempt authentication against users array via email or simple string
    const user = users.find(u => (u.email === username || u.uid === username) && u.password === password);
    
    if (user) {
        if (user.role === targetRole || (user.role === 'admin' && targetRole === 'worker')) {
            // Allow admin accounts to log in as worker too for field testing
            onLogin(user);
        } else {
            setError(`عذراً، هذا الحساب ليس لديه صلاحية الدخول كـ ${targetRole === 'admin' ? 'مدير' : 'عامل'}`);
        }
    } else {
        if (selectedRole === 'admin') {
            if (username === 'admin' && password === 'Admin1997') {
                onLogin({
                    uid: 'admin_root',
                    fullName: 'المدير العام الرئيسي (Admin)',
                    email: 'admin',
                    role: 'admin',
                    subRole: 'general_manager',
                    isActive: true,
                });
            } else if (username === 'yacine' && password === 'yacine04') {
                onLogin({
                    uid: 'admin_yacine',
                    fullName: 'ياسين بن عمار (المدير العام)',
                    email: 'yacine',
                    role: 'admin',
                    subRole: 'general_manager',
                    isActive: true,
                });
            } else {
                setError('بيانات الدخول غير صحيحة للمدير (admin أو yacine)');
            }
        } else {
            if (username === 'ali' && password === 'ali123') {
                onLogin({
                    uid: 'worker_ali',
                    fullName: 'علي الميداني',
                    email: 'ali',
                    role: 'worker',
                    subRole: 'worker',
                    isActive: true,
                });
            } else if (username === 'yacine' && password === 'yacine04') {
                onLogin({
                    uid: 'admin_yacine',
                    fullName: 'ياسين بن عمار (المدير العام)',
                    email: 'yacine',
                    role: 'worker', // allows entering worker dashboard directly
                    subRole: 'general_manager',
                    isActive: true,
                });
            } else {
                setError('بيانات الدخول غير صحيحة للموظف الميداني');
            }
        }
    }
    
    setIsLoading(false);
  };

  const roles = [
    { id: 'admin', label: 'مدير عام', icon: ShieldCheck },
    { id: 'worker', label: 'موظف ميداني', icon: Factory },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-fbm-light dark:bg-fbm-blue font-sans overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-fbm-green/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(#8CC63F 1px, transparent 1px), linear-gradient(90deg, #8CC63F 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Brand Side (Left on Desktop) */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center relative z-10 bg-fbm-blue-card border-r border-fbm-blue-border p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-lg"
        >
          <FBMLogo size="xl" showText={true} />
          
          <div className="mt-16 space-y-6">
            <div className="flex items-center gap-4 bg-fbm-blue border border-fbm-blue-border p-4 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-fbm-green/10 flex items-center justify-center text-fbm-green shrink-0">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold">إدارة متقدمة للورش</h3>
                <p className="text-slate-400 text-sm mt-1">تتبع دقيق للمشاريع، النفقات، والموظفين في الوقت الفعلي.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-fbm-blue border border-fbm-blue-border p-4 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-fbm-green/10 flex items-center justify-center text-fbm-green shrink-0">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold">إدارة أسطول النقل</h3>
                <p className="text-slate-400 text-sm mt-1">مراقبة الشاحنات، الصيانة الدورية، والمهام اليومية للسائقين.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-fbm-blue border border-fbm-blue-border p-4 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-fbm-green/10 flex items-center justify-center text-fbm-green shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold">نظام آمن وموثوق</h3>
                <p className="text-slate-400 text-sm mt-1">بنية تحتية مشفرة وصلاحيات دقيقة لضمان سرية البيانات.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Login Side (Right on Desktop) */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-32 relative z-10">
        
        {/* Mobile Logo */}
        <div className="lg:hidden flex justify-center mb-10">
           <FBMLogo size="lg" showText={true} />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="text-center lg:text-right mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">مرحباً بك مجدداً</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">الرجاء إدخال بيانات الدخول للمتابعة</p>
          </div>

          <div className="bg-white dark:bg-fbm-blue-card p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl border border-slate-200 dark:border-fbm-blue-border">
            <form className="space-y-6" onSubmit={handleLogin}>
              
              {/* Roles */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id as any)}
                    className={`flex flex-col items-center justify-center gap-3 py-4 px-2 rounded-2xl border-2 transition-all ${
                      selectedRole === role.id
                        ? 'border-fbm-green bg-fbm-green/10 text-fbm-green shadow-sm'
                        : 'border-slate-200 dark:border-fbm-blue-border bg-slate-50 dark:bg-fbm-blue text-slate-500 dark:text-slate-400 hover:border-fbm-green/50'
                    }`}
                  >
                    <role.icon className="w-6 h-6" />
                    <span className="text-sm font-bold">{role.label}</span>
                  </button>
                ))}
              </div>

                
              <div className="space-y-5">
                {/* Username */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    اسم المستخدم
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                      <User className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full bg-slate-50 dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-xl py-3.5 pl-4 pr-12 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-fbm-blue-card focus:ring-2 focus:ring-fbm-green/20 focus:border-fbm-green transition-all outline-none font-medium text-left"
                      placeholder="أدخل اسم المستخدم"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-5 w-5" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full bg-slate-50 dark:bg-fbm-blue border border-slate-200 dark:border-fbm-blue-border rounded-xl py-3.5 pl-4 pr-12 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-fbm-blue-card focus:ring-2 focus:ring-fbm-green/20 focus:border-fbm-green transition-all outline-none font-medium text-left"
                      placeholder="••••••••"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>


              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm flex items-start gap-3"
                >
                  <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
                  <span className="font-bold">{error}</span>
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-fbm-green hover:bg-fbm-green-hover text-white font-black py-4 px-4 rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(140,198,63,0.3)] hover:shadow-[0_0_25px_rgba(140,198,63,0.4)] active:scale-[0.98] text-lg flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'تسجيل الدخول'
                )}
              </button>
            </form>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">
              LES FRÈRES BEN AMAR &copy; {new Date().getFullYear()}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
