import {
  initializeDB,
  saveSettings,
  isFirebaseConfigured,
  getFirebaseConfig,
  getCurrentProfile,
  setCurrentProfile,
  isEditDeleteAllEnabled,
  canWifeSwitch,
  getShoppingItems,
  addShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  getExpenses,
  addExpense,
  deleteExpense,
  getDues,
  addDue,
  toggleDueStatus,
  deleteDue
} from './db.js';

// DOM Element Selectors
const DOM = {
  // Navigation & Screen Switcher
  navItems: document.querySelectorAll('.curved-nav-item'),
  screens: document.querySelectorAll('.screen'),
  
  // Header / Profiles
  profileBtn: document.getElementById('profile-btn'),
  profileAvatar: document.getElementById('profile-avatar'),
  profileName: document.getElementById('profile-name'),
  welcomeUser: document.getElementById('welcome-user'),
  syncDot: document.getElementById('sync-dot'),
  syncText: document.getElementById('sync-text'),
  offlineIndicator: document.getElementById('offline-indicator'),
  themeToggleBtn: document.getElementById('theme-toggle-btn'),
  themeToggleIcon: document.getElementById('theme-toggle-icon'),
  
  // Dashboard
  dashExpenses: document.getElementById('dash-monthly-expenses'),
  dashTake: document.getElementById('dash-pending-take'),
  dashGive: document.getElementById('dash-pending-give'),
  dashBajarPending: document.getElementById('dash-bajar-pending'),
  quickBajar: document.getElementById('quick-add-bajar'),
  quickExpense: document.getElementById('quick-add-expense'),
  quickDue: document.getElementById('quick-add-due'),
  recentActivitiesList: document.getElementById('recent-activities-list'),

  // Shopping List (Bajar)
  shoppingForm: document.getElementById('shopping-form'),
  shopItemName: document.getElementById('shop-item-name'),
  shopItemQty: document.getElementById('shop-item-qty'),
  shoppingContainer: document.getElementById('shopping-list-container'),
  shoppingFilterTabs: document.getElementById('shopping-filter-tabs').querySelectorAll('.tab-btn'),
  
  // Expenses (Hishab)
  expenseForm: document.getElementById('expense-form'),
  expenseAmount: document.getElementById('expense-amount'),
  expenseNotes: document.getElementById('expense-notes'),
  expenseHistory: document.getElementById('expense-history-list'),
  expenseTotalContainer: document.getElementById('expense-total-container'),
  expenseTotalValue: document.getElementById('expense-total-value'),
  
  // Dues (Dhar-Dena)
  dueForm: document.getElementById('due-form'),
  duePerson: document.getElementById('due-person'),
  dueAmount: document.getElementById('due-amount'),
  dueType: document.getElementById('due-type'),
  dueStatus: document.getElementById('due-status'),
  duesContainer: document.getElementById('dues-list-container'),
  duesFilterTabs: document.getElementById('dues-filter-tabs').querySelectorAll('.tab-btn'),
  
  // Settings Modal
  settingsModal: document.getElementById('settings-modal'),
  settingsClose: document.getElementById('settings-close'),
  settingsSave: document.getElementById('btn-save-settings'),
  firebaseEnable: document.getElementById('firebase-enable'),
  firebaseSection: document.getElementById('firebase-config-section'),
  fbApiKey: document.getElementById('fb-api-key'),
  fbProjectId: document.getElementById('fb-project-id'),
  fbAuthDomain: document.getElementById('fb-auth-domain'),
  fbAppId: document.getElementById('fb-app-id'),
  editDeleteAllEnable: document.getElementById('edit-delete-all-enable'),
  wifeSwitchPermissionGroup: document.getElementById('wife-switch-permission-group'),

  // Drawer Selectors
  drawerOverlay: document.getElementById('drawer-overlay'),
  drawer: document.getElementById('app-drawer'),
  drawerClose: document.getElementById('drawer-close'),
  drawerToggleBtn: document.getElementById('drawer-toggle-btn'),
  drawerItems: document.querySelectorAll('.drawer-item'),
  drawerSettingsBtn: document.getElementById('drawer-settings-btn'),
  drawerProfileBtn: document.getElementById('drawer-profile-btn'),
  drawerAvatar: document.getElementById('drawer-avatar'),
  drawerProfileName: document.getElementById('drawer-profile-name')
};

// UI Active State Filters
let activeShoppingFilter = 'all';
let activeDuesFilter = 'give';
let activeExpenseMonth = ''; // Format: YYYY-MM

// Category colors for expense ledger and charts
const CATEGORY_COLORS = {
  'House Rent': '#F87171',      // Soft Red/Coral
  'Utilities': '#FBBF24',       // Soft Amber Yellow
  'Maid Salary': '#34D399',     // Soft Emerald Green
  'Grocery': '#60A5FA',         // Soft Sky Blue
  'Shopping': '#F472B6',        // Soft Pink
  'Medicine': '#A78BFA',        // Soft Purple
  'Misc': '#9CA3AF'             // Soft Grey
};

// Theme management functions
function initializeTheme() {
  let savedTheme = localStorage.getItem('mm_theme');
  if (!savedTheme) {
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    savedTheme = prefersLight ? 'light' : 'dark';
  }
  setTheme(savedTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('mm_theme', theme);
  updateThemeToggleIcon(theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

function updateThemeToggleIcon(theme) {
  if (!DOM.themeToggleIcon) return;
  if (theme === 'light') {
    DOM.themeToggleIcon.innerHTML = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;
    DOM.themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
  } else {
    DOM.themeToggleIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    DOM.themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
  }
}

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

  // Initialize DB state
  initializeDB(handleDataUpdate, handleSyncStateChange);

  // Initialize Theme
  initializeTheme();

  // Set up event listeners
  setupEventListeners();

  // Initial UI state setup
  updateProfileUI();
  updateOfflineBanner();
  switchScreen('dashboard');

  // Check for app code updates
  checkCodeUpdate();

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('Service Worker registered: ', reg.scope);
          reg.update();
        })
        .catch(err => console.error('Service Worker registration failed: ', err));
    });
  }
});

// Detect network status and update PWA Offline warning
window.addEventListener('online', updateOfflineBanner);
window.addEventListener('offline', updateOfflineBanner);

// ----------------------------------------------------
// AUTOMATIC CODE UPDATE DETECTION & POPUP NOTIFICATION
// ----------------------------------------------------
let currentVersion = localStorage.getItem('mm_app_version') || null;

async function checkCodeUpdate() {
  try {
    const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.version) {
        const serverVer = data.version.toString();
        if (!currentVersion) {
          localStorage.setItem('mm_app_version', serverVer);
          currentVersion = serverVer;
        } else if (currentVersion !== serverVer) {
          showUpdatePopup(serverVer);
        }
      }
    }
  } catch (e) {
    // Fail silently if server is offline
  }
}

function showUpdatePopup(newVersion) {
  const overlay = document.getElementById('update-banner-overlay');
  const btn = document.getElementById('btn-apply-update');
  const card = document.getElementById('update-banner-card');
  const loading = document.getElementById('update-loading-container');
  if (!overlay || !btn) return;

  overlay.style.display = 'flex';

  btn.onclick = async () => {
    // Hide warning card and show loading spinner card
    if (card) card.style.display = 'none';
    if (loading) loading.style.display = 'flex';
    
    localStorage.setItem('mm_app_version', newVersion);

    // Clear service worker caches
    if ('caches' in window) {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      } catch (e) {}
    }

    // Unregister active service workers
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let reg of registrations) {
          await reg.unregister();
        }
      } catch (e) {}
    }

    // Artificial delay of 1.5 seconds to show the loading animation smoothly
    setTimeout(() => {
      window.location.reload(true);
    }, 1500);
  };
}

// Check for code updates when app comes back into focus
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    checkCodeUpdate();
  }
});
window.addEventListener('focus', checkCodeUpdate);

function updateOfflineBanner() {
  if (navigator.onLine) {
    DOM.offlineIndicator.classList.remove('active');
  } else {
    DOM.offlineIndicator.classList.add('active');
  }
}

// ----------------------------------------------------
// NAVIGATION SYSTEM
// ----------------------------------------------------
function switchScreen(screenName) {
  // Update nav buttons
  DOM.navItems.forEach(item => {
    if (item.dataset.screen === screenName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update curved nav cutout position and active icon
  const activeNavItem = Array.from(DOM.navItems).find(item => item.dataset.screen === screenName);
  if (activeNavItem) {
    const index = parseInt(activeNavItem.dataset.index);
    const cutoutContainer = document.getElementById('nav-cutout-container');
    if (cutoutContainer) {
      cutoutContainer.style.transform = `translateX(${index * 100}%)`;
    }
    
    const activeIconWrapper = document.getElementById('nav-active-icon-wrapper');
    if (activeIconWrapper) {
      const originalSvg = activeNavItem.querySelector('svg');
      if (originalSvg) {
        const tabSvg = originalSvg.cloneNode(true);
        activeIconWrapper.innerHTML = '';
        activeIconWrapper.appendChild(tabSvg);
      }
    }
  }

  // Update drawer nav buttons
  if (DOM.drawerItems) {
    DOM.drawerItems.forEach(item => {
      if (item.dataset.screen === screenName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Update screens visibility
  DOM.screens.forEach(screen => {
    if (screen.id === `screen-${screenName}`) {
      screen.classList.add('active');
    } else {
      screen.classList.remove('active');
    }
  });

  // Trigger content redraws if necessary
  renderActiveScreen();
}

function renderActiveScreen() {
  const activeScreen = document.querySelector('.screen.active').id;
  if (activeScreen === 'screen-dashboard') {
    renderDashboard();
  } else if (activeScreen === 'screen-bajar') {
    renderShoppingList();
  } else if (activeScreen === 'screen-hishab') {
    renderExpenseTracker();
  } else if (activeScreen === 'screen-dues') {
    renderDuesLedger();
  }
}

// Drawer open/close helpers
function openDrawer() {
  DOM.drawer.classList.add('active');
  DOM.drawerOverlay.classList.add('active');
  // Reset inline styles
  DOM.drawer.style.transform = '';
  DOM.drawerOverlay.style.opacity = '';
  DOM.drawerOverlay.style.pointerEvents = '';
}

function closeDrawer() {
  DOM.drawer.classList.remove('active');
  DOM.drawerOverlay.classList.remove('active');
  // Reset inline styles
  DOM.drawer.style.transform = '';
  DOM.drawerOverlay.style.opacity = '';
  DOM.drawerOverlay.style.pointerEvents = '';
}

// Swipe gestures with real-time touch tracking
let touchStartX = 0;
let touchStartY = 0;
let isDraggingOpen = false;
let isDraggingClose = false;
const drawerWidth = 280;

document.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  
  const isDrawerActive = DOM.drawer.classList.contains('active');
  
  if (!isDrawerActive) {
    // Check if touch starts on the right edge of the screen/container
    const screenWidth = window.innerWidth;
    const isTouchFromRight = touchStartX > (screenWidth - 40);
    
    // For desktop container (max-width: 480px, centered)
    const containerWidth = 480;
    const isTouchFromRightDesktop = (screenWidth >= containerWidth) && 
      (touchStartX > (screenWidth / 2 + containerWidth / 2 - 40));
      
    if (isTouchFromRight || isTouchFromRightDesktop) {
      isDraggingOpen = true;
      // Disable transition for tracking finger
      DOM.drawer.style.transition = 'none';
      DOM.drawerOverlay.style.transition = 'none';
    }
  } else {
    // If drawer is open, check if touch starts inside the drawer
    const drawerRect = DOM.drawer.getBoundingClientRect();
    if (touchStartX >= drawerRect.left) {
      isDraggingClose = true;
      DOM.drawer.style.transition = 'none';
      DOM.drawerOverlay.style.transition = 'none';
    }
  }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (!isDraggingOpen && !isDraggingClose) return;
  
  const touch = e.touches[0];
  const currentX = touch.clientX;
  const currentY = touch.clientY;
  
  const diffY = touchStartY - currentY;
  
  // Prevent tracking if vertical scroll is dominant
  if (Math.abs(diffY) > Math.abs(touchStartX - currentX) && (isDraggingOpen && touchStartX - currentX < 15)) {
    return;
  }
  
  if (isDraggingOpen) {
    let deltaX = touchStartX - currentX; // Dragging left increases deltaX
    if (deltaX < 0) deltaX = 0;
    if (deltaX > drawerWidth) deltaX = drawerWidth;
    
    // Translate drawer from hidden (280px) to fully shown (0px)
    const translateVal = drawerWidth - deltaX;
    DOM.drawer.style.transform = `translateX(${translateVal}px)`;
    
    // Fade in overlay backdrop
    const opacityVal = (deltaX / drawerWidth) * 0.4;
    DOM.drawerOverlay.classList.add('active');
    DOM.drawerOverlay.style.opacity = opacityVal;
    DOM.drawerOverlay.style.pointerEvents = 'none';
  }
  
  if (isDraggingClose) {
    let deltaX = currentX - touchStartX; // Dragging right increases deltaX (closing)
    if (deltaX < 0) deltaX = 0;
    if (deltaX > drawerWidth) deltaX = drawerWidth;
    
    // Translate drawer from shown (0px) to hidden (280px)
    DOM.drawer.style.transform = `translateX(${deltaX}px)`;
    
    // Fade out overlay backdrop
    const opacityVal = ((drawerWidth - deltaX) / drawerWidth) * 0.4;
    DOM.drawerOverlay.style.opacity = opacityVal;
    DOM.drawerOverlay.style.pointerEvents = 'none';
  }
}, { passive: true });

document.addEventListener('touchend', (e) => {
  const isOpening = isDraggingOpen;
  const isClosing = isDraggingClose;
  
  // Reset drag flags
  isDraggingOpen = false;
  isDraggingClose = false;
  
  if (!isOpening && !isClosing) return;
  
  // Re-enable transitions
  DOM.drawer.style.transition = '';
  DOM.drawerOverlay.style.transition = '';
  
  const touch = e.changedTouches[0];
  const endX = touch.clientX;
  
  if (isOpening) {
    const deltaX = touchStartX - endX;
    if (deltaX > 80) {
      openDrawer();
    } else {
      closeDrawer();
    }
  }
  
  if (isClosing) {
    const deltaX = endX - touchStartX;
    if (deltaX > 80) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }
}, { passive: true });

// ----------------------------------------------------
// EVENT LISTENERS SETUP
// ----------------------------------------------------
function setupEventListeners() {
  // Bottom Navigation Bar
  DOM.navItems.forEach(item => {
    item.addEventListener('click', () => {
      switchScreen(item.dataset.screen);
    });
  });

  // Drawer Toggle / Close Events
  if (DOM.drawerToggleBtn) {
    DOM.drawerToggleBtn.addEventListener('click', openDrawer);
  }
  if (DOM.drawerClose) {
    DOM.drawerClose.addEventListener('click', closeDrawer);
  }
  if (DOM.drawerOverlay) {
    DOM.drawerOverlay.addEventListener('click', closeDrawer);
  }
  if (DOM.drawerItems) {
    DOM.drawerItems.forEach(item => {
      item.addEventListener('click', () => {
        switchScreen(item.dataset.screen);
        closeDrawer();
      });
    });
  }
  if (DOM.drawerSettingsBtn) {
    DOM.drawerSettingsBtn.addEventListener('click', () => {
      closeDrawer();
      openSettingsModal();
    });
  }
  if (DOM.drawerProfileBtn) {
    DOM.drawerProfileBtn.addEventListener('click', () => {
      closeDrawer();
      toggleActiveProfile();
    });
  }

  // Profile Toggling and Settings Close Buttons
  DOM.profileBtn.addEventListener('click', toggleActiveProfile);
  DOM.settingsClose.addEventListener('click', closeSettingsModal);

  // Theme Toggle Button
  if (DOM.themeToggleBtn) {
    DOM.themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Quick Action Buttons
  DOM.quickBajar.addEventListener('click', () => switchScreen('bajar'));
  DOM.quickExpense.addEventListener('click', () => switchScreen('hishab'));
  DOM.quickDue.addEventListener('click', () => switchScreen('dues'));

  // Firebase sync toggler in Settings
  DOM.firebaseEnable.addEventListener('change', (e) => {
    DOM.firebaseSection.style.display = e.target.checked ? 'block' : 'none';
  });

  // Save Settings Modal Actions
  DOM.settingsSave.addEventListener('click', handleSettingsSave);



  // Forms submissions
  DOM.shoppingForm.addEventListener('submit', handleAddShoppingItem);
  DOM.expenseForm.addEventListener('submit', handleAddExpenseItem);
  DOM.dueForm.addEventListener('submit', handleAddDueItem);

  // Shopping List Filter Tabs
  DOM.shoppingFilterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      DOM.shoppingFilterTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      activeShoppingFilter = e.target.dataset.filter;
      renderShoppingList();
    });
  });

  // Dues Ledger Filter Tabs
  DOM.duesFilterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      DOM.duesFilterTabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      activeDuesFilter = e.target.dataset.filter;
      renderDuesLedger();
    });
  });

  // Shopping List Container Event Delegation (Toggle & Delete)
  if (DOM.shoppingContainer) {
    DOM.shoppingContainer.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.btn-icon-delete');

      if (deleteBtn && deleteBtn.dataset.id) {
        e.stopPropagation();
        
        // Safety check:
        const items = getShoppingItems();
        const item = items.find(i => i.id === deleteBtn.dataset.id);
        if (item && !isEditDeleteAllEnabled() && item.addedBy !== getCurrentProfile()) {
          alert(`You are not allowed to delete this item (added by ${item.addedBy})`);
          return;
        }

        await deleteShoppingItem(deleteBtn.dataset.id);
        renderShoppingList();
        renderDashboard();
        return;
      }

      const itemRow = e.target.closest('.list-item');
      if (itemRow) {
        const chk = itemRow.querySelector('.item-checkbox');
        if (chk && chk.dataset.id) {
          await toggleShoppingItem(chk.dataset.id);
          renderShoppingList();
          renderDashboard();
        }
      }
    });
  }

  // Expense History Container Event Delegation (Delete)
  if (DOM.expenseHistory) {
    DOM.expenseHistory.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.btn-icon-delete');
      if (deleteBtn && deleteBtn.dataset.id) {
        e.stopPropagation();

        const expenses = getExpenses();
        const exp = expenses.find(expItem => expItem.id === deleteBtn.dataset.id);
        if (exp && !isEditDeleteAllEnabled() && exp.addedBy !== getCurrentProfile()) {
          alert(`You are not allowed to delete this expense (added by ${exp.addedBy})`);
          return;
        }

        await deleteExpense(deleteBtn.dataset.id);
        renderExpenseTracker();
        renderDashboard();
      }
    });
  }

  // Dues Container Event Delegation (Delete)
  if (DOM.duesContainer) {
    DOM.duesContainer.addEventListener('click', async (e) => {
      const deleteBtn = e.target.closest('.btn-icon-delete');
      if (deleteBtn && deleteBtn.dataset.id) {
        e.stopPropagation();

        const dues = getDues();
        const due = dues.find(d => d.id === deleteBtn.dataset.id);
        if (due && !isEditDeleteAllEnabled() && due.addedBy !== getCurrentProfile()) {
          alert(`You are not allowed to delete this entry (added by ${due.addedBy})`);
          return;
        }

        await deleteDue(deleteBtn.dataset.id);
        renderDuesLedger();
        renderDashboard();
      }
    });
  }
}

// ----------------------------------------------------
// SETTINGS & PROFILE MANAGEMENT
// ----------------------------------------------------
function updateProfileUI() {
  const profile = getCurrentProfile();
  DOM.profileName.textContent = profile;
  DOM.profileAvatar.textContent = profile === 'Husband' ? '🧔' : '👩';
  DOM.welcomeUser.textContent = profile;
  
  // Update drawer profile
  if (DOM.drawerProfileName) DOM.drawerProfileName.textContent = profile;
  if (DOM.drawerAvatar) DOM.drawerAvatar.textContent = profile === 'Husband' ? '🧔' : '👩';
  
  // Set data-profile attribute on documentElement
  document.documentElement.setAttribute('data-profile', profile.toLowerCase());
}

function toggleActiveProfile() {
  const currentProfile = getCurrentProfile();
  
  if (currentProfile === 'Wife') {
    if (canWifeSwitch() !== 'yes') {
      alert("Wife cannot switch profile! Permission denied by Husband.");
      return;
    }
  }

  const newProfile = currentProfile === 'Husband' ? 'Wife' : 'Husband';
  setCurrentProfile(newProfile);
  updateProfileUI();
  
  // Refresh layout and reload after a short delay so the visual switch is registered
  setTimeout(() => {
    window.location.reload(true);
  }, 200);
}

function openSettingsModal() {
  const currentProfile = getCurrentProfile();

  // Show wife switch permission group ONLY if Husband is viewing settings
  if (DOM.wifeSwitchPermissionGroup) {
    if (currentProfile === 'Husband') {
      DOM.wifeSwitchPermissionGroup.style.display = 'block';
      
      const val = canWifeSwitch();
      const radYes = document.getElementById('wife-switch-yes');
      const radNo = document.getElementById('wife-switch-no');
      if (radYes && radNo) {
        if (val === 'yes') {
          radYes.checked = true;
        } else {
          radNo.checked = true;
        }
      }
    } else {
      DOM.wifeSwitchPermissionGroup.style.display = 'none';
    }
  }

  // Pre-fill Edit & Delete all config
  if (DOM.editDeleteAllEnable) {
    DOM.editDeleteAllEnable.checked = isEditDeleteAllEnabled();
  }

  // Pre-fill firebase configs
  const isFb = isFirebaseConfigured();
  DOM.firebaseEnable.checked = isFb;
  DOM.firebaseSection.style.display = isFb ? 'block' : 'none';

  const fbConfig = getFirebaseConfig();
  DOM.fbApiKey.value = fbConfig.apiKey || '';
  DOM.fbProjectId.value = fbConfig.projectId || '';
  DOM.fbAuthDomain.value = fbConfig.authDomain || '';
  DOM.fbAppId.value = fbConfig.appId || '';

  DOM.settingsModal.classList.add('active');
}

function closeSettingsModal() {
  DOM.settingsModal.classList.remove('active');
}

async function handleSettingsSave() {
  DOM.settingsSave.disabled = true;
  DOM.settingsSave.textContent = 'Saving...';

  const firebaseEnabled = DOM.firebaseEnable.checked;
  const editDeleteAll = DOM.editDeleteAllEnable ? DOM.editDeleteAllEnable.checked : false;
  
  // Read wife switch permission if Husband is saving settings
  let wifeCanSwitch = canWifeSwitch();
  if (getCurrentProfile() === 'Husband') {
    const selectedRadio = document.querySelector('input[name="wife-switch"]:checked');
    if (selectedRadio) {
      wifeCanSwitch = selectedRadio.value;
    }
  }

  const config = {
    apiKey: DOM.fbApiKey.value.trim(),
    projectId: DOM.fbProjectId.value.trim(),
    authDomain: DOM.fbAuthDomain.value.trim(),
    appId: DOM.fbAppId.value.trim()
  };

  const success = await saveSettings(firebaseEnabled, config, editDeleteAll, wifeCanSwitch, handleSyncStateChange);
  
  DOM.settingsSave.disabled = false;
  DOM.settingsSave.textContent = 'Save Settings';
  
  if (success) {
    updateProfileUI();
    closeSettingsModal();
    
    // Automatically reload page after 500ms to apply new configuration
    setTimeout(() => {
      window.location.reload(true);
    }, 500);

    // Re-render everything with the new user context
    renderDashboard();
    renderShoppingList();
    renderExpenseTracker();
    renderDuesLedger();
  } else {
    alert('Firebase Sync failed to connect! Check credentials and try again.');
  }
}

// ----------------------------------------------------
// DATABASE & SYNC STATE UI UPDATER
// ----------------------------------------------------
function handleDataUpdate(type, sourceCollection) {
  // Re-render only necessary parts based on collection updates or do complete redraws
  renderDashboard();
  if (!sourceCollection || sourceCollection === 'shopping_list') renderShoppingList();
  if (!sourceCollection || sourceCollection === 'expenses') renderExpenseTracker();
  if (!sourceCollection || sourceCollection === 'dues') renderDuesLedger();
}

function handleSyncStateChange(state, errorMessage = '') {
  DOM.syncDot.className = 'sync-dot';
  
  switch(state) {
    case 'connecting':
      DOM.syncDot.classList.add('syncing');
      DOM.syncText.textContent = 'Syncing...';
      break;
    case 'connected':
      DOM.syncDot.classList.add('give'); // Sage green color (reusing class)
      DOM.syncText.textContent = 'Cloud Synced';
      break;
    case 'local':
      DOM.syncDot.classList.add('disconnected');
      DOM.syncText.textContent = 'Local Mode';
      break;
    case 'error':
      DOM.syncDot.classList.add('take'); // Coral color (reusing class)
      DOM.syncText.textContent = 'Sync Error';
      console.error('Firebase Sync status reports error:', errorMessage);
      break;
  }
}

// ----------------------------------------------------
// SCREEN RENDERS: DASHBOARD
// ----------------------------------------------------
function renderDashboard() {
  // 1. Calculate Grand Total of Needs
  const expenses = getExpenses();
  const totalNeeded = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  DOM.dashExpenses.textContent = `৳ ${totalNeeded.toLocaleString('en-IN')}`;

  // 2. Calculate Pending Dues
  const dues = getDues();
  const pendingTake = dues
    .filter(due => due.status === 'pending' && due.type === 'take')
    .reduce((sum, due) => sum + due.amount, 0);

  const pendingGive = dues
    .filter(due => due.status === 'pending' && due.type === 'give')
    .reduce((sum, due) => sum + due.amount, 0);

  DOM.dashTake.textContent = `৳ ${pendingTake.toLocaleString('en-IN')}`;
  DOM.dashGive.textContent = `৳ ${pendingGive.toLocaleString('en-IN')}`;

  // 3. Calculate Pending Bajar Items Count
  const shopping = getShoppingItems();
  const pendingBajar = shopping.filter(item => !item.bought).length;
  if (DOM.dashBajarPending) {
    DOM.dashBajarPending.textContent = pendingBajar;
  }

  // 4. Compile Recent Activities
  if (!DOM.recentActivitiesList) return;
  
  // Combine all items to create a pseudo-log
  const logs = [];

  shopping.forEach(item => {
    logs.push({
      id: item.id,
      timestamp: item.timestamp,
      user: item.addedBy,
      type: 'shopping',
      action: item.bought ? 'bought' : 'added',
      text: `${item.bought ? 'purchased' : 'added'} "${item.name}" (Qty: ${item.qty})`
    });
  });

  expenses.forEach(exp => {
    logs.push({
      id: exp.id,
      timestamp: exp.timestamp,
      user: exp.addedBy,
      type: 'expense',
      action: 'recorded',
      text: `added need: "${exp.notes}" (৳${exp.amount})`
    });
  });

  dues.forEach(due => {
    logs.push({
      id: due.id,
      timestamp: due.timestamp,
      user: due.addedBy,
      type: 'due',
      action: due.status === 'paid' ? 'settled' : 'recorded',
      text: due.status === 'paid' 
        ? `settled loan of ৳${due.amount} with ${due.person}`
        : `recorded ৳${due.amount} loan to ${due.type === 'give' ? 'give to' : 'take from'} ${due.person}`
    });
  });

  // Sort logs by timestamp descending
  logs.sort((a, b) => b.timestamp - a.timestamp);

  // Render recent 3 activities
  const recentLogs = logs.slice(0, 3);
  
  if (recentLogs.length === 0) {
    DOM.recentActivitiesList.innerHTML = `
      <div class="empty-state">
        <p>No recent activity. Start adding logs!</p>
      </div>
    `;
    return;
  }

  DOM.recentActivitiesList.innerHTML = recentLogs.map(log => {
    const timeString = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
    const avatar = log.user === 'Husband' ? '🧔' : '👩';
    
    return `
      <div class="list-item" style="padding: 10px 12px; margin-bottom: 8px; font-size: 13px; border-radius: 8px;">
        <div class="item-left" style="gap: 8px;">
          <span style="font-size: 20px;">${avatar}</span>
          <div class="item-details">
            <span style="font-weight: 700; color: var(--text-dark);">${log.user}</span>
            <span style="color: var(--text-dark); opacity: 0.9;">${log.text}</span>
          </div>
        </div>
        <div class="item-right" style="flex-direction: column; align-items: flex-end; gap: 2px;">
          <span style="font-size: 10px; font-weight: 700; color: var(--color-primary);">${dateString}</span>
          <span style="font-size: 10px; color: var(--text-muted);">${timeString}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------
// SCREEN RENDERS: BAJARER TALIKA (SHOPPING LIST)
// ----------------------------------------------------
function renderShoppingList() {
  const items = getShoppingItems();
  
  // Filter items
  let filteredItems = items;
  if (activeShoppingFilter === 'pending') {
    filteredItems = items.filter(item => !item.bought);
  } else if (activeShoppingFilter === 'bought') {
    filteredItems = items.filter(item => item.bought);
  }

  // Sort: newest first
  filteredItems.sort((a, b) => b.timestamp - a.timestamp);

  if (filteredItems.length === 0) {
    DOM.shoppingContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/></svg>
        <p>No shopping items found in this view.</p>
      </div>
    `;
    return;
  }

  DOM.shoppingContainer.innerHTML = filteredItems.map(item => {
    const checkedClass = item.bought ? 'bought' : '';
    const buyerInfo = item.bought ? `bought by ${item.boughtBy || 'someone'}` : `added by ${item.addedBy}`;
    const currentProfile = getCurrentProfile();
    const canDelete = isEditDeleteAllEnabled() || (item.addedBy === currentProfile);
    const deleteButtonHtml = canDelete ? `
      <button class="btn-icon-delete" data-id="${item.id}" aria-label="Delete shopping item">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    ` : '';
    
    return `
      <li class="list-item ${checkedClass}">
        <div class="item-left">
          <div class="item-checkbox" data-id="${item.id}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="item-details">
            <span class="item-name">${item.name}</span>
            <span class="item-meta">${buyerInfo}</span>
          </div>
        </div>
        <div class="item-right">
          <span class="item-qty">${item.qty}</span>
          ${deleteButtonHtml}
        </div>
      </li>
    `;
  }).join('');
}

async function handleAddShoppingItem(e) {
  e.preventDefault();
  
  const name = DOM.shopItemName.value;
  const qty = DOM.shopItemQty.value;

  if (!name.trim() || !qty.trim()) return;

  await addShoppingItem(name, qty);

  DOM.shopItemName.value = '';
  DOM.shopItemQty.value = '';
  DOM.shopItemName.blur();

  renderShoppingList();
  renderDashboard();
}

// ----------------------------------------------------
// SCREEN RENDERS: SANSARIK HISHAB (EXPENSES)
// ----------------------------------------------------
function renderExpenseTracker() {
  const expenses = getExpenses();

  // Sort expenses: newest date first
  expenses.sort((a, b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp);

  // 3. Render Expense History List
  if (expenses.length === 0) {
    DOM.expenseHistory.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <p>No items added yet.</p>
      </div>
    `;
    if (DOM.expenseTotalContainer) DOM.expenseTotalContainer.style.display = 'none';
    return;
  }

  DOM.expenseHistory.innerHTML = expenses.map(exp => {
    const parsedDate = new Date(exp.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const currentProfile = getCurrentProfile();
    const canDelete = isEditDeleteAllEnabled() || (exp.addedBy === currentProfile);
    const deleteButtonHtml = canDelete ? `
      <button class="btn-icon-delete" data-id="${exp.id}" aria-label="Delete expense">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    ` : '';
    
    return `
      <div class="list-item" style="border-left: 4px solid var(--color-primary); margin-bottom: 8px; padding: 12px 16px;">
        <div class="item-left" style="gap: 12px;">
          <div class="item-details">
            <span style="font-weight: 800; font-size: 15px; color: var(--text-dark);">${exp.notes || 'Expense'}</span>
            <span style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
              by ${exp.addedBy} • ${parsedDate}
            </span>
          </div>
        </div>
        <div class="item-right" style="gap: 12px;">
          <span style="font-family: var(--font-title); font-weight: 800; font-size: 16px; color: var(--text-dark);">
            ৳${exp.amount.toLocaleString('en-IN')}
          </span>
          ${deleteButtonHtml}
        </div>
      </div>
    `;
  }).join('');

  // Calculate and display total
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  if (DOM.expenseTotalContainer && DOM.expenseTotalValue) {
    DOM.expenseTotalContainer.style.display = 'flex';
    DOM.expenseTotalValue.textContent = `৳ ${total.toLocaleString('en-IN')}`;
  }
}

async function handleAddExpenseItem(e) {
  e.preventDefault();

  const amount = DOM.expenseAmount.value;
  const notes = DOM.expenseNotes.value;
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time

  if (!amount || !notes.trim()) return;

  await addExpense(today, 'General', amount, notes);

  DOM.expenseAmount.value = '';
  DOM.expenseNotes.value = '';
  DOM.expenseNotes.blur();

  renderExpenseTracker();
  renderDashboard();
}

// ----------------------------------------------------
// SCREEN RENDERS: DHAR-DENA (LOANS & DUES)
// ----------------------------------------------------
function renderDuesLedger() {
  const dues = getDues();

  // Filter based on active tab ('give' for Dena vs 'take' for Pawna)
  const filteredDues = dues.filter(due => due.type === activeDuesFilter);

  // Sort by date/timestamp descending
  filteredDues.sort((a, b) => b.timestamp - a.timestamp);

  // Calculate Totals for both sections
  const totalDena = dues
    .filter(due => due.type === 'give')
    .reduce((sum, due) => sum + due.amount, 0);

  const totalPawna = dues
    .filter(due => due.type === 'take')
    .reduce((sum, due) => sum + due.amount, 0);

  // Update Totals in UI
  const totalDenaEl = document.getElementById('due-total-dena');
  const totalPawnaEl = document.getElementById('due-total-pawna');
  if (totalDenaEl) totalDenaEl.textContent = `৳ ${totalDena.toLocaleString('en-IN')}`;
  if (totalPawnaEl) totalPawnaEl.textContent = `৳ ${totalPawna.toLocaleString('en-IN')}`;

  if (filteredDues.length === 0) {
    DOM.duesContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <p>No records found in this view.</p>
      </div>
    `;
    return;
  }

  DOM.duesContainer.innerHTML = filteredDues.map(due => {
    // Determine labels and styling
    const typeLabel = due.type === 'give' ? 'You owe them' : 'They owe you';
    const amountColorClass = due.type === 'give' ? 'take' : 'give'; // Coral vs Sage color
    const currentProfile = getCurrentProfile();
    const canDelete = isEditDeleteAllEnabled() || (due.addedBy === currentProfile);
    const deleteButtonHtml = canDelete ? `
      <button class="btn-icon-delete" data-id="${due.id}" aria-label="Delete entry" style="align-self: center;">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    ` : '';
    
    return `
      <div class="ledger-item ${due.type}">
        <div class="item-left">
          <div style="flex: 1; display: flex; flex-direction: column;">
            <span style="font-weight: 800; font-size: 15px; color: var(--text-dark);">${due.person}</span>
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-top: 2px;">
              ${typeLabel} • ${due.date}
            </span>
            <span style="font-size: 10px; color: var(--text-muted); margin-top: 1px;">by ${due.addedBy}</span>
          </div>
        </div>
        <div class="item-right" style="gap: 12px;">
          <span class="ledger-amount ${amountColorClass}">
            ৳${due.amount.toLocaleString('en-IN')}
          </span>
          ${deleteButtonHtml}
        </div>
      </div>
    `;
  }).join('');
}

// Global action handlers
window.handleDeleteShopping = async (id) => {
  const items = getShoppingItems();
  const item = items.find(i => i.id === id);
  if (item && !isEditDeleteAllEnabled() && item.addedBy !== getCurrentProfile()) return;
  await deleteShoppingItem(id);
  renderShoppingList();
  renderDashboard();
};

window.handleToggleShopping = async (id) => {
  await toggleShoppingItem(id);
  renderShoppingList();
  renderDashboard();
};

window.handleDeleteExpense = async (id) => {
  const expenses = getExpenses();
  const exp = expenses.find(e => e.id === id);
  if (exp && !isEditDeleteAllEnabled() && exp.addedBy !== getCurrentProfile()) return;
  await deleteExpense(id);
  renderExpenseTracker();
  renderDashboard();
};

window.handleDeleteDue = async (id) => {
  const dues = getDues();
  const due = dues.find(d => d.id === id);
  if (due && !isEditDeleteAllEnabled() && due.addedBy !== getCurrentProfile()) return;
  await deleteDue(id);
  renderDuesLedger();
  renderDashboard();
};

async function handleAddDueItem(e) {
  e.preventDefault();

  const person = DOM.duePerson.value;
  const amount = DOM.dueAmount.value;
  const type = DOM.dueType.value;
  const status = 'pending';

  if (!person.trim() || !amount || !type) return;

  await addDue(person, amount, type, status);

  DOM.duePerson.value = '';
  DOM.dueAmount.value = '';
  DOM.duePerson.blur();

  renderDuesLedger();
  renderDashboard();
}
