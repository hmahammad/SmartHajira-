import React from 'react';
import { X, ShieldAlert, CheckCircle2, Lock, AlertTriangle, Clock } from 'lucide-react';
import { AuditLogItem } from '../types';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogItem[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  auditLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              নিরাপত্তা ও অ্যাকসেস কন্ট্রোল অডিট লগ (Audit Log)
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2 text-xs">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-xl border flex items-start justify-between ${
                log.status === 'Security Alert'
                  ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {log.status === 'Security Alert' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="font-extrabold">{log.action}</span>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md font-bold">
                    {log.userRole}
                  </span>
                </div>
                <p className="text-xs font-semibold">{log.targetMember}</p>
                <p className="text-[11px] opacity-80">{log.details}</p>
              </div>

              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
