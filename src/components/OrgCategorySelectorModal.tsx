import React, { useState } from 'react';
import { OrgCategoryKey, ORG_CATEGORIES } from '../utils/organizationConfig';
import { GraduationCap, Briefcase, Factory, Building2, Store, Check, Sparkles, X, RefreshCw, Users } from 'lucide-react';

interface OrgCategorySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategory: OrgCategoryKey;
  onSelectCategory: (categoryKey: OrgCategoryKey, loadDefaults: boolean) => void;
}

const CATEGORY_ICONS: Record<OrgCategoryKey, React.FC<{ className?: string }>> = {
  educational: GraduationCap,
  corporate: Briefcase,
  factory: Factory,
  medical: Building2,
  general: Store,
  somity: Users,
};

export const OrgCategorySelectorModal: React.FC<OrgCategorySelectorModalProps> = ({
  isOpen,
  onClose,
  currentCategory,
  onSelectCategory,
}) => {
  const [selectedKey, setSelectedKey] = useState<OrgCategoryKey>(currentCategory);
  const [shouldLoadDefaults, setShouldLoadDefaults] = useState<boolean>(true);

  if (!isOpen) return null;

  const activeInfo = ORG_CATEGORIES[selectedKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">প্রতিষ্ঠানের ক্যাটাগরি নির্বাচন করুন</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ক্যাটাগরি অনুযায়ী টাইটেল, টার্মিনোলজি ও শব্দসমূহ সয়ংক্রিয়ভাবে পরিবর্তিত হবে
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            উপযুক্ত প্রতিষ্ঠান বা কর্মক্ষেত্র নির্বাচন করুন:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(ORG_CATEGORIES) as OrgCategoryKey[]).map((key) => {
              const cat = ORG_CATEGORIES[key];
              const IconComp = CATEGORY_ICONS[key] || Building2;
              const isSelected = selectedKey === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedKey(key)}
                  className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between space-y-2 relative ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 shadow-md shadow-emerald-500/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-xl ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <IconComp className="w-5 h-5" />
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{cat.titleBangla}</h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{cat.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dynamic Preview Box */}
          {activeInfo && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>নির্বাচিত ক্যাটাগরির টার্মিনোলজি ও শব্দাবলী প্রিভিউ:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">সদস্য/ব্যক্তি</span>
                  <span className="font-semibold text-slate-800">{activeInfo.terminology.memberLabel}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">এডমিন/পরিচালক</span>
                  <span className="font-semibold text-slate-800">{activeInfo.terminology.adminLabel}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">বিভাগ/গ্রুপ</span>
                  <span className="font-semibold text-slate-800">{activeInfo.terminology.groupLabel}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">আইডি/রোল</span>
                  <span className="font-semibold text-slate-800">{activeInfo.terminology.idLabel}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">যোগাযোগ</span>
                  <span className="font-semibold text-slate-800">{activeInfo.terminology.contactLabel}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px]">ডিউটি/সময়</span>
                  <span className="font-semibold text-slate-800">{activeInfo.terminology.sessionLabel}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notice: Members preserved, only terminology updates */}
          <div className="flex items-center space-x-2.5 bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">
              প্রতিষ্ঠানের ধরন পরিবর্তন করলে আপনার বিদ্যমান সকল সদস্য অক্ষুণ্ণ থাকবে, শুধুমাত্র পদবী, বিভাগ ও শব্দাবলী আপডেট হবে।
            </span>
          </div>

        </div>

        {/* Action Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            বাতিল করুন
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectCategory(selectedKey, false);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>ক্যাটাগরি প্রয়োগ করুন</span>
          </button>
        </div>

      </div>
    </div>
  );
};
