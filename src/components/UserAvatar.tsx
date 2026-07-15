import React from 'react';
import { AppUser } from '../types';

interface UserAvatarProps {
  user: AppUser;
  className?: string;
}

export const AVATAR_GRADIENTS = [
  { name: 'الأخضر الحيوي', value: 'linear-gradient(135deg, #76BC21 0%, #10b981 100%)', text: 'text-white' },
  { name: 'الأزرق الفاخر', value: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', text: 'text-white' },
  { name: 'البنفسجي الإمبراطوري', value: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', text: 'text-white' },
  { name: 'البرتقالي الوهّاج', value: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', text: 'text-white' },
  { name: 'الوردي الياقوتي', value: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', text: 'text-white' },
  { name: 'كوسميك دارك', value: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', text: 'text-slate-200' },
  { name: 'الزمردي الداكن', value: 'linear-gradient(135deg, #059669 0%, #064e3b 100%)', text: 'text-emerald-100' },
];

export const PRESET_AVATARS = [
  {
    name: 'مدير / رئيس فريق (رجل)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'admin'
  },
  {
    name: 'مديرة / رئيسة فريق (امرأة)',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'admin'
  },
  {
    name: 'مهندس / تقني ميداني (رجل)',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'worker'
  },
  {
    name: 'مشرفة / إدارية (امرأة)',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'worker'
  },
  {
    name: 'عامل تشغيلي / فني (رجل)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'worker'
  },
  {
    name: 'محاسبة / مدققة (امرأة)',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'worker'
  },
  {
    name: 'سائق / منسق لوجستي (رجل)',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'worker'
  },
  {
    name: 'ممثلة خدمة عملاء / تنسيق (امرأة)',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
    role: 'worker'
  }
];

export const PRESET_EMOJIS = [
  '👷', '🚚', '👮', '💰', '💼', '👩‍💻', '👨‍💼', '👑', '⚡', '🌟', '🛠️', '📦', '🔧', '📋'
];

export default function UserAvatar({ user, className = 'w-9 h-9' }: UserAvatarProps) {
  // Determine standard background gradient based on UID to keep it persistent if not customized
  const getDefaultGradient = (uid: string) => {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
      hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
    return AVATAR_GRADIENTS[index];
  };

  const selectedGradient = user.avatarColor 
    ? (AVATAR_GRADIENTS.find(g => g.value === user.avatarColor) || { value: user.avatarColor, text: 'text-white' })
    : getDefaultGradient(user.uid);

  const firstLetter = user.fullName ? user.fullName.trim().charAt(0) : '?';

  if (user.avatarUrl) {
    return (
      <div className={`${className} rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-fbm-blue-border/40 bg-slate-100 shadow-sm`}>
        <img
          src={user.avatarUrl}
          alt={user.fullName}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  if (user.avatarEmoji) {
    return (
      <div
        className={`${className} rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-200/20`}
        style={{ background: selectedGradient.value }}
      >
        <span className="text-lg md:text-xl select-none leading-none">{user.avatarEmoji}</span>
      </div>
    );
  }

  return (
    <div
      className={`${className} rounded-xl flex items-center justify-center font-black shrink-0 shadow-sm border border-slate-200/10 ${selectedGradient.text}`}
      style={{ background: selectedGradient.value }}
    >
      <span className="text-sm select-none leading-none">{firstLetter}</span>
    </div>
  );
}
