import React from 'react';
import { OrganizationScheduleSettings } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { ScheduleSettingsView } from './ScheduleSettingsView';
import { X } from 'lucide-react';

interface ScheduleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: OrganizationScheduleSettings;
  onSaveSettings: (settings: OrganizationScheduleSettings) => void;
  orgInfo: OrgCategoryInfo;
}

export const ScheduleSettingsModal: React.FC<ScheduleSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  orgInfo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-black text-white">ডিউটি শিফট ও কাজের সময়সূচী কনফিগারেশন</h2>
            <p className="text-xs text-slate-300">প্রতিষ্ঠান শিফট, ডিউটি সময়সীমা, লেট গ্রেস পিরিয়ড ও ওভারটাইম নিয়মাবলী</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <ScheduleSettingsView
            settings={settings}
            onSaveSettings={(newSettings) => {
              onSaveSettings(newSettings);
              onClose();
            }}
            orgInfo={orgInfo}
            onBackToDashboard={onClose}
          />
        </div>
      </div>
    </div>
  );
};
