import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';

// Local Storage Keys
const KEYS = {
  PROFILE: 'mm_profile',
  FB_ENABLED: 'mm_firebase_enabled',
  FB_CONFIG: 'mm_firebase_config',
  SHOPPING: 'mm_shopping_list',
  EXPENSES: 'mm_expenses',
  DUES: 'mm_dues'
};

// Global application state for db
let firebaseApp = null;
let firestoreDb = null;
let unsubscribeCallbacks = [];
let onUpdateCallback = null;
let isSyncing = false;
let isWriting = false;
let writeCooldownTimer = null;
let autoSyncInterval = null;

// Helper: Generate unique IDs for records
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ----------------------------------------------------
// LOCAL STORAGE BACKEND
// ----------------------------------------------------
function getLocal(key, defaultValue = []) {
  try {
    const val = localStorage.getItem(key);
    if (val === null || val === undefined) return defaultValue;
    const parsed = JSON.parse(val);
    if (parsed === null || parsed === undefined) return defaultValue;
    if (Array.isArray(defaultValue)) {
      return Array.isArray(parsed) ? parsed : defaultValue;
    }
    return parsed;
  } catch (e) {
    console.error('LocalStorage read error:', e);
    return defaultValue;
  }
}

function setLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// ----------------------------------------------------
// LOCAL SERVER LIVE REALTIME SYNC (Race-Condition Free)
// ----------------------------------------------------

// READ-ONLY Polling (Background interval: GET method only, never overwrites server!)
export async function pollServerData() {
  if (isSyncing || isWriting) return;
  isSyncing = true;

  try {
    const res = await fetch('./api/sync?t=' + Date.now(), { cache: 'no-store' });
    // Re-check isWriting AFTER fetch - a user action may have happened while fetch was in-flight
    if (isWriting) return;
    if (res.ok) {
      const text = await res.text();
      // Re-check again after reading response body
      if (isWriting) return;
      let serverData;
      try {
        serverData = JSON.parse(text);
      } catch (err) {
        return;
      }

      if (serverData && typeof serverData === 'object') {
        const localShopping = getLocal(KEYS.SHOPPING, []);
        const localExpenses = getLocal(KEYS.EXPENSES, []);
        const localDues = getLocal(KEYS.DUES, []);

        const remoteShopping = serverData.shopping || [];
        const remoteExpenses = serverData.expenses || [];
        const remoteDues = serverData.dues || [];

        let updated = false;

        if (JSON.stringify(localShopping) !== JSON.stringify(remoteShopping)) {
          setLocal(KEYS.SHOPPING, remoteShopping);
          updated = true;
        }
        if (JSON.stringify(localExpenses) !== JSON.stringify(remoteExpenses)) {
          setLocal(KEYS.EXPENSES, remoteExpenses);
          updated = true;
        }
        if (JSON.stringify(localDues) !== JSON.stringify(remoteDues)) {
          setLocal(KEYS.DUES, remoteDues);
          updated = true;
        }

        if (updated && onUpdateCallback) {
          onUpdateCallback('update', 'all');
        }
      }
    }
  } catch (e) {
    // Quietly catch network fetch errors if server is unreachable
  } finally {
    isSyncing = false;
  }
}

// WRITE Push (Triggered ONLY when user adds, toggles, or deletes an item!)
export async function pushStateToServer() {
  // Set write lock to prevent polling from overwriting our changes
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  try {
    const localShopping = getLocal(KEYS.SHOPPING, []);
    const localExpenses = getLocal(KEYS.EXPENSES, []);
    const localDues = getLocal(KEYS.DUES, []);

    const payload = {
      shopping: localShopping,
      expenses: localExpenses,
      dues: localDues,
      updatedAt: Date.now()
    };

    await fetch('./api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('Push state to server failed:', e);
  } finally {
    // Keep write lock for a short cooldown to let server fully persist the data
    writeCooldownTimer = setTimeout(() => {
      isWriting = false;
    }, 2000);
  }
}

// ----------------------------------------------------
// DYNAMIC FIREBASE SYNC MANAGEMENT
// ----------------------------------------------------
export function isFirebaseConfigured() {
  const enabled = getLocal(KEYS.FB_ENABLED, true);
  const config = getFirebaseConfig();
  return enabled && config && config.apiKey && config.projectId;
}

export function getFirebaseConfig() {
  const config = getLocal(KEYS.FB_CONFIG, null);
  if (config && config.apiKey && config.apiKey.trim() !== '') {
    return config;
  }
  return {
    apiKey: 'AIzaSyBctzeXb68VDrFpHAcKjt2SZps7yZaowO0',
    projectId: 'family-ledger-7401f',
    authDomain: 'family-ledger-7401f.firebaseapp.com',
    appId: '1:931990023596:web:89f92a83ea241fdaf85e09'
  };
}

export function getCurrentProfile() {
  return localStorage.getItem(KEYS.PROFILE) || 'Husband';
}

export function setCurrentProfile(profile) {
  localStorage.setItem(KEYS.PROFILE, profile);
}

// Clear all active Firestore listeners
function clearListeners() {
  unsubscribeCallbacks.forEach(unsub => {
    try { unsub(); } catch (e) { console.error('Error clearing listener:', e); }
  });
  unsubscribeCallbacks = [];
}

// Disconnect from Firebase and return to local mode
function disconnectFirebase() {
  clearListeners();
  firebaseApp = null;
  firestoreDb = null;
  if (onUpdateCallback) {
    onUpdateCallback('disconnected');
  }
}

// Initialize connection to Firebase
export async function connectFirebase(config, onSyncStateChange) {
  clearListeners();
  
  try {
    firebaseApp = initializeApp(config);
    firestoreDb = getFirestore(firebaseApp);
    
    if (onSyncStateChange) onSyncStateChange('connecting');

    // Sync current local storage to Firestore (First time upload or merger)
    uploadLocalDataToCloud().catch(e => console.error('Upload local data to cloud failed:', e));

    // Set up listeners for the collections
    setupCollectionListener('shopping_list', KEYS.SHOPPING, onSyncStateChange);
    setupCollectionListener('expenses', KEYS.EXPENSES, onSyncStateChange);
    setupCollectionListener('dues', KEYS.DUES, onSyncStateChange);

    if (onSyncStateChange) onSyncStateChange('connected');
    return true;
  } catch (e) {
    console.error('Firebase initialization failed:', e);
    if (onSyncStateChange) onSyncStateChange('error', e.message);
    disconnectFirebase();
    return false;
  }
}

// Set up real-time listener for a Firestore collection
function setupCollectionListener(collectionName, localKey, onSyncStateChange) {
  if (!firestoreDb) return;

  const colRef = collection(firestoreDb, collectionName);
  const q = query(colRef);

  const unsub = onSnapshot(q, (snapshot) => {
    const remoteData = [];
    snapshot.forEach(doc => {
      remoteData.push(doc.data());
    });

    setLocal(localKey, remoteData);
    
    if (onUpdateCallback) {
      onUpdateCallback('update', collectionName);
    }
  }, (err) => {
    console.error(`Firestore listener error on ${collectionName}:`, err);
    if (onSyncStateChange) onSyncStateChange('error', err.message);
  });

  unsubscribeCallbacks.push(unsub);
}

// Push local offline records to Firestore when connecting
async function uploadLocalDataToCloud() {
  if (!firestoreDb) return;

  const collectionsToSync = [
    { name: 'shopping_list', localKey: KEYS.SHOPPING },
    { name: 'expenses', localKey: KEYS.EXPENSES },
    { name: 'dues', localKey: KEYS.DUES }
  ];

  for (const col of collectionsToSync) {
    const localItems = getLocal(col.localKey, []);
    if (localItems.length === 0) continue;

    const batch = writeBatch(firestoreDb);
    localItems.forEach(item => {
      const docRef = doc(firestoreDb, col.name, item.id);
      batch.set(docRef, item, { merge: true });
    });

    await batch.commit();
  }
}

// Initialize the Database Interface
export async function initializeDB(onUpdate, onSyncStateChange) {
  onUpdateCallback = onUpdate;
  
  if (isFirebaseConfigured()) {
    const config = getFirebaseConfig();
    await connectFirebase(config, onSyncStateChange);
  } else {
    if (onSyncStateChange) onSyncStateChange('connected');
    // Direct trigger for initial render
    if (onUpdateCallback) onUpdateCallback('initial');

    // Start automated background live sync (GET polling only)
    pollServerData();
    if (!autoSyncInterval) {
      autoSyncInterval = setInterval(() => pollServerData(), 1500);
    }
  }
}

// Save Firebase Config settings
export async function saveSettings(profile, firebaseEnabled, config, onSyncStateChange) {
  setCurrentProfile(profile);
  setLocal(KEYS.FB_ENABLED, firebaseEnabled);
  setLocal(KEYS.FB_CONFIG, config);

  if (firebaseEnabled && config.apiKey && config.projectId) {
    return await connectFirebase(config, onSyncStateChange);
  } else {
    disconnectFirebase();
    if (onSyncStateChange) onSyncStateChange('connected');
    
    pollServerData();
    if (!autoSyncInterval) {
      autoSyncInterval = setInterval(() => pollServerData(), 1500);
    }
    return true;
  }
}

// ----------------------------------------------------
// APIS: SHOPPING LIST (BAJARER TALIKA)
// ----------------------------------------------------
export function getShoppingItems() {
  return getLocal(KEYS.SHOPPING, []);
}

export async function addShoppingItem(name, qty) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getShoppingItems();
  const newItem = {
    id: generateId(),
    name: name.trim(),
    qty: qty.trim(),
    bought: false,
    addedBy: getCurrentProfile(),
    timestamp: Date.now()
  };

  items.push(newItem);
  setLocal(KEYS.SHOPPING, items);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'shopping_list', newItem.id), newItem).catch(e => {
      console.error('Firebase save failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'shopping_list');
  pushStateToServer();
}

export async function toggleShoppingItem(id) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getShoppingItems();
  const index = items.findIndex(item => item.id === id);
  if (index === -1) { isWriting = false; return; }

  items[index].bought = !items[index].bought;
  items[index].boughtBy = items[index].bought ? getCurrentProfile() : null;
  items[index].timestamp = Date.now();

  setLocal(KEYS.SHOPPING, items);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'shopping_list', id), items[index], { merge: true }).catch(e => {
      console.error('Firebase update failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'shopping_list');
  pushStateToServer();
}

export async function deleteShoppingItem(id) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getShoppingItems();
  const filtered = items.filter(item => item.id !== id);
  setLocal(KEYS.SHOPPING, filtered);

  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, 'shopping_list', id)).catch(e => {
      console.error('Firebase delete failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'shopping_list');
  pushStateToServer();
}

// ----------------------------------------------------
// APIS: EXPENSES (SANSARIK HISHAB)
// ----------------------------------------------------
export function getExpenses() {
  return getLocal(KEYS.EXPENSES, []);
}

export async function addExpense(date, category, amount, notes) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const expenses = getExpenses();
  const newExpense = {
    id: generateId(),
    date: date,
    category: category,
    amount: parseFloat(amount),
    notes: notes.trim(),
    addedBy: getCurrentProfile(),
    timestamp: Date.now()
  };

  expenses.push(newExpense);
  setLocal(KEYS.EXPENSES, expenses);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'expenses', newExpense.id), newExpense).catch(e => {
      console.error('Firebase save failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'expenses');
  pushStateToServer();
}

export async function deleteExpense(id) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const expenses = getExpenses();
  const filtered = expenses.filter(exp => exp.id !== id);
  setLocal(KEYS.EXPENSES, filtered);

  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, 'expenses', id)).catch(e => {
      console.error('Firebase delete failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'expenses');
  pushStateToServer();
}

// ----------------------------------------------------
// APIS: DUES & LOANS (DHAR-DENA)
// ----------------------------------------------------
export function getDues() {
  return getLocal(KEYS.DUES, []);
}

export async function addDue(person, amount, type, status) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const dues = getDues();
  const newDue = {
    id: generateId(),
    person: person.trim(),
    amount: parseFloat(amount),
    type: type,
    status: status,
    addedBy: getCurrentProfile(),
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now()
  };

  dues.push(newDue);
  setLocal(KEYS.DUES, dues);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'dues', newDue.id), newDue).catch(e => {
      console.error('Firebase save failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'dues');
  pushStateToServer();
}

export async function toggleDueStatus(id) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const dues = getDues();
  const index = dues.findIndex(due => due.id === id);
  if (index === -1) { isWriting = false; return; }

  dues[index].status = dues[index].status === 'pending' ? 'paid' : 'pending';
  dues[index].timestamp = Date.now();

  setLocal(KEYS.DUES, dues);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'dues', id), dues[index], { merge: true }).catch(e => {
      console.error('Firebase update failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'dues');
  pushStateToServer();
}

export async function deleteDue(id) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const dues = getDues();
  const filtered = dues.filter(due => due.id !== id);
  setLocal(KEYS.DUES, filtered);

  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, 'dues', id)).catch(e => {
      console.error('Firebase delete failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'dues');
  pushStateToServer();
}
