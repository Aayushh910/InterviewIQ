import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-md rounded-3xl bg-[#0A0A0A] border border-white/15 p-6 shadow-2xl text-white backdrop-blur-xl space-y-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Confirm Log Out</h3>
              <p className="text-xs text-neutral-400">Are you sure you want to end your session?</p>
            </div>
          </div>
          <p className="text-xs text-neutral-300 bg-[#141414] p-3.5 rounded-2xl border border-white/10 font-sans leading-relaxed">
            You will need to sign in again to access your live AI interview simulations and saved reports.
          </p>
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white rounded-xl bg-[#141414] border border-white/15 transition-colors font-mono"
            >
              Cancel
            </button>
            <Button
              variant="danger"
              size="sm"
              onClick={onConfirm}
              icon={LogOut}
              className="bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg"
            >
              Log Out
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
