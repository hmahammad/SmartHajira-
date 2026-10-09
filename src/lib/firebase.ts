import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { RegisteredCompany, Student, AttendanceRecord, AuditLogItem, OrganizationScheduleSettings } from '../types';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    const code = error?.code || '';
    const message = error?.message || '';

    if (
      code === 'auth/web-storage-unsupported' || 
      code === 'auth/operation-not-supported-in-this-environment' ||
      message.includes('third-party cookies') ||
      message.includes('storage') ||
      message.includes('cookie')
    ) {
      throw new Error('COOKIE_BLOCKED: ব্রাউজারের আইফ্রেম বা প্রিভিউ মোডে ৩য় পক্ষীয় কুকিজ ব্লক করা হয়েছে। অনুগ্রহ করে সরাসরি লগইন বাটন ব্যবহার করুন অথবা নতুন উইন্ডোতে অ্যাপটি খুলুন।');
    } else if (code === 'auth/popup-blocked') {
      throw new Error('POPUP_BLOCKED: ব্রাউজারের পপআপ উইন্ডো ব্লক করা হয়েছে। অনুগ্রহ করে পপআপ পারমিশন এলাউ করুন অথবা সরাসরি লগইন করুন।');
    } else if (code === 'auth/unauthorized-domain') {
      throw new Error('UNAUTHORIZED_DOMAIN: বর্তমান ডোমেইনটি অথোরাইজড তালিকায় যুক্ত নেই। আপনি নিচের সরাসরি লগইন বিকল্প দিয়ে অনায়াসে প্রবেশ করতে পারেন।');
    } else if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
      throw new Error('লগইন পপআপ উইন্ডো বন্ধ করা হয়েছে।');
    }
    
    throw new Error(error.message || 'গুগল সাইন-ইন সম্পন্ন করা যায়নি। অনুগ্রহ করে সরাসরি লগইন বিকল্প ব্যবহার করুন।');
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Info:', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore Connected Successfully');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network connection.");
    }
    return false;
  }
}

// Firestore Realtime Subscriptions & Actions

export function subscribeToCompanies(onUpdate: (companies: RegisteredCompany[]) => void) {
  const colRef = collection(db, 'companies');
  return onSnapshot(colRef, (snapshot) => {
    const items: RegisteredCompany[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ ...docSnap.data(), id: docSnap.id } as RegisteredCompany);
    });
    if (items.length > 0) {
      onUpdate(items);
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'companies');
  });
}

export async function saveCompanyToFirestore(company: RegisteredCompany) {
  const path = `companies/${company.id}`;
  try {
    await setDoc(doc(db, 'companies', company.id), company, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToMembers(onUpdate: (members: Student[]) => void) {
  const colRef = collection(db, 'members');
  return onSnapshot(colRef, (snapshot) => {
    const items: Student[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ ...docSnap.data(), id: docSnap.id } as Student);
    });
    if (items.length > 0) {
      onUpdate(items);
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'members');
  });
}

export async function saveMemberToFirestore(member: Student) {
  const path = `members/${member.id}`;
  try {
    await setDoc(doc(db, 'members', member.id), member, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMemberFromFirestore(memberId: string) {
  const path = `members/${memberId}`;
  try {
    await deleteDoc(doc(db, 'members', memberId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToAttendance(onUpdate: (records: AttendanceRecord[]) => void) {
  const colRef = collection(db, 'attendance');
  const q = query(colRef, orderBy('date', 'desc'), limit(200));
  return onSnapshot(q, (snapshot) => {
    const items: AttendanceRecord[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ ...docSnap.data(), id: docSnap.id } as AttendanceRecord);
    });
    if (items.length > 0) {
      onUpdate(items);
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, 'attendance');
  });
}

export async function saveAttendanceToFirestore(record: AttendanceRecord) {
  const path = `attendance/${record.id}`;
  try {
    await setDoc(doc(db, 'attendance', record.id), record, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveAuditLogToFirestore(log: AuditLogItem) {
  const path = `audit_logs/${log.id}`;
  try {
    await setDoc(doc(db, 'audit_logs', log.id), log);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToScheduleSettings(onUpdate: (settings: OrganizationScheduleSettings) => void) {
  const docRef = doc(db, 'settings', 'schedule_config');
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as OrganizationScheduleSettings;
      if (data && data.shifts && data.shifts.length > 0) {
        onUpdate(data);
      }
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'settings/schedule_config');
  });
}

export async function saveScheduleSettingsToFirestore(settings: OrganizationScheduleSettings) {
  const path = 'settings/schedule_config';
  try {
    await setDoc(doc(db, 'settings', 'schedule_config'), settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

