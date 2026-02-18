
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseService';
import { UserProfile, RiskItem, UserRole } from '../types';

const USERS_COLLECTION = 'users';
const RISKS_COLLECTION = 'risks';

/**
 * Fetches all registered users from the Firestore 'users' collection.
 */
export const fetchAllUsers = async (): Promise<UserProfile[]> => {
  if (!db) return [];

  // Helper to check if string is email format
  const isEmailFormat = (str: string | undefined): boolean => {
    if (!str) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  };

  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users: UserProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;

      // Determine email: use email field, or fallback to user/name field if it's email format
      let email = data.email;
      if (!email && isEmailFormat(data.user)) {
        email = data.user;
      }
      if (!email && isEmailFormat(data.name)) {
        email = data.name;
      }

      // Only include records with valid email
      if (email && isEmailFormat(email)) {
        users.push({
          id: docSnap.id,
          ...data,
          email: email // Ensure email field is set
        } as UserProfile);
      } else {
        // Skip invalid records silently (or log if needed for debugging)
      }
    });
    return users;
  } catch (error: any) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

/**
 * Updates a user's role and assigned projects.
 */
export const updateUserPermissions = async (uid: string, role: UserRole, assignedProjects: string[]): Promise<void> => {
  if (!db) throw new Error("DB not initialized");
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, {
    role,
    assignedProjects,
    updatedAt: new Date().toISOString()
  });
};

/**
 * Deletes a user profile from Firestore.
 */
export const deleteUserRecord = async (uid: string): Promise<void> => {
  if (!db) throw new Error("DB not initialized");
  try {
    await deleteDoc(doc(db, USERS_COLLECTION, uid));
  } catch (error) {
    console.error("Error deleting user record:", error);
    throw error;
  }
};

/**
 * Fetches all data (Risks and Users) and returns it as a JSON string for backup purposes.
 */
export const createSystemBackup = async (): Promise<string> => {
  if (!db) throw new Error("DB not initialized");

  try {
    // 1. Fetch Risks
    const risksSnap = await getDocs(collection(db, RISKS_COLLECTION));
    const risks: RiskItem[] = [];
    risksSnap.forEach(doc => risks.push(doc.data() as RiskItem));

    // 2. Fetch Users
    const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
    const users: UserProfile[] = [];
    usersSnap.forEach(doc => users.push({ id: doc.id, ...(doc.data() as any) } as UserProfile));

    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      stats: {
        risksCount: risks.length,
        usersCount: users.length
      },
      data: {
        risks,
        users
      }
    };

    return JSON.stringify(backupData, null, 2);
  } catch (error) {
    console.error("Backup failed:", error);
    throw error;
  }
};
