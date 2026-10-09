import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, ClassSubject, Student, AttendanceRecord, AuditLogItem, RegisteredCompany, OrganizationScheduleSettings } from './types';
import { getStoredClasses, getStoredStudents, getStoredAttendance, getDailySummaryForClass, getStoredCompanies, saveStoredCompanies } from './utils/storage';
import { OrgCategoryKey, ORG_CATEGORIES, getStoredOrgCategory, saveOrgCategory } from './utils/organizationConfig';
import { getStoredScheduleSettings, saveScheduleSettings, getCurrentActiveShift } from './utils/scheduleConfig';
import { ScheduleSettingsModal } from './components/ScheduleSettingsModal';
import {
  CATEGORY_CLASSES,
  CATEGORY_MEMBERS,
  generateInitialAttendanceRecords,
  MOCK_AUDIT_LOGS,
  MOCK_COMPANIES
} from './data/mockData';

import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { KioskMode } from './components/KioskMode';
import { FaceScannerModal } from './components/FaceScannerModal';
import { StudentFaceRegisterModal } from './components/StudentFaceRegisterModal';
import { OrgCategorySelectorModal } from './components/OrgCategorySelectorModal';
import { AnalyticsView } from './components/AnalyticsView';

// Mobile-First Core Modules
import { GeofenceScannerModal } from './components/GeofenceScannerModal';
import { NotificationSmsModal } from './components/NotificationSmsModal';
import { SmartIdCardModal } from './components/SmartIdCardModal';
import { AuditLogModal } from './components/AuditLogModal';
import { AuthRegistrationModal } from './components/AuthRegistrationModal';
import { MandatoryLoginGate } from './components/MandatoryLoginGate';
import { NavigationMenu } from './components/NavigationMenu';
import { CompanyAdminNavbar } from './components/CompanyAdminNavbar';
import { UserDirectoryView } from './components/UserDirectoryView';
import { MemberProfileModal } from './components/MemberProfileModal';
import { CompanyProfileModal } from './components/CompanyProfileModal';
import { AttendanceLinkModal } from './components/AttendanceLinkModal';
import { PublicAttendancePortal } from './components/PublicAttendancePortal';
import { UserAttendancePortal } from './components/UserAttendancePortal';
import { BiometricManagementModal } from './components/BiometricManagementModal';
import { ZKTecoDeviceModal } from './components/ZKTecoDeviceModal';
import { FingerprintScannerModal } from './components/FingerprintScannerModal';
import { EditMemberModal } from './components/EditMemberModal';
import { ScheduleSettingsView } from './components/ScheduleSettingsView';
import { FooterNavigation } from './components/FooterNavigation';
import { exportAttendanceCSV, saveStudents } from './utils/storage';

import {
  BarChart3,
  LayoutDashboard,
  Users,
  MapPin,
  MessageSquare,
  QrCode,
  Camera,
  CheckCircle2,
  Zap,
  UserPlus
} from 'lucide-react';

import {
  testFirestoreConnection,
  subscribeToCompanies,
  saveCompanyToFirestore,
  subscribeToMembers,
  saveMemberToFirestore,
  deleteMemberFromFirestore,
  subscribeToAttendance,
  saveAttendanceToFirestore,
  saveAuditLogToFirestore,
  subscribeToScheduleSettings,
  saveScheduleSettingsToFirestore,
  subscribeToAuth,
  signInWithGoogle,
  signOutUser
} from './lib/firebase';
import { User } from 'firebase/auth';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem('smart_hazira_current_role_v1');
      return (saved as UserRole) || 'teacher';
    } catch {
      return 'teacher';
    }
  });

  const [orgCategory, setOrgCategory] = useState<OrgCategoryKey>('educational');
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('smart_hazira_current_user_v1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    try {
      if (user) {
        localStorage.setItem('smart_hazira_current_user_v1', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }));
      } else {
        localStorage.removeItem('smart_hazira_current_user_v1');
      }
    } catch (e) {
      console.warn('Could not save user to storage:', e);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    try {
      localStorage.setItem('smart_hazira_current_role_v1', role);
    } catch {
      // ignore
    }
  };
  
  const [classes, setClasses] = useState<ClassSubject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // System datasets
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(MOCK_AUDIT_LOGS);
  const [registeredCompanies, setRegisteredCompanies] = useState<RegisteredCompany[]>(() => {
    return getStoredCompanies();
  });
  const [activeCompany, setActiveCompany] = useState<RegisteredCompany | null>(() => {
    try {
      const saved = localStorage.getItem('smart_hazira_active_company_v1');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        setCurrentUser(user);
        const newLog: AuditLogItem = {
          id: `log-auth-${Date.now()}`,
          userRole: currentRole,
          action: 'Google Authentication Sign In',
          targetMember: user.displayName || user.email || 'User',
          timestamp: new Date().toLocaleTimeString('bn-BD'),
          details: `Google ID: ${user.email} সফলভাবে লগইন করেছেন`,
          status: 'Success'
        };
        setAuditLogs(prev => [newLog, ...prev]);
        saveAuditLogToFirestore(newLog);
      }
    } catch (error) {
      console.error('Google Sign In failed:', error);
      setIsAuthModalOpen(true);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error('Sign Out error from Firebase:', error);
    }
    setCurrentUser(null);
    setActiveCompany(null);
    setSelectedLoggedInStudentId('');
    try {
      localStorage.removeItem('smart_hazira_current_user_v1');
      localStorage.removeItem('smart_hazira_active_company_v1');
    } catch {
      // ignore
    }
    const newLog: AuditLogItem = {
      id: `log-out-${Date.now()}`,
      userRole: currentRole,
      action: 'Authentication Sign Out',
      targetMember: currentUser?.displayName || currentUser?.email || 'User',
      timestamp: new Date().toLocaleTimeString('bn-BD'),
      details: `সফলভাবে লগআউট সম্পন্ন হয়েছে`,
      status: 'Success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog);
  };

  const handleAddCompany = (newCompany: RegisteredCompany) => {
    setRegisteredCompanies(prev => {
      const updated = [newCompany, ...prev.filter(c => c.id !== newCompany.id)];
      saveStoredCompanies(updated);
      return updated;
    });
    
    // CRITICAL: Only set as active company if registering from public login (company onboarding)
    // If Super Admin adds a company from SuperAdminDashboard, DO NOT switch active company globally!
    if (currentRole !== 'super_admin') {
      setActiveCompany(newCompany);
      try {
        localStorage.setItem('smart_hazira_active_company_v1', JSON.stringify(newCompany));
      } catch {
        // ignore
      }
    }
    saveCompanyToFirestore(newCompany);

    const newLog: AuditLogItem = {
      id: `log-cmp-${Date.now()}`,
      userRole: 'Super Admin',
      action: 'New Company Registered',
      targetMember: newCompany.nameBangla,
      timestamp: new Date().toLocaleTimeString('bn-BD'),
      details: `ক্যাটাগরি: ${newCompany.category}, কোড: ${newCompany.code} নিবন্ধিত হয়েছে`,
      status: 'Success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog);
  };

  const handleUpdateCompanyStatus = (companyId: string, newStatus: 'Active' | 'Pending' | 'Suspended') => {
    setRegisteredCompanies(prev => {
      const updated = prev.map(c => c.id === companyId ? { ...c, status: newStatus } : c);
      saveStoredCompanies(updated);
      const targetCompany = updated.find(c => c.id === companyId);
      if (targetCompany) {
        saveCompanyToFirestore(targetCompany);
      }
      return updated;
    });
  };

  const handleSelectCompanyToManage = (company: RegisteredCompany) => {
    setActiveCompany(company);
    try {
      localStorage.setItem('smart_hazira_active_company_v1', JSON.stringify(company));
    } catch {
      // ignore
    }
    handleSelectOrgCategory(company.category, false);
    handleRoleChange('teacher');
    const newLog: AuditLogItem = {
      id: `log-sw-${Date.now()}`,
      userRole: 'Super Admin',
      action: 'Switched to Company Dashboard',
      targetMember: company.nameBangla,
      timestamp: new Date().toLocaleTimeString('bn-BD'),
      details: `কোম্পানি ${company.nameBangla} ড্যাশবোর্ডে প্রবেশ করা হয়েছে`,
      status: 'Success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog);
  };

  const handleAddMemberToCompany = (memberData: Partial<Student>, companyId: string) => {
    const company = registeredCompanies.find(c => c.id === companyId);
    const companyCat = company ? company.category : orgCategory;
    const targetClasses = CATEGORY_CLASSES[companyCat] || classes;
    const defaultClass = targetClasses[0] || classes[0];

    const newMember: Student = {
      id: `std-${Date.now()}`,
      name: memberData.name || memberData.nameBangla || 'New Member',
      nameBangla: memberData.nameBangla || 'নতুন সদস্য',
      roll: memberData.roll || `ID-${Math.floor(100 + Math.random() * 900)}`,
      classId: defaultClass ? defaultClass.id : 'class-default',
      className: defaultClass ? defaultClass.classNameBangla : 'সাধারণ বিভাগ',
      companyId: companyId,
      companyName: company?.nameBangla,
      photoUrl: memberData.photoUrl || memberData.faceImage || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%2310b981"/><circle cx="100" cy="80" r="42" fill="%23fce7f3"/><text x="100" y="192" font-size="12" font-family="sans-serif" text-anchor="middle" fill="white">${encodeURIComponent(memberData.nameBangla || 'সদস্য')}</text></svg>`,
      faceImage: memberData.faceImage || memberData.photoUrl || undefined,
      faceRegistered: Boolean(memberData.faceImage || (memberData.photoUrl && !memberData.photoUrl.includes('data:image/svg+xml') && !memberData.photoUrl.includes('placeholder'))),
      faceDescriptor: memberData.faceDescriptor,
      faceBiometricCode: memberData.faceBiometricCode,
      gender: 'Male',
      guardianPhone: memberData.guardianPhone || '01700000000',
      attendanceStreak: 1,
      department: memberData.department,
      designation: memberData.designation
    };

    setStudents(prev => [newMember, ...prev]);
    saveMemberToFirestore(newMember);

    setRegisteredCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        const updated = { ...c, totalMembers: c.totalMembers + 1 };
        saveCompanyToFirestore(updated);
        return updated;
      }
      return c;
    }));

    const newLog: AuditLogItem = {
      id: `log-mem-${Date.now()}`,
      userRole: 'Admin',
      action: 'Member Attached to Company',
      targetMember: `${newMember.nameBangla} (${company?.nameBangla})`,
      timestamp: new Date().toLocaleTimeString('bn-BD'),
      details: `কোম্পানি আইডি: ${companyId}, রোল: ${newMember.roll}`,
      status: 'Success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog);
  };

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'schedule' | 'analytics'>('dashboard');

  // Modals state
  const [scheduleSettings, setScheduleSettings] = useState<OrganizationScheduleSettings>(getStoredScheduleSettings());
  const [isScheduleSettingsOpen, setIsScheduleSettingsOpen] = useState<boolean>(false);
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState<boolean>(false);
  const [isGeofenceScannerOpen, setIsGeofenceScannerOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [isOrgSelectorOpen, setIsOrgSelectorOpen] = useState<boolean>(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState<boolean>(false);
  const [isSmartIdCardOpen, setIsSmartIdCardOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState<boolean>(false);
  const [isCompanyProfileModalOpen, setIsCompanyProfileModalOpen] = useState<boolean>(false);
  const [isAttendanceLinkModalOpen, setIsAttendanceLinkModalOpen] = useState<boolean>(false);
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<Student | null>(null);
  const [isPublicPortalOpen, setIsPublicPortalOpen] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';
      return urlParams.get('mode') === 'attendance' || 
             urlParams.get('link') === 'attendance' || 
             urlParams.get('portal') === 'attendance' ||
             hash.includes('mode=attendance') ||
             hash.includes('portal=attendance');
    } catch {
      return false;
    }
  });
  const [publicPortalGeofence, setPublicPortalGeofence] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('geo') === '1';
    } catch {
      return false;
    }
  });
  const [publicPortalMode, setPublicPortalMode] = useState<'public' | 'user'>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('portal_mode') === 'user' ? 'user' : 'public';
    } catch {
      return 'public';
    }
  });
  const [isBiometricsModalOpen, setIsBiometricsModalOpen] = useState<boolean>(false);
  const [isZKTecoDeviceModalOpen, setIsZKTecoDeviceModalOpen] = useState<boolean>(false);
  const [isFingerprintScannerOpen, setIsFingerprintScannerOpen] = useState<boolean>(false);
  const [selectedStudentForBiometrics, setSelectedStudentForBiometrics] = useState<Student | null>(null);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState<boolean>(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [selectedLoggedInStudentId, setSelectedLoggedInStudentId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Initialize data, Firebase subscriptions, and organization category on mount
  useEffect(() => {
    // Check if opened via Public Attendance Portal Link (?mode=attendance)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('mode') === 'attendance' || urlParams.get('link') === 'attendance') {
        setIsPublicPortalOpen(true);
        if (urlParams.get('geo') === '1') {
          setPublicPortalGeofence(true);
        }
      }
    } catch {
      // url fallback
    }

    const savedCategory = getStoredOrgCategory();
    setOrgCategory(savedCategory);

    const loadedClasses = getStoredClasses();
    const loadedStudents = getStoredStudents();
    const loadedAttendance = getStoredAttendance();

    setClasses(loadedClasses);
    setStudents(loadedStudents);
    setAttendanceRecords(loadedAttendance);

    if (loadedClasses.length > 0) {
      setSelectedClassId(loadedClasses[0].id);
    }

    // Test Firestore Connection
    testFirestoreConnection().then(connected => {
      setIsFirebaseConnected(connected);
    });

    // Subscribe to real-time Firestore updates
    const unsubCompanies = subscribeToCompanies((cloudCompanies) => {
      if (cloudCompanies && cloudCompanies.length > 0) {
        setRegisteredCompanies(prev => {
          // Merge unique companies
          const map = new Map<string, RegisteredCompany>();
          prev.forEach(c => map.set(c.id, c));
          cloudCompanies.forEach(c => map.set(c.id, c));
          return Array.from(map.values());
        });
      }
    });

    const unsubMembers = subscribeToMembers((cloudMembers) => {
      if (cloudMembers && cloudMembers.length > 0) {
        setStudents(prev => {
          const map = new Map<string, Student>();
          prev.forEach(s => map.set(s.id, s));
          cloudMembers.forEach(s => map.set(s.id, s));
          const merged = Array.from(map.values());
          localStorage.setItem('smart_hazira_students_v1', JSON.stringify(merged));
          return merged;
        });
      }
    });

    const unsubAttendance = subscribeToAttendance((cloudAttendance) => {
      if (cloudAttendance && cloudAttendance.length > 0) {
        setAttendanceRecords(prev => {
          const map = new Map<string, AttendanceRecord>();
          prev.forEach(a => map.set(a.id, a));
          cloudAttendance.forEach(a => map.set(a.id, a));
          const merged = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
          localStorage.setItem('smart_hazira_attendance_v1', JSON.stringify(merged));
          return merged;
        });
      }
    });

    const unsubSchedule = subscribeToScheduleSettings((cloudSettings) => {
      if (cloudSettings && cloudSettings.shifts && cloudSettings.shifts.length > 0) {
        setScheduleSettings(cloudSettings);
        saveScheduleSettings(cloudSettings);
      }
    });

    // Subscribe to Auth state: only update if Firebase returns a non-null authenticated user
    const unsubAuth = subscribeToAuth((cloudUser) => {
      if (cloudUser) {
        setCurrentUser(cloudUser);
      }
    });

    return () => {
      unsubCompanies();
      unsubMembers();
      unsubAttendance();
      unsubSchedule();
      unsubAuth();
    };
  }, []);

  const orgInfo = ORG_CATEGORIES[orgCategory] || ORG_CATEGORIES.educational;

  const handleSelectOrgCategory = (newCategoryKey: OrgCategoryKey, _loadDefaults: boolean = false) => {
    setOrgCategory(newCategoryKey);
    saveOrgCategory(newCategoryKey);

    // If active company exists, update company's category in state, Firestore, and storage
    if (activeCompany) {
      const updatedCompany: RegisteredCompany = {
        ...activeCompany,
        category: newCategoryKey
      };
      setActiveCompany(updatedCompany);
      saveCompanyToFirestore(updatedCompany);
      setRegisteredCompanies(prev => prev.map(c => c.id === updatedCompany.id ? updatedCompany : c));
      try {
        localStorage.setItem('smart_hazira_active_company_v1', JSON.stringify(updatedCompany));
      } catch {
        // ignore
      }
    }

    // Update available departments/classes template for this category
    const newClasses = CATEGORY_CLASSES[newCategoryKey] || CATEGORY_CLASSES.educational;
    setClasses(newClasses);
    try {
      localStorage.setItem('smart_hazira_classes_v1', JSON.stringify(newClasses));
    } catch {
      // ignore
    }

    // Show all members by default so changing category does not hide any user
    setSelectedClassId('all');

    // CRITICAL: NEVER overwrite or wipe students or attendance records!
    // Existing members remain 100% intact, only terminology & labels change.
  };

  // Strictly resolve the active company based on current session and role to prevent company name leakage
  const resolvedActiveCompany = useMemo<RegisteredCompany | null>(() => {
    // 1. If currently a student/employee, find that student's specific company
    if (currentRole === 'student' && selectedLoggedInStudentId) {
      const loggedStudent = students.find(s => s.id === selectedLoggedInStudentId);
      if (loggedStudent?.companyId) {
        const comp = registeredCompanies.find(c => c.id === loggedStudent.companyId);
        if (comp) return comp;
      }
    }

    // 2. If activeCompany is set in state, verify with registered companies
    if (activeCompany) {
      const match = registeredCompanies.find(c => c.id === activeCompany.id);
      return match || activeCompany;
    }

    // 3. If current user is authenticated as a company admin (uid: comp-*)
    if (currentUser?.uid && currentUser.uid.startsWith('comp-')) {
      const compId = currentUser.uid.replace('comp-', '');
      const match = registeredCompanies.find(c => c.id === compId);
      if (match) return match;
    }

    // 4. If current role is super_admin, do NOT pin to any single company
    if (currentRole === 'super_admin') {
      return null;
    }

    return registeredCompanies[0] || null;
  }, [activeCompany, currentRole, selectedLoggedInStudentId, students, registeredCompanies, currentUser]);

  // Isolate members strictly per active company (Multi-tenancy isolation - Requirement 2)
  const currentCompanyId = resolvedActiveCompany?.id;

  const companyStudents = useMemo(() => {
    // If Super Admin, show all members across companies
    if (currentRole === 'super_admin') {
      return students;
    }
    if (!currentCompanyId) {
      return students;
    }
    // Company admin or employee: STRICTLY show only members belonging to this specific company!
    return students.filter(s => s.companyId === currentCompanyId);
  }, [students, currentCompanyId, currentRole]);

  const companyAttendanceRecords = useMemo(() => {
    if (currentRole === 'super_admin' || !currentCompanyId) {
      return attendanceRecords;
    }
    const memberIds = new Set(companyStudents.map(s => s.id));
    return attendanceRecords.filter(r => memberIds.has(r.studentId));
  }, [attendanceRecords, companyStudents, currentCompanyId, currentRole]);

  // Ensure pure white background and light mode throughout the whole document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  }, []);

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const todayDateStr = new Date().toISOString().split('T')[0];

  // Real-time daily statistics isolated strictly for the active company
  const companyTodayAttendance = useMemo(() => {
    return companyAttendanceRecords.filter(r => r.date === todayDateStr);
  }, [companyAttendanceRecords, todayDateStr]);

  const companyStats = useMemo(() => {
    const total = companyStudents.length;
    const present = companyTodayAttendance.filter(r => r.status === 'Present').length;
    const late = companyTodayAttendance.filter(r => r.status === 'Late').length;
    const absent = Math.max(0, total - (present + late));
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return { total, present, late, absent, percentage };
  }, [companyStudents, companyTodayAttendance]);

  // Daily Summary statistics fallback
  const dailySummary = {
    date: todayDateStr,
    classId: selectedClassId || 'all',
    totalEnrolled: companyStats.total,
    present: companyStats.present,
    absent: companyStats.absent,
    late: companyStats.late,
    percentage: companyStats.percentage,
    autoSaved: true,
  };

  const handleAttendanceUpdated = (newRecord: AttendanceRecord) => {
    setAttendanceRecords(prev => {
      const index = prev.findIndex(r => r.id === newRecord.id);
      let updated: AttendanceRecord[];
      if (index >= 0) {
        updated = [...prev];
        updated[index] = newRecord;
      } else {
        updated = [newRecord, ...prev];
      }
      localStorage.setItem('smart_hazira_attendance_v1', JSON.stringify(updated));
      return updated;
    });

    // Save to Firestore Cloud
    saveAttendanceToFirestore(newRecord);

    // Add Audit Log
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      action: 'Attendance Updated',
      userRole: currentRole,
      targetMember: newRecord.studentName,
      timestamp: new Date().toLocaleTimeString('bn-BD'),
      details: `${newRecord.method} মেথডে স্ট্যাটাস ${newRecord.status} রেকর্ড করা হয়েছে`,
      status: 'Success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog);
  };

  const handleStudentAdded = (newStudent: Student) => {
    const targetCompId = activeCompany?.id || newStudent.companyId || 'default-company';
    const targetCompName = activeCompany?.nameBangla || newStudent.companyName || 'সংশ্লিষ্ট প্রতিষ্ঠান';
    const scopedStudent: Student = {
      ...newStudent,
      companyId: targetCompId,
      companyName: targetCompName
    };

    setStudents(prev => {
      const updated = [...prev, scopedStudent];
      localStorage.setItem('smart_hazira_students_v1', JSON.stringify(updated));
      return updated;
    });
    saveMemberToFirestore(scopedStudent);

    if (activeCompany) {
      setRegisteredCompanies(prev => prev.map(c => {
        if (c.id === activeCompany.id) {
          const updated = { ...c, totalMembers: (c.totalMembers || 0) + 1 };
          saveCompanyToFirestore(updated);
          return updated;
        }
        return c;
      }));
    }

    const newLog: AuditLogItem = {
      id: `log-std-${Date.now()}`,
      action: 'New Member Registered',
      userRole: currentRole,
      targetMember: scopedStudent.nameBangla,
      timestamp: new Date().toLocaleTimeString('bn-BD'),
      details: `কোম্পানি: ${targetCompName}, আইডি: ${scopedStudent.roll}, বিভাগ: ${scopedStudent.className}`,
      status: 'Success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog);
  };

  const handleBulkStudentsAdded = (newStudents: Student[]) => {
    if (!newStudents || newStudents.length === 0) return;
    const targetCompId = activeCompany?.id || 'default-company';
    const targetCompName = activeCompany?.nameBangla || 'সংশ্লিষ্ট প্রতিষ্ঠান';

    const scopedStudents = newStudents.map(s => ({
      ...s,
      companyId: s.companyId || targetCompId,
      companyName: s.companyName || targetCompName,
    }));

    setStudents(prev => {
      const existingRolls = new Set(prev.filter(s => s.companyId === targetCompId).map(s => String(s.roll).trim()));
      const filtered = scopedStudents.filter(s => !existingRolls.has(String(s.roll).trim()));
      if (filtered.length === 0) return prev;
      const updated = [...prev, ...filtered];
      saveStudents(updated);
      return updated;
    });

    scopedStudents.forEach(s => {
      saveMemberToFirestore(s);
    });

    if (activeCompany) {
      setRegisteredCompanies(prev => prev.map(c => {
        if (c.id === activeCompany.id) {
          const updated = { ...c, totalMembers: (c.totalMembers || 0) + scopedStudents.length };
          saveCompanyToFirestore(updated);
          return updated;
        }
        return c;
      }));
    }

    const newLog: AuditLogItem = {
      id: `log-bulk-std-${Date.now()}`,
      action: 'Bulk Workers Imported',
      userRole: currentRole,
      targetMember: `${scopedStudents.length} জন কর্মী`,
      timestamp: new Date().toLocaleTimeString('bn-BD'),
      details: `কোম্পানি: ${targetCompName}-এ মোট ${scopedStudents.length} জন কর্মী সফলভাবে যুক্ত করা হয়েছে`,
      status: 'Success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog);
  };

  const handleSaveBiometrics = (updatedStudent: Student) => {
    setStudents(prev => {
      const updated = prev.map(s => s.id === updatedStudent.id ? updatedStudent : s);
      saveStudents(updated);
      return updated;
    });
    saveMemberToFirestore(updatedStudent);

    const newLog: AuditLogItem = {
      id: `log-bio-${Date.now()}`,
      action: 'Biometrics Profile Updated',
      userRole: currentRole,
      targetMember: updatedStudent.nameBangla,
      timestamp: new Date().toLocaleTimeString('bn-BD'),
      details: `ফেস আইডি: ${updatedStudent.faceRegistered ? 'সংযুক্ত' : 'মুছে ফেলা হয়েছে'}, ফিঙ্গারপ্রিন্ট: ${updatedStudent.fingerprintRegistered ? 'সংযুক্ত' : 'মুছে ফেলা হয়েছে'}`,
      status: 'Success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog);
  };

  const handleOpenEditModal = (student: Student) => {
    setSelectedStudentForEdit(student);
    setIsEditMemberModalOpen(true);
  };

  const handleSaveEditedMember = (updatedStudent: Student) => {
    setStudents(prev => {
      const updated = prev.map(s => s.id === updatedStudent.id ? updatedStudent : s);
      saveStudents(updated);
      return updated;
    });
    saveMemberToFirestore(updatedStudent);

    const newLog: AuditLogItem = {
      id: `log-edit-${Date.now()}`,
      userRole: currentRole === 'super_admin' ? 'Super Admin' : 'Admin',
      action: 'Member Profile Updated',
      targetMember: updatedStudent.nameBangla,
      timestamp: new Date().toLocaleTimeString('bn-BD'),
      details: `রোল: ${updatedStudent.roll}, বিভাগ: ${updatedStudent.className || 'সাধারণ'}, যোগাযোগ: ${updatedStudent.guardianPhone || updatedStudent.parentPhone || 'N/A'}`,
      status: 'Success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog);
  };

  const handleDeleteMember = (studentId: string) => {
    const target = students.find(s => s.id === studentId);
    setStudents(prev => {
      const updated = prev.filter(s => s.id !== studentId);
      saveStudents(updated);
      return updated;
    });
    deleteMemberFromFirestore(studentId);

    if (target) {
      const newLog: AuditLogItem = {
        id: `log-del-${Date.now()}`,
        userRole: currentRole === 'super_admin' ? 'Super Admin' : 'Admin',
        action: 'Member Profile Deleted',
        targetMember: target.nameBangla,
        timestamp: new Date().toLocaleTimeString('bn-BD'),
        details: `সদস্য ${target.nameBangla} (${target.roll}) মুছে ফেলা হয়েছে`,
        status: 'Success'
      };
      setAuditLogs(prev => [newLog, ...prev]);
      saveAuditLogToFirestore(newLog);
    }
  };

  const handleApproveBiometrics = (studentId: string, status: 'Approved' | 'Rejected' | 'None') => {
    const target = students.find(s => s.id === studentId);
    if (!target) return;

    const updatedStudent: Student = {
      ...target,
      fingerprintStatus: status,
      fingerprintRegistered: status === 'Approved',
      fingerprintApprovedAt: status === 'Approved' ? new Date().toISOString() : undefined,
      fingerprintApprovedBy: status === 'Approved' ? ((currentUser as any)?.displayName || (currentUser as any)?.name || 'Company Admin') : undefined
    };

    setStudents(prev => {
      const updated = prev.map(s => (s.id === studentId ? updatedStudent : s));
      saveStudents(updated);
      return updated;
    });

    saveMemberToFirestore(updatedStudent);

    const newLog: AuditLogItem = {
      id: `log-bio-${Date.now()}`,
      userRole: currentRole === 'super_admin' ? 'Super Admin' : 'Admin',
      action: status === 'Approved' ? 'Biometrics Approved' : 'Biometrics Rejected',
      targetMember: target.nameBangla,
      timestamp: new Date().toLocaleTimeString('bn-BD'),
      details: status === 'Approved' 
        ? `মোবাইল ফিঙ্গারপ্রিন্ট অনুমোদন করা হয়েছে (ডিভাইস: ${target.fingerprintDeviceModel || 'স্মার্টফোন'})`
        : `মোবাইল ফিঙ্গারপ্রিন্ট আবেদন বাতিল করা হয়েছে`,
      status: status === 'Approved' ? 'Success' : 'Warning'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog);
  };

  // Schedule & Geofence Settings handler
  const handleSaveScheduleSettings = (newSettings: OrganizationScheduleSettings) => {
    setScheduleSettings(newSettings);
    saveScheduleSettings(newSettings);
    saveScheduleSettingsToFirestore(newSettings);
    const newLog: AuditLogItem = {
      id: `log-sch-${Date.now()}`,
      userRole: currentRole,
      action: 'Schedule & Geofence Updated',
      targetMember: 'Organization Shift System',
      timestamp: new Date().toLocaleTimeString('bn-BD'),
      details: `শিফট সংখ্যা: ${newSettings.shifts.length}, GPS ব্যাসার্ধ: ${newSettings.geofence.radiusMeters}m`,
      status: 'Success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveAuditLogToFirestore(newLog);
  };

  // If opened in Public Self-Service Attendance Portal Mode, render isolated portal without admin credentials
  if (isPublicPortalOpen) {
    const currentStudent = companyStudents.find(s => s.id === selectedLoggedInStudentId || s.email === currentUser?.email || s.phone === (currentUser as any)?.phoneNumber || s.guardianPhone === (currentUser as any)?.phoneNumber) || companyStudents[0];

    if (publicPortalMode === 'user' && currentStudent) {
      return (
        <UserAttendancePortal
          student={currentStudent}
          classes={classes}
          onExitPortal={() => {
            setIsPublicPortalOpen(false);
            setPublicPortalMode('public');
            try {
              window.history.replaceState({}, '', window.location.pathname);
            } catch {}
          }}
          onAttendanceUpdated={handleAttendanceUpdated}
          soundEnabled={soundEnabled}
          orgInfo={orgInfo}
          companyName={resolvedActiveCompany?.nameBangla || activeCompany?.nameBangla || 'স্মার্ট হাজিরা AI'}
          enforceGeofence={publicPortalGeofence}
          scheduleSettings={scheduleSettings}
          onUpdateStudent={(updatedStudent) => {
            setStudents(prev => {
              const updated = prev.map(s => s.id === updatedStudent.id ? updatedStudent : s);
              saveStudents(updated);
              return updated;
            });
            saveMemberToFirestore(updatedStudent);
          }}
        />
      );
    }

    return (
      <PublicAttendancePortal
        classes={classes}
        students={companyStudents}
        onExitPortal={() => {
          setIsPublicPortalOpen(false);
          setPublicPortalMode('public');
          try {
            window.history.replaceState({}, '', window.location.pathname);
          } catch {}
        }}
        onAttendanceUpdated={handleAttendanceUpdated}
        soundEnabled={soundEnabled}
        orgInfo={orgInfo}
        companyName={resolvedActiveCompany?.nameBangla || activeCompany?.nameBangla || 'স্মার্ট হাজিরা AI'}
        enforceGeofence={publicPortalGeofence}
      />
    );
  }

  // If user is not logged in, render the Authentication & Company Registration portal directly as the page
  if (!currentUser) {
    return (
      <MandatoryLoginGate
        onGoogleSignIn={handleGoogleSignIn}
        companies={registeredCompanies}
        students={students}
        onAddCompany={handleAddCompany}
        onRoleChange={handleRoleChange}
        onSelectCompany={handleSelectCompanyToManage}
        onSelectLoggedInStudent={(std) => setSelectedLoggedInStudentId(std.id)}
        onSetCurrentUser={setCurrentUser}
        orgCategory={orgCategory}
        onOpenPublicPortal={() => setIsPublicPortalOpen(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Top Main Navigation Bar for Company Admin & Users */}
      {currentRole === 'teacher' ? (
        <CompanyAdminNavbar
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab as any)}
          orgInfo={orgInfo}
          activeCompany={resolvedActiveCompany || activeCompany || null}
          currentUser={currentUser}
          isFirebaseConnected={isFirebaseConnected}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(prev => !prev)}
          onOpenOrgSelector={() => setIsOrgSelectorOpen(true)}
          onOpenFaceScanner={() => setIsFaceScannerOpen(true)}
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          onOpenProfileModal={() => setIsCompanyProfileModalOpen(true)}
          onOpenAuditLog={() => setIsAuditLogOpen(true)}
          onOpenSmsModal={() => setIsSmsModalOpen(true)}
          onOpenAttendanceLinkModal={() => setIsAttendanceLinkModalOpen(true)}
          onOpenScheduleSettings={() => setActiveTab('schedule')}
          activeShiftTitle={getCurrentActiveShift(scheduleSettings)?.nameBangla}
          onOpenNavigationMenu={() => setIsNavMenuOpen(true)}
          onSignOut={handleGoogleSignOut}
        />
      ) : (
        <Header
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(prev => !prev)}
          orgInfo={orgInfo}
          onOpenOrgSelector={() => setIsOrgSelectorOpen(true)}
          onOpenAuthPortal={() => setIsAuthModalOpen(true)}
          onOpenNavigationMenu={() => setIsNavMenuOpen(true)}
          isFirebaseConnected={isFirebaseConnected}
          currentUser={currentUser}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          companyName={resolvedActiveCompany?.nameBangla}
        />
      )}

      {/* Main Content Area */}
      {currentRole === 'kiosk' ? (
        <KioskMode
          classes={classes}
          students={students}
          onExitKiosk={() => setCurrentRole('teacher')}
          onAttendanceUpdated={handleAttendanceUpdated}
          soundEnabled={soundEnabled}
          orgInfo={orgInfo}
        />
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:pb-24 space-y-6">
          
          {/* Top Summary Stats (Only on Attendance Dashboard tab) */}
          {activeTab === 'dashboard' && (
            <StatsOverview
              totalStudents={companyStats.total}
              presentCount={companyStats.present}
              lateCount={companyStats.late}
              absentCount={companyStats.absent}
              attendancePercentage={companyStats.percentage}
              selectedClassName={currentClass ? currentClass.classNameBangla : orgInfo.terminology.groupLabel}
              autoSaved={dailySummary.autoSaved}
              orgInfo={orgInfo}
              activeShift={getCurrentActiveShift(scheduleSettings, new Date())}
            />
          )}

          {/* View Selection */}
          {currentRole === 'super_admin' ? (
            <SuperAdminDashboard
              companies={registeredCompanies}
              onAddCompany={handleAddCompany}
              onUpdateCompanyStatus={handleUpdateCompanyStatus}
              onSelectCompanyToManage={handleSelectCompanyToManage}
              onAddMemberToCompany={handleAddMemberToCompany}
              totalMembersCount={students.length}
              auditLogs={auditLogs}
            />
          ) : currentRole === 'teacher' ? (
            activeTab === 'dashboard' ? (
              <TeacherDashboard
                classes={classes}
                selectedClassId={selectedClassId}
                onSelectClass={setSelectedClassId}
                students={companyStudents}
                attendanceRecords={companyAttendanceRecords}
                onOpenFaceScanner={() => setIsFaceScannerOpen(true)}
                onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                onAttendanceUpdated={handleAttendanceUpdated}
                orgInfo={orgInfo}
                onOpenGeofenceModal={() => setIsGeofenceScannerOpen(true)}
                onOpenSmsModal={() => setIsSmsModalOpen(true)}
                onOpenSmartIdCard={() => setIsSmartIdCardOpen(true)}
                onOpenAuditLog={() => setIsAuditLogOpen(true)}
                onOpenAttendanceLinkModal={() => setIsAttendanceLinkModalOpen(true)}
                onOpenZKTecoDeviceModal={() => setIsZKTecoDeviceModalOpen(true)}
                onOpenFingerprintScanner={() => setIsFingerprintScannerOpen(true)}
                activeCompany={activeCompany || registeredCompanies[0] || null}
                onOpenBiometricsModal={(student) => {
                  setSelectedStudentForBiometrics(student);
                  setIsBiometricsModalOpen(true);
                }}
                onOpenEditModal={handleOpenEditModal}
                onNavigateToUsers={() => setActiveTab('users')}
                onOpenMemberProfile={(student) => setSelectedMemberForProfile(student)}
              />
            ) : activeTab === 'users' ? (
              <UserDirectoryView
                students={companyStudents}
                classes={classes}
                orgInfo={orgInfo}
                onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
                onOpenSmartIdCard={() => setIsSmartIdCardOpen(true)}
                onOpenFaceScanner={() => setIsFaceScannerOpen(true)}
                onOpenBiometricsModal={(student) => {
                  setSelectedStudentForBiometrics(student);
                  setIsBiometricsModalOpen(true);
                }}
                onEditStudent={handleOpenEditModal}
                onDeleteStudent={handleDeleteMember}
                onApproveBiometrics={handleApproveBiometrics}
                onBulkStudentsAdded={handleBulkStudentsAdded}
                onOpenMemberProfile={(student) => setSelectedMemberForProfile(student)}
              />
            ) : activeTab === 'schedule' ? (
              <ScheduleSettingsView
                settings={scheduleSettings}
                onSaveSettings={handleSaveScheduleSettings}
                orgInfo={orgInfo}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            ) : (
              <AnalyticsView
                classes={classes}
                students={companyStudents}
                attendanceRecords={companyAttendanceRecords}
                orgInfo={orgInfo}
              />
            )
          ) : (
            <StudentDashboard
              students={
                selectedLoggedInStudentId
                  ? (students.some(s => s.id === selectedLoggedInStudentId) ? students : (companyStudents.length > 0 ? companyStudents : students))
                  : (companyStudents.length > 0 ? companyStudents : students)
              }
              attendanceRecords={companyAttendanceRecords}
              onOpenFaceScanner={() => setIsFaceScannerOpen(true)}
              orgInfo={orgInfo}
              selectedStudentId={selectedLoggedInStudentId}
              scheduleSettings={scheduleSettings}
              onSignOut={handleGoogleSignOut}
              companyName={resolvedActiveCompany?.nameBangla}
              onOpenPublicPortal={() => {
                setIsPublicPortalOpen(true);
                setPublicPortalMode('user');
              }}
              onUpdateStudent={(updatedStudent) => {
                setStudents(prev => {
                  const updated = prev.map(s => (s.id === updatedStudent.id ? updatedStudent : s));
                  saveStudents(updated);
                  return updated;
                });
                saveMemberToFirestore(updatedStudent);
              }}
              onAttendancePunch={(record) => {
                handleAttendanceUpdated(record);
              }}
            />
          )}

        </main>
      )}

      {/* AI Face Scanner Modal */}
      <FaceScannerModal
        isOpen={isFaceScannerOpen}
        onClose={() => setIsFaceScannerOpen(false)}
        students={companyStudents.length > 0 ? companyStudents : students}
        selectedClassId={selectedClassId}
        selectedClassName={currentClass ? currentClass.classNameBangla : orgInfo.terminology.groupLabel}
        onAttendanceUpdated={handleAttendanceUpdated}
        soundEnabled={soundEnabled}
        orgInfo={orgInfo}
      />

      {/* GPS Geofencing & Office Boundary Configuration Modal */}
      <GeofenceScannerModal
        isOpen={isGeofenceScannerOpen}
        onClose={() => setIsGeofenceScannerOpen(false)}
        orgInfo={orgInfo}
        scheduleSettings={scheduleSettings}
        onSaveSettings={handleSaveScheduleSettings}
      />

      {/* Student Face Register Modal */}
      <StudentFaceRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        classes={classes}
        selectedClassId={selectedClassId}
        onStudentAdded={handleStudentAdded}
        orgInfo={orgInfo}
        companyId={resolvedActiveCompany?.id || activeCompany?.id || registeredCompanies[0]?.id}
        companyName={resolvedActiveCompany?.nameBangla || activeCompany?.nameBangla || registeredCompanies[0]?.nameBangla}
      />

      {/* Organization Category Selector Modal */}
      <OrgCategorySelectorModal
        isOpen={isOrgSelectorOpen}
        onClose={() => setIsOrgSelectorOpen(false)}
        currentCategory={orgCategory}
        onSelectCategory={handleSelectOrgCategory}
      />

      {/* SMS / WhatsApp Notification Modal */}
      <NotificationSmsModal
        isOpen={isSmsModalOpen}
        onClose={() => setIsSmsModalOpen(false)}
        students={companyStudents}
        orgInfo={orgInfo}
      />

      {/* Smart ID Card Modal */}
      <SmartIdCardModal
        isOpen={isSmartIdCardOpen}
        onClose={() => setIsSmartIdCardOpen(false)}
        students={companyStudents}
        orgInfo={orgInfo}
        companyName={activeCompany?.nameBangla || registeredCompanies[0]?.nameBangla}
      />

      {/* Security Audit Log Modal */}
      <AuditLogModal
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
        auditLogs={auditLogs}
      />

      {/* Auth & Registration Portal Modal */}
      <AuthRegistrationModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        companies={registeredCompanies}
        students={students}
        onAddCompany={handleAddCompany}
        onRoleChange={setCurrentRole}
        onSelectCompany={handleSelectCompanyToManage}
        onSelectLoggedInStudent={(std) => setSelectedLoggedInStudentId(std.id)}
        orgCategory={orgCategory}
        currentUser={currentUser}
        currentRole={currentRole}
        isCompanyLoggedIn={currentRole === 'teacher'}
        onSetCurrentUser={setCurrentUser}
      />

      {/* Central App Navigation & Tools Drawer Menu */}
      <NavigationMenu
        isOpen={isNavMenuOpen}
        onClose={() => setIsNavMenuOpen(false)}
        currentRole={currentRole}
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as any)}
        orgInfo={orgInfo}
        onOpenFaceScanner={() => setIsFaceScannerOpen(true)}
        onOpenGeofenceModal={() => setIsGeofenceScannerOpen(true)}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenSmartIdCard={() => setIsSmartIdCardOpen(true)}
        onOpenSmsModal={() => setIsSmsModalOpen(true)}
        onOpenAuditLog={() => setIsAuditLogOpen(true)}
        onOpenAttendanceLinkModal={() => setIsAttendanceLinkModalOpen(true)}
        onOpenScheduleSettings={() => setActiveTab('schedule')}
        onOpenZKTecoDeviceModal={() => setIsZKTecoDeviceModalOpen(true)}
        onOpenFingerprintScanner={() => setIsFingerprintScannerOpen(true)}
        onExportCSV={() => {
          exportAttendanceCSV(attendanceRecords, `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
        }}
        onMarkAllPresent={() => {
          const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
          const classStudents = students.filter(s => s.classId === selectedClassId);
          const today = new Date().toISOString().split('T')[0];
          const nowTime = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
          classStudents.forEach(student => {
            const record: AttendanceRecord = {
              id: `att-${Date.now()}-${student.id}`,
              studentId: student.id,
              studentName: student.nameBangla,
              roll: student.roll,
              classId: selectedClassId,
              className: currentClass ? currentClass.classNameBangla : orgInfo.terminology.groupLabel,
              date: today,
              time: nowTime,
              status: 'Present',
              method: 'Manual',
              notes: 'মেনু থেকে এক ক্লিকে সকল কর্মী উপস্থিত করা হয়েছে'
            };
            handleAttendanceUpdated(record);
          });
        }}
        onOpenOrgSelector={() => setIsOrgSelectorOpen(true)}
        onRoleChange={setCurrentRole}
        onSignOut={handleGoogleSignOut}
      />

      {/* Schedule, Shift (24h) & GPS Geofence Settings Modal */}
      <ScheduleSettingsModal
        isOpen={isScheduleSettingsOpen}
        onClose={() => setIsScheduleSettingsOpen(false)}
        settings={scheduleSettings}
        orgInfo={orgInfo}
        onSaveSettings={handleSaveScheduleSettings}
      />

      {/* Company Admin Profile & Settings Modal */}
      <CompanyProfileModal
        isOpen={isCompanyProfileModalOpen}
        onClose={() => setIsCompanyProfileModalOpen(false)}
        company={activeCompany || registeredCompanies[0] || null}
        currentUser={currentUser}
        orgInfo={orgInfo}
        totalMembersCount={students.length}
        onUpdateCompany={(updated) => {
          handleAddCompany(updated);
        }}
        onOpenOrgSelector={() => setIsOrgSelectorOpen(true)}
        onOpenScheduleSettings={() => setIsScheduleSettingsOpen(true)}
        onSignOut={handleGoogleSignOut}
        onOpenAuditLogs={() => setIsAuditLogOpen(true)}
      />

      {/* Public Attendance Link & Printable QR Code Generator Modal */}
      <AttendanceLinkModal
        isOpen={isAttendanceLinkModalOpen}
        onClose={() => setIsAttendanceLinkModalOpen(false)}
        company={activeCompany || registeredCompanies[0] || null}
        orgInfo={orgInfo}
        onOpenPublicPortal={() => setIsPublicPortalOpen(true)}
      />

      {/* Employee / Member Biometric Management Modal */}
      <BiometricManagementModal
        isOpen={isBiometricsModalOpen}
        onClose={() => {
          setIsBiometricsModalOpen(false);
          setSelectedStudentForBiometrics(null);
        }}
        student={selectedStudentForBiometrics}
        onSaveBiometrics={handleSaveBiometrics}
        orgInfo={orgInfo}
      />

      {/* Standalone ZKTeco Attendance Machine (Cloud ADMS / Push Protocol) Modal */}
      <ZKTecoDeviceModal
        isOpen={isZKTecoDeviceModalOpen}
        onClose={() => setIsZKTecoDeviceModalOpen(false)}
        students={companyStudents}
        attendanceRecords={companyAttendanceRecords}
        onAttendanceUpdated={handleAttendanceUpdated}
        orgInfo={orgInfo}
        onBulkStudentsAdded={handleBulkStudentsAdded}
      />

      {/* USB Optical Scanner & WebAuthn / Passkey Biometric Attendance Modal */}
      <FingerprintScannerModal
        isOpen={isFingerprintScannerOpen}
        onClose={() => setIsFingerprintScannerOpen(false)}
        students={companyStudents}
        selectedClassId={selectedClassId}
        selectedClassName={classes.find(c => c.id === selectedClassId)?.classNameBangla || orgInfo.terminology.groupLabel}
        onAttendanceUpdated={handleAttendanceUpdated}
        soundEnabled={soundEnabled}
        orgInfo={orgInfo}
      />

      {/* Member Profile Modal with Camera Face Enrollment */}
      {selectedMemberForProfile && (
        <MemberProfileModal
          student={selectedMemberForProfile}
          classes={classes}
          orgInfo={orgInfo}
          onClose={() => setSelectedMemberForProfile(null)}
          onUpdateStudent={(updatedStudent: Student) => {
            setStudents(prev => {
              const updated = prev.map(s => s.id === updatedStudent.id ? updatedStudent : s);
              saveStudents(updated);
              return updated;
            });
            saveMemberToFirestore(updatedStudent);
            setSelectedMemberForProfile(updatedStudent);
          }}
        />
      )}

      {/* Member Profile Edit Modal */}
      <EditMemberModal
        isOpen={isEditMemberModalOpen}
        onClose={() => {
          setIsEditMemberModalOpen(false);
          setSelectedStudentForEdit(null);
        }}
        student={selectedStudentForEdit}
        classes={classes}
        orgInfo={orgInfo}
        onSave={handleSaveEditedMember}
        onDelete={handleDeleteMember}
        onOpenBiometricsModal={(student) => {
          setIsEditMemberModalOpen(false);
          setSelectedStudentForBiometrics(student);
          setIsBiometricsModalOpen(true);
        }}
      />

      {/* Sticky Bottom Footer Navigation Bar with Icon System */}
      {currentRole !== 'kiosk' && (
        <FooterNavigation
          currentRole={currentRole}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab as any)}
          orgInfo={orgInfo}
          onOpenFaceScanner={() => {
            if (currentRole === 'student') {
              setIsPublicPortalOpen(true);
              setPublicPortalMode('user');
            } else {
              window.open(window.location.origin + window.location.pathname + '?mode=attendance&portal=public', '_blank');
            }
          }}
          onOpenNavMenu={() => setIsNavMenuOpen(true)}
          onOpenProfileModal={() => setIsCompanyProfileModalOpen(true)}
          onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          onOpenAttendanceLinkModal={() => {
            window.open(window.location.origin + window.location.pathname + '?mode=attendance&portal=public', '_blank');
          }}
          onOpenSmartIdCard={() => setIsSmartIdCardOpen(true)}
        />
      )}

    </div>
  );
}
