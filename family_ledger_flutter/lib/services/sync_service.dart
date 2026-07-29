import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'db_service.dart';
import '../models/shopping_item.dart';
import '../models/expense_item.dart';
import '../models/due_item.dart';
import '../models/suggestion_item.dart';

class SyncService {
  FirebaseApp? _firebaseApp;
  FirebaseFirestore? _firestore;
  List<StreamSubscription> _subscriptions = [];
  Timer? _pollingTimer;
  bool _isSyncingLocal = false;
  bool _isWritingLocal = false;
  Timer? _writeCooldownTimer;

  bool get isFirebaseConnected => _firestore != null;

  // --- LOCAL HTTP SERVER SYNC ---
  
  // Start background HTTP polling
  void startLocalServerPolling(String serverUrl, DbService dbService, Function() onUpdate) {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(milliseconds: 1500), (timer) {
      pollServerData(serverUrl, dbService, onUpdate);
    });
  }

  void stopLocalServerPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  // Poll server data (GET)
  Future<void> pollServerData(String baseUrl, DbService dbService, Function() onUpdate) async {
    if (_isSyncingLocal || _isWritingLocal) return;
    _isSyncingLocal = true;

    try {
      final url = Uri.parse('$baseUrl/api/sync?t=${DateTime.now().millisecondsSinceEpoch}');
      final response = await http.get(url).timeout(const Duration(seconds: 3));
      
      if (_isWritingLocal) return;
      if (response.statusCode == 200) {
        final serverData = jsonDecode(response.body);
        if (serverData is Map) {
          final localShopping = dbService.getShoppingItems();
          final localExpenses = dbService.getExpenses();
          final localDues = dbService.getDues();
          final localSuggestions = dbService.getSuggestions();

          final List remoteShoppingJson = serverData['shopping'] ?? [];
          final List remoteExpensesJson = serverData['expenses'] ?? [];
          final List remoteDuesJson = serverData['dues'] ?? [];
          final List remoteSuggestionsJson = serverData['suggestions'] ?? [];

          final remoteShopping = remoteShoppingJson.map((item) => ShoppingItem.fromJson(Map<String, dynamic>.from(item))).toList();
          final remoteExpenses = remoteExpensesJson.map((item) => ExpenseItem.fromJson(Map<String, dynamic>.from(item))).toList();
          final remoteDues = remoteDuesJson.map((item) => DueItem.fromJson(Map<String, dynamic>.from(item))).toList();
          final remoteSuggestions = remoteSuggestionsJson.map((item) => SuggestionItem.fromJson(Map<String, dynamic>.from(item))).toList();

          bool updated = false;

          if (jsonEncode(localShopping) != jsonEncode(remoteShopping)) {
            await dbService.setShoppingItems(remoteShopping);
            updated = true;
          }
          if (jsonEncode(localExpenses) != jsonEncode(remoteExpenses)) {
            await dbService.setExpenses(remoteExpenses);
            updated = true;
          }
          if (jsonEncode(localDues) != jsonEncode(remoteDues)) {
            await dbService.setDues(remoteDues);
            updated = true;
          }
          if (jsonEncode(localSuggestions) != jsonEncode(remoteSuggestions)) {
            await dbService.setSuggestions(remoteSuggestions);
            updated = true;
          }

          if (updated) {
            onUpdate();
          }
        }
      }
    } catch (e) {
      // Quietly ignore network failures if local server is down
    } finally {
      _isSyncingLocal = false;
    }
  }

  // Push local state to server (POST)
  Future<void> pushStateToServer(String baseUrl, DbService dbService) async {
    _isWritingLocal = true;
    _writeCooldownTimer?.cancel();

    try {
      final payload = {
        'shopping': dbService.getShoppingItems().map((i) => i.toJson()).toList(),
        'expenses': dbService.getExpenses().map((i) => i.toJson()).toList(),
        'dues': dbService.getDues().map((i) => i.toJson()).toList(),
        'suggestions': dbService.getSuggestions().map((i) => i.toJson()).toList(),
        'updatedAt': DateTime.now().millisecondsSinceEpoch,
      };

      final url = Uri.parse('$baseUrl/api/sync');
      await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 3));
    } catch (e) {
      // Quietly log or ignore push failures
    } finally {
      _writeCooldownTimer = Timer(const Duration(seconds: 2), () {
        _isWritingLocal = false;
      });
    }
  }

  // --- FIREBASE CLOUD FIRESTORE SYNC ---

  // Connect & Initialize Firebase dynamically
  Future<bool> connectFirebase({
    required Map<String, String> config,
    required DbService dbService,
    required Function(String status, [String? error]) onSyncStateChange,
    required Function() onUpdate,
  }) async {
    disconnectFirebase();
    onSyncStateChange('connecting');

    try {
      final apiKey = config['apiKey'] ?? '';
      final projectId = config['projectId'] ?? '';
      final authDomain = config['authDomain'] ?? '';
      final appId = config['appId'] ?? '';

      if (apiKey.isEmpty || projectId.isEmpty) {
        throw Exception('API Key or Project ID is empty');
      }

      // Initialize a named Firebase app instance to support dynamic settings
      _firebaseApp = await Firebase.initializeApp(
        name: 'family_ledger_instance',
        options: FirebaseOptions(
          apiKey: apiKey,
          appId: appId,
          messagingSenderId: '1234567890', // dummy value to satisfy Firebase SDK
          projectId: projectId,
          authDomain: authDomain,
        ),
      );

      _firestore = FirebaseFirestore.instanceFor(app: _firebaseApp!);
      
      // Merge offline local data to Firebase cloud Firestore
      await _uploadLocalDataToCloud(dbService);

      // Listen to Firestore updates
      _setupCollectionListener('shopping_list', dbService, onUpdate, (jsonList) async {
        final items = jsonList.map((j) => ShoppingItem.fromJson(j)).toList();
        await dbService.setShoppingItems(items);
      });

      _setupCollectionListener('expenses', dbService, onUpdate, (jsonList) async {
        final items = jsonList.map((j) => ExpenseItem.fromJson(j)).toList();
        await dbService.setExpenses(items);
      });

      _setupCollectionListener('dues', dbService, onUpdate, (jsonList) async {
        final items = jsonList.map((j) => DueItem.fromJson(j)).toList();
        await dbService.setDues(items);
      });

      _setupCollectionListener('suggestions', dbService, onUpdate, (jsonList) async {
        final items = jsonList.map((j) => SuggestionItem.fromJson(j)).toList();
        await dbService.setSuggestions(items);
      });

      onSyncStateChange('connected');
      return true;
    } catch (e) {
      onSyncStateChange('error', e.toString());
      disconnectFirebase();
      return false;
    }
  }

  void disconnectFirebase() {
    for (var sub in _subscriptions) {
      sub.cancel();
    }
    _subscriptions.clear();
    _firestore = null;
    _firebaseApp = null;
  }

  // Upload local items to firestore
  Future<void> _uploadLocalDataToCloud(DbService dbService) async {
    if (_firestore == null) return;

    final collections = [
      {'name': 'shopping_list', 'items': dbService.getShoppingItems().map((i) => i.toJson()).toList()},
      {'name': 'expenses', 'items': dbService.getExpenses().map((i) => i.toJson()).toList()},
      {'name': 'dues', 'items': dbService.getDues().map((i) => i.toJson()).toList()},
      {'name': 'suggestions', 'items': dbService.getSuggestions().map((i) => i.toJson()).toList()},
    ];

    for (final col in collections) {
      final name = col['name'] as String;
      final items = col['items'] as List<Map<String, dynamic>>;
      if (items.isEmpty) continue;

      final batch = _firestore!.batch();
      for (final item in items) {
        final docRef = _firestore!.collection(name).doc(item['id'] as String);
        batch.set(docRef, item, SetOptions(merge: true));
      }
      await batch.commit();
    }
  }

  // Collection listener helper
  void _setupCollectionListener(
    String collectionName,
    DbService dbService,
    Function() onUpdate,
    Future<void> Function(List<Map<String, dynamic>> data) onDataReceived,
  ) {
    if (_firestore == null) return;

    final sub = _firestore!.collection(collectionName).snapshots().listen((snapshot) async {
      final data = snapshot.docs.map((doc) => doc.data()).toList();
      await onDataReceived(data);
      onUpdate();
    }, onError: (error) {
      // Handle or log listener error
    });

    _subscriptions.add(sub);
  }

  // --- Write updates to Firestore ---
  Future<void> writeDoc(String collectionName, String docId, Map<String, dynamic> data) async {
    if (_firestore == null) return;
    try {
      await _firestore!.collection(collectionName).doc(docId).set(data, SetOptions(merge: true));
    } catch (e) {
      // Fail silently
    }
  }

  Future<void> deleteDoc(String collectionName, String docId) async {
    if (_firestore == null) return;
    try {
      await _firestore!.collection(collectionName).doc(docId).delete();
    } catch (e) {
      // Fail silently
    }
  }
}
