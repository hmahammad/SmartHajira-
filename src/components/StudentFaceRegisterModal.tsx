import React, { useState, useEffect } from 'react';
import { Student, ClassSubject } from '../types';
import { addStudent } from '../utils/storage';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { FullScreenCameraModal } from './FullScreenCameraModal';
import { extractFaceBiometrics } from '../utils/faceBiometrics';
import {
  UserPlus,
  Camera,
  Upload,
  X,
  CheckCircle2,
  RefreshCw,
  Zap,
  ShieldCheck,
  User,
  Fingerprint,
  Trash2,
  CreditCard,
  Building,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';

interface StudentFaceRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassSubject[];
  selectedClassId: string;
  onStudentAdded: (student: Student) => void;
  orgInfo: OrgCategoryInfo;
  companyId?: string;
  companyName?: string;
}

export const StudentFaceRegisterModal: React.FC<StudentFaceRegisterModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  onStudentAdded,
  orgInfo,
  companyId,
  companyName,
}) => {
  const { terminology } = orgInfo;

  const [nameBangla, setNameBangla] = useState('');
  const [nameEnglish, setNameEnglish] = useState('');
  const [roll, setRoll] = useState('');
  const [classId, setClassId] = useState(selectedClassId);
  const [designation, setDesignation] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [email, setEmail] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');

  // Biometrics State
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | undefined>(undefined);
  const [faceBiometricCode, setFaceBiometricCode] = useState<string | undefined>(undefined);
  const [isFullScreenCameraOpen, setIsFullScreenCameraOpen] = useState(false);

  const [fingerprintRegistered, setFingerprintRegistered] = useState(false);
  const [fingerprintName, setFingerprintName] = useState('ডান হাতের বৃদ্ধাঙ্গুল (Right Thumb)');
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);

  useEffect(() => {
    setClassId(selectedClassId);
  }, [selectedClassId]);

  const processCapturedFace = async (photoUrl: string) => {
    setCapturedPhotoUrl(photoUrl);
    try {
      const biometrics = await extractFaceBiometrics(photoUrl);
      if (biometrics && biometrics.descriptor) {
        setFaceDescriptor(biometrics.descriptor);
        setFaceBiometricCode(biometrics.biometricCode);
      }
    } catch (err) {
      console.warn('Biometric feature extraction error:', err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        processCapturedFace(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanFingerprint = () => {
    setIsScanningFingerprint(true);
    setTimeout(() => {
      setFingerprintRegistered(true);
      setIsScanningFingerprint(false);
    }, 1200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBangla.trim() || !roll.trim()) {
      alert(`অনুগ্রহ করে নাম ও ${terminology.idLabel} লিখুন।`);
      return;
    }

    const currentClass = classes.find(c => c.id === classId);

    const newStudent = addStudent({
      name: nameEnglish || nameBangla,
      nameBangla: nameBangla.trim(),
      nameEnglish: nameEnglish.trim() || undefined,
      roll: roll.trim(),
      classId,
      className: currentClass ? currentClass.classNameBangla : '',
      designation: designation.trim() || undefined,
      photoUrl: capturedPhotoUrl || '',
      faceImage: capturedPhotoUrl || '',
      faceRegistered: Boolean(capturedPhotoUrl && capturedPhotoUrl.length > 50),
      faceDescriptor: faceDescriptor,
      faceBiometricCode: faceBiometricCode,
      fingerprintRegistered,
      fingerprintFingerName: fingerprintRegistered ? fingerprintName : undefined,
      gender,
      guardianPhone: guardianPhone.trim(),
      parentPhone: guardianPhone.trim(),
      email: email.trim() || undefined,
      monthlySalary: monthlySalary ? Number(monthlySalary) : undefined,
      companyId: companyId || 'default-company',
      companyName: companyName || 'সংশ্লিষ্ট প্রতিষ্ঠান',
      active: true,
    });

    onStudentAdded(newStudent);

    // Reset Form
    setNameBangla('');
    setNameEnglish('');
    setRoll('');
    setDesignation('');
    setGuardianPhone('');
    setEmail('');
    setMonthlySalary('');
    setCapturedPhotoUrl(null);
    setFaceDescriptor(undefined);
    setFaceBiometricCode(undefined);
    setFingerprintRegistered(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] my-6">
          
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4.5 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black">{terminology.registerActionText}</h2>
                <p className="text-xs text-slate-300">
                  {companyName ? `প্রতিষ্ঠান: ${companyName}` : 'নতুন সদস্য ও বায়োমেট্রিক প্রোফাইল তৈরি'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
            
            {/* General Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {terminology.memberLabel}-এর পূর্ণ নাম (বাংলা) *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                    value={nameBangla}
                    onChange={e => setNameBangla(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Md Rafiqul Islam"
                  value={nameEnglish}
                  onChange={e => setNameEnglish(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {terminology.idLabel} / আইডি নম্বর *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="যেমন: EMP-101 বা 101"
                    value={roll}
                    onChange={e => setRoll(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-black text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {terminology.groupLabel} / বিভাগ *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select
                    value={classId}
                    onChange={e => setClassId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.classNameBangla} ({c.section})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">পদবী / ডেসিগনেশন</label>
                <input
                  type="text"
                  placeholder="যেমন: ফিল্ড অফিসার / এক্সিকিউটিভ"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">লিঙ্গ (Gender)</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                >
                  <option value="Male">পুরুষ (Male)</option>
                  <option value="Female">নারী (Female)</option>
                  <option value="Other">অন্যান্য (Other)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">{terminology.contactLabel}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="017xxxxxxxx"
                    value={guardianPhone}
                    onChange={e => setGuardianPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">ইমেইল ঠিকানা (ঐচ্ছিক)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="member@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">মাসিক মূল বেতন / মজুরি</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    placeholder="যেমন: 25000"
                    value={monthlySalary}
                    onChange={e => setMonthlySalary(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* SEPARATE BIOMETRICS SECTION AT BOTTOM OF FORM */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>বায়োমেট্রিক নিবন্ধন ও ডাটা (Biometrics)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    নিচে ফেস ও ফিঙ্গারপ্রিন্ট আলাদাভাবে সংযুক্ত করুন অথবা রিমুভ করুন।
                  </p>
                </div>
              </div>

              {/* 2 Separate Biometrics Cards (Face & Fingerprint) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. FACE BIOMETRIC CARD */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                          ফেস বায়োমেট্রিক
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Face Recognition
                        </span>
                      </div>
                    </div>

                    {capturedPhotoUrl ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ফেস সক্রিয়</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        ফেস নেই
                      </span>
                    )}
                  </div>

                  {/* Face Content: If Face exists show Photo + Remove button; Else show Full Screen Camera trigger */}
                  {capturedPhotoUrl ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <img
                          src={capturedPhotoUrl}
                          alt="Face Preview"
                          className="w-14 h-14 rounded-lg object-cover border border-emerald-500/40 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            ছবি সংগ্রহ সম্পন্ন
                          </p>
                          {faceBiometricCode ? (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold truncate">
                              কোড: {faceBiometricCode}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              হাজিরা শনাক্তকরণের জন্য প্রস্তুত
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setCapturedPhotoUrl(null)}
                          className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ফেস রিমুভ করুন</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsFullScreenCameraOpen(true)}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center space-x-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>পুনরায় স্ক্যান</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        কোন ফেস ডাটা পাওয়া যায়নি। নিচের বাটনে ক্লিক করলে সরাসরি ফুল স্ক্রিন ক্যামেরা চালু হবে।
                      </p>

                      <button
                        type="button"
                        onClick={() => setIsFullScreenCameraOpen(true)}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                      >
                        <Zap className="w-4 h-4" />
                        <span>সরাসরি ফুল স্ক্রিন ক্যামেরায় ফেস স্ক্যান করুন</span>
                      </button>

                      <label className="block text-center text-[11px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer">
                        বা গ্যালারি থেকে ফাইল আপলোড করুন
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>

                {/* 2. FINGERPRINT BIOMETRIC CARD */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Fingerprint className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                          ফিঙ্গারপ্রিন্ট বায়োমেট্রিক
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Fingerprint Sensor
                        </span>
                      </div>
                    </div>

                    {fingerprintRegistered ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>সক্রিয়</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        নেই
                      </span>
                    )}
                  </div>

                  {/* Fingerprint Content */}
                  {fingerprintRegistered ? (
                    <div className="space-y-3">
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                          <Fingerprint className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {fingerprintName}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            ডিভাইসে ফিঙ্গারপ্রিন্ট সংযুক্ত
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setFingerprintRegistered(false)}
                          className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ফিঙ্গারপ্রিন্ট রিমুভ</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleScanFingerprint}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center space-x-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>পুনরায় স্ক্যান</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          আঙ্গুল নির্বাচন করুন:
                        </label>
                        <select
                          value={fingerprintName}
                          onChange={e => setFingerprintName(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-indigo-500"
                        >
                          <option value="ডান হাতের বৃদ্ধাঙ্গুল (Right Thumb)">ডান হাতের বৃদ্ধাঙ্গুল (Right Thumb)</option>
                          <option value="ডান হাতের তর্জনী (Right Index)">ডান হাতের তর্জনী (Right Index)</option>
                          <option value="বাম হাতের বৃদ্ধাঙ্গুল (Left Thumb)">বাম হাতের বৃদ্ধাঙ্গুল (Left Thumb)</option>
                          <option value="বাম হাতের তর্জনী (Left Index)">বাম হাতের তর্জনী (Left Index)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={handleScanFingerprint}
                        disabled={isScanningFingerprint}
                        className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                      >
                        {isScanningFingerprint ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>সেন্সরে স্ক্যান হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <Fingerprint className="w-4 h-4" />
                            <span>ফিঙ্গারপ্রিন্ট স্ক্যান ও সংযোগ করুন</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-3 flex items-center justify-end space-x-2.5 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                সংরক্ষণ করুন
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* FULL SCREEN CAMERA OVERLAY MODAL */}
      <FullScreenCameraModal
        isOpen={isFullScreenCameraOpen}
        onClose={() => setIsFullScreenCameraOpen(false)}
        memberName={nameBangla}
        onCapture={(photoDataUrl) => {
          processCapturedFace(photoDataUrl);
        }}
      />
    </>
  );
};
