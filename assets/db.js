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
  DUES: 'mm_dues',
  SUGGESTIONS: 'mm_suggestions',
  EDIT_DELETE_ALL: 'mm_edit_delete_all',
  WIFE_CAN_SWITCH: 'mm_wife_can_switch',
  BABY_NAMES: 'mm_baby_names',
  MOVIES: 'mm_movies',
  BABY_NEEDS: 'mm_baby_needs'
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
        const localSuggestions = getLocal(KEYS.SUGGESTIONS, []);
        const localBabyNames = getLocal(KEYS.BABY_NAMES, []);
        const localMovies = getLocal(KEYS.MOVIES, []);
        const localBabyNeeds = getLocal(KEYS.BABY_NEEDS, []);

        const remoteShopping = serverData.shopping || [];
        const remoteExpenses = serverData.expenses || [];
        const remoteDues = serverData.dues || [];
        const remoteSuggestions = serverData.suggestions || [];
        const remoteBabyNames = serverData.babyNames || [];
        const remoteMovies = serverData.movies || [];
        const remoteBabyNeeds = serverData.babyNeeds || [];

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
        if (JSON.stringify(localSuggestions) !== JSON.stringify(remoteSuggestions)) {
          setLocal(KEYS.SUGGESTIONS, remoteSuggestions);
          updated = true;
        }
        if (JSON.stringify(localBabyNames) !== JSON.stringify(remoteBabyNames)) {
          setLocal(KEYS.BABY_NAMES, remoteBabyNames);
          updated = true;
        }
        if (JSON.stringify(localMovies) !== JSON.stringify(remoteMovies)) {
          setLocal(KEYS.MOVIES, remoteMovies);
          updated = true;
        }
        if (JSON.stringify(localBabyNeeds) !== JSON.stringify(remoteBabyNeeds)) {
          setLocal(KEYS.BABY_NEEDS, remoteBabyNeeds);
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
    const localSuggestions = getLocal(KEYS.SUGGESTIONS, []);
    const localBabyNames = getLocal(KEYS.BABY_NAMES, []);
    const localMovies = getLocal(KEYS.MOVIES, []);
    const localBabyNeeds = getLocal(KEYS.BABY_NEEDS, []);

    const payload = {
      shopping: localShopping,
      expenses: localExpenses,
      dues: localDues,
      suggestions: localSuggestions,
      babyNames: localBabyNames,
      movies: localMovies,
      babyNeeds: localBabyNeeds,
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
  if (profile === 'Husband' || profile === 'Wife') {
    localStorage.setItem('mm_parent_profile', profile);
  }
}

export function isEditDeleteAllEnabled() {
  return getLocal(KEYS.EDIT_DELETE_ALL, false);
}

export function setEditDeleteAllEnabled(enabled) {
  setLocal(KEYS.EDIT_DELETE_ALL, enabled);
}

export function canWifeSwitch() {
  return 'yes';
}

export function setWifeCanSwitch(value) {
  // No-op, wife can always switch
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
    setupCollectionListener('suggestions', KEYS.SUGGESTIONS, onSyncStateChange);
    setupCollectionListener('baby_names', KEYS.BABY_NAMES, onSyncStateChange);
    setupCollectionListener('movies', KEYS.MOVIES, onSyncStateChange);
    setupCollectionListener('baby_needs', KEYS.BABY_NEEDS, onSyncStateChange);

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
    { name: 'dues', localKey: KEYS.DUES },
    { name: 'suggestions', localKey: KEYS.SUGGESTIONS },
    { name: 'baby_names', localKey: KEYS.BABY_NAMES },
    { name: 'movies', localKey: KEYS.MOVIES },
    { name: 'baby_needs', localKey: KEYS.BABY_NEEDS }
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
export async function saveSettings(firebaseEnabled, config, editDeleteAllEnabled, wifeCanSwitch, onSyncStateChange) {
  setLocal(KEYS.FB_ENABLED, firebaseEnabled);
  setLocal(KEYS.FB_CONFIG, config);
  setLocal(KEYS.EDIT_DELETE_ALL, editDeleteAllEnabled);
  if (wifeCanSwitch !== undefined) {
    setLocal(KEYS.WIFE_CAN_SWITCH, wifeCanSwitch);
  }

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

export async function addShoppingItem(name, qty, amount = '') {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getShoppingItems();
  const newItem = {
    id: generateId(),
    name: name.trim(),
    qty: (qty || '').trim(),
    amount: amount ? parseFloat(amount) : 0,
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

export async function markAllShoppingItemsBought(ids) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getShoppingItems();
  let updatedCount = 0;

  items.forEach(item => {
    if (ids.includes(item.id) && !item.bought) {
      item.bought = true;
      item.boughtBy = getCurrentProfile();
      item.timestamp = Date.now();
      updatedCount++;

      if (firestoreDb) {
        setDoc(doc(firestoreDb, 'shopping_list', item.id), item, { merge: true }).catch(e => {
          console.error('Firebase update failed:', e);
        });
      }
    }
  });

  if (updatedCount > 0) {
    setLocal(KEYS.SHOPPING, items);
    if (onUpdateCallback) onUpdateCallback('update', 'shopping_list');
    pushStateToServer();
  }
}

export async function unmarkAllShoppingItemsBought(ids) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getShoppingItems();
  let updatedCount = 0;

  items.forEach(item => {
    if (ids.includes(item.id) && item.bought) {
      item.bought = false;
      item.boughtBy = null;
      item.timestamp = Date.now();
      updatedCount++;

      if (firestoreDb) {
        setDoc(doc(firestoreDb, 'shopping_list', item.id), item, { merge: true }).catch(e => {
          console.error('Firebase update failed:', e);
        });
      }
    }
  });

  if (updatedCount > 0) {
    setLocal(KEYS.SHOPPING, items);
    if (onUpdateCallback) onUpdateCallback('update', 'shopping_list');
    pushStateToServer();
  }
}

export async function deleteAllShoppingItems(ids) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getShoppingItems();
  const filtered = items.filter(item => !ids.includes(item.id));
  setLocal(KEYS.SHOPPING, filtered);

  if (firestoreDb) {
    ids.forEach(id => {
      deleteDoc(doc(firestoreDb, 'shopping_list', id)).catch(e => {
        console.error('Firebase delete failed:', e);
      });
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

export async function addExpense(date, category, amount, notes, image = '') {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const expenses = getExpenses();
  const newExpense = {
    id: generateId(),
    date: date,
    category: category,
    amount: parseFloat(amount),
    notes: notes.trim(),
    image: image,
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

export async function addDue(person, amount, type, status, date) {
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
    date: date || '',
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

export async function updateShoppingItem(id, name, qty, amount = '') {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getShoppingItems();
  const index = items.findIndex(item => item.id === id);
  if (index === -1) { isWriting = false; return; }

  items[index].name = name.trim();
  items[index].qty = qty.trim();
  items[index].amount = amount ? parseFloat(amount) : 0;
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

export async function updateExpense(id, amount, notes, removeImage = false) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const expenses = getExpenses();
  const index = expenses.findIndex(exp => exp.id === id);
  if (index === -1) { isWriting = false; return; }

  expenses[index].amount = parseFloat(amount);
  expenses[index].notes = notes.trim();
  if (removeImage) {
    expenses[index].image = '';
  }
  expenses[index].timestamp = Date.now();

  setLocal(KEYS.EXPENSES, expenses);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'expenses', id), expenses[index], { merge: true }).catch(e => {
      console.error('Firebase update failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'expenses');
  pushStateToServer();
}

export async function updateDue(id, person, amount, date) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const dues = getDues();
  const index = dues.findIndex(due => due.id === id);
  if (index === -1) { isWriting = false; return; }

  dues[index].person = person.trim();
  dues[index].amount = parseFloat(amount);
  dues[index].date = date || '';
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

// ----------------------------------------------------
// APIS: NEXT SUGGESTIONS
// ----------------------------------------------------
export function getSuggestions() {
  return getLocal(KEYS.SUGGESTIONS, []);
}

export async function addSuggestion(text) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const list = getSuggestions();
  const newItem = {
    id: generateId(),
    text: text.trim(),
    done: false,
    addedBy: getCurrentProfile(),
    timestamp: Date.now()
  };

  list.push(newItem);
  setLocal(KEYS.SUGGESTIONS, list);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'suggestions', newItem.id), newItem).catch(e => {
      console.error('Firebase save failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'suggestions');
  pushStateToServer();
}

export async function toggleSuggestionStatus(id) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const list = getSuggestions();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) { isWriting = false; return; }

  list[index].done = !list[index].done;
  list[index].timestamp = Date.now();

  setLocal(KEYS.SUGGESTIONS, list);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'suggestions', id), list[index], { merge: true }).catch(e => {
      console.error('Firebase update failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'suggestions');
  pushStateToServer();
}

export async function deleteSuggestion(id) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const list = getSuggestions();
  const filtered = list.filter(item => item.id !== id);
  setLocal(KEYS.SUGGESTIONS, filtered);

  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, 'suggestions', id)).catch(e => {
      console.error('Firebase delete failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'suggestions');
  pushStateToServer();
}

export async function updateSuggestion(id, text) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const list = getSuggestions();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) { isWriting = false; return; }

  list[index].text = text.trim();
  list[index].timestamp = Date.now();

  setLocal(KEYS.SUGGESTIONS, list);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'suggestions', id), list[index], { merge: true }).catch(e => {
      console.error('Firebase update failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'suggestions');
  pushStateToServer();
}

export async function reorderItemToPosition(key, itemId, newPosition, filterType = 'all', activeDuesFilter = 'give') {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getLocal(key, []);
  
  // Sort items by current order
  if (key === KEYS.EXPENSES) {
    items.sort((a, b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp);
  } else {
    items.sort((a, b) => b.timestamp - a.timestamp);
  }

  const sourceItem = items.find(item => item.id === itemId);
  if (!sourceItem) { isWriting = false; return; }

  // Filter items matching current view
  let filteredItems = [];
  if (key === KEYS.SHOPPING) {
    if (filterType === 'pending') {
      filteredItems = items.filter(item => !item.bought);
    } else if (filterType === 'bought') {
      filteredItems = items.filter(item => item.bought);
    } else {
      filteredItems = [...items];
    }
  } else if (key === KEYS.DUES) {
    filteredItems = items.filter(due => due.type === activeDuesFilter);
  } else if (key === KEYS.BABY_NAMES) {
    filteredItems = items.filter(n => n.gender === sourceItem.gender);
  } else {
    filteredItems = [...items];
  }

  // Remove sourceItem from filtered items
  const sourceIndexInFiltered = filteredItems.indexOf(sourceItem);
  if (sourceIndexInFiltered !== -1) {
    filteredItems.splice(sourceIndexInFiltered, 1);
  }

  // Bound and insert at target position (1-indexed input)
  let targetIndex = parseInt(newPosition) - 1;
  if (isNaN(targetIndex) || targetIndex < 0) targetIndex = 0;
  if (targetIndex > filteredItems.length) targetIndex = filteredItems.length;

  filteredItems.splice(targetIndex, 0, sourceItem);

  // Re-map the new filtered items order back into the main items array
  let finalItems = [];
  if (key === KEYS.SHOPPING && filterType !== 'all') {
    let filteredIdx = 0;
    finalItems = items.map(item => {
      const isMatch = filterType === 'pending' ? !item.bought : item.bought;
      if (isMatch) {
        return filteredItems[filteredIdx++];
      }
      return item;
    });
  } else if (key === KEYS.DUES) {
    let filteredIdx = 0;
    finalItems = items.map(item => {
      if (item.type === activeDuesFilter) {
        return filteredItems[filteredIdx++];
      }
      return item;
    });
  } else if (key === KEYS.BABY_NAMES) {
    let filteredIdx = 0;
    finalItems = items.map(item => {
      if (item.gender === sourceItem.gender) {
        return filteredItems[filteredIdx++];
      }
      return item;
    });
  } else {
    finalItems = filteredItems;
  }

  // Rewrite timestamps sequentially (newest first) to maintain visual persistence
  const now = Date.now();
  finalItems.forEach((item, index) => {
    item.timestamp = now - index * 1000;
  });

  setLocal(key, finalItems);

  if (firestoreDb) {
    const collectionName = key === KEYS.SHOPPING ? 'shopping_list' : 
                           key === KEYS.EXPENSES ? 'expenses' : 
                           key === KEYS.DUES ? 'dues' : 
                           key === KEYS.SUGGESTIONS ? 'suggestions' : 
                           key === KEYS.BABY_NEEDS ? 'baby_needs' : 'baby_names';
    const batch = writeBatch(firestoreDb);
    finalItems.forEach(item => {
      const docRef = doc(firestoreDb, collectionName, item.id);
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit().catch(e => console.error("Firebase reorder sync failed:", e));
  }

  const collName = key === KEYS.SHOPPING ? 'shopping_list' : 
                   key === KEYS.EXPENSES ? 'expenses' : 
                   key === KEYS.DUES ? 'dues' : 
                   key === KEYS.SUGGESTIONS ? 'suggestions' : 
                   key === KEYS.BABY_NEEDS ? 'baby_needs' : 'baby_names';
  if (onUpdateCallback) onUpdateCallback('update', collName);
  pushStateToServer();
}

// ----------------------------------------------------
// APIS: BABY NAMES LIST (SOLAMONIR NAMER TALIKA)
// ----------------------------------------------------
export function getBabyNames() {
  return getLocal(KEYS.BABY_NAMES, []);
}

export async function addBabyName(name, gender) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getBabyNames();
  const parent = localStorage.getItem('mm_parent_profile') || 'Husband';
  const addedByLabel = parent === 'Husband' ? 'Father' : 'Mother';

  const newItem = {
    id: generateId(),
    name: name.trim(),
    gender: gender, // 'boy' or 'girl'
    likes: [], // list of profile names who liked it e.g. ["Father", "Mother"]
    addedBy: addedByLabel,
    timestamp: Date.now()
  };

  items.push(newItem);
  setLocal(KEYS.BABY_NAMES, items);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'baby_names', newItem.id), newItem).catch(e => {
      console.error('Firebase save failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'baby_names');
  pushStateToServer();
}

export async function toggleLikeBabyName(id) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getBabyNames();
  const index = items.findIndex(item => item.id === id);
  if (index === -1) { isWriting = false; return; }

  const parent = localStorage.getItem('mm_parent_profile') || 'Husband';
  const addedByLabel = parent === 'Husband' ? 'Father' : 'Mother';
  const likes = items[index].likes || [];
  items[index].likes = [...likes, addedByLabel];
  items[index].timestamp = Date.now();

  setLocal(KEYS.BABY_NAMES, items);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'baby_names', id), items[index], { merge: true }).catch(e => {
      console.error('Firebase update failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'baby_names');
  pushStateToServer();
}

export async function deleteBabyName(id) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getBabyNames();
  const filtered = items.filter(item => item.id !== id);
  setLocal(KEYS.BABY_NAMES, filtered);

  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, 'baby_names', id)).catch(e => {
      console.error('Firebase delete failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'baby_names');
  pushStateToServer();
}

export async function updateBabyName(id, name) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getBabyNames();
  const index = items.findIndex(item => item.id === id);
  if (index === -1) { isWriting = false; return; }

  items[index].name = name.trim();
  items[index].timestamp = Date.now();

  setLocal(KEYS.BABY_NAMES, items);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'baby_names', id), items[index], { merge: true }).catch(e => {
      console.error('Firebase update failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'baby_names');
  pushStateToServer();
}

// ----------------------------------------------------
// APIS: MOVIE/SERIES LIST
// ----------------------------------------------------
export function getMovies() {
  return getLocal(KEYS.MOVIES, []);
}

export async function addMovie(name, type) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getMovies();
  const parent = localStorage.getItem('mm_parent_profile') || 'Husband';
  const newItem = {
    id: generateId(),
    name: name.trim(),
    type: type, // 'movie' or 'series'
    watched: false,
    addedBy: parent === 'Husband' ? 'Father' : 'Mother',
    timestamp: Date.now()
  };

  items.push(newItem);
  setLocal(KEYS.MOVIES, items);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'movies', newItem.id), newItem).catch(e => {
      console.error('Firebase save failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'movies');
  pushStateToServer();
}

export async function toggleWatchedMovie(id) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getMovies();
  const index = items.findIndex(item => item.id === id);
  if (index === -1) { isWriting = false; return; }

  items[index].watched = !items[index].watched;
  items[index].timestamp = Date.now();

  setLocal(KEYS.MOVIES, items);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'movies', id), items[index], { merge: true }).catch(e => {
      console.error('Firebase update failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'movies');
  pushStateToServer();
}

export async function deleteMovie(id) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getMovies();
  const filtered = items.filter(item => item.id !== id);
  setLocal(KEYS.MOVIES, filtered);

  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, 'movies', id)).catch(e => {
      console.error('Firebase delete failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'movies');
  pushStateToServer();
}

export async function updateMovie(id, name) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getMovies();
  const index = items.findIndex(item => item.id === id);
  if (index === -1) { isWriting = false; return; }

  items[index].name = name.trim();
  items[index].timestamp = Date.now();

  setLocal(KEYS.MOVIES, items);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'movies', id), items[index], { merge: true }).catch(e => {
      console.error('Firebase update failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'movies');
  pushStateToServer();
}

// ----------------------------------------------------
// APIS: BABY NEEDS LIST
// ----------------------------------------------------
export function getBabyNeeds() {
  return getLocal(KEYS.BABY_NEEDS, []);
}

export async function addBabyNeed(name) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getBabyNeeds();
  const newItem = {
    id: generateId(),
    name: name.trim(),
    addedBy: getCurrentProfile(),
    timestamp: Date.now()
  };

  items.push(newItem);
  setLocal(KEYS.BABY_NEEDS, items);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'baby_needs', newItem.id), newItem).catch(e => {
      console.error('Firebase save failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'baby_needs');
  pushStateToServer();
}

export async function deleteBabyNeed(id) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getBabyNeeds();
  const filtered = items.filter(item => item.id !== id);
  setLocal(KEYS.BABY_NEEDS, filtered);

  if (firestoreDb) {
    deleteDoc(doc(firestoreDb, 'baby_needs', id)).catch(e => {
      console.error('Firebase delete failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'baby_needs');
  pushStateToServer();
}

export async function updateBabyNeed(id, name) {
  isWriting = true;
  if (writeCooldownTimer) clearTimeout(writeCooldownTimer);

  const items = getBabyNeeds();
  const index = items.findIndex(item => item.id === id);
  if (index === -1) { isWriting = false; return; }

  items[index].name = name.trim();
  items[index].timestamp = Date.now();

  setLocal(KEYS.BABY_NEEDS, items);

  if (firestoreDb) {
    setDoc(doc(firestoreDb, 'baby_needs', id), items[index], { merge: true }).catch(e => {
      console.error('Firebase update failed:', e);
    });
  }

  if (onUpdateCallback) onUpdateCallback('update', 'baby_needs');
  pushStateToServer();
}
