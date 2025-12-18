import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  updateDoc, 
  query, 
  where, 
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { User, Transaction, UserRole, TransactionType, Notification } from '../types';

// ==========================================
// ⚠️ PASTE YOUR FIREBASE CONFIGURATION HERE
// ==========================================
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app;
let firestore: any;

try {
  // Quick check to warn user if they forgot to paste keys
  if (firebaseConfig.apiKey.includes("PASTE_YOUR")) {
    console.error("⚠️ FIREBASE CONFIGURATION MISSING: Please open services/db.ts and paste your Firebase Config keys.");
    alert("SETUP REQUIRED: Please open the code file 'services/db.ts' and paste your Firebase Configuration keys inside the firebaseConfig object.");
  }

  app = initializeApp(firebaseConfig);
  firestore = getFirestore(app);
} catch (error) {
  console.error("Firebase Initialization Error. Did you update the config in services/db.ts?", error);
}

const USERS_COL = 'users';
const TRANSACTIONS_COL = 'transactions';
const NOTIFICATIONS_COL = 'notifications';
const SESSION_KEY = 'aui_session_uid'; // We only store the User ID in local storage for session

export const db = {
  // Check if admin exists, if not create default (Run on app load)
  ensureAdminExists: async () => {
    if (!firestore) return;
    try {
      const adminQuery = query(collection(firestore, USERS_COL), where("role", "==", UserRole.ADMIN));
      const snapshot = await getDocs(adminQuery);
      
      if (snapshot.empty) {
        const adminUser: User = {
          id: 'admin-001',
          fullName: 'System Admin',
          address: 'HQ',
          phoneNumber: '+2340000000000',
          guardianPhoneNumber: '',
          password: '1234',
          role: UserRole.ADMIN,
          cashAtHand: 0,
          cashInBank: 0,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(firestore, USERS_COL, adminUser.id), adminUser);
        console.log("Default Admin Created");
      }
    } catch (e: any) {
      console.error("Error ensuring admin exists:", e);
      if (e.code === 'permission-denied') {
        alert("ACCESS DENIED: Your Firebase Database is locked.\n\n1. Go to Firebase Console > Firestore > Rules\n2. Change 'allow read, write: if false;' to 'allow read, write: if true;'\n3. Click Publish");
      }
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const snapshot = await getDocs(collection(firestore, USERS_COL));
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  saveUser: async (user: User): Promise<void> => {
    await setDoc(doc(firestore, USERS_COL, user.id), user);
  },

  updateUserBalance: async (userId: string, cashAtHand: number, cashInBank: number): Promise<User | null> => {
    const userRef = doc(firestore, USERS_COL, userId);
    await updateDoc(userRef, {
      cashAtHand,
      cashInBank
    });

    // Notify Worker
    await db.addNotification({
      id: crypto.randomUUID(),
      recipientId: userId,
      title: 'Balance Updated',
      message: `Your balances have been updated by the admin. Cash at Hand: ₦${cashAtHand}, Cash in Bank: ₦${cashInBank}`,
      read: false,
      createdAt: new Date().toISOString()
    });

    // Return updated user object for UI
    const snap = await getDoc(userRef);
    return snap.data() as User;
  },

  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const snapshot = await getDocs(collection(firestore, TRANSACTIONS_COL));
      return snapshot.docs.map(doc => doc.data() as Transaction);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  addTransaction: async (transaction: Transaction): Promise<void> => {
    // 1. Save Transaction
    await setDoc(doc(firestore, TRANSACTIONS_COL, transaction.id), transaction);

    // 2. Update Balances
    const userRef = doc(firestore, USERS_COL, transaction.userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const user = userSnap.data() as User;
      let newCashAtHand = user.cashAtHand;
      let newCashInBank = user.cashInBank;
      const amount = Math.round(Number(transaction.amount));
      const charge = Math.round(Number(transaction.charge));

      switch (transaction.type) {
        case TransactionType.TRANSFER:
          // Adds to Cash at Hand, Deducts from Cash in Bank (including charge)
          newCashAtHand += amount;
          newCashInBank -= (amount + charge);
          break;
        
        case TransactionType.WITHDRAWAL:
          // Deducted from Cash at Hand, Added to Cash in Bank
          newCashAtHand -= amount;
          newCashInBank += amount;
          break;

        case TransactionType.AIRTIME:
        case TransactionType.DATA:
        case TransactionType.UTILITIES:
          // Adds to Cash at Hand, Deducts from Cash in Bank
          newCashAtHand += amount;
          newCashInBank -= amount;
          break;

        case TransactionType.WITHDRAW_AND_TRANSFER:
          // No balance effect
          break;
      }

      await updateDoc(userRef, {
        cashAtHand: newCashAtHand,
        cashInBank: newCashInBank
      });

      // 3. Notifications
      
      // Notify Admin of New Transaction
      await db.addNotification({
        id: crypto.randomUUID(),
        recipientId: 'ADMIN',
        title: 'New Transaction',
        message: `${transaction.userName} logged a ${transaction.type} of ₦${transaction.amount}.`,
        read: false,
        createdAt: new Date().toISOString()
      });

      // Low Balance Check
      if (newCashAtHand < 10000) {
        await db.addNotification({
          id: crypto.randomUUID(),
          recipientId: 'ADMIN',
          title: 'Low Balance Alert',
          message: `${user.fullName}'s Cash at Hand is low (₦${newCashAtHand}).`,
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }
  },

  getTransactionsByUserId: async (userId: string): Promise<Transaction[]> => {
    const q = query(collection(firestore, TRANSACTIONS_COL), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Transaction);
  },

  getNotifications: async (userId: string, role: UserRole): Promise<Notification[]> => {
    let q;
    if (role === UserRole.ADMIN) {
      // Get admin notifications (recipientId = 'ADMIN' OR recipientId = userId)
      // Firestore OR queries are tricky, we will fetch recipientId=='ADMIN' mainly
      q = query(collection(firestore, NOTIFICATIONS_COL), where("recipientId", "==", "ADMIN"));
    } else {
      q = query(collection(firestore, NOTIFICATIONS_COL), where("recipientId", "==", userId));
    }
    
    const snapshot = await getDocs(q);
    const notifs = snapshot.docs.map(doc => doc.data() as Notification);
    // Sort client side as simpler than composite indexes for now
    return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addNotification: async (notification: Notification): Promise<void> => {
    await setDoc(doc(firestore, NOTIFICATIONS_COL, notification.id), notification);
  },

  markNotificationRead: async (notificationId: string): Promise<void> => {
    const ref = doc(firestore, NOTIFICATIONS_COL, notificationId);
    await updateDoc(ref, { read: true });
  },

  markAllRead: async (userId: string, role: UserRole): Promise<void> => {
    // This requires fetching then batch updating.
    const notifs = await db.getNotifications(userId, role);
    const batch = writeBatch(firestore);
    let count = 0;
    
    notifs.forEach(n => {
      if (!n.read) {
        const ref = doc(firestore, NOTIFICATIONS_COL, n.id);
        batch.update(ref, { read: true });
        count++;
      }
    });

    if (count > 0) await batch.commit();
  },

  // Session Management
  login: async (phone: string, password: string): Promise<User | null> => {
    // Note: Storing PIN in plain text in DB is bad practice, but per requirements we are doing simple auth
    try {
      const q = query(collection(firestore, USERS_COL), where("phoneNumber", "==", phone));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const user = snapshot.docs[0].data() as User;
        if (user.password === password) {
          localStorage.setItem(SESSION_KEY, user.id);
          return user;
        }
      }
    } catch (e: any) {
      console.error("Login error:", e);
      if (e.code === 'permission-denied') {
        alert("ACCESS DENIED: Your Firebase Database is locked.\n\nPlease check Firebase Console Rules.");
      }
    }
    return null;
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: async (): Promise<User | null> => {
    const uid = localStorage.getItem(SESSION_KEY);
    if (uid) {
      try {
        const snap = await getDoc(doc(firestore, USERS_COL, uid));
        if (snap.exists()) return snap.data() as User;
      } catch (e) {
        console.error(e);
        return null;
      }
    }
    return null;
  },

  // Utility for Database Management
  getFullDatabase: async () => {
    const users = await db.getUsers();
    const transactions = await db.getTransactions();
    // Fetch all notifs is heavy, maybe skip or fetch limit
    const notifSnap = await getDocs(collection(firestore, NOTIFICATIONS_COL));
    const notifications = notifSnap.docs.map(d => d.data());
    
    return { users, transactions, notifications };
  },

  resetDatabase: async () => {
    // Deleting collections from client is not standard, but we can delete documents one by one
    // This is dangerous and slow for large DBs
    const batchDelete = async (colName: string) => {
      const snap = await getDocs(collection(firestore, colName));
      const batch = writeBatch(firestore);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    };

    await batchDelete(TRANSACTIONS_COL);
    await batchDelete(NOTIFICATIONS_COL);
    await batchDelete(USERS_COL); // Will delete Admin too
    
    // Re-init admin
    await db.ensureAdminExists();
    window.location.reload();
  }
};
