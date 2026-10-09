import React, { useState, useEffect } from 'react';
import { Student, ClassSubject } from '../types';
import { OrgCategoryInfo } from '../utils/organizationConfig';
import { isFaceActuallyRegistered, isFingerprintActuallyRegistered } from '../utils/faceMatching';
import { FullScreenCameraModal } from './FullScreenCameraModal';
import {
  X,
  User,
  Phone,
  Mail,
  Building,
  CreditCard,
  Calendar,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Save,
  Zap,
  Camera,
  Fingerprint,
  Upload,
  RefreshCw
} from 'lucide-react';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  classes: ClassSubject[];
  orgInfo: OrgCategoryInfo;
  onSave?: (updatedStudent: Student) => void;
  onSaveMember?: (updatedStudent: Student) => void;
  onDelete?: (studentId: string) => void;
  onDeleteMember?: (studentId: string) => void;
  onOpenBiometricsModal?: (student: Student) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  student,
  classes,
  orgInfo,
  onSave,
  onSaveMember,
  onDelete,
  onDeleteMember,
}) => {
  const { terminology } = orgInfo;
  const saveHandler = onSave || onSaveMember;
  const deleteHandler = onDelete || onDeleteMember;

  const [nameBangla, setNameBangla] = useState<string>('');
  const [nameEnglish, setNameEnglish] = useState<string>('');
  const [roll, setRoll] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [guardianPhone, setGuardianPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [nidNumber, setNidNumber] = useState<string>('');
  const [joinDate, setJoinDate] = useState<string>('');
  const [monthlySalary, setMonthlySalary] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Biometrics State
  const [faceRegistered, setFaceRegistered] = useState<boolean>(false);
  const [faceImage, setFaceImage] = useState<string>('');
  const [fingerprintRegistered, setFingerprintRegistered] = useState<boolean>(false);
  const [fingerprintFingerName, setFingerprintFingerName] = useState<string>('ডান হাতের বৃদ্ধাঙ্গুল (Right Thumb)');
  const [isScanningFingerprint, setIsScanningFingerprint] = useState<boolean>(false);
  const [isFullScreenCameraOpen, setIsFullScreenCameraOpen] = useState<boolean>(false);

  useEffect(() => {
    if (student) {
      setNameBangla(student.nameBangla || student.name || '');
      setNameEnglish(student.nameEnglish || '');
      setRoll(student.roll || '');
      setClassId(student.classId || (classes[0]?.id || ''));
      setDesignation(student.designation || '');
      setGuardianPhone(student.guardianPhone || student.parentPhone || '');
      setEmail(student.email || '');
      setGender(student.gender || 'Male');
      setNidNumber(student.nidNumber || '');
      setJoinDate(student.joinDate || '');
      setMonthlySalary(student.monthlySalary ? String(student.monthlySalary) : '');
      setActive(student.active !== false);
      setPhotoUrl(student.photoUrl || '');

      const hasFace = isFaceActuallyRegistered(student);
      setFaceRegistered(hasFace);
      setFaceImage(hasFace ? (student.faceImage || student.photoUrl || '') : '');

      const hasFp = isFingerprintActuallyRegistered(student);
      setFingerprintRegistered(hasFp);
      setFingerprintFingerName(student.fingerprintFingerName || 'ডান হাতের বৃদ্ধাঙ্গুল (Right Thumb)');
    }
  }, [student, classes]);

  if (!isOpen || !student) return null;

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setPhotoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFace = () => {
    setFaceRegistered(false);
    setFaceImage('');
  };

  const handleRemoveFingerprint = () => {
    setFingerprintRegistered(false);
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
      alert(`অনুগ্রহ করে নাম এবং ${terminology.idLabel} দিন।`);
      return;
    }

    const selectedClass = classes.find(c => c.id === classId);

    const updatedStudent: Student = {
      ...student,
      name: nameEnglish || nameBangla,
      nameBangla: nameBangla.trim(),
      nameEnglish: nameEnglish.trim() || undefined,
      roll: roll.trim(),
      classId,
      className: selectedClass ? selectedClass.classNameBangla : student.className,
      designation: designation.trim() || undefined,
      guardianPhone: guardianPhone.trim(),
      parentPhone: guardianPhone.trim(),
      email: email.trim() || undefined,
      gender,
      nidNumber: nidNumber.trim() || undefined,
      joinDate: joinDate.trim() || undefined,
      monthlySalary: monthlySalary ? Number(monthlySalary) : undefined,
      active,
      photoUrl: photoUrl.trim() || (faceRegistered && faceImage ? faceImage : student.photoUrl),
      faceRegistered,
      faceImage: faceRegistered ? faceImage : undefined,
      fingerprintRegistered,
      fingerprintFingerName: fingerprintRegistered ? fingerprintFingerName : undefined,
    };

    if (saveHandler) {
      saveHandler(updatedStudent);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!deleteHandler) return;
    if (confirm(`আপনি কি নিশ্চিত যে "${student.nameBangla}" এর সকল তথ্য এবং রেকর্ড মুছে ফেলতে চান?`)) {
      deleteHandler(student.id);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold overflow-hidden shadow-inner shrink-0">
                {photoUrl && !photoUrl.includes('placeholder') ? (
                  <img src={photoUrl} alt={student.nameBangla} className="w-full h-full object-cover" />
                ) : faceImage ? (
                  <img src={faceImage} alt={student.nameBangla} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2 className="text-base font-black flex items-center space-x-2">
                  <span>{terminology.memberLabel} প্রোফাইল ও তথ্য এডিট</span>
                </h2>
                <p className="text-xs text-slate-300">
                  {student.nameBangla} &bull; {terminology.idLabel}: <span className="font-mono text-emerald-400 font-bold">{student.roll}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
            
            {/* Profile Picture Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                  {photoUrl && !photoUrl.includes('placeholder') ? (
                    <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : faceImage ? (
                    <img src={faceImage} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    প্রোফাইল পিকচার (Avatar Photo)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    গ্যালারি বা ডিভাইস থেকে সাধারণ প্রোফাইল ছবি আপলোড করুন।
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>ছবি আপলোড</span>
                  <input type="file" accept="image/*" onChange={handleProfileImageUpload} className="hidden" />
                </label>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="px-2.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl font-bold transition text-xs cursor-pointer"
                  >
                    ছবি সরান
                  </button>
                )}
              </div>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Bangla Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {terminology.memberLabel}-এর পূর্ণ নাম (বাংলা) *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={nameBangla}
                    onChange={(e) => setNameBangla(e.target.value)}
                    placeholder="যেমন: মোঃ আনিসুর রহমান"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-emerald-500 font-bold"
                  />
                </div>
              </div>

              {/* English Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  নাম (ইংরেজি)
                </label>
                <input
                  type="text"
                  value={nameEnglish}
                  onChange={(e) => setNameEnglish(e.target.value)}
                  placeholder="e.g. Md Anisur Rahman"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-emerald-500 font-medium"
                />
              </div>

              {/* ID / Roll */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {terminology.idLabel} / আইডি *
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={roll}
                    onChange={(e) => setRoll(e.target.value)}
                    placeholder="যেমন: EMP-101 বা 101"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-mono font-black focus:outline-emerald-500"
                  />
                </div>
              </div>

              {/* Class / Department */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {terminology.groupLabel} / বিভাগ *
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-emerald-500 font-bold"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.classNameBangla} ({c.section})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Designation / Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  পদবী / দায়িত্ব (Designation)
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="যেমন: সিনিয়র অফিসার / এক্সিকিউটিভ"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-emerald-500 font-medium"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  যোগাযোগের মোবাইল নম্বর
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-emerald-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ইমেইল এড্রেস
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="member@company.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  লিঙ্গ (Gender)
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-emerald-500 font-bold"
                >
                  <option value="Male">পুরুষ (Male)</option>
                  <option value="Female">মহিলা (Female)</option>
                  <option value="Other">অন্যান্য (Other)</option>
                </select>
              </div>

              {/* Monthly Salary / Wage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মাসিক বেতন / মজুরি (ঐচ্ছিক)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    placeholder="যেমন: 25000"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-mono focus:outline-emerald-500"
                  />
                </div>
              </div>

              {/* Active / Inactive Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  কর্মরত স্ট্যাটাস
                </label>
                <div className="flex items-center space-x-4 pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <input
                      type="radio"
                      name="activeStatus"
                      checked={active === true}
                      onChange={() => setActive(true)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>সক্রিয় (Active)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-rose-600 dark:text-rose-400">
                    <input
                      type="radio"
                      name="activeStatus"
                      checked={active === false}
                      onChange={() => setActive(false)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>নিষ্ক্রিয় (Inactive)</span>
                  </label>
                </div>
              </div>

            </div>

            {/* SEPARATE BIOMETRICS SECTION AT BOTTOM OF FORM */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>বায়োমেট্রিক তথ্য ও ব্যবস্থাপনা (Biometrics Data)</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  নিচে ফেস এবং ফিঙ্গারপ্রিন্ট আলাদাভাবে প্রদর্শিত হচ্ছে। ফেস থাকলে রিমুভ করুন অথবা সরাসরি ফুল স্ক্রিন ক্যামেরায় ছবি তুলুন।
                </p>
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

                    {faceRegistered && faceImage ? (
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

                  {/* Face Content */}
                  {faceRegistered && faceImage ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                        <img
                          src={faceImage}
                          alt="Face Preview"
                          className="w-14 h-14 rounded-lg object-cover border border-emerald-500/40 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {student.nameBangla}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            ফেস ডাটাবেজে সক্রিয় রয়েছে
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleRemoveFace}
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
                        বর্তমানে কোনো ফেস ডাটা সংরক্ষিত নেই। নিচের বাটনে ক্লিক করে সরাসরি ফুল স্ক্রিন ক্যামেরায় ছবি তুলুন।
                      </p>

                      <button
                        type="button"
                        onClick={() => setIsFullScreenCameraOpen(true)}
                        className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                      >
                        <Zap className="w-4 h-4" />
                        <span>সরাসরি ফুল স্ক্রিন ক্যামেরায় ফেস স্ক্যান করুন</span>
                      </button>
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
                            {fingerprintFingerName}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            ডিভাইসে ফিঙ্গারপ্রিন্ট সংযুক্ত
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleRemoveFingerprint}
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
                          value={fingerprintFingerName}
                          onChange={e => setFingerprintFingerName(e.target.value)}
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

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-5 border-t border-slate-200 dark:border-slate-800">
              {deleteHandler ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-800 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>প্রোফাইল মুছুন</span>
                </button>
              ) : <div />}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  বাতিল
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>পরিবর্তন সংরক্ষণ করুন</span>
                </button>
              </div>
            </div>

          </form>

        </div>
      </div>

      {/* FULL SCREEN CAMERA MODAL OVERLAY */}
      <FullScreenCameraModal
        isOpen={isFullScreenCameraOpen}
        onClose={() => setIsFullScreenCameraOpen(false)}
        memberName={nameBangla || student.nameBangla}
        onCapture={(photoDataUrl) => {
          setFaceImage(photoDataUrl);
          setFaceRegistered(true);
          if (!photoUrl) {
            setPhotoUrl(photoDataUrl);
          }
        }}
      />
    </>
  );
};
