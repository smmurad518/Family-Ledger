import 'package:hive_flutter/hive_flutter.dart';
import '../models/shopping_item.dart';
import '../models/expense_item.dart';
import '../models/due_item.dart';
import '../models/suggestion_item.dart';

class DbService {
  static const String _boxName = 'family_ledger_box';
  
  // Keys matching localstorage keys exactly
  static const String keyProfile = 'mm_profile';
  static const String keyFbEnabled = 'mm_firebase_enabled';
  static const String keyFbConfig = 'mm_firebase_config';
  static const String keyShopping = 'mm_shopping_list';
  static const String keyExpenses = 'mm_expenses';
  static const String keyDues = 'mm_dues';
  static const String keySuggestions = 'mm_suggestions';
  static const String keyEditDeleteAll = 'mm_edit_delete_all';
  static const String keyWifeCanSwitch = 'mm_wife_can_switch';
  static const String keyTheme = 'mm_theme';

  late Box _box;

  Future<void> init() async {
    await Hive.initFlutter();
    _box = await Hive.openBox(_boxName);
  }

  // --- Getters ---
  String getProfile() => _box.get(keyProfile, defaultValue: 'Husband');
  bool getFirebaseEnabled() => _box.get(keyFbEnabled, defaultValue: false);
  bool getEditDeleteAll() => _box.get(keyEditDeleteAll, defaultValue: false);
  bool getWifeCanSwitch() => _box.get(keyWifeCanSwitch, defaultValue: false);
  String getTheme() => _box.get(keyTheme, defaultValue: 'light');

  Map<String, String> getFirebaseConfig() {
    final Map? config = _box.get(keyFbConfig);
    if (config == null) return {};
    return Map<String, String>.from(config);
  }

  List<ShoppingItem> getShoppingItems() {
    final List? list = _box.get(keyShopping);
    if (list == null) return [];
    return list.map((item) => ShoppingItem.fromJson(Map<String, dynamic>.from(item))).toList();
  }

  List<ExpenseItem> getExpenses() {
    final List? list = _box.get(keyExpenses);
    if (list == null) return [];
    return list.map((item) => ExpenseItem.fromJson(Map<String, dynamic>.from(item))).toList();
  }

  List<DueItem> getDues() {
    final List? list = _box.get(keyDues);
    if (list == null) return [];
    return list.map((item) => DueItem.fromJson(Map<String, dynamic>.from(item))).toList();
  }

  List<SuggestionItem> getSuggestions() {
    final List? list = _box.get(keySuggestions);
    if (list == null) return [];
    return list.map((item) => SuggestionItem.fromJson(Map<String, dynamic>.from(item))).toList();
  }

  // --- Setters ---
  Future<void> setProfile(String value) async => await _box.put(keyProfile, value);
  Future<void> setFirebaseEnabled(bool value) async => await _box.put(keyFbEnabled, value);
  Future<void> setEditDeleteAll(bool value) async => await _box.put(keyEditDeleteAll, value);
  Future<void> setWifeCanSwitch(bool value) async => await _box.put(keyWifeCanSwitch, value);
  Future<void> setTheme(String value) async => await _box.put(keyTheme, value);

  Future<void> setFirebaseConfig(Map<String, String> value) async {
    await _box.put(keyFbConfig, value);
  }

  Future<void> setShoppingItems(List<ShoppingItem> items) async {
    final list = items.map((item) => item.toJson()).toList();
    await _box.put(keyShopping, list);
  }

  Future<void> setExpenses(List<ExpenseItem> items) async {
    final list = items.map((item) => item.toJson()).toList();
    await _box.put(keyExpenses, list);
  }

  Future<void> setDues(List<DueItem> items) async {
    final list = items.map((item) => item.toJson()).toList();
    await _box.put(keyDues, list);
  }

  Future<void> setSuggestions(List<SuggestionItem> items) async {
    final list = items.map((item) => item.toJson()).toList();
    await _box.put(keySuggestions, list);
  }
}
