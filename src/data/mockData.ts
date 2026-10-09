import { Student, ClassSubject, AttendanceRecord, RegisteredCompany, PayrollRecord, SomityTransaction, LeaveRequest, AuditLogItem } from '../types';
import { OrgCategoryKey } from '../utils/organizationConfig';

export const CATEGORY_CLASSES: Record<OrgCategoryKey, ClassSubject[]> = {
  educational: [
    {
      id: 'class-10-phy',
      className: 'Class 10',
      classNameBangla: '১০ম শ্রেণী',
      section: 'A',
      subjectName: 'পদার্থবিজ্ঞান (Physics)',
      teacherName: 'প্রধান শিক্ষক / বিষয় শিক্ষক',
      totalStudents: 0,
      roomNo: '২০১ নম্বর কক্ষ',
      scheduleTime: '০৯:০০ AM - ১০:০০ AM'
    },
    {
      id: 'class-9-math',
      className: 'Class 9',
      classNameBangla: '৯ম শ্রেণী',
      section: 'B',
      subjectName: 'উচ্চতর গণিত (Higher Math)',
      teacherName: 'গণিত শিক্ষক',
      totalStudents: 0,
      roomNo: '১০৪ নম্বর কক্ষ',
      scheduleTime: '১০:১৫ AM - ১১:১৫ AM'
    }
  ],
  corporate: [
    {
      id: 'dept-it-dev',
      className: 'Software Engineering',
      classNameBangla: 'আইটি ও সফটওয়্যার বিভাগ',
      section: 'IT',
      subjectName: 'সফটওয়্যার ডেভেলপমেন্ট টিম',
      teacherName: 'টিম লিড / ম্যানেজার',
      totalStudents: 0,
      roomNo: 'লেভেল-৪',
      scheduleTime: '০৯:০০ AM - ০৬:০০ PM'
    },
    {
      id: 'dept-hr-admin',
      className: 'HR & Management',
      classNameBangla: 'এইচআর ও এডমিন বিভাগ',
      section: 'HR',
      subjectName: 'মানবসম্পদ ও প্রশাসন',
      teacherName: 'এইচআর ম্যানেজার',
      totalStudents: 0,
      roomNo: 'এইচআর রুম',
      scheduleTime: '০৯:০০ AM - ০৫:৩০ PM'
    }
  ],
  factory: [
    {
      id: 'line-garments-1',
      className: 'Sewing Line 1',
      classNameBangla: 'সুইং সেকশন (লাইন-১)',
      section: 'Floor-A',
      subjectName: 'পোশাক সেলাই ও অ্যাসেম্বলি',
      teacherName: 'সুপারভাইজার ইনচার্জ',
      totalStudents: 0,
      roomNo: 'ফ্লোর-১',
      scheduleTime: '০৮:০০ AM - ০৫:০০ PM'
    }
  ],
  medical: [
    {
      id: 'unit-icu-emergency',
      className: 'Emergency Unit',
      classNameBangla: 'জরুরী বিভাগ ও আইসিইউ',
      section: 'ER',
      subjectName: 'ইমার্জেন্সি ও ক্রিটিক্যাল কেয়ার',
      teacherName: 'মেডিকেল অফিসার',
      totalStudents: 0,
      roomNo: 'গ্রাউন্ড ফ্লোর',
      scheduleTime: '২৪/৭ শিফট রোস্টার'
    }
  ],
  general: [
    {
      id: 'shop-main-branch',
      className: 'Main Showroom',
      classNameBangla: 'প্রধান শোরুম কাউন্টার',
      section: 'Main',
      subjectName: 'সেলস ও কাস্টমার সার্ভিস',
      teacherName: 'আউটলেট ম্যানেজার',
      totalStudents: 0,
      roomNo: 'প্রধান আউটলেট',
      scheduleTime: '১০:০০ AM - ০৮:০০ PM'
    }
  ],
  somity: [
    {
      id: 'somity-zone-1',
      className: 'Zone 1 Central',
      classNameBangla: 'সমিতি - কেন্দ্রীয় জোন ১',
      section: 'A',
      subjectName: 'সাপ্তাহিক ও মাসিক সভা',
      teacherName: 'সমিতি সভাপতি',
      totalStudents: 0,
      roomNo: 'সমিতি মিলনায়তন',
      scheduleTime: 'শুক্রবার বিকাল ০৪:০০ টা'
    }
  ]
};

// All mock data completely cleared - starting fresh with real user-created data
export const CATEGORY_MEMBERS: Record<OrgCategoryKey, Student[]> = {
  educational: [],
  corporate: [],
  factory: [],
  medical: [],
  general: [],
  somity: []
};

export const INITIAL_CLASSES: ClassSubject[] = CATEGORY_CLASSES.educational;
export const INITIAL_STUDENTS: Student[] = [];

export const generateInitialAttendanceRecords = (_categoryKey: OrgCategoryKey = 'educational'): AttendanceRecord[] => {
  return [];
};

export const MOCK_PAYROLL_RECORDS: PayrollRecord[] = [];
export const MOCK_SOMITY_TRANSACTIONS: SomityTransaction[] = [];
export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [];
export const MOCK_AUDIT_LOGS: AuditLogItem[] = [];
export const MOCK_ACADEMIC_SCHEDULE: any[] = [];
export const MOCK_COMPANIES: RegisteredCompany[] = [];
