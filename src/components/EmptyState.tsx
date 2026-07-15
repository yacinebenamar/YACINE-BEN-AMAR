import React from 'react';
import { motion } from 'motion/react';
import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center bg-[#f8fafc]/40 dark:bg-[#000839]/40 border border-slate-200 dark:border-slate-800 rounded-3xl"
    >
      <div className="w-20 h-20 mb-4 bg-slate-100/50 dark:bg-slate-900/50 rounded-full flex items-center justify-center text-[#76BC21]/60">
        {icon || <FolderOpen className="w-10 h-10" />}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm">{description}</p>
    </motion.div>
  );
}
