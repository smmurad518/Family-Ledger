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
  markAllShoppingItemsBought,
  deleteShoppingItem,
  updateShoppingItem,
  getExpenses,
  addExpense,
  deleteExpense,
  updateExpense,
  getDues,
  addDue,
  toggleDueStatus,
  deleteDue,
  updateDue,
  getSuggestions,
  addSuggestion,
  toggleSuggestionStatus,
  deleteSuggestion,
  updateSuggestion,
  reorderItemToPosition,
  getBabyNames,
  addBabyName,
  toggleLikeBabyName,
  deleteBabyName,
  updateBabyName,
  getMovies,
  addMovie,
  toggleWatchedMovie,
  deleteMovie,
  updateMovie
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

  recentActivitiesList: document.getElementById('recent-activities-list'),

  // Shopping List (Bajar)
  shoppingForm: document.getElementById('shopping-form'),
  shopItemName: document.getElementById('shop-item-name'),
  shopItemQty: document.getElementById('shop-item-qty'),
  shopItemAmount: document.getElementById('shop-item-amount'),
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
  dueDate: document.getElementById('due-date'),
  dueStatus: document.getElementById('due-status'),
  duesContainer: document.getElementById('dues-list-container'),
  duesFilterTabs: document.getElementById('dues-filter-tabs').querySelectorAll('.tab-btn'),
  
  // Settings Modal
  settingsModal: document.getElementById('settings-modal'),
  settingsClose: document.getElementById('settings-close'),
  settingsSave: document.getElementById('btn-save-settings'),
  firebaseEnable: document.getElementById('firebase-enable'),
  firebaseSection: document.getElementById('firebase-config-section'),
  firebaseConfigToggle: document.getElementById('firebase-config-toggle'),
  firebaseToggleIcon: document.getElementById('firebase-toggle-icon'),
  fbApiKey: document.getElementById('fb-api-key'),
  fbProjectId: document.getElementById('fb-project-id'),
  fbAuthDomain: document.getElementById('fb-auth-domain'),
  fbAppId: document.getElementById('fb-app-id'),
  editDeleteAllEnable: document.getElementById('edit-delete-all-enable'),
  
  // Edit Modal Selectors
  editModal: document.getElementById('edit-modal'),
  editModalClose: document.getElementById('edit-modal-close'),
  editModalTitle: document.getElementById('edit-modal-title'),
  editLabel1: document.getElementById('edit-label-1'),
  editLabel2: document.getElementById('edit-label-2'),
  editLabel3: document.getElementById('edit-label-3'),
  editLabelSerial: document.getElementById('edit-label-serial'),
  editInput1: document.getElementById('edit-input-1'),
  editInput2: document.getElementById('edit-input-2'),
  editInput3: document.getElementById('edit-input-3'),
  editInputSerial: document.getElementById('edit-input-serial'),
  editInputGroup3: document.getElementById('edit-group-3'),
  editInputGroupSerial: document.getElementById('edit-group-serial'),
  editSaveBtn: document.getElementById('btn-save-edit'),

  // Drawer Selectors
  drawerOverlay: document.getElementById('drawer-overlay'),
  drawer: document.getElementById('app-drawer'),
  drawerClose: document.getElementById('drawer-close'),
  drawerToggleBtn: document.getElementById('drawer-toggle-btn'),
  drawerItems: document.querySelectorAll('.drawer-item'),
  drawerSettingsBtn: document.getElementById('drawer-settings-btn'),

  // Suggestions Selectors
  suggestionsContainer: document.getElementById('suggestions-list-container'),
  suggestionForm: document.getElementById('suggestion-form'),
  suggestionInput: document.getElementById('suggestion-input'),

  // Baby Selectors
  babyForm: document.getElementById('baby-name-form'),
  babyNameInput: document.getElementById('baby-name-input'),
  babyGenderSelect: document.getElementById('baby-gender-select'),
  boyNamesList: document.getElementById('boy-names-list'),
  girlNamesList: document.getElementById('girl-names-list'),
  babyScreen: document.getElementById('screen-baby-names'),
  curvedNav: document.querySelector('.curved-nav'),
  
  // Movie Selectors
  movieForm: document.getElementById('movie-form'),
  movieNameInput: document.getElementById('movie-name-input'),
  movieTypeSelect: document.getElementById('movie-type-select'),
  moviesContainer: document.getElementById('movies-list-container'),
  seriesContainer: document.getElementById('series-list-container'),

  // Profile Chooser Modal
  profileModal: document.getElementById('profile-modal'),
  profileModalClose: document.getElementById('profile-modal-close'),
  profileCards: document.querySelectorAll('.profile-select-card')
};

// UI Active State Filters
let activeShoppingFilter = 'all';
let activeDuesFilter = 'give';
let activeExpenseMonth = ''; // Format: YYYY-MM

// Cache for detecting remote new entries
let lastShoppingList = [];
let lastExpensesList = [];
let lastDuesList = [];
let lastSuggestionsList = [];
let lastBabyNamesList = [];
let lastMoviesList = [];
let isFirstLoad = true;

// Active Edit Context
let currentEditType = ''; // 'shopping', 'expense', 'due', 'suggestion'
let currentEditId = '';

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
// Reset window scroll position on mobile layout adjustments
function resetViewportScroll() {
  window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', () => {

  // Initialize DB state
  initializeDB(handleDataUpdate, handleSyncStateChange);

  // Initialize Theme
  initializeTheme();

  // Set up event listeners
  setupEventListeners();

  // Initialize Collapsible Form Cards
  setupCollapsibleCards();

  // Initial UI state setup
  updateProfileUI();
  updateOfflineBanner();
  switchScreen('dashboard');

  // Request browser notification permissions
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Cache initial datasets
  lastShoppingList = getShoppingItems();
  lastExpensesList = getExpenses();
  lastDuesList = getDues();
  lastSuggestionsList = getSuggestions();

  // Set isFirstLoad to false after 4 seconds to ignore initial data sync events
  setTimeout(() => {
    isFirstLoad = false;
  }, 4000);

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

  // Reset scroll on mobile keyboards blur
  document.querySelectorAll('input[type="text"], input[type="password"], input[type="number"], input[type="tel"]').forEach(input => {
    input.addEventListener('blur', resetViewportScroll);
  });
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
  const profile = getCurrentProfile();
  if (profile === 'Baby') {
    screenName = 'baby-names';
    if (DOM.curvedNav) DOM.curvedNav.style.display = 'none';
  } else {
    if (DOM.curvedNav) DOM.curvedNav.style.display = 'block';
  }

  // Update nav buttons
  DOM.navItems.forEach(item => {
    if (item.dataset.screen === screenName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update curved nav cutout position and active icon
  const cutoutContainer = document.getElementById('nav-cutout-container');
  const activeNavItem = Array.from(DOM.navItems).find(item => item.dataset.screen === screenName);
  if (activeNavItem && profile !== 'Baby') {
    if (cutoutContainer) {
      cutoutContainer.style.opacity = '1';
      cutoutContainer.style.pointerEvents = 'auto';
      const index = parseInt(activeNavItem.dataset.index);
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
  } else {
    // Hide active cutout circle on bottom nav for sidebar-only pages or Baby screen
    if (cutoutContainer) {
      cutoutContainer.style.opacity = '0';
      cutoutContainer.style.pointerEvents = 'none';
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
  const activeScreenEl = document.querySelector('.screen.active');
  if (!activeScreenEl) return;
  const activeScreen = activeScreenEl.id;
  if (activeScreen === 'screen-dashboard') {
    renderDashboard();
  } else if (activeScreen === 'screen-bajar') {
    renderShoppingList();
  } else if (activeScreen === 'screen-hishab') {
    renderExpenseTracker();
  } else if (activeScreen === 'screen-dues') {
    renderDuesLedger();
  } else if (activeScreen === 'screen-suggestions') {
    renderSuggestionsList();
  } else if (activeScreen === 'screen-baby-names') {
    renderBabyNamesList();
  } else if (activeScreen === 'screen-movies') {
    renderMoviesList();
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

  // Profile Toggling and Settings Close Buttons
  DOM.profileBtn.addEventListener('click', toggleActiveProfile);
  DOM.settingsClose.addEventListener('click', closeSettingsModal);
  DOM.editModalClose.addEventListener('click', closeEditModal);

  // Theme Toggle Button
  if (DOM.themeToggleBtn) {
    DOM.themeToggleBtn.addEventListener('click', toggleTheme);
  }



  // Firebase sync toggler in Settings
  DOM.firebaseEnable.addEventListener('change', (e) => {
    if (e.target.checked) {
      DOM.firebaseConfigToggle.style.display = 'block';
    } else {
      DOM.firebaseConfigToggle.style.display = 'none';
      DOM.firebaseSection.style.display = 'none';
      DOM.firebaseToggleIcon.style.transform = 'rotate(0deg)';
    }
    resetViewportScroll();
  });

  // Firebase config dropdown toggle button
  if (DOM.firebaseConfigToggle) {
    DOM.firebaseConfigToggle.addEventListener('click', () => {
      const isExpanded = DOM.firebaseSection.style.display === 'block';
      if (isExpanded) {
        DOM.firebaseSection.style.display = 'none';
        DOM.firebaseToggleIcon.style.transform = 'rotate(0deg)';
      } else {
        DOM.firebaseSection.style.display = 'block';
        DOM.firebaseToggleIcon.style.transform = 'rotate(180deg)';
      }
      resetViewportScroll();
    });
  }

  // Save Settings Modal Actions
  DOM.settingsSave.addEventListener('click', handleSettingsSave);
  DOM.editSaveBtn.addEventListener('click', handleEditSave);



  // Forms submissions
  DOM.shoppingForm.addEventListener('submit', handleAddShoppingItem);
  DOM.expenseForm.addEventListener('submit', handleAddExpenseItem);
  DOM.dueForm.addEventListener('submit', handleAddDueItem);

  const btnSelectAllShopping = document.getElementById('btn-select-all-shopping');
  if (btnSelectAllShopping) {
    btnSelectAllShopping.addEventListener('click', handleSelectAllShopping);
  }

  const btnClearDueDate = document.getElementById('btn-clear-due-date');
  if (btnClearDueDate) {
    btnClearDueDate.addEventListener('click', () => {
      if (DOM.dueDate) DOM.dueDate.value = '';
    });
  }
  const btnClearEditDate = document.getElementById('btn-clear-edit-date');
  if (btnClearEditDate) {
    btnClearEditDate.addEventListener('click', () => {
      const editInput3 = document.getElementById('edit-input-3');
      if (editInput3) editInput3.value = '';
    });
  }

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

  // Shopping List Container Event Delegation (Toggle, Edit & Delete)
  if (DOM.shoppingContainer) {
    DOM.shoppingContainer.addEventListener('click', async (e) => {
      // Edit Button
      const editBtn = e.target.closest('.btn-icon-edit');
      if (editBtn && editBtn.dataset.id) {
        e.stopPropagation();
        
        if (!isEditDeleteAllEnabled()) {
          alert("Editing is disabled! Enable Edit & Delete in Settings.");
          return;
        }

        const items = getShoppingItems();
        const item = items.find(i => i.id === editBtn.dataset.id);
        if (item) {
          openEditModal('shopping', item.id, 'Edit Shopping Item', 'Item Name', item.name, 'Quantity', item.qty, 'Amount (৳)', item.amount || '');
        }
        return;
      }

      // Delete Button
      const deleteBtn = e.target.closest('.btn-icon-delete');
      if (deleteBtn && deleteBtn.dataset.id) {
        e.stopPropagation();
        
        if (!isEditDeleteAllEnabled()) {
          alert("Deletion is disabled! Enable Edit & Delete in Settings.");
          return;
        }

        const itemRow = deleteBtn.closest('.list-item');
        if (itemRow) {
          itemRow.classList.add('deleting');
          await new Promise(r => setTimeout(r, 400));
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

  // Expense History Container Event Delegation (Edit & Delete)
  if (DOM.expenseHistory) {
    DOM.expenseHistory.addEventListener('click', async (e) => {
      // Edit Button
      const editBtn = e.target.closest('.btn-icon-edit');
      if (editBtn && editBtn.dataset.id) {
        e.stopPropagation();

        if (!isEditDeleteAllEnabled()) {
          alert("Editing is disabled! Enable Edit & Delete in Settings.");
          return;
        }

        const expenses = getExpenses();
        const exp = expenses.find(expItem => expItem.id === editBtn.dataset.id);
        if (exp) {
          openEditModal('expense', exp.id, 'Edit Expense', 'Expense Description', exp.notes, 'Amount (৳)', exp.amount);
        }
        return;
      }

      // Delete Button
      const deleteBtn = e.target.closest('.btn-icon-delete');
      if (deleteBtn && deleteBtn.dataset.id) {
        e.stopPropagation();

        if (!isEditDeleteAllEnabled()) {
          alert("Deletion is disabled! Enable Edit & Delete in Settings.");
          return;
        }

        const itemRow = deleteBtn.closest('.list-item');
        if (itemRow) {
          itemRow.classList.add('deleting');
          await new Promise(r => setTimeout(r, 400));
        }

        await deleteExpense(deleteBtn.dataset.id);
        renderExpenseTracker();
        renderDashboard();
      }
    });
  }

  // Dues Container Event Delegation (Edit & Delete)
  if (DOM.duesContainer) {
    DOM.duesContainer.addEventListener('click', async (e) => {
      // Edit Button
      const editBtn = e.target.closest('.btn-icon-edit');
      if (editBtn && editBtn.dataset.id) {
        e.stopPropagation();

        if (!isEditDeleteAllEnabled()) {
          alert("Editing is disabled! Enable Edit & Delete in Settings.");
          return;
        }

        const dues = getDues();
        const due = dues.find(d => d.id === editBtn.dataset.id);
        if (due) {
          openEditModal('due', due.id, 'Edit Due Entry', 'Person Name', due.person, 'Amount (৳)', due.amount, 'Date', due.date);
        }
        return;
      }

      // Delete Button
      const deleteBtn = e.target.closest('.btn-icon-delete');
      if (deleteBtn && deleteBtn.dataset.id) {
        e.stopPropagation();

        if (!isEditDeleteAllEnabled()) {
          alert("Deletion is disabled! Enable Edit & Delete in Settings.");
          return;
        }

        const itemRow = deleteBtn.closest('.ledger-item');
        if (itemRow) {
          itemRow.classList.add('deleting');
          await new Promise(r => setTimeout(r, 400));
        }

        await deleteDue(deleteBtn.dataset.id);
        renderDuesLedger();
        renderDashboard();
      }
    });
  }

  // Suggestions Form Submit
  if (DOM.suggestionForm) {
    DOM.suggestionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = DOM.suggestionInput.value.trim();
      if (!text) return;

      await addSuggestion(text);
      DOM.suggestionInput.value = '';
      DOM.suggestionInput.blur();
      renderSuggestionsList();
    });
  }

  // Suggestions Container Event Delegation (Toggle, Edit, Delete)
  if (DOM.suggestionsContainer) {
    DOM.suggestionsContainer.addEventListener('click', async (e) => {
      // Toggle suggestion checkbox
      const checkbox = e.target.closest('.item-checkbox');
      if (checkbox && checkbox.dataset.id) {
        e.stopPropagation();
        await toggleSuggestionStatus(checkbox.dataset.id);
        renderSuggestionsList();
        return;
      }

      // Edit Button
      const editBtn = e.target.closest('.btn-icon-edit');
      if (editBtn && editBtn.dataset.id) {
        e.stopPropagation();
        
        if (!isEditDeleteAllEnabled()) {
          alert("Editing is disabled! Enable Edit & Delete in Settings.");
          return;
        }

        const list = getSuggestions();
        const item = list.find(i => i.id === editBtn.dataset.id);
        if (item) {
          openEditModal('suggestion', item.id, 'Edit Suggestion Idea', 'Suggestion Text', item.text, '', '');
        }
        return;
      }

      // Delete Button
      const deleteBtn = e.target.closest('.btn-icon-delete');
      if (deleteBtn && deleteBtn.dataset.id) {
        e.stopPropagation();

        if (!isEditDeleteAllEnabled()) {
          alert("Deletion is disabled! Enable Edit & Delete in Settings.");
          return;
        }

        const itemRow = deleteBtn.closest('.list-item');
        if (itemRow) {
          itemRow.classList.add('deleting');
          await new Promise(r => setTimeout(r, 400));
        }

        await deleteSuggestion(deleteBtn.dataset.id);
        renderSuggestionsList();
      }
    });
  }

  // Baby Names Form Submit
  if (DOM.babyForm) {
    DOM.babyForm.addEventListener('submit', handleAddBabyNameItem);
  }

  // Baby Names Columns Click Delegations
  if (DOM.boyNamesList) {
    DOM.boyNamesList.addEventListener('click', handleBabyListClick);
  }
  if (DOM.girlNamesList) {
    DOM.girlNamesList.addEventListener('click', handleBabyListClick);
  }

  // Movie Form Submit
  if (DOM.movieForm) {
    DOM.movieForm.addEventListener('submit', handleAddMovieItem);
  }

  // Movies Containers Click Delegations
  if (DOM.moviesContainer) {
    DOM.moviesContainer.addEventListener('click', handleMovieListClick);
  }
  if (DOM.seriesContainer) {
    DOM.seriesContainer.addEventListener('click', handleMovieListClick);
  }

  // Profile Modal Chooser Listeners
  if (DOM.profileModalClose) {
    DOM.profileModalClose.addEventListener('click', closeProfileModal);
  }
  DOM.profileCards.forEach(card => {
    card.addEventListener('click', handleProfileSelect);
  });
  // Initialize default due date to today
  if (DOM.dueDate) {
    DOM.dueDate.value = new Date().toISOString().split('T')[0];
  }
}

// ----------------------------------------------------
// SETTINGS & PROFILE MANAGEMENT
// ----------------------------------------------------
function updateProfileUI() {
  const profile = getCurrentProfile();
  DOM.profileName.textContent = profile;
  DOM.profileAvatar.textContent = profile === 'Husband' ? '🧔' : (profile === 'Wife' ? '👩' : '👶');
  DOM.welcomeUser.textContent = profile;
  
  // Set data-profile attribute on documentElement
  document.documentElement.setAttribute('data-profile', profile.toLowerCase());
}

function toggleActiveProfile() {
  openProfileModal();
}

function openProfileModal() {
  resetViewportScroll();
  const currentProfile = getCurrentProfile();

  DOM.profileCards.forEach(card => {
    if (card.dataset.profile === currentProfile) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  DOM.profileModal.classList.add('active');
}

function closeProfileModal() {
  DOM.profileModal.classList.remove('active');
  resetViewportScroll();
}

async function handleProfileSelect(e) {
  const card = e.target.closest('.profile-select-card');
  if (!card) return;

  const currentProfile = getCurrentProfile();
  const newProfile = card.dataset.profile;

  if (currentProfile === newProfile) {
    closeProfileModal();
    return;
  }

  playProfileSwitchSound();

  setCurrentProfile(newProfile);
  updateProfileUI();
  closeProfileModal();

  // Refresh layout and reload after a short delay so the visual switch is registered
  setTimeout(() => {
    window.location.reload(true);
  }, 350);
}

function getListForType(type, itemId) {
  if (type === 'shopping') {
    const items = getShoppingItems();
    let filtered = items;
    if (activeShoppingFilter === 'pending') {
      filtered = items.filter(item => !item.bought);
    } else if (activeShoppingFilter === 'bought') {
      filtered = items.filter(item => item.bought);
    }
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    return filtered;
  }
  if (type === 'expense') {
    const items = getExpenses();
    items.sort((a, b) => b.date.localeCompare(a.date) || b.timestamp - a.timestamp);
    return items;
  }
  if (type === 'due') {
    const items = getDues().filter(due => due.type === activeDuesFilter);
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  }
  if (type === 'suggestion') {
    const items = getSuggestions();
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  }
  if (type === 'baby_name') {
    const items = getBabyNames();
    const item = items.find(i => i.id === itemId);
    if (!item) return [];
    const filtered = items.filter(n => n.gender === item.gender);
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    return filtered;
  }
  if (type === 'movie') {
    const items = getMovies();
    const item = items.find(i => i.id === itemId);
    if (!item) return [];
    const filtered = items.filter(m => m.type === item.type);
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    return filtered;
  }
  return [];
}

function openEditModal(type, id, title, label1, val1, label2, val2, label3 = '', val3 = '') {
  currentEditType = type;
  currentEditId = id;
  
  DOM.editModalTitle.textContent = title;
  DOM.editLabel1.textContent = label1;
  DOM.editInput1.value = val1;

  const formGroup2 = DOM.editInput2.closest('.form-group');
  if (type === 'suggestion' || type === 'baby_name') {
    if (formGroup2) formGroup2.style.display = 'none';
  } else {
    if (formGroup2) formGroup2.style.display = 'block';
    DOM.editLabel2.textContent = label2;
    DOM.editInput2.value = val2;
  }

  const btnClearEditDate = document.getElementById('btn-clear-edit-date');
  if (type === 'shopping' || type === 'due') {
    DOM.editLabel3.textContent = label3;
    DOM.editInput3.value = val3;
    if (type === 'due') {
      DOM.editInput3.type = 'date';
      DOM.editInput3.setAttribute('lang', 'en-GB');
      if (btnClearEditDate) btnClearEditDate.style.display = 'inline-block';
    } else {
      DOM.editInput3.type = 'text';
      if (btnClearEditDate) btnClearEditDate.style.display = 'none';
    }
    if (DOM.editInputGroup3) DOM.editInputGroup3.style.display = 'block';
  } else {
    if (DOM.editInputGroup3) DOM.editInputGroup3.style.display = 'none';
    if (btnClearEditDate) btnClearEditDate.style.display = 'none';
  }

  // Pre-fill serial number information
  const list = getListForType(type, id);
  const idx = list.findIndex(item => item.id === id);
  const currentSerial = idx !== -1 ? idx + 1 : 1;
  const totalCount = list.length;

  if (DOM.editLabelSerial && DOM.editInputSerial && DOM.editInputGroupSerial) {
    if (totalCount > 1) {
      DOM.editLabelSerial.textContent = `Serial No (1 to ${totalCount})`;
      DOM.editInputSerial.value = currentSerial;
      DOM.editInputSerial.min = 1;
      DOM.editInputSerial.max = totalCount;
      DOM.editInputGroupSerial.style.display = 'block';
    } else {
      DOM.editInputGroupSerial.style.display = 'none';
    }
  }

  DOM.editModal.classList.add('active');
}

function closeEditModal() {
  DOM.editModal.classList.remove('active');
  currentEditType = '';
  currentEditId = '';
  const formGroup2 = DOM.editInput2.closest('.form-group');
  if (formGroup2) formGroup2.style.display = 'block';
  if (DOM.editInput3) {
    DOM.editInput3.type = 'text';
    DOM.editInput3.removeAttribute('lang');
  }
  if (DOM.editInputGroup3) DOM.editInputGroup3.style.display = 'none';
  if (DOM.editInputGroupSerial) DOM.editInputGroupSerial.style.display = 'none';
  const btnClearEditDate = document.getElementById('btn-clear-edit-date');
  if (btnClearEditDate) btnClearEditDate.style.display = 'none';
  resetViewportScroll();
}

async function handleEditSave() {
  const val1 = DOM.editInput1.value.trim();
  const val2 = DOM.editInput2.value.trim();
  const val3 = DOM.editInput3 ? DOM.editInput3.value.trim() : '';
  const newSerialVal = DOM.editInputSerial ? DOM.editInputSerial.value.trim() : '';

  const isOneFieldOnly = currentEditType === 'suggestion' || currentEditType === 'baby_name';

  if (!isOneFieldOnly && currentEditType !== 'shopping' && (!val1 || !val2)) {
    alert("Please fill in all fields!");
    return;
  }
  if (currentEditType === 'shopping' && (!val1 || !val2)) {
    alert("Please enter name and quantity!");
    return;
  }
  if (isOneFieldOnly && !val1) {
    alert("Please enter a value!");
    return;
  }

  DOM.editSaveBtn.disabled = true;
  DOM.editSaveBtn.textContent = 'Updating...';

  // Determine active keys for serial reordering
  const keyMap = {
    'shopping': 'mm_shopping_list',
    'expense': 'mm_expenses',
    'due': 'mm_dues',
    'suggestion': 'mm_suggestions',
    'baby_name': 'mm_baby_names',
    'movie': 'mm_movies'
  };

  // Perform updates
  if (currentEditType === 'shopping') {
    await updateShoppingItem(currentEditId, val1, val2, val3);
  } else if (currentEditType === 'expense') {
    if (isNaN(val2) || parseFloat(val2) <= 0) {
      alert("Please enter a valid amount!");
      DOM.editSaveBtn.disabled = false;
      DOM.editSaveBtn.textContent = 'Update Entry';
      return;
    }
    await updateExpense(currentEditId, val2, val1);
  } else if (currentEditType === 'due') {
    if (isNaN(val2) || parseFloat(val2) <= 0) {
      alert("Please enter a valid amount!");
      DOM.editSaveBtn.disabled = false;
      DOM.editSaveBtn.textContent = 'Update Entry';
      return;
    }
    await updateDue(currentEditId, val1, val2, val3);
  } else if (currentEditType === 'suggestion') {
    await updateSuggestion(currentEditId, val1);
  } else if (currentEditType === 'baby_name') {
    await updateBabyName(currentEditId, val1);
  } else if (currentEditType === 'movie') {
    await updateMovie(currentEditId, val1);
  }

  // Handle Serial reordering if requested and valid
  const dbKey = keyMap[currentEditType];
  if (dbKey && newSerialVal) {
    const list = getListForType(currentEditType, currentEditId);
    const oldIdx = list.findIndex(item => item.id === currentEditId);
    const oldSerial = oldIdx !== -1 ? oldIdx + 1 : -1;
    const newSerial = parseInt(newSerialVal);

    if (newSerial > 0 && newSerial <= list.length && newSerial !== oldSerial) {
      await reorderItemToPosition(dbKey, currentEditId, newSerial, activeShoppingFilter, activeDuesFilter);
    }
  }

  // Trigger renders
  if (currentEditType === 'shopping') renderShoppingList();
  if (currentEditType === 'expense') renderExpenseTracker();
  if (currentEditType === 'due') renderDuesLedger();
  if (currentEditType === 'suggestion') renderSuggestionsList();
  if (currentEditType === 'baby_name') renderBabyNamesList();
  if (currentEditType === 'movie') renderMoviesList();

  DOM.editSaveBtn.disabled = false;
  DOM.editSaveBtn.textContent = 'Update Entry';
  closeEditModal();
  renderDashboard();
}

function openSettingsModal() {
  resetViewportScroll();
  const currentProfile = getCurrentProfile();

  // Pre-fill Edit & Delete all config
  if (DOM.editDeleteAllEnable) {
    DOM.editDeleteAllEnable.checked = isEditDeleteAllEnabled();
  }

  // Pre-fill firebase configs
  const isFb = isFirebaseConfigured();
  DOM.firebaseEnable.checked = isFb;
  DOM.firebaseConfigToggle.style.display = isFb ? 'block' : 'none';
  DOM.firebaseSection.style.display = 'none'; // Keep collapsed by default
  DOM.firebaseToggleIcon.style.transform = 'rotate(0deg)';

  const fbConfig = getFirebaseConfig();
  DOM.fbApiKey.value = fbConfig.apiKey || '';
  DOM.fbProjectId.value = fbConfig.projectId || '';
  DOM.fbAuthDomain.value = fbConfig.authDomain || '';
  DOM.fbAppId.value = fbConfig.appId || '';

  DOM.settingsModal.classList.add('active');
}

function closeSettingsModal() {
  DOM.settingsModal.classList.remove('active');
  resetViewportScroll();
}

async function handleSettingsSave() {
  // Collapse keyboard on mobile immediately by blurring active inputs
  if (document.activeElement && typeof document.activeElement.blur === 'function') {
    document.activeElement.blur();
  }
  
  // Wait 350ms for viewport layout and keyboard slide down to settle
  await new Promise(resolve => setTimeout(resolve, 350));

  DOM.settingsSave.disabled = true;
  DOM.settingsSave.textContent = 'Saving...';

  const firebaseEnabled = DOM.firebaseEnable.checked;
  const editDeleteAll = DOM.editDeleteAllEnable ? DOM.editDeleteAllEnable.checked : false;

  const config = {
    apiKey: DOM.fbApiKey.value.trim(),
    projectId: DOM.fbProjectId.value.trim(),
    authDomain: DOM.fbAuthDomain.value.trim(),
    appId: DOM.fbAppId.value.trim()
  };

  const success = await saveSettings(firebaseEnabled, config, editDeleteAll, 'yes', handleSyncStateChange);
  
  DOM.settingsSave.disabled = false;
  DOM.settingsSave.textContent = 'Save Settings';
  
  if (success) {
    updateProfileUI();
    closeSettingsModal();
    
    // Automatically reload page after 1200ms to allow layout transitions to fully settle
    setTimeout(() => {
      window.location.reload(true);
    }, 1200);

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
function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const time = ctx.currentTime;
    
    // Tone 1: Fundamental frequency
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, time); // G5
    gain1.gain.setValueAtTime(0.12, time);
    gain1.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    // Tone 2: Overtone for pleasant ring
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, time); // D6
    gain2.gain.setValueAtTime(0.06, time);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(time);
    osc1.stop(time + 0.4);
    osc2.start(time);
    osc2.stop(time + 0.35);
  } catch (e) {
    console.error("Audio playback error:", e);
  }
}

function showInAppToast(title, message) {
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    Object.assign(toastContainer.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '9999',
      width: '90%',
      maxWidth: '380px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    });
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'custom-toast';
  Object.assign(toast.style, {
    background: 'rgba(21, 22, 26, 0.95)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(10px)',
    webkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    pointerEvents: 'auto',
    transform: 'translateY(-30px)',
    opacity: '0',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
  });

  toast.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
      <span style="font-family: var(--font-title); font-weight: 800; font-size: 14px; color: var(--color-primary);">${title}</span>
      <button style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; font-size: 14px; line-height: 1;" onclick="this.closest('.custom-toast').remove()">×</button>
    </div>
    <span style="font-size: 12px; color: var(--text-dark); line-height: 1.4;">${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 10);

  setTimeout(() => {
    toast.style.transform = 'translateY(-20px)';
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 5000);
}

function triggerNotification(title, message) {
  // 1. Play sound
  playNotificationSound();

  // 2. Web Push Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: message,
        icon: './assets/icons/icon-192.png'
      });
    } catch (e) {
      console.error("System notification failed:", e);
    }
  }

  // 3. In-app Toast Notification
  showInAppToast(title, message);
}

function handleDataUpdate(type, sourceCollection) {
  // Re-render only necessary parts based on collection updates or do complete redraws
  renderDashboard();
  if (!sourceCollection || sourceCollection === 'shopping_list') renderShoppingList();
  if (!sourceCollection || sourceCollection === 'expenses') renderExpenseTracker();
  if (!sourceCollection || sourceCollection === 'dues') renderDuesLedger();
  if (!sourceCollection || sourceCollection === 'suggestions') renderSuggestionsList();
  if (!sourceCollection || sourceCollection === 'baby_names') renderBabyNamesList();
  if (!sourceCollection || sourceCollection === 'movies') renderMoviesList();

  // If this is the initial load, just update cache and return
  if (isFirstLoad) {
    lastShoppingList = getShoppingItems();
    lastExpensesList = getExpenses();
    lastDuesList = getDues();
    lastSuggestionsList = getSuggestions();
    lastBabyNamesList = getBabyNames();
    lastMoviesList = getMovies();
    return;
  }

  // Detect new items
  const currentProfile = getCurrentProfile();
  let newEntriesFound = [];

  // 1. Check Shopping List
  const newShoppingList = getShoppingItems();
  newShoppingList.forEach(newItem => {
    if (newItem.addedBy !== currentProfile && !lastShoppingList.some(oldItem => oldItem.id === newItem.id)) {
      newEntriesFound.push({
        type: 'Bajar Item',
        title: 'New Shopping Item 🛒',
        message: `${newItem.addedBy} added a new shopping item: "${newItem.name}" (${newItem.qty}).`
      });
    }
  });
  lastShoppingList = newShoppingList;

  // 2. Check Expenses
  const newExpensesList = getExpenses();
  newExpensesList.forEach(newItem => {
    if (newItem.addedBy !== currentProfile && !lastExpensesList.some(oldItem => oldItem.id === newItem.id)) {
      newEntriesFound.push({
        type: 'Expense',
        title: 'New Expense Recorded ৳',
        message: `${newItem.addedBy} recorded a new expense: "${newItem.notes}" (৳${newItem.amount.toLocaleString('en-IN')}).`
      });
    }
  });
  lastExpensesList = newExpensesList;

  // 3. Check Dues
  const newDuesList = getDues();
  newDuesList.forEach(newItem => {
    if (newItem.addedBy !== currentProfile && !lastDuesList.some(oldItem => oldItem.id === newItem.id)) {
      const typeLabel = newItem.type === 'give' ? 'Payable' : 'Receivable';
      newEntriesFound.push({
        type: 'Due Entry',
        title: 'New Dues Transaction 🤝',
        message: `${newItem.addedBy} recorded a new transaction: "${newItem.person}" (৳${newItem.amount.toLocaleString('en-IN')}, ${typeLabel}).`
      });
    }
  });
  lastDuesList = newDuesList;

  // 4. Check Suggestions
  const newSuggestionsList = getSuggestions();
  newSuggestionsList.forEach(newItem => {
    if (newItem.addedBy !== currentProfile && !lastSuggestionsList.some(oldItem => oldItem.id === newItem.id)) {
      newEntriesFound.push({
        type: 'Suggestion',
        title: 'New Suggestion Idea 💡',
        message: `${newItem.addedBy} added a new suggestion: "${newItem.text}".`
      });
    }
  });
  lastSuggestionsList = newSuggestionsList;

  // 5. Check Baby Names
  const newBabyNamesList = getBabyNames();
  newBabyNamesList.forEach(newItem => {
    if (newItem.addedBy !== currentProfile && !lastBabyNamesList.some(oldItem => oldItem.id === newItem.id)) {
      newEntriesFound.push({
        type: 'Baby Name',
        title: 'New Baby Name Suggestion 👶',
        message: `${newItem.addedBy} suggested a new baby name: "${newItem.name}" (${newItem.gender === 'boy' ? 'Boy' : 'Girl'}).`
      });
    }
  });
  lastBabyNamesList = newBabyNamesList;

  // 6. Check Movies/Series
  const newMoviesList = getMovies();
  newMoviesList.forEach(newItem => {
    const isFather = newItem.addedBy === 'Father';
    const isByOther = (currentProfile === 'Husband' && !isFather) || (currentProfile === 'Wife' && isFather);
    if (isByOther && !lastMoviesList.some(oldItem => oldItem.id === newItem.id)) {
      const typeLabel = newItem.type === 'movie' ? 'movie' : 'series';
      newEntriesFound.push({
        type: 'Movie/Series',
        title: `New ${newItem.type === 'movie' ? 'Movie 🎥' : 'Series 📺'} Added`,
        message: `${newItem.addedBy} added a new ${typeLabel}: "${newItem.name}".`
      });
    }
  });
  lastMoviesList = newMoviesList;

  // Trigger notification and play sound if new entries added by the other spouse are found
  if (newEntriesFound.length > 0) {
    newEntriesFound.forEach(entry => {
      triggerNotification(entry.title, entry.message);
    });
  }
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
    const avatar = log.user === 'Husband' ? '🧔' : (log.user === 'Wife' ? '👩' : '👶');
    
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

  const selectAllBtn = document.getElementById('btn-select-all-shopping');
  if (selectAllBtn) {
    const hasPending = items.some(item => !item.bought);
    if (hasPending && (activeShoppingFilter === 'all' || activeShoppingFilter === 'pending')) {
      selectAllBtn.style.display = 'inline-block';
    } else {
      selectAllBtn.style.display = 'none';
    }
  }
  
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
    const canAction = isEditDeleteAllEnabled();
    const actionButtonsHtml = canAction ? `
      <button class="btn-icon-edit" data-id="${item.id}" aria-label="Edit shopping item">
        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="btn-icon-delete" data-id="${item.id}" aria-label="Delete shopping item">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    ` : '';
    
    const amountHtml = item.amount && item.amount > 0 ? `
      <span class="item-amount" style="font-family: var(--font-title); font-weight: 800; font-size: 13px; color: var(--color-primary-interactive); margin-right: 4px;">
        ৳${item.amount.toLocaleString('en-IN')}
      </span>
    ` : '';

    return `
      <li class="list-item ${checkedClass}" data-id="${item.id}">
        <div class="item-left">
          <div class="item-checkbox" data-id="${item.id}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="item-details">
            <span class="item-name">${item.name}</span>
            <span class="item-meta">${buyerInfo}</span>
          </div>
        </div>
        <div class="item-right" style="display: flex; align-items: center; gap: 8px;">
          ${amountHtml}
          <span class="item-qty">${item.qty}</span>
          ${actionButtonsHtml}
        </div>
      </li>
    `;
  }).join('');
}

async function handleAddShoppingItem(e) {
  e.preventDefault();
  
  const name = DOM.shopItemName.value;
  const qty = DOM.shopItemQty.value;
  const amount = DOM.shopItemAmount.value;

  if (!name.trim() || !qty.trim()) return;

  await addShoppingItem(name, qty, amount);

  DOM.shopItemName.value = '';
  DOM.shopItemQty.value = '';
  DOM.shopItemAmount.value = '';
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
    const canAction = isEditDeleteAllEnabled();
    const actionButtonsHtml = canAction ? `
      <button class="btn-icon-edit" data-id="${exp.id}" aria-label="Edit expense">
        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="btn-icon-delete" data-id="${exp.id}" aria-label="Delete expense">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    ` : '';
    
    return `
      <div class="list-item" data-id="${exp.id}" style="border-left: 4px solid var(--color-primary); margin-bottom: 8px; padding: 12px 16px;">
        <div class="item-left" style="gap: 12px;">
          <div class="item-details">
            <span style="font-weight: 800; font-size: 15px; color: var(--text-dark);">${exp.notes || 'Expense'}</span>
            <span style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">
              by ${exp.addedBy} • ${parsedDate}
            </span>
          </div>
        </div>
        <div class="item-right" style="gap: 8px; display: flex; align-items: center;">
          <span style="font-family: var(--font-title); font-weight: 800; font-size: 16px; color: var(--text-dark);">
            ৳${exp.amount.toLocaleString('en-IN')}
          </span>
          ${actionButtonsHtml}
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
function formatDueDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function calculateDaysPassed(dateStr) {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  const today = new Date();
  start.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

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
    const canAction = isEditDeleteAllEnabled();
    const actionButtonsHtml = canAction ? `
      <button class="btn-icon-edit" data-id="${due.id}" aria-label="Edit entry" style="align-self: center;">
        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="btn-icon-delete" data-id="${due.id}" aria-label="Delete entry" style="align-self: center;">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    ` : '';
    
    let ageBadgeHtml = '';
    if (due.date) {
      const daysPassed = calculateDaysPassed(due.date);
      if (daysPassed > 0) {
        ageBadgeHtml = `
          <span class="due-age-badge" style="background-color: var(--color-danger); color: white; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 12px; margin-left: 6px; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle; box-shadow: 0 2px 4px rgba(239, 83, 80, 0.2);">
            ${daysPassed}d
          </span>
        `;
      } else {
        ageBadgeHtml = `
          <span class="due-age-badge" style="background-color: var(--color-primary-light); color: var(--color-primary-interactive); font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 12px; margin-left: 6px; display: inline-flex; align-items: center; justify-content: center; vertical-align: middle;">
            Today
          </span>
        `;
      }
    }

    return `
      <div class="ledger-item ${due.type}" data-id="${due.id}">
        <div class="item-left">
          <div style="flex: 1; display: flex; flex-direction: column;">
            <span style="font-weight: 800; font-size: 15px; color: var(--text-dark); display: flex; align-items: center; gap: 4px;">
              ${due.person}
              ${ageBadgeHtml}
            </span>
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-top: 2px;">
              ${typeLabel}${due.date ? ` • ${formatDueDate(due.date)}` : ''}
            </span>
            <span style="font-size: 10px; color: var(--text-muted); margin-top: 1px;">by ${due.addedBy}</span>
          </div>
        </div>
        <div class="item-right" style="gap: 8px; display: flex; align-items: center;">
          <span class="ledger-amount ${amountColorClass}">
            ৳${due.amount.toLocaleString('en-IN')}
          </span>
          ${actionButtonsHtml}
        </div>
      </div>
    `;
  }).join('');
}

// Global action handlers
window.handleDeleteShopping = async (id) => {
  if (!isEditDeleteAllEnabled()) return;
  await deleteShoppingItem(id);
  renderShoppingList();
  renderDashboard();
};

window.handleToggleShopping = async (id) => {
  await toggleShoppingItem(id);
  renderShoppingList();
  renderDashboard();
};

window.handleSelectAllShopping = async () => {
  const items = getShoppingItems();
  const filteredItems = items.filter(item => {
    if (activeShoppingFilter === 'pending') return !item.bought;
    if (activeShoppingFilter === 'bought') return item.bought;
    return true;
  });

  const pendingIds = filteredItems.filter(item => !item.bought).map(item => item.id);
  if (pendingIds.length === 0) return;

  await markAllShoppingItemsBought(pendingIds);
  renderShoppingList();
  renderDashboard();
};

window.handleDeleteExpense = async (id) => {
  if (!isEditDeleteAllEnabled()) return;
  await deleteExpense(id);
  renderExpenseTracker();
  renderDashboard();
};

window.handleDeleteDue = async (id) => {
  if (!isEditDeleteAllEnabled()) return;
  await deleteDue(id);
  renderDuesLedger();
  renderDashboard();
};

async function handleAddDueItem(e) {
  e.preventDefault();

  const person = DOM.duePerson.value;
  const amount = DOM.dueAmount.value;
  const type = DOM.dueType.value;
  const date = DOM.dueDate ? DOM.dueDate.value : '';
  const status = 'pending';

  if (!person.trim() || !amount || !type) return;

  await addDue(person, amount, type, status, date);

  DOM.duePerson.value = '';
  DOM.dueAmount.value = '';
  if (DOM.dueDate) {
    DOM.dueDate.value = new Date().toISOString().split('T')[0];
  }
  DOM.duePerson.blur();

  renderDuesLedger();
  renderDashboard();
}

// ----------------------------------------------------
// SCREEN RENDERS: NEXT SUGGESTIONS
// ----------------------------------------------------
function renderSuggestionsList() {
  if (!DOM.suggestionsContainer) return;
  const list = getSuggestions();

  // Sort suggestions: newest first
  list.sort((a, b) => b.timestamp - a.timestamp);

  if (list.length === 0) {
    DOM.suggestionsContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 8v4l3 3" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
        <p>No suggestions added yet.</p>
      </div>
    `;
    return;
  }

  DOM.suggestionsContainer.innerHTML = list.map(item => {
    const checkedClass = item.done ? 'bought' : ''; // Reuse styles from shopping list check
    const canAction = isEditDeleteAllEnabled();
    const actionButtonsHtml = canAction ? `
      <button class="btn-icon-edit" data-id="${item.id}" aria-label="Edit suggestion">
        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="btn-icon-delete" data-id="${item.id}" aria-label="Delete suggestion">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    ` : '';

    return `
      <li class="list-item ${checkedClass}" data-id="${item.id}">
        <div class="item-left">
          <div class="item-checkbox" data-id="${item.id}">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="item-details">
            <span class="item-name" style="text-decoration: ${item.done ? 'line-through' : 'none'}; opacity: ${item.done ? 0.6 : 1};">${item.text}</span>
            <span class="item-meta">added by ${item.addedBy}</span>
          </div>
        </div>
        <div class="item-right" style="display: flex; align-items: center; gap: 8px;">
          ${actionButtonsHtml}
        </div>
      </li>
    `;
  }).join('');

}

// ----------------------------------------------------
// SCREEN RENDERS: BABY NAMES TRACKER
// ----------------------------------------------------
function renderBabyNamesList() {
  if (!DOM.boyNamesList || !DOM.girlNamesList) return;

  const names = getBabyNames();
  
  // Sort: newest first
  names.sort((a, b) => b.timestamp - a.timestamp);

  const boyNames = names.filter(n => n.gender === 'boy');
  const girlNames = names.filter(n => n.gender === 'girl');

  const renderNameItem = (item) => {
    const canAction = isEditDeleteAllEnabled();
    const actionButtonsHtml = canAction ? `
      <button class="btn-icon-edit" data-id="${item.id}" aria-label="Edit name" style="padding: 2px;">
        <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="btn-icon-delete" data-id="${item.id}" aria-label="Delete name" style="padding: 2px;">
        <svg viewBox="0 0 24 24" style="width: 14px; height: 14px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    ` : '';

    const addedByDisplay = item.addedBy === 'Husband' || item.addedBy === 'Baby' ? 'Father' : (item.addedBy === 'Wife' ? 'Mother' : item.addedBy);

    return `
      <li class="baby-name-item" data-id="${item.id}">
        <div class="baby-name-info">
          <span class="baby-name-text">${item.name}</span>
        </div>
        <div class="baby-actions">
          ${actionButtonsHtml}
        </div>
      </li>
    `;
  };

  DOM.boyNamesList.innerHTML = boyNames.length === 0 
    ? `<div class="empty-state" style="padding: 15px 10px;"><p style="font-size: 11px;">No boy names suggested yet.</p></div>` 
    : boyNames.map(renderNameItem).join('');

  DOM.girlNamesList.innerHTML = girlNames.length === 0 
    ? `<div class="empty-state" style="padding: 15px 10px;"><p style="font-size: 11px;">No girl names suggested yet.</p></div>` 
    : girlNames.map(renderNameItem).join('');
}

async function handleAddBabyNameItem(e) {
  e.preventDefault();

  const name = DOM.babyNameInput.value.trim();
  const gender = DOM.babyGenderSelect.value;

  if (!name) return;

  await addBabyName(name, gender);

  DOM.babyNameInput.value = '';
  DOM.babyNameInput.blur();

  renderBabyNamesList();
}

async function handleBabyListClick(e) {
  // 1. Heart Like Button
  const likeBtn = e.target.closest('.btn-like-heart');
  if (likeBtn && likeBtn.dataset.id) {
    e.stopPropagation();
    await toggleLikeBabyName(likeBtn.dataset.id);
    renderBabyNamesList();
    return;
  }

  // 2. Edit Button
  const editBtn = e.target.closest('.btn-icon-edit');
  if (editBtn && editBtn.dataset.id) {
    e.stopPropagation();
    
    if (!isEditDeleteAllEnabled()) {
      alert("Editing is disabled! Enable Edit & Delete in Settings.");
      return;
    }

    const items = getBabyNames();
    const item = items.find(i => i.id === editBtn.dataset.id);
    if (item) {
      openEditModal('baby_name', item.id, 'Edit Baby Name', 'Baby Name', item.name, '', '');
    }
    return;
  }

  // 3. Delete Button
  const deleteBtn = e.target.closest('.btn-icon-delete');
  if (deleteBtn && deleteBtn.dataset.id) {
    e.stopPropagation();
    
    if (!isEditDeleteAllEnabled()) {
      alert("Deletion is disabled! Enable Edit & Delete in Settings.");
      return;
    }

    const itemRow = deleteBtn.closest('.baby-name-item');
    if (itemRow) {
      // Apply smooth collapse deletion animation
      itemRow.classList.add('deleting');
      await new Promise(r => setTimeout(r, 400));
    }

    await deleteBabyName(deleteBtn.dataset.id);
    renderBabyNamesList();
  }
}

function setupCollapsibleCards() {
  const togglers = [
    { headerId: 'shopping-form-header', contentId: 'shopping-form-content' },
    { headerId: 'expense-form-header', contentId: 'expense-form-content' },
    { headerId: 'due-form-header', contentId: 'due-form-content' },
    { headerId: 'baby-form-header', contentId: 'baby-form-content' }
  ];

  togglers.forEach(({ headerId, contentId }) => {
    const header = document.getElementById(headerId);
    const content = document.getElementById(contentId);
    if (!header || !content) return;

    // Default state: collapsed
    content.classList.add('collapsible-content', 'collapsed');
    const chevron = header.querySelector('.btn-toggle-collapse');
    if (chevron) chevron.classList.remove('rotated');

    header.addEventListener('click', () => {
      const isCollapsed = content.classList.toggle('collapsed');
      if (chevron) {
        if (isCollapsed) {
          chevron.classList.remove('rotated');
        } else {
          chevron.classList.add('rotated');
        }
      }
    });
  });
}

function playProfileSwitchSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    function playNote(freq, startTime, duration, vol = 0.08) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'triangle'; 
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    }
    
    const now = audioCtx.currentTime;
    playNote(523.25, now, 0.20, 0.08);       // C5
    playNote(659.25, now + 0.04, 0.18, 0.07); // E5
    playNote(783.99, now + 0.08, 0.22, 0.06); // G5
  } catch (e) {
    console.error("Failed to play profile switch sound:", e);
  }
}

async function handleAddMovieItem(e) {
  e.preventDefault();
  const name = DOM.movieNameInput.value.trim();
  const type = DOM.movieTypeSelect.value;

  if (!name) return;

  await addMovie(name, type);

  DOM.movieNameInput.value = '';
  DOM.movieNameInput.blur();

  renderMoviesList();
}

async function handleMovieListClick(e) {
  // 1. Checkbox click to toggle watched
  const checkbox = e.target.closest('.item-checkbox');
  if (checkbox && checkbox.dataset.id) {
    e.stopPropagation();
    await toggleWatchedMovie(checkbox.dataset.id);
    renderMoviesList();
    return;
  }

  // 2. Edit Button click
  const editBtn = e.target.closest('.btn-icon-edit');
  if (editBtn && editBtn.dataset.id) {
    e.stopPropagation();
    
    if (!isEditDeleteAllEnabled()) {
      alert("Editing is disabled! Enable Edit & Delete in Settings.");
      return;
    }

    const items = getMovies();
    const item = items.find(i => i.id === editBtn.dataset.id);
    if (item) {
      openEditModal('movie', item.id, 'Edit Movie/Series Name', 'Name', item.name, '', '');
    }
    return;
  }

  // 3. Delete Button click
  const deleteBtn = e.target.closest('.btn-icon-delete');
  if (deleteBtn && deleteBtn.dataset.id) {
    e.stopPropagation();

    if (!isEditDeleteAllEnabled()) {
      alert("Deletion is disabled! Enable Edit & Delete in Settings.");
      return;
    }

    const itemRow = deleteBtn.closest('.list-item');
    if (itemRow) {
      itemRow.classList.add('deleting');
      await new Promise(r => setTimeout(r, 400));
    }

    await deleteMovie(deleteBtn.dataset.id);
    renderMoviesList();
  }
}

function renderMoviesList() {
  if (!DOM.moviesContainer || !DOM.seriesContainer) return;

  const items = getMovies();
  
  // Sort items: newest first
  items.sort((a, b) => b.timestamp - a.timestamp);

  const movies = items.filter(item => item.type === 'movie');
  const series = items.filter(item => item.type === 'series');

  // Render function for each sub-list
  function renderList(list, container, emptyMsg) {
    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          <p>${emptyMsg}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(item => {
      const checkedClass = item.watched ? 'bought' : '';
      const canAction = isEditDeleteAllEnabled();
      const actionButtonsHtml = canAction ? `
        <button class="btn-icon-edit" data-id="${item.id}" aria-label="Edit item">
          <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon-delete" data-id="${item.id}" aria-label="Delete item">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      ` : '';

      return `
        <li class="list-item ${checkedClass}" data-id="${item.id}">
          <div class="item-left">
            <div class="item-checkbox" data-id="${item.id}">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="item-details">
              <span class="item-name" style="text-decoration: ${item.watched ? 'line-through' : 'none'}; opacity: ${item.watched ? 0.6 : 1};">${item.name}</span>
              <span class="item-meta">added by ${item.addedBy}</span>
            </div>
          </div>
          <div class="item-right" style="display: flex; align-items: center; gap: 8px;">
            ${actionButtonsHtml}
          </div>
        </li>
      `;
    }).join('');
  }

  renderList(movies, DOM.moviesContainer, "No movies added yet.");
  renderList(series, DOM.seriesContainer, "No series added yet.");
}

