import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Printer, 
  QrCode, 
  Shield, 
  Download, 
  Users, 
  Check, 
  CreditCard, 
  Phone, 
  Sparkles,
  ExternalLink,
  RotateCw
} from 'lucide-react';
import { Student } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { printHtmlContent, generateSingleIdCardHtml, generateBatchIdCardsHtml } from '../utils/printUtils';

interface SmartIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  orgInfo: OrgCategoryInfo;
  companyName?: string;
}

export const SmartIdCardModal: React.FC<SmartIdCardModalProps> = ({
  isOpen,
  onClose,
  students,
  orgInfo,
  companyName = 'স্মার্ট প্রতিষ্ঠান',
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [localQrDataUrl, setLocalQrDataUrl] = useState<string>('');

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const { terminology } = orgInfo;

  useEffect(() => {
    if (currentStudent) {
      QRCode.toDataURL(currentStudent.id || currentStudent.roll || 'ID', {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 300,
        color: { dark: '#000000', light: '#ffffff' }
      }).then(url => {
        setLocalQrDataUrl(url);
      }).catch(() => {
        setLocalQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentStudent.id || currentStudent.roll)}`);
      });
    }
  }, [currentStudent?.id, currentStudent?.roll]);

  if (!isOpen) return null;

  if (!currentStudent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center max-w-sm">
          <p className="text-slate-500 text-sm">কোনো সদস্য তথ্য পাওয়া যায়নি।</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs">বন্ধ করুন</button>
        </div>
      </div>
    );
  }

  const photoUrl = currentStudent.photoUrl || currentStudent.faceImage || '';
  const [imageError, setImageError] = useState<boolean>(false);

  useEffect(() => {
    setImageError(false);
  }, [currentStudent?.id, photoUrl]);

  // Handle Single Card Printing
  const handlePrintSingleCard = () => {
    setIsPrinting(true);
    const html = generateSingleIdCardHtml(
      currentStudent, 
      companyName || terminology.orgCategoryName, 
      terminology.orgCategoryName
    );
    printHtmlContent(html, `${currentStudent.nameBangla || currentStudent.name}_স্মার্ট_আইডি_কার্ড`);
    setTimeout(() => setIsPrinting(false), 800);
  };

  // Handle Batch Print All
  const handlePrintAllCards = () => {
    setIsPrinting(true);
    const html = generateBatchIdCardsHtml(
      students, 
      companyName || terminology.orgCategoryName, 
      terminology.orgCategoryName
    );
    printHtmlContent(html, `সকল_সদস্যের_আইডি_কার্ড_${students.length}জন`);
    setTimeout(() => setIsPrinting(false), 800);
  };

  // Download QR Code image directly
  const handleDownloadQrImage = async () => {
    try {
      const dataUrl = localQrDataUrl || await QRCode.toDataURL(currentStudent.id || currentStudent.roll, {
        width: 500,
        margin: 2
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${currentStudent.nameBangla || currentStudent.name || 'সদস্য'}_QR_Code.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(currentStudent.id || currentStudent.roll)}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <span>স্মার্ট ডিজিটাল আইডি কার্ড ও QR</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                  হাই-রেজুলেশন প্রিন্ট
                </span>
              </h3>
              <p className="text-xs text-slate-400">পিভিসি কার্ড বা এ৪ কাগজে প্রিন্ট উপযোগী স্ট্যান্ডার্ড ফরম্যাট</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 dark:text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member Selector Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {terminology.memberLabel} নির্বাচন করুন:
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-emerald-500"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nameBangla} ({s.roll}) - {s.className || s.designation || 'সদস্য'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={() => setCardSide(cardSide === 'front' ? 'back' : 'front')}
              className="flex-1 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <RotateCw className="w-3.5 h-3.5 text-emerald-500" />
              <span>{cardSide === 'front' ? 'কার্ডের উল্টোপাশ (Back) দেখুন' : 'কার্ডের সম্মুখভাগ (Front) দেখুন'}</span>
            </button>
          </div>
        </div>

        {/* ID Card Visual Preview Container */}
        <div className="flex justify-center items-center py-2 shrink-0">
          {cardSide === 'front' ? (
            /* FRONT CARD */
            <div className="w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-2xl border-2 border-emerald-500/50 relative overflow-hidden flex flex-col items-center text-center space-y-3.5 transition-all">
              
              {/* Header */}
              <div className="w-full border-b border-slate-700/80 pb-2">
                <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest block">
                  {terminology.orgCategoryName} পরিচিতি কার্ড
                </span>
                <h4 className="font-black text-xs text-white truncate px-1">
                  {companyName || terminology.orgCategoryName}
                </h4>
              </div>

              {/* Photo */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-400 shadow-lg bg-slate-800 flex items-center justify-center font-bold text-xl text-emerald-400">
                  {photoUrl && !imageError ? (
                    <img
                      src={photoUrl}
                      alt={currentStudent.nameBangla}
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-2xl font-black text-emerald-400">
                      {currentStudent.nameBangla ? currentStudent.nameBangla.charAt(0) : 'স'}
                    </span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 p-1 bg-emerald-500 text-slate-950 rounded-full shadow">
                  <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
                </span>
              </div>

              {/* Name & Role */}
              <div>
                <h3 className="font-black text-sm text-white">{currentStudent.nameBangla}</h3>
                <p className="text-[11px] text-emerald-400 font-bold">{currentStudent.designation || currentStudent.className}</p>
                <div className="flex items-center justify-center space-x-2 text-[10px] text-slate-300 font-mono mt-1">
                  <span className="bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-700">
                    {terminology.idLabel}: <strong className="text-emerald-300">{currentStudent.roll}</strong>
                  </span>
                  {currentStudent.bloodGroup && (
                    <span className="bg-rose-950/60 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded-md font-bold">
                      {currentStudent.bloodGroup}
                    </span>
                  )}
                </div>
              </div>

              {/* Real QR Code */}
              <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-md flex items-center justify-center">
                <img
                  src={localQrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentStudent.id || currentStudent.roll)}`}
                  alt="Member QR"
                  className="w-16 h-16"
                />
              </div>

              {/* Footer text */}
              <div className="text-[9px] text-slate-400 font-mono w-full border-t border-slate-800 pt-1.5 flex items-center justify-between">
                <span>স্মার্ট এআই হাজিরা</span>
                <span className="text-emerald-400">বৈধ আইডি</span>
              </div>

            </div>
          ) : (
            /* BACK CARD */
            <div className="w-72 bg-white text-slate-900 rounded-3xl p-5 shadow-2xl border-2 border-slate-300 dark:border-slate-700 relative overflow-hidden flex flex-col space-y-3 transition-all text-xs">
              <div className="text-center border-b pb-2 border-slate-200">
                <h4 className="font-extrabold text-xs text-slate-900">নির্দেশনা ও নিয়মাবলী</h4>
                <p className="text-[10px] text-emerald-600 font-bold">{companyName}</p>
              </div>

              <ol className="text-[10px] text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed flex-1">
                <li>এই কার্ডটি প্রতিষ্ঠানের নিজস্ব সম্পত্তি।</li>
                <li>প্রতিষ্ঠান চলাকালীন কার্ডটি পরিধান আবশ্যক।</li>
                <li>কার্ডের কিউআর কোডটি হাজিরা স্ক্যানারে ব্যবহারযোগ্য।</li>
                <li>কার্ড হারালে অবিলম্বে এডমিনকে জানান।</li>
              </ol>

              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 text-[10px] space-y-0.5 font-mono">
                <p className="text-slate-500">জরুরী হেল্পলাইন:</p>
                <p className="font-bold text-slate-800">{currentStudent.guardianPhone || '01700-000000'}</p>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[10px] text-slate-400">
                কর্তৃপক্ষের অনুমোদন ও স্বাক্ষর
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
          
          {/* Print Single Card */}
          <button
            onClick={handlePrintSingleCard}
            disabled={isPrinting}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-2xl flex items-center justify-center space-x-1.5 shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>এই কার্ডটি প্রিন্ট করুন</span>
          </button>

          {/* Batch Print All Members */}
          <button
            onClick={handlePrintAllCards}
            disabled={isPrinting}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-2xl flex items-center justify-center space-x-1.5 shadow-md transition cursor-pointer"
            title="সকল সদস্যের কার্ড একসাথে A4 শীটে প্রিন্ট করুন"
          >
            <Users className="w-4 h-4" />
            <span>সকল কার্ড একসাথে প্রিন্ট ({students.length})</span>
          </button>

          {/* Download QR Image */}
          <button
            onClick={handleDownloadQrImage}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>QR ইমেজ ডাউনলোড</span>
          </button>

        </div>

      </div>
    </div>
  );
};
