
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot,
  getDoc, updateDoc, writeBatch, query, where, getDocs, Firestore,
  QuerySnapshot, DocumentData
} from 'firebase/firestore';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, updatePassword, User, Auth,
  sendPasswordResetEmail
} from 'firebase/auth';
import { RiskItem, UserProfile } from '../types';
import { BASELINE_RISKS, ProjectModifier } from '../constants/riskConstants';
import { calculateAdjustedScore } from './riskBaselineService';

const firebaseConfig = {
  apiKey: "AIzaSyDsEWkkz5HqKps6fiRgUjLarKYivqpeY3U",
  authDomain: "risk-e-po-pm.firebaseapp.com",
  projectId: "risk-e-po-pm",
  storageBucket: "risk-e-po-pm.firebasestorage.app",
  messagingSenderId: "182724137344",
  appId: "1:182724137344:web:5075d17a8f23aafaa6b165",
  measurementId: "G-TB7H3QJBMD"
};

export let app: FirebaseApp | undefined;
export let db: Firestore | undefined;
export let auth: Auth | undefined;

export const isConfigured = () => {
  return firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE" &&
    !firebaseConfig.apiKey.includes("YOUR_API_KEY");
};

// Initialize Firebase
if (isConfigured()) {
  try {
    const existingApps = getApps();
    app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
}

const COLLECTION_NAME = 'risks';
const USERS_COLLECTION = 'users';
const DEFAULT_PASSWORD = 'gcme1234567';
const ADMIN_EMAIL = 'anupong.th@gmail.com';
const BASELINE_COLLECTION = 'baseline_risks';

// Listener Registry for cleanup before logout
const activeListeners: Map<string, () => void> = new Map();

export const registerListener = (id: string, unsubscribe: () => void) => {
  activeListeners.set(id, unsubscribe);
};

export const unregisterListener = (id: string) => {
  activeListeners.delete(id);
};

const cleanupAllListeners = () => {
  activeListeners.forEach((unsubscribe, id) => {
    try {
      unsubscribe();
    } catch (e) {
      // Ignore cleanup errors
    }
  });
  activeListeners.clear();
};

const sanitizeData = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

export const isPermissionError = (error: any): boolean => {
  if (!error) return false;
  const code = String(error.code || '');
  if (code === 'permission-denied' || code === '7') return true;
  const msg = String(error.message || '').toLowerCase();
  return msg.includes('permission') || msg.includes('insufficient') || msg.includes('access denied');
};

// --- AUTHENTICATION FUNCTIONS ---

export const loginWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error("auth-not-initialized");
  const credential = await signInWithEmailAndPassword(auth, email, password);

  // Ensure profile exists after login (for users registered before this update)
  if (db && credential.user) {
    const docRef = doc(db, USERS_COLLECTION, credential.user.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        email: email,
        role: email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'Admin' : 'User',
        assignedProjects: [],
        isDefaultPassword: password === DEFAULT_PASSWORD,
        createdAt: new Date().toISOString()
      });
    } else {
      // Auto-promote default admin if they were just a 'User'
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (docSnap.data() as any).role !== 'Admin') {
        await updateDoc(docRef, { role: 'Admin' });
      }
    }
  }

  return credential;
};

export const registerWithDefaultPassword = async (email: string) => {
  if (!auth || !db) throw new Error("auth-not-initialized");
  const userCredential = await createUserWithEmailAndPassword(auth, email, DEFAULT_PASSWORD);
  const user = userCredential.user;
  if (user) {
    await setDoc(doc(db, USERS_COLLECTION, user.uid), {
      email: email,
      role: email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'Admin' : 'User',
      assignedProjects: [],
      isDefaultPassword: true,
      createdAt: new Date().toISOString()
    });
  }
  return user;
};

export const resetUserPassword = async (email: string) => {
  if (!auth) throw new Error("auth-not-initialized");
  return sendPasswordResetEmail(auth, email);
};

export const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!db) return null;
  const docSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as any) } as UserProfile;
  }
  return null;
};

export const checkUserNeedsPasswordChange = async (uid: string): Promise<boolean> => {
  if (!db) return false;
  try {
    const profile = await fetchUserProfile(uid);
    return profile?.isDefaultPassword === true;
  } catch (error) {
    console.error("Error checking user profile:", error);
    throw error;
  }
};

export const updateUserPasswordAndProfile = async (newPassword: string) => {
  if (!auth || !db) throw new Error("auth-not-initialized");
  const user = auth.currentUser;
  if (!user) throw new Error("no-user-logged-in");
  await updatePassword(user, newPassword);
  await setDoc(doc(db, USERS_COLLECTION, user.uid), {
    isDefaultPassword: false,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

export const logoutUser = async () => {
  if (!auth) return;
  // Cleanup all active Firestore listeners before signing out
  cleanupAllListeners();
  // Small delay to allow cleanup to complete
  await new Promise(resolve => setTimeout(resolve, 100));
  return signOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => { };
  }
  return onAuthStateChanged(auth, callback);
};

/**
 * Automatically assign a project number to a user's authorized list.
 */
export const assignProjectToUser = async (uid: string, projectNo: string): Promise<void> => {
  if (!db) throw new Error("db-not-initialized");
  const userRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const currentProjects = data.assignedProjects || [];
    if (!currentProjects.includes(projectNo)) {
      await updateDoc(userRef, {
        assignedProjects: [...currentProjects, projectNo],
        updatedAt: new Date().toISOString()
      });
    }
  }
};

// --- FIRESTORE FUNCTIONS ---

export const subscribeToRisks = (onUpdate: (risks: RiskItem[]) => void, onError: (error: any) => void): (() => void) => {
  if (!db) {
    onUpdate([]);
    return () => { };
  }
  return onSnapshot(collection(db, COLLECTION_NAME), (querySnapshot) => {
    const risks: RiskItem[] = [];
    querySnapshot.forEach((doc) => {
      risks.push(doc.data() as RiskItem);
    });
    onUpdate(risks);
  }, (error) => {
    console.error("Error fetching risks:", error);
    onError(error);
  });
};

export const saveRiskToFirestore = async (risk: RiskItem): Promise<void> => {
  if (!db) throw new Error("db-not-initialized");
  const cleanRisk = sanitizeData(risk);
  await setDoc(doc(db, COLLECTION_NAME, risk.id), cleanRisk);
};

export const deleteRiskFromFirestore = async (riskId: string): Promise<void> => {
  if (!db) throw new Error("db-not-initialized");
  await deleteDoc(doc(db, COLLECTION_NAME, riskId));
};

export const fetchRisksByProject = async (projectNo: string): Promise<RiskItem[]> => {
  if (!db) return [];
  const q = query(collection(db, COLLECTION_NAME), where("projectNo", "==", projectNo));
  const querySnapshot = await getDocs(q);
  const risks: RiskItem[] = [];
  querySnapshot.forEach((doc) => risks.push(doc.data() as RiskItem));
  return risks;
};

export const batchSaveRisks = async (risks: RiskItem[]): Promise<void> => {
  if (!db) throw new Error("db-not-initialized");
  if (risks.length === 0) return;
  const batch = writeBatch(db);
  risks.forEach(risk => {
    const ref = doc(db, COLLECTION_NAME, risk.id);
    batch.set(ref, sanitizeData(risk));
  });
  await batch.commit();
};

export const updateProjectDetails = async (
  projectNo: string,
  updates: { projectName: string, pmName: string, email: string, industryType?: string, appliedModifiers?: string[] }
): Promise<void> => {
  if (!db) throw new Error("db-not-initialized");

  // 1. Get all risks for this project
  const risks = await fetchRisksByProject(projectNo);
  if (risks.length === 0) return;

  // 2. Batch update all of them
  const batch = writeBatch(db);
  risks.forEach(risk => {
    const ref = doc(db, COLLECTION_NAME, risk.id);
    batch.update(ref, {
      projectName: updates.projectName,
      pmName: updates.pmName,
      email: updates.email,
      industryType: updates.industryType || '',
      appliedModifiers: updates.appliedModifiers || [],
      lastUpdatedBy: auth?.currentUser?.email || 'System',
      updatedAt: new Date().toISOString()
    });
  });

  await batch.commit();
};

export const syncBaselineRisks = async (
  projectNo: string,
  industryType: string,
  modifiers: ProjectModifier[]
): Promise<void> => {
  if (!db) throw new Error("db-not-initialized");

  // Fetch current baseline definitions
  const currentBaseline = await fetchBaselineRisks();

  const risks = await fetchRisksByProject(projectNo);
  const baselineRisks = risks.filter(r => r.riskId.startsWith('B-'));
  if (baselineRisks.length === 0) return;

  const batch = writeBatch(db);

  baselineRisks.forEach(risk => {
    // Find the corresponding baseline definition to get base scores
    const baseDef = currentBaseline.find(b => `Baseline: ${b.factor}` === risk.description);
    if (baseDef) {
      const impact = calculateAdjustedScore(baseDef.baseImpact, 'Impact', modifiers, industryType);
      const likelihood = calculateAdjustedScore(baseDef.baseLikelihood, 'Likelihood', modifiers, industryType);

      const ref = doc(db, COLLECTION_NAME, risk.id);
      batch.update(ref, {
        initialRisk: { impact, likelihood },
        // Update residual risks too with default slight improvement
        residualRisk: {
          impact: Math.max(1, impact - 1),
          likelihood: Math.max(1, likelihood - 1)
        },
        appliedModifiers: modifiers.map(m => m.item),
        lastUpdatedBy: auth?.currentUser?.email || 'System',
        updatedAt: new Date().toISOString()
      });
    }
  });

  await batch.commit();
};

// --- BASELINE RISK MANAGEMENT ---

export const fetchBaselineRisks = async (): Promise<any[]> => {
  if (!db) return BASELINE_RISKS;
  try {
    const querySnapshot = await getDocs(collection(db, BASELINE_COLLECTION));
    if (querySnapshot.empty) {
      return BASELINE_RISKS;
    }
    const risks: any[] = [];
    querySnapshot.forEach((doc) => risks.push({ id: doc.id, ...doc.data() }));
    // Sort by discipline and factor for consistency
    return risks.sort((a, b) => {
      if (a.discipline === b.discipline) {
        return a.factor.localeCompare(b.factor);
      }
      return a.discipline.localeCompare(b.discipline);
    });
  } catch (error) {
    console.error("Error fetching baseline risks:", error);
    return BASELINE_RISKS;
  }
};

export const saveBaselineRisksBatch = async (risks: any[]): Promise<void> => {
  if (!db) throw new Error("db-not-initialized");
  const batch = writeBatch(db);

  // Fetch existing baseline risks to know what to delete/overwrite
  const querySnapshot = await getDocs(collection(db, BASELINE_COLLECTION));
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  risks.forEach((risk, index) => {
    const id = risk.id || `baseline_${String(index).padStart(3, '0')}`;
    const ref = doc(db, BASELINE_COLLECTION, id);
    const { id: _, ...data } = risk; // Remove id from data
    batch.set(ref, sanitizeData(data));
  });

  await batch.commit();
};
