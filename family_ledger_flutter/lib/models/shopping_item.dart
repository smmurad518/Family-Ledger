class ShoppingItem {
  final String id;
  final String name;
  final String qty;
  final bool bought;
  final String addedBy;
  final int timestamp;
  final String? boughtBy;

  ShoppingItem({
    required this.id,
    required this.name,
    required this.qty,
    this.bought = false,
    required this.addedBy,
    required this.timestamp,
    this.boughtBy,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'qty': qty,
      'bought': bought,
      'addedBy': addedBy,
      'timestamp': timestamp,
      'boughtBy': boughtBy,
    };
  }

  factory ShoppingItem.fromJson(Map<String, dynamic> json) {
    return ShoppingItem(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      qty: json['qty'] ?? '',
      bought: json['bought'] ?? false,
      addedBy: json['addedBy'] ?? '',
      timestamp: json['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
      boughtBy: json['boughtBy'],
    );
  }

  ShoppingItem copyWith({
    String? id,
    String? name,
    String? qty,
    bool? bought,
    String? addedBy,
    int? timestamp,
    String? boughtBy,
  }) {
    return ShoppingItem(
      id: id ?? this.id,
      name: name ?? this.name,
      qty: qty ?? this.qty,
      bought: bought ?? this.bought,
      addedBy: addedBy ?? this.addedBy,
      timestamp: timestamp ?? this.timestamp,
      boughtBy: boughtBy ?? this.boughtBy,
    );
  }
}
