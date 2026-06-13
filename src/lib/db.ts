import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';

// 1. Firebase Configuration Check
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isFirebaseEnabled = !!firebaseConfig.apiKey;

// Initialize Firebase if enabled
let firebaseApp: any = null;
let firebaseAuth: any = null;
let firestore: any = null;

if (isFirebaseEnabled) {
  console.log("Firebase credentials detected. Initializing Firebase Cloud Mode...");
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  firebaseAuth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
} else {
  console.log("No Firebase credentials detected. Initializing LocalStorage Database Mode...");
}

// 2. Helper Interfaces
export interface DbUser {
  id: string;
  email: string | null;
  user_metadata?: {
    name?: string;
  };
}

export interface DbSession {
  user: DbUser;
}

// Helper to recursively clean undefined values from objects before writing to Firestore
const cleanDataForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanDataForFirestore).filter(v => v !== undefined);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = cleanDataForFirestore(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
};

// 3. Local Storage fallback database engine helpers
const getLocalUsers = (): any[] => JSON.parse(localStorage.getItem('nasake_local_users') || '[]');
const saveLocalUsers = (users: any[]) => localStorage.setItem('nasake_local_users', JSON.stringify(users));

const getLocalSession = (): DbSession | null => {
  const sessionData = localStorage.getItem('nasake_local_session');
  return sessionData ? JSON.parse(sessionData) : null;
};
const saveLocalSession = (session: DbSession | null) => {
  if (session) {
    localStorage.setItem('nasake_local_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('nasake_local_session');
  }
  // Notify local auth listeners
  localAuthCallbacks.forEach(cb => cb(session ? 'SIGNED_IN' : 'SIGNED_OUT', session));
};

let localAuthCallbacks: Array<(event: string, session: any) => void> = [];

// 4. Unified DB Client Interface
export const db = {
  isCloudMode: () => isFirebaseEnabled,

  auth: {
    signUp: async (email: string, password: string, name?: string) => {
      if (isFirebaseEnabled) {
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;
        
        if (name) {
          await updateProfile(user, { displayName: name });
        }
        
        // Create user profile in Firestore
        await setDoc(doc(firestore, "profiles", user.uid), {
          id: user.uid,
          name: name || '',
          email: email,
          created_at: new Date().toISOString()
        });

        const session: DbSession = {
          user: {
            id: user.uid,
            email: user.email,
            user_metadata: { name }
          }
        };

        return { data: { user, session }, error: null };
      } else {
        const users = getLocalUsers();
        if (users.some(u => u.email === email)) {
          return { data: null, error: new Error('User already exists') };
        }

        const newId = Math.random().toString(36).substring(2, 15);
        const newUser = {
          id: newId,
          email,
          password,
          name: name || '',
          created_at: new Date().toISOString()
        };

        users.push(newUser);
        saveLocalUsers(users);

        const session: DbSession = {
          user: {
            id: newId,
            email,
            user_metadata: { name }
          }
        };

        saveLocalSession(session);
        return { data: { user: session.user, session }, error: null };
      }
    },

    signInWithPassword: async (credentials: { email: string; password: string }) => {
      if (isFirebaseEnabled) {
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, credentials.email, credentials.password);
        const user = userCredential.user;
        const session: DbSession = {
          user: {
            id: user.uid,
            email: user.email,
            user_metadata: { name: user.displayName || undefined }
          }
        };
        return { data: { user, session }, error: null };
      } else {
        const users = getLocalUsers();
        const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
        
        if (!user) {
          return { data: null, error: new Error('Invalid login credentials') };
        }

        const session: DbSession = {
          user: {
            id: user.id,
            email: user.email,
            user_metadata: { name: user.name }
          }
        };

        saveLocalSession(session);
        return { data: { user: session.user, session }, error: null };
      }
    },

    signOut: async () => {
      if (isFirebaseEnabled) {
        await firebaseSignOut(firebaseAuth);
        return { error: null };
      } else {
        saveLocalSession(null);
        return { error: null };
      }
    },

    getSession: async () => {
      if (isFirebaseEnabled) {
        const currentUser = firebaseAuth.currentUser;
        if (currentUser) {
          const session: DbSession = {
            user: {
              id: currentUser.uid,
              email: currentUser.email,
              user_metadata: { name: currentUser.displayName || undefined }
            }
          };
          return { data: { session }, error: null };
        }
        return { data: { session: null }, error: null };
      } else {
        return { data: { session: getLocalSession() }, error: null };
      }
    },

    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      if (isFirebaseEnabled) {
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
          if (user) {
            const session: DbSession = {
              user: {
                id: user.uid,
                email: user.email,
                user_metadata: { name: user.displayName || undefined }
              }
            };
            callback('SIGNED_IN', session);
          } else {
            callback('SIGNED_OUT', null);
          }
        });
        return { data: { subscription: { unsubscribe } } };
      } else {
        localAuthCallbacks.push(callback);
        // Trigger initial callback asynchronously
        const session = getLocalSession();
        setTimeout(() => {
          callback(session ? 'INITIAL_SESSION' : 'SIGNED_OUT', session);
        }, 0);
        
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                localAuthCallbacks = localAuthCallbacks.filter(cb => cb !== callback);
              }
            }
          }
        };
      }
    },

    updateUser: async (attributes: { password?: string }) => {
      if (isFirebaseEnabled) {
        // In Firebase client SDK, updates to password require re-authentication or are done via updatePassword
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) throw new Error("No user authenticated");
        
        if (attributes.password) {
          // import dynamic function to save bundle size
          const { updatePassword } = await import('firebase/auth');
          await updatePassword(currentUser, attributes.password);
        }
        return { error: null };
      } else {
        const session = getLocalSession();
        if (!session) return { error: new Error("Not logged in") };

        const users = getLocalUsers();
        const userIndex = users.findIndex(u => u.id === session.user.id);
        if (userIndex !== -1 && attributes.password) {
          users[userIndex].password = attributes.password;
          saveLocalUsers(users);
        }
        return { error: null };
      }
    }
  },

  profiles: {
    get: async (userId: string) => {
      if (isFirebaseEnabled) {
        const docRef = doc(firestore, "profiles", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { data: docSnap.data(), error: null };
        }
        return { data: null, error: null };
      } else {
        const users = getLocalUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
          return { data: { name: user.name, email: user.email, created_at: user.created_at }, error: null };
        }
        return { data: null, error: null };
      }
    },

    update: async (userId: string, data: { name: string }) => {
      if (isFirebaseEnabled) {
        const docRef = doc(firestore, "profiles", userId);
        await updateDoc(docRef, { name: data.name });
        
        // Also update Firebase auth profile displayName
        const currentUser = firebaseAuth.currentUser;
        if (currentUser && currentUser.uid === userId) {
          await updateProfile(currentUser, { displayName: data.name });
        }
        return { error: null };
      } else {
        const users = getLocalUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          users[userIndex].name = data.name;
          saveLocalUsers(users);
          
          // Sync current session user_metadata
          const session = getLocalSession();
          if (session && session.user.id === userId) {
            session.user.user_metadata = { ...session.user.user_metadata, name: data.name };
            saveLocalSession(session);
          }
        }
        return { error: null };
      }
    }
  },

  journal: {
    list: async (userId: string) => {
      if (isFirebaseEnabled) {
        const q = query(
          collection(firestore, "journal_entries"), 
          where("user_id", "==", userId)
        );
        const querySnapshot = await getDocs(q);
        const entries: any[] = [];
        querySnapshot.forEach((doc) => {
          entries.push({ id: doc.id, ...doc.data() });
        });
        entries.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return { data: entries, error: null };
      } else {
        const entries = JSON.parse(localStorage.getItem('nasake_local_journal') || '[]');
        const userEntries = entries
          .filter((e: any) => e.user_id === userId)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return { data: userEntries, error: null };
      }
    },

    insert: async (entry: { user_id: string; text: string; mood: number | null; analysis: any }) => {
      const dataToInsert = {
        ...entry,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (isFirebaseEnabled) {
        const cleanedData = cleanDataForFirestore(dataToInsert);
        const docRef = await addDoc(collection(firestore, "journal_entries"), cleanedData);
        return { data: [{ id: docRef.id, ...cleanedData }], error: null };
      } else {
        const entries = JSON.parse(localStorage.getItem('nasake_local_journal') || '[]');
        const newId = Math.random().toString(36).substring(2, 15);
        const newEntry = { id: newId, ...dataToInsert };
        entries.push(newEntry);
        localStorage.setItem('nasake_local_journal', JSON.stringify(entries));
        return { data: [newEntry], error: null };
      }
    }
  },

  assessments: {
    list: async (userId: string) => {
      if (isFirebaseEnabled) {
        const q = query(
          collection(firestore, "condition_assessments"), 
          where("user_id", "==", userId)
        );
        const querySnapshot = await getDocs(q);
        const assessments: any[] = [];
        querySnapshot.forEach((doc) => {
          assessments.push({ id: doc.id, ...doc.data() });
        });
        assessments.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return { data: assessments, error: null };
      } else {
        const assessments = JSON.parse(localStorage.getItem('nasake_local_assessments') || '[]');
        const userAssessments = assessments
          .filter((e: any) => e.user_id === userId)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return { data: userAssessments, error: null };
      }
    },

    insert: async (assessment: { user_id: string; condition_type: string; score: number; result: string; answers: any }) => {
      const dataToInsert = {
        ...assessment,
        created_at: new Date().toISOString()
      };

      if (isFirebaseEnabled) {
        const cleanedData = cleanDataForFirestore(dataToInsert);
        const docRef = await addDoc(collection(firestore, "condition_assessments"), cleanedData);
        return { data: [{ id: docRef.id, ...cleanedData }], error: null };
      } else {
        const assessments = JSON.parse(localStorage.getItem('nasake_local_assessments') || '[]');
        const newId = Math.random().toString(36).substring(2, 15);
        const newAssessment = { id: newId, ...dataToInsert };
        assessments.push(newAssessment);
        localStorage.setItem('nasake_local_assessments', JSON.stringify(assessments));
        return { data: [newAssessment], error: null };
      }
    }
  },

  games: {
    list: async (userId: string, gameType?: 'color_shift' | 'number_trail') => {
      if (isFirebaseEnabled) {
        let q;
        if (gameType) {
          q = query(
            collection(firestore, "game_sessions"), 
            where("user_id", "==", userId),
            where("game_type", "==", gameType)
          );
        } else {
          q = query(
            collection(firestore, "game_sessions"), 
            where("user_id", "==", userId)
          );
        }
        const querySnapshot = await getDocs(q);
        const sessions: any[] = [];
        querySnapshot.forEach((doc) => {
          sessions.push({ id: doc.id, ...doc.data() });
        });
        sessions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return { data: sessions, error: null };
      } else {
        const sessions = JSON.parse(localStorage.getItem('nasake_local_games') || '[]');
        let userSessions = sessions.filter((e: any) => e.user_id === userId);
        if (gameType) {
          userSessions = userSessions.filter((e: any) => e.game_type === gameType);
        }
        userSessions.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return { data: userSessions, error: null };
      }
    },

    insert: async (session: { user_id: string; game_type: string; score: number; accuracy: number; reaction_time_ms?: number | null; sequence_length?: number | null; metadata?: any }) => {
      const dataToInsert = {
        ...session,
        created_at: new Date().toISOString()
      };

      if (isFirebaseEnabled) {
        const cleanedData = cleanDataForFirestore(dataToInsert);
        const docRef = await addDoc(collection(firestore, "game_sessions"), cleanedData);
        return { data: [{ id: docRef.id, ...cleanedData }], error: null };
      } else {
        const sessions = JSON.parse(localStorage.getItem('nasake_local_games') || '[]');
        const newId = Math.random().toString(36).substring(2, 15);
        const newSession = { id: newId, ...dataToInsert };
        sessions.push(newSession);
        localStorage.setItem('nasake_local_games', JSON.stringify(sessions));
        return { data: [newSession], error: null };
      }
    }
  }
};
