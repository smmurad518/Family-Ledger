import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/shopping_item.dart';
import '../models/expense_item.dart';
import '../models/due_item.dart';
import '../models/suggestion_item.dart';
import '../models/important_date_item.dart';
import '../services/db_service.dart';
import '../services/sync_service.dart';

class AppState extends ChangeNotifier {
  final DbService _dbService = DbService();
  final SyncService _syncService = SyncService();
  final _uuid = const Uuid();

  // State Variables
  String _currentProfile = 'Husband';
  String _theme = 'light';
  bool _firebaseEnabled = false;
  Map<String, String> _firebaseConfig = {};
  bool _editDeleteAll = false;
  bool _wifeCanSwitch = true;
  String _localServerUrl = 'http://localhost:8000';
  String? _loggedInUser;
  Map<String, String> _users = {};

  List<ShoppingItem> _shoppingItems = [];
  List<ExpenseItem> _expenseItems = [];
  List<DueItem> _dueItems = [];
  List<SuggestionItem> _suggestionItems = [];
  List<ImportantDateItem> _importantDates = [];

  String _syncState = 'disconnected';
  String? _syncError;

  // Getters
  String get currentProfile => _currentProfile;
  String get theme => _theme;
  bool get firebaseEnabled => _firebaseEnabled;
  Map<String, String> get firebaseConfig => _firebaseConfig;
  bool get editDeleteAll => _editDeleteAll;
  bool get wifeCanSwitch => _wifeCanSwitch;
  String get localServerUrl => _localServerUrl;
  String? get loggedInUser => _loggedInUser;
  Map<String, String> get users => _users;

  List<ShoppingItem> get shoppingItems => _shoppingItems;
  List<ExpenseItem> get expenseItems => _expenseItems;
  List<DueItem> get dueItems => _dueItems;
  List<SuggestionItem> get suggestionItems => _suggestionItems;
  List<ImportantDateItem> get importantDates => _importantDates;

  String get syncState => _syncState;
  String? get syncError => _syncError;

  // Constructor
  AppState() {
    _init();
  }

  Future<void> _init() async {
    await _dbService.init();

    // Load configurations
    _currentProfile = _dbService.getProfile();
    _theme = _dbService.getTheme();
    _firebaseEnabled = _dbService.getFirebaseEnabled();
    _firebaseConfig = _dbService.getFirebaseConfig();
    _editDeleteAll = _dbService.getEditDeleteAll();
    _wifeCanSwitch = _dbService.getWifeCanSwitch();
    
    // Custom server URL settings loaded from Hive, fallback to default
    _localServerUrl = _dbService.getFirebaseConfig()['_localServerUrl'] ?? 'http://localhost:8000';

    // Load data lists
    _loadLocalData();

    // Start sync engine
    _initializeSync();
  }

  void _loadLocalData() {
    _shoppingItems = _dbService.getShoppingItems();
    _expenseItems = _dbService.getExpenses();
    _dueItems = _dbService.getDues();
    _suggestionItems = _dbService.getSuggestions();
    _importantDates = _dbService.getImportantDates();
    _loggedInUser = _dbService.getLoggedInUser();
    _users = _dbService.getUsers();
    notifyListeners();
  }

  void _initializeSync() {
    if (_firebaseEnabled && _firebaseConfig.containsKey('apiKey') && _firebaseConfig['apiKey']!.isNotEmpty) {
      _syncService.connectFirebase(
        config: _firebaseConfig,
        dbService: _dbService,
        onSyncStateChange: (state, [error]) {
          _syncState = state;
          _syncError = error;
          notifyListeners();
        },
        onUpdate: () {
          _loadLocalData();
        },
      );
    } else {
      _syncState = 'connected';
      _syncError = null;
      notifyListeners();

      // Fallback: Local Server Polling
      _syncService.startLocalServerPolling(_localServerUrl, _dbService, () {
        _loadLocalData();
      });
    }
  }

  // --- AUTH ACTIONS ---

  Future<bool> login(String profile, String password) async {
    String actualProfile = profile;
    final trimmedPass = password.trim();
    if (_users[actualProfile] != trimmedPass) {
      final alternateProfile = actualProfile == 'Husband' ? 'Wife' : 'Husband';
      if (_users[alternateProfile] == trimmedPass) {
        actualProfile = alternateProfile;
      } else {
        return false;
      }
    }
    _loggedInUser = actualProfile;
    await _dbService.setLoggedInUser(actualProfile);
    await switchProfile(actualProfile);
    return true;
  }

  Future<void> changeUserPassword(String profile, String newPassword) async {
    _users[profile] = newPassword;
    await _dbService.setUsers(_users);
    notifyListeners();
    
    if (_firebaseEnabled) {
      await _syncService.writeDoc('users', 'auth', _users);
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  // --- SETTINGS ACTIONS ---

  Future<void> switchProfile(String profile) async {
    _currentProfile = profile;
    await _dbService.setProfile(profile);
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    _theme = _theme == 'light' ? 'dark' : 'light';
    await _dbService.setTheme(_theme);
    notifyListeners();
  }

  Future<void> saveSettings({
    required bool firebaseEnabled,
    required Map<String, String> firebaseConfig,
    required bool editDeleteAll,
    required bool wifeCanSwitch,
    required String serverUrl,
  }) async {
    _firebaseEnabled = firebaseEnabled;
    _firebaseConfig = {...firebaseConfig, '_localServerUrl': serverUrl};
    _editDeleteAll = editDeleteAll;
    _wifeCanSwitch = wifeCanSwitch;
    _localServerUrl = serverUrl;

    await _dbService.setFirebaseEnabled(firebaseEnabled);
    await _dbService.setFirebaseConfig(_firebaseConfig);
    await _dbService.setEditDeleteAll(editDeleteAll);
    await _dbService.setWifeCanSwitch(wifeCanSwitch);

    // Stop active engines and re-init
    _syncService.disconnectFirebase();
    _syncService.stopLocalServerPolling();
    _initializeSync();
  }

  // --- SHOPPING LIST ACTIONS ---

  Future<void> addShoppingItem(String name, String qty) async {
    final newItem = ShoppingItem(
      id: _uuid.v4().substring(0, 10),
      name: name.trim(),
      qty: qty.trim(),
      bought: false,
      addedBy: _currentProfile,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _shoppingItems.add(newItem);
    await _dbService.setShoppingItems(_shoppingItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('shopping_list', newItem.id, newItem.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> toggleShoppingItem(String id) async {
    final index = _shoppingItems.indexWhere((item) => item.id == id);
    if (index == -1) return;

    final item = _shoppingItems[index];
    final updated = item.copyWith(
      bought: !item.bought,
      boughtBy: !item.bought ? _currentProfile : null,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _shoppingItems[index] = updated;
    await _dbService.setShoppingItems(_shoppingItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('shopping_list', id, updated.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> deleteShoppingItem(String id) async {
    _shoppingItems.removeWhere((item) => item.id == id);
    await _dbService.setShoppingItems(_shoppingItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.deleteDoc('shopping_list', id);
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> updateShoppingItem(String id, String name, String qty) async {
    final index = _shoppingItems.indexWhere((item) => item.id == id);
    if (index == -1) return;

    final updated = _shoppingItems[index].copyWith(
      name: name.trim(),
      qty: qty.trim(),
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _shoppingItems[index] = updated;
    await _dbService.setShoppingItems(_shoppingItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('shopping_list', id, updated.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  // --- EXPENSE LIST ACTIONS ---

  Future<void> addExpenseItem(String notes, double amount, {String category = 'General'}) async {
    final newExpense = ExpenseItem(
      id: _uuid.v4().substring(0, 10),
      date: DateTime.now().toString().substring(0, 10), // YYYY-MM-DD
      category: category,
      amount: amount,
      notes: notes.trim(),
      addedBy: _currentProfile,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _expenseItems.add(newExpense);
    await _dbService.setExpenses(_expenseItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('expenses', newExpense.id, newExpense.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> deleteExpenseItem(String id) async {
    _expenseItems.removeWhere((item) => item.id == id);
    await _dbService.setExpenses(_expenseItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.deleteDoc('expenses', id);
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> updateExpenseItem(String id, String notes, double amount, {String category = 'General'}) async {
    final index = _expenseItems.indexWhere((item) => item.id == id);
    if (index == -1) return;

    final updated = _expenseItems[index].copyWith(
      notes: notes.trim(),
      amount: amount,
      category: category,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _expenseItems[index] = updated;
    await _dbService.setExpenses(_expenseItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('expenses', id, updated.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  // --- DUES ACTIONS ---

  Future<void> addDueItem(String person, double amount, String type) async {
    final newDue = DueItem(
      id: _uuid.v4().substring(0, 10),
      person: person.trim(),
      amount: amount,
      type: type,
      status: 'pending',
      addedBy: _currentProfile,
      date: DateTime.now().toString().substring(0, 10),
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _dueItems.add(newDue);
    await _dbService.setDues(_dueItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('dues', newDue.id, newDue.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> toggleDueStatus(String id) async {
    final index = _dueItems.indexWhere((item) => item.id == id);
    if (index == -1) return;

    final item = _dueItems[index];
    final updated = item.copyWith(
      status: item.status == 'pending' ? 'paid' : 'pending',
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _dueItems[index] = updated;
    await _dbService.setDues(_dueItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('dues', id, updated.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> deleteDueItem(String id) async {
    _dueItems.removeWhere((item) => item.id == id);
    await _dbService.setDues(_dueItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.deleteDoc('dues', id);
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> updateDueItem(String id, String person, double amount, String type) async {
    final index = _dueItems.indexWhere((item) => item.id == id);
    if (index == -1) return;

    final updated = _dueItems[index].copyWith(
      person: person.trim(),
      amount: amount,
      type: type,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _dueItems[index] = updated;
    await _dbService.setDues(_dueItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('dues', id, updated.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  // --- SUGGESTIONS ACTIONS ---

  Future<void> addSuggestionItem(String text) async {
    final newSuggestion = SuggestionItem(
      id: _uuid.v4().substring(0, 10),
      text: text.trim(),
      done: false,
      addedBy: _currentProfile,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _suggestionItems.add(newSuggestion);
    await _dbService.setSuggestions(_suggestionItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('suggestions', newSuggestion.id, newSuggestion.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> toggleSuggestionStatus(String id) async {
    final index = _suggestionItems.indexWhere((item) => item.id == id);
    if (index == -1) return;

    final item = _suggestionItems[index];
    final updated = item.copyWith(
      done: !item.done,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _suggestionItems[index] = updated;
    await _dbService.setSuggestions(_suggestionItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('suggestions', id, updated.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> deleteSuggestionItem(String id) async {
    _suggestionItems.removeWhere((item) => item.id == id);
    await _dbService.setSuggestions(_suggestionItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.deleteDoc('suggestions', id);
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> updateSuggestionItem(String id, String text) async {
    final index = _suggestionItems.indexWhere((item) => item.id == id);
    if (index == -1) return;

    final updated = _suggestionItems[index].copyWith(
      text: text.trim(),
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _suggestionItems[index] = updated;
    await _dbService.setSuggestions(_suggestionItems);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('suggestions', id, updated.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> addImportantDate(String date, String title, String? description) async {
    final newItem = ImportantDateItem(
      id: _uuid.v4(),
      date: date.trim(),
      title: title.trim(),
      description: description != null && description.trim().isNotEmpty ? description.trim() : null,
      addedBy: _currentProfile,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _importantDates.add(newItem);
    await _dbService.setImportantDates(_importantDates);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('important_dates', newItem.id, newItem.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> deleteImportantDate(String id) async {
    _importantDates.removeWhere((item) => item.id == id);
    await _dbService.setImportantDates(_importantDates);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.deleteDoc('important_dates', id);
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  Future<void> updateImportantDate(String id, String date, String title, String? description) async {
    final index = _importantDates.indexWhere((item) => item.id == id);
    if (index == -1) return;

    final updated = _importantDates[index].copyWith(
      date: date.trim(),
      title: title.trim(),
      description: description != null && description.trim().isNotEmpty ? description.trim() : null,
      timestamp: DateTime.now().millisecondsSinceEpoch,
    );

    _importantDates[index] = updated;
    await _dbService.setImportantDates(_importantDates);
    notifyListeners();

    if (_firebaseEnabled) {
      await _syncService.writeDoc('important_dates', id, updated.toJson());
    } else {
      await _syncService.pushStateToServer(_localServerUrl, _dbService);
    }
  }

  @override
  void dispose() {
    _syncService.disconnectFirebase();
    _syncService.stopLocalServerPolling();
    super.dispose();
  }
}
