import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged
} from "firebase/auth";
import { ref, set, get, onValue, update } from "firebase/database";
import { auth, database } from "./firebase";
import { User, userSchema } from "@shared/schema";

export interface AuthState {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
}

export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = async () => {
  await signOut(auth);
};

export const createUser = async (email: string, password: string, userData: Omit<User, 'uid'>) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  
  const fullUserData: User = {
    ...userData,
    uid,
  };
  
  await set(ref(database, `users/${uid}`), fullUserData);
  return userCredential.user;
};

export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    const snapshot = await get(ref(database, `users/${uid}`));
    if (snapshot.exists()) {
      const data = snapshot.val();
      return userSchema.parse(data);
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export const subscribeToUserData = (uid: string, callback: (user: User | null) => void) => {
  const userRef = ref(database, `users/${uid}`);
  return onValue(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      try {
        const userData = userSchema.parse(data);
        callback(userData);
      } catch (error) {
        console.error("Error parsing user data:", error);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

export const createOrUpdateUserProfile = async (uid: string, userData: Partial<User>): Promise<User> => {
  try {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, userData);
    
    const updatedData = await getUserData(uid);
    if (!updatedData) {
      throw new Error("Failed to create or update user profile");
    }
    return updatedData;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const initializeUserProfile = async (firebaseUser: any): Promise<User> => {
  // First try to get existing user data
  let userData = await getUserData(firebaseUser.uid);
  
  if (!userData) {
    // Create default user profile for new users
    const defaultUserData: User = {
      uid: firebaseUser.uid,
      nama: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email || '',
      kelas: '12 C Teknik',
      tanggal_lahir: '2000-01-01',
      role: 'murid' as const,
      isAdmin: false
    };
    
    // Special case for admin user
    if (firebaseUser.uid === 'YcAkHiKAQHdFdKBqxgNElRvB3fD2') {
      defaultUserData.nama = 'Muhammad Amin';
      defaultUserData.role = 'admin';
      defaultUserData.isAdmin = true;
    }
    
    try {
      await set(ref(database, `users/${firebaseUser.uid}`), defaultUserData);
      userData = defaultUserData;
    } catch (error) {
      console.error("Error creating user profile:", error);
      // Return the default data even if we can't save to Firebase
      userData = defaultUserData;
    }
  }
  
  return userData;
};

export const subscribeToAuthState = (callback: (authState: AuthState) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      callback({ user: firebaseUser, userData: null, loading: true });
      
      try {
        const userData = await initializeUserProfile(firebaseUser);
        callback({ user: firebaseUser, userData, loading: false });
      } catch (error) {
        console.error("Error initializing user profile:", error);
        // Create a fallback user profile for admin
        const fallbackUserData: User = {
          uid: firebaseUser.uid,
          nama: firebaseUser.uid === 'YcAkHiKAQHdFdKBqxgNElRvB3fD2' ? 'Muhammad Amin' : 'User',
          email: firebaseUser.email || '',
          kelas: '12 C Teknik',
          tanggal_lahir: '2000-01-01',
          role: firebaseUser.uid === 'YcAkHiKAQHdFdKBqxgNElRvB3fD2' ? 'admin' : 'murid',
          isAdmin: firebaseUser.uid === 'YcAkHiKAQHdFdKBqxgNElRvB3fD2'
        };
        callback({ user: firebaseUser, userData: fallbackUserData, loading: false });
      }
    } else {
      callback({ user: null, userData: null, loading: false });
    }
  });
};
