import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged
} from "firebase/auth";
import { ref, set, get, onValue } from "firebase/database";
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
  const snapshot = await get(ref(database, `users/${uid}`));
  if (snapshot.exists()) {
    const data = snapshot.val();
    return userSchema.parse(data);
  }
  return null;
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

export const subscribeToAuthState = (callback: (authState: AuthState) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      callback({ user: firebaseUser, userData: null, loading: true });
      
      const userData = await getUserData(firebaseUser.uid);
      callback({ user: firebaseUser, userData, loading: false });
    } else {
      callback({ user: null, userData: null, loading: false });
    }
  });
};
