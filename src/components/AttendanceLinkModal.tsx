import React, { useState } from 'react';
import { 
  QrCode, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Smartphone, 
  Printer, 
  Share2, 
  X, 
  MapPin, 
  Camera, 
  Lock, 
  Sparkles,
  Layers,
  Info,
  Download
} from 'lucide-react';
import { RegisteredCompany } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { printHtmlContent, generateAttendanceQrPosterHtml } from '../utils/printUtils';

interface AttendanceLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: RegisteredCompany | null;
  orgInfo: OrgCategoryInfo;
  onOpenPublicPortal: () => void;
}

export const AttendanceLinkModal: React.FC<AttendanceLinkModalProps> = ({
  isOpen,
  onClose,
  company,
  orgInfo,
  onOpenPublicPortal,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [requireGeofence, setRequireGeofence] = useState<boolean>(true);
  const [allowManualPin, setAllowManualPin] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'security'>('link');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentUrl = window.location.origin + window.location.pathname;
  const companySlug = company?.id || 'default_company';
  const companyName = company?.nameBangla || orgInfo.label || orgInfo.titleBangla;
  const attendanceLink = `${currentUrl}?mode=attendance&companyId=${encodeURIComponent(companySlug)}&geo=${requireGeofence ? '1' : '0'}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(attendanceLink)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(attendanceLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintQR = () => {
    setIsPrinting(true);
    const html = generateAttendanceQrPosterHtml(
      companyName,
      orgInfo.terminology.orgCategoryName,
      attendanceLink
    );
    printHtmlContent(html, `${companyName}_ডিজিটাল_হাজিরা_কিউআর_পোস্টার`);
    setTimeout(() => setIsPrinting(false), 800);
  };

  const handleDownloadQrImage = async () => {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${companyName}_হাজিরা_QR_কোড.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(qrImageUrl, '_blank');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `স্মার্ট ডিজিটাল হাজিরা লিংক (${companyName}):\nকর্মীরা এই লিংকে ক্লিক করে তাৎক্ষণিক ফেস স্ক্যান বা আইডি দিয়ে হাজিরা দিন:\n${attendanceLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-inner">
              <QrCode className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black tracking-wide">
                  পাবলিক হাজিরা লিংক ও কিউআর কোড
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  নিরাপদ সেলফ-সার্ভিস
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                এডমিন ডাটা বা প্রোফাইল অ্যাক্সেস ছাড়াই কর্মীরা নিরাপদে হাজিরা দিতে পারবে
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'link'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>হাজিরা লিংক & শেয়ার</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'qr'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>প্রিন্টযোগ্য QR কোড</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 text-xs font-black transition-all border-b-2 flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'security'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>সিকিউরিটি ও নিয়মাবলী</span>
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* TAB 1: Link & Distribution */}
          {activeTab === 'link' && (
            <div className="space-y-5">
              
              {/* Security Highlight Box */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start space-x-3">
                <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl mt-0.5">
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
                  <p className="font-extrabold text-sm text-emerald-900 dark:text-emerald-300">
                    এডমিন গোপনীয়তা শতভাগ সুরক্ষিত
                  </p>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    এই লিংকে ক্লিক করে কেউ কোম্পানি এডমিন প্যানেল, কর্মী তালিকা, বেতন বা রিপোর্ট দেখতে পারবে না। শুধুমাত্র ক্যামেরা ও আইডির মাধ্যমে উপস্থিতি ইনপুট নেওয়া হবে।
                  </p>
                </div>
              </div>

              {/* Direct Link Copy Box */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>পাবলিক হাজিরা লিংক (সবার জন্য উন্মুক্ত)</span>
                  <span className="text-[11px] text-slate-400 font-normal">ট্যাবলেট বা মোবাইল ব্রাউজারে উপযোগী</span>
                </label>

                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-800 dark:text-slate-200 font-mono select-all truncate">
                    {attendanceLink}
                  </div>
                  
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-3 rounded-2xl font-black text-xs transition flex items-center space-x-2 shrink-0 cursor-pointer shadow-sm ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>লিংক কপি</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleShareWhatsApp}
                  className="p-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>হোয়াটসঅ্যাপে লিংক পাঠান</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenPublicPortal();
                  }}
                  className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>লাইভ টেস্ট করুন (হাজিরা পোর্টাল)</span>
                </button>
              </div>

              {/* Office Tablet Guide */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-xs">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>অফিসের সাধারণ ট্যাব/কম্পিউটারে ব্যবহারের নিয়ম:</span>
                </div>
                <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                  <li>অফিসের রিসেপশন বা প্রবেশদ্বারে একটি সাধারণ ট্যাবলেট/স্মার্টফোনে এই লিংকটি ওপেন করুন।</li>
                  <li>ব্রাউজারকে ফুলস্ক্রিন করে রাখুন (F11 বা Add to Home Screen)।</li>
                  <li>কর্মীরা আসার সাথে সাথে স্বয়ংক্রিয় ফেস স্ক্যান বা আইডি টাইপ করে হাজিরা দেবে।</li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 2: Printable QR Code */}
          {activeTab === 'qr' && (
            <div className="space-y-6 text-center">
              
              {/* Noticeboard Poster Frame */}
              <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-emerald-500/50 inline-block mx-auto shadow-xl space-y-4 max-w-sm">
                
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {companyName}
                  </span>
                  <h4 className="font-black text-slate-900 dark:text-white text-base">
                    স্মার্ট ডিজিটাল হাজিরা কিউআর
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    অফিস / প্রতিষ্ঠানের নোটিশবোর্ডের জন্য উপযোগী
                  </p>
                </div>

                {/* Real QR Code */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-md flex items-center justify-center mx-auto w-52 h-52">
                  <img
                    src={qrImageUrl}
                    alt="হাজিরা কিউআর কোড"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center space-x-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-500" />
                    <span>স্মার্টফোনের ক্যামেরা দিয়ে স্ক্যান করুন</span>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    স্ক্যান করলেই সরাসরি ফেস হাজিরা পোর্টাল ওপেন হবে
                  </p>
                </div>

              </div>

              {/* Action Buttons: Print & Download */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handlePrintQR}
                  disabled={isPrinting}
                  className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center space-x-2 shadow-lg transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>নোটিশবোর্ডের জন্য পোস্টার প্রিন্ট করুন (A4)</span>
                </button>

                <button
                  onClick={handleDownloadQrImage}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center space-x-2 border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>QR ইমেজ ডাউনলোড</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: Security Policy & Geofence Settings */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span>ভুয়া/প্রক্সি হাজিরা ঠেকানোর অটোমেটিক ফিল্টার</span>
                </h4>

                <div className="space-y-3">
                  <label className="flex items-start space-x-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireGeofence}
                      onChange={(e) => setRequireGeofence(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>অফিস সীমানা (GPS Geofence) বাধ্যতামূলক করুন</span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        কর্মী অফিসের ১০০ মিটারের বাইরে থাকলে হাজিরা সাবমিট করা যাবে না।
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowManualPin}
                      onChange={(e) => setAllowManualPin(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-500" />
                        <span>লাইভ ক্যামেরা ফেস ডিটেকশন</span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        ছবি বা স্ক্রিনশট দেখালে বাতিল হবে, লাইভ ক্যামেরায় মানুষের মুখ শনাক্ত হতে হবে।
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 flex items-start space-x-3">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">এডমিনের রিমোট কন্ট্রোল:</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    এই লিংকের মাধ্যমে সংগৃহীত প্রতিটি উপস্থিতি সাথে সাথে এডমিনের কেন্দ্রীয় ড্যাশবোর্ড ও ক্লাউড ডাটাবেজে রিয়েল-টাইমে সেভ হয়ে যাবে।
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>এনক্রিপ্টেড ও সম্পূর্ণ নিরাপদ লিংক</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
