import React, { useState } from 'react';
import { X, Send, MessageSquare, PhoneCall, Check, ExternalLink } from 'lucide-react';
import { Student } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';

interface NotificationSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  orgInfo: OrgCategoryInfo;
}

export const NotificationSmsModal: React.FC<NotificationSmsModalProps> = ({
  isOpen,
  onClose,
  students,
  orgInfo,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [templateType, setTemplateType] = useState<'absent' | 'late' | 'salary' | 'meeting'>('absent');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const getTemplateText = () => {
    if (!currentStudent) return '';
    const phone = currentStudent.guardianPhone || '01700000000';
    const name = currentStudent.nameBangla;
    const roll = currentStudent.roll;

    switch (templateType) {
      case 'absent':
        return `সম্মানিত অভিভাবক/সদস্য, আপনার সন্তান/কর্মী ${name} (${orgInfo.terminology.idLabel}: ${roll}) আজ ${new Date().toLocaleDateString('bn-BD')} তারিখ ${orgInfo.terminology.orgCategoryName}-এ অনুপস্থিত রয়েছেন। ধন্যবাদ - স্মার্ট হাজিরা।`;
      case 'late':
        return `সম্মানিত অভিভাবক/সদস্য, ${name} (${roll}) আজ নির্ধারিত সময়ের পরে বিলম্বে ইন করেছেন। নিয়মিত সময়ানুবর্তিতা কাম্য। - ${orgInfo.terminology.orgCategoryName}।`;
      case 'salary':
        return `সুপ্রিয় ${name}, আপনার চলতি মাসের বেতন ও ওভারটাইমের স্লিপ প্রস্তুত হয়েছে। বিস্তারিত পে-রোল পোর্টালে ভিজিট করুন। - স্মার্ট হাজিরা।`;
      case 'meeting':
        return `জরুরী বিজ্ঞপ্তি: ${orgInfo.terminology.orgCategoryName}-এর আগামী সভার হাজিরা ও সাধারণ বৈঠক আগামী শুক্রবার বিকাল ৪টায় অনুষ্ঠিত হবে। আপনার উপস্থিতি কাম্য।`;
      default:
        return '';
    }
  };

  const messageText = getTemplateText();
  const cleanPhone = currentStudent?.guardianPhone.replace(/[^0-9]/g, '') || '8801700000000';
  const formattedPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">SMS / WhatsApp নোটিফিকেশন সেন্টার</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          
          {/* Member Selection */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              প্রাপক {orgInfo.terminology.memberLabel} নির্বাচন করুন:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id} className="text-slate-900 bg-white dark:bg-slate-800 dark:text-white">
                  {s.nameBangla} ({s.guardianPhone})
                </option>
              ))}
            </select>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              মেসেজ টেমপ্লেট:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTemplateType('absent')}
                className={`p-2 rounded-xl border text-left font-bold transition ${templateType === 'absent' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50'}`}
              >
                🔴 অনুপস্থিতি সতর্কবার্তা
              </button>
              <button
                onClick={() => setTemplateType('late')}
                className={`p-2 rounded-xl border text-left font-bold transition ${templateType === 'late' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50'}`}
              >
                🟡 বিলম্বে প্রবেশের অ্যালার্ট
              </button>
              <button
                onClick={() => setTemplateType('salary')}
                className={`p-2 rounded-xl border text-left font-bold transition ${templateType === 'salary' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50'}`}
              >
                💰 বেতনের নোটিশ
              </button>
              <button
                onClick={() => setTemplateType('meeting')}
                className={`p-2 rounded-xl border text-left font-bold transition ${templateType === 'meeting' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-slate-50'}`}
              >
                📢 সাধারণ সভা স্মরণিকা
              </button>
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <label className="block font-bold mb-1">মেসেজ প্রিভিউ:</label>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium text-slate-800 dark:text-slate-200 border">
              {messageText}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-300 transition flex items-center justify-center space-x-1"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : null}
              <span>{copied ? 'কপি হয়েছে' : 'টেক্সট কপি করুন'}</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition flex items-center justify-center space-x-1.5"
            >
              <Send className="w-4 h-4" />
              <span>WhatsApp মেসেজ পাঠান</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
