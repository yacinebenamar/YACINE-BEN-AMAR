import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Sparkles, Smile, Image as ImageIcon, Palette } from 'lucide-react';
import { AppUser } from '../types';
import UserAvatar, { PRESET_AVATARS, PRESET_EMOJIS, AVATAR_GRADIENTS } from './UserAvatar';

interface EditAvatarModalProps {
  user: AppUser;
  onClose: () => void;
  onSave: (updatedUser: AppUser) => void;
}

export default function EditAvatarModal({ user, onClose, onSave }: EditAvatarModalProps) {
  const [activeTab, setActiveTab] = useState<'presets' | 'emojis' | 'gradients'>('presets');
  
  // Local state for temporary changes
  const [tempAvatarUrl, setTempAvatarUrl] = useState<string | undefined>(user.avatarUrl);
  const [tempAvatarEmoji, setTempAvatarEmoji] = useState<string | undefined>(user.avatarEmoji);
  const [tempAvatarColor, setTempAvatarColor] = useState<string | undefined>(user.avatarColor);

  const handleSave = () => {
    const updatedUser: AppUser = {
      ...user,
      avatarUrl: tempAvatarUrl,
      avatarEmoji: tempAvatarEmoji,
      avatarColor: tempAvatarColor,
    };
    onSave(updatedUser);
  };

  const handleSelectPreset = (url: string) => {
    setTempAvatarUrl(url);
    setTempAvatarEmoji(undefined);
    setTempAvatarColor(undefined);
  };

  const handleSelectEmoji = (emoji: string) => {
    setTempAvatarUrl(undefined);
    setTempAvatarEmoji(emoji);
    if (!tempAvatarColor) {
      setTempAvatarColor(AVATAR_GRADIENTS[0].value); // Default to first gradient if none
    }
  };

  const handleSelectGradient = (gradientValue: string) => {
    setTempAvatarColor(gradientValue);
    // If not in emoji tab and we have no emoji, it'll apply to initials
    if (activeTab === 'gradients') {
      setTempAvatarEmoji(undefined);
      setTempAvatarUrl(undefined);
    }
  };

  const handleClearAvatar = () => {
    setTempAvatarUrl(undefined);
    setTempAvatarEmoji(undefined);
    setTempAvatarColor(undefined);
  };

  // Create a mock user to pass to UserAvatar preview
  const previewUser: AppUser = {
    ...user,
    avatarUrl: tempAvatarUrl,
    avatarEmoji: tempAvatarEmoji,
    avatarColor: tempAvatarColor,
  };

  return (
    <div className="fixed inset-0 bg-[#00021c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl bg-white dark:bg-fbm-blue-card border border-slate-200 dark:border-fbm-blue-border rounded-2xl p-6 shadow-xl relative overflow-hidden"
        dir="rtl"
      >
        {/* Background Decorative Blur */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-fbm-green/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-fbm-blue-border/40 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-fbm-green/10 text-fbm-green">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">تخصيص الصورة الرمزية للملف الشخصي</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">صمم مظهرك الاحترافي داخل المنصة التشغيلية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer p-1.5 hover:bg-slate-100 dark:hover:bg-fbm-blue rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-fbm-blue-border"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Right Column: Preview & Status */}
          <div className="md:col-span-1 flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-fbm-blue/20 rounded-2xl border border-slate-100 dark:border-fbm-blue-border/30">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-4 select-none">معاينة مباشرة</p>
            
            <div className="relative group">
              {/* Pulsing light effect behind avatar */}
              <div className="absolute inset-0 bg-fbm-green/20 rounded-2xl blur-md scale-95 opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <UserAvatar user={previewUser} className="w-24 h-24 text-xl font-black relative border-2 border-white dark:border-[#0f172a] shadow-lg rounded-2xl" />
            </div>

            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-4 text-center truncate w-full">{user.fullName}</h4>
            <span className="bg-fbm-green/10 text-fbm-green text-[9px] font-black px-2.5 py-0.5 rounded-full mt-1.5">
              {user.role === 'admin' ? 'إدارة عليا' : 'موظف ميداني'}
            </span>

            <button
              onClick={handleClearAvatar}
              className="mt-6 text-[10px] text-red-500 hover:text-red-600 dark:text-rose-400 dark:hover:text-rose-300 font-bold hover:underline transition-all cursor-pointer"
            >
              إعادة تعيين للوضع الافتراضي 🔄
            </button>
          </div>

          {/* Left Column: Customizers */}
          <div className="md:col-span-2 flex flex-col space-y-4">
            {/* Tabs Selector */}
            <div className="flex bg-slate-100 dark:bg-fbm-blue/50 p-1 rounded-xl border border-slate-200/50 dark:border-fbm-blue-border/30">
              <button
                onClick={() => setActiveTab('presets')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeTab === 'presets'
                    ? 'bg-white dark:bg-fbm-blue-card text-fbm-green shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>صور رمزية جاهزة</span>
              </button>
              <button
                onClick={() => setActiveTab('emojis')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeTab === 'emojis'
                    ? 'bg-white dark:bg-fbm-blue-card text-fbm-green shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>شخصيات إيموجي</span>
              </button>
              <button
                onClick={() => setActiveTab('gradients')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  activeTab === 'gradients'
                    ? 'bg-white dark:bg-fbm-blue-card text-fbm-green shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>ألوان متدرجة</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 bg-white dark:bg-[#0c1445]/20 border border-slate-100 dark:border-fbm-blue-border/20 rounded-xl p-4 overflow-y-auto max-h-[220px] custom-scrollbar">
              
              {activeTab === 'presets' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">اختر من الصور الاحترافية المعدّة مسبقاً لمطابقة طبيعة عملك:</p>
                  <div className="grid grid-cols-4 gap-2.5">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectPreset(preset.url)}
                        title={preset.name}
                        className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-105 group ${
                          tempAvatarUrl === preset.url
                            ? 'border-fbm-green shadow-md shadow-[#76BC21]/15'
                            : 'border-slate-200 dark:border-fbm-blue-border/60'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {tempAvatarUrl === preset.url && (
                          <div className="absolute inset-0 bg-fbm-green/20 flex items-center justify-center">
                            <span className="bg-fbm-green text-white p-0.5 rounded-full text-[8px]">✓</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'emojis' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">1. اختر رمز التعبير المناسب لوظيفتك:</p>
                    <div className="grid grid-cols-7 gap-2">
                      {PRESET_EMOJIS.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectEmoji(emoji)}
                          className={`aspect-square text-lg flex items-center justify-center rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-fbm-blue transition-all ${
                            tempAvatarEmoji === emoji
                              ? 'bg-fbm-green/20 text-fbm-green border-2 border-fbm-green/50'
                              : 'bg-slate-50 dark:bg-fbm-blue/20 border border-slate-200/50 dark:border-fbm-blue-border/40'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">2. اختر التدرج اللوني للخلفية:</p>
                    <div className="grid grid-cols-7 gap-2">
                      {AVATAR_GRADIENTS.map((grad, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSelectGradient(grad.value)}
                          title={grad.name}
                          className={`aspect-square rounded-lg cursor-pointer border-2 hover:scale-105 transition-all ${
                            tempAvatarColor === grad.value
                              ? 'border-fbm-green scale-105 shadow-md'
                              : 'border-transparent'
                          }`}
                          style={{ background: grad.value }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gradients' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">اختر تدرجاً لونياً مميزاً لخلفية الحرف الأول من اسمك:</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {AVATAR_GRADIENTS.map((grad, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectGradient(grad.value)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer text-right transition-all hover:bg-slate-50 dark:hover:bg-fbm-blue/40 ${
                          tempAvatarColor === grad.value && !tempAvatarEmoji && !tempAvatarUrl
                            ? 'border-fbm-green bg-fbm-green/5'
                            : 'border-slate-200 dark:border-fbm-blue-border/40'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-md shrink-0" style={{ background: grad.value }} />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{grad.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2 gap-3 pt-5 border-t border-slate-100 dark:border-fbm-blue-border/40 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 dark:bg-fbm-blue hover:bg-slate-200 dark:hover:bg-fbm-blue/70 border border-slate-200 dark:border-fbm-blue-border text-slate-500 dark:text-slate-400 font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-all"
          >
            إلغاء التعديل
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-fbm-green hover:bg-fbm-green-hover text-white font-bold py-2.5 px-4 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#76BC21]/15"
          >
            <Check className="w-4 h-4 font-bold" />
            <span>حفظ المظهر الجديد</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
