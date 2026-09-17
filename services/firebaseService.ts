
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot,
  getDoc, updateDoc, writeBatch, query, where, getDocs, Firestore,
  QuerySnapshot, DocumentData
} from 'firebase/firestore';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, updatePassword, User, Auth,
  sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential,
  OAuthProvider, signInWithPopup
} from 'firebase/auth';
import { RiskItem, UserProfile, RiskAppetite, ReviewFrequency } from '../types';
import { TorProject } from '../types/torRisk';
import { BASELINE_RISKS, ProjectModifier } from '../constants/riskConstants';
import { calculateAdjustedScore } from './riskBaselineService';

const firebaseConfig = {
  apiKey: "AIzaSyCAyFUBlA6dYUs0DybaMIO1ar1RkA9k3sY",
  authDomain: "epc-project-management-5e14a.firebaseapp.com",
  projectId: "epc-project-management-5e14a",
  storageBucket: "epc-project-management-5e14a.firebasestorage.app",
  messagingSenderId: "968939185099",
  appId: "1:968939185099:web:aa326d05c5a605b0e40c4e",
  measurementId: "G-N42LT9ZBPN"
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

export const loginWithMicrosoft = async () => {
  if (!auth) throw new Error("auth-not-initialized");
  const provider = new OAuthProvider('microsoft.com');
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  
  const credential = await signInWithPopup(auth, provider);

  // Ensure profile exists after Microsoft login
  if (db && credential.user) {
    const docRef = doc(db, USERS_COLLECTION, credential.user.uid);
    const docSnap = await getDoc(docRef);
    const userEmail = credential.user.email || '';
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        email: userEmail,
        role: userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'Admin' : 'User',
        assignedProjects: [],
        isDefaultPassword: false,
        createdAt: new Date().toISOString()
      });
    } else {
      if (userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (docSnap.data() as any).role !== 'Admin') {
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
  const docRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data() as any;

    // Auto-promote default admin if they were just a 'User'
    if (data.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && data.role !== 'Admin') {
      await updateDoc(docRef, { role: 'Admin', updatedAt: new Date().toISOString() });
      return { id: docSnap.id, ...data, role: 'Admin' } as UserProfile;
    }

    return { id: docSnap.id, ...data } as UserProfile;
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

export const updateUserPasswordAndProfile = async (newPassword: string, currentPassword?: string) => {
  if (!auth || !db) throw new Error("auth-not-initialized");
  const user = auth.currentUser;
  if (!user) throw new Error("no-user-logged-in");

  const pwdToTry = currentPassword || DEFAULT_PASSWORD;

  try {
    await updatePassword(user, newPassword);
  } catch (err: any) {
    const isRecentLoginError =
      err?.code === 'auth/requires-recent-login' ||
      String(err?.message || '').includes('requires-recent-login');

    if (isRecentLoginError && user.email) {
      try {
        const credential = EmailAuthProvider.credential(user.email, pwdToTry);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
      } catch (reauthErr: any) {
        console.error("Re-authentication attempt failed:", reauthErr);
        throw err;
      }
    } else {
      throw err;
    }
  }

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

// Maximum operations per Firestore batch (Firestore hard limit is 500)
const FIRESTORE_BATCH_LIMIT = 450;

/**
 * Executes batch operations in safe chunks (max 450 operations per batch)
 * to strictly stay below the Firestore 500-operation limit per commit.
 */
async function commitInBatches<T>(
  items: T[],
  operation: (batch: ReturnType<typeof writeBatch>, item: T) => void
): Promise<void> {
  if (!db) throw new Error("db-not-initialized");
  if (items.length === 0) return;

  for (let i = 0; i < items.length; i += FIRESTORE_BATCH_LIMIT) {
    const chunk = items.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach(item => operation(batch, item));
    await batch.commit();
  }
}

export const batchSaveRisks = async (risks: RiskItem[]): Promise<void> => {
  if (!db) throw new Error("db-not-initialized");
  if (risks.length === 0) return;

  await commitInBatches(risks, (batch, risk) => {
    const ref = doc(db, COLLECTION_NAME, risk.id);
    batch.set(ref, sanitizeData(risk));
  });
};

export const deleteProjectRisks = async (projectNo: string): Promise<void> => {
  if (!db) throw new Error("db-not-initialized");
  const risks = await fetchRisksByProject(projectNo);
  if (risks.length === 0) return;

  await commitInBatches(risks, (batch, risk) => {
    const ref = doc(db, COLLECTION_NAME, risk.id);
    batch.delete(ref);
  });
};

export const updateProjectDetails = async (
  projectNo: string,
  updates: {
    projectName: string;
    pmName: string;
    email: string;
    industryType?: string;
    appliedModifiers?: string[];
    riskAppetite?: RiskAppetite;
    reviewFrequency?: ReviewFrequency;
  }
): Promise<void> => {
  if (!db) throw new Error("db-not-initialized");

  // 1. Get all risks for this project
  const risks = await fetchRisksByProject(projectNo);
  if (risks.length === 0) return;

  // 2. Batch update all of them in chunks
  const currentUserEmail = auth?.currentUser?.email || 'System';
  const now = new Date().toISOString();

  await commitInBatches(risks, (batch, risk) => {
    const ref = doc(db, COLLECTION_NAME, risk.id);
    const updateData: any = {
      projectName: updates.projectName,
      pmName: updates.pmName,
      email: updates.email,
      industryType: updates.industryType || '',
      appliedModifiers: updates.appliedModifiers || [],
      lastUpdatedBy: currentUserEmail,
      updatedAt: now
    };
    if (updates.riskAppetite) updateData.riskAppetite = updates.riskAppetite;
    if (updates.reviewFrequency) updateData.reviewFrequency = updates.reviewFrequency;

    batch.update(ref, updateData);
  });
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

  const currentUserEmail = auth?.currentUser?.email || 'System';
  const now = new Date().toISOString();
  const modifierItems = modifiers.map(m => m.item);

  await commitInBatches(baselineRisks, (batch, risk) => {
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
        appliedModifiers: modifierItems,
        lastUpdatedBy: currentUserEmail,
        updatedAt: now
      });
    }
  });
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

  // Fetch existing baseline risks to know what to delete/overwrite
  const querySnapshot = await getDocs(collection(db, BASELINE_COLLECTION));
  const docsToDelete = querySnapshot.docs;

  // Delete existing in safe chunks
  await commitInBatches(docsToDelete, (batch, docSnap) => {
    batch.delete(docSnap.ref);
  });

  // Save new in safe chunks
  const itemsToSave = risks.map((risk, index) => ({
    id: risk.id || `baseline_${String(index).padStart(3, '0')}`,
    data: (({ id: _, ...rest }) => rest)(risk)
  }));

  await commitInBatches(itemsToSave, (batch, item) => {
    const ref = doc(db, BASELINE_COLLECTION, item.id);
    batch.set(ref, sanitizeData(item.data));
  });
};

// --- TOR & PROPOSAL RISK ASSESSMENT MANAGEMENT ---

const TOR_PROJECTS_COLLECTION = 'tor_projects';

export const subscribeToTorProjects = (
  onUpdate: (projects: TorProject[]) => void,
  onError?: (error: any) => void
): (() => void) => {
  if (!db) {
    onUpdate([]);
    return () => { };
  }
  return onSnapshot(collection(db, TOR_PROJECTS_COLLECTION), (querySnapshot) => {
    const projects: TorProject[] = [];
    querySnapshot.forEach((doc) => {
      projects.push(doc.data() as TorProject);
    });
    // Sort by updatedAt desc
    projects.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    onUpdate(projects);
  }, (error) => {
    console.error("Error fetching TOR projects:", error);
    if (onError) onError(error);
  });
};

export const saveTorProject = async (project: TorProject): Promise<void> => {
  if (!db) throw new Error("db-not-initialized");
  const cleanProject = sanitizeData(project);
  await setDoc(doc(db, TOR_PROJECTS_COLLECTION, project.id), cleanProject);
};

export const deleteTorProject = async (projectId: string): Promise<void> => {
  if (!db) throw new Error("db-not-initialized");
  await deleteDoc(doc(db, TOR_PROJECTS_COLLECTION, projectId));
};

export const getTorProject = async (projectId: string): Promise<TorProject | null> => {
  if (!db) return null;
  const docRef = doc(db, TOR_PROJECTS_COLLECTION, projectId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as TorProject;
  }
  return null;
};

