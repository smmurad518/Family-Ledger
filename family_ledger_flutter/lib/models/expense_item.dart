class ExpenseItem {
  final String id;
  final String date;
  final String category;
  final double amount;
  final String notes;
  final String addedBy;
  final int timestamp;

  ExpenseItem({
    required this.id,
    required this.date,
    this.category = 'General',
    required this.amount,
    required this.notes,
    required this.addedBy,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date,
      'category': category,
      'amount': amount,
      'notes': notes,
      'addedBy': addedBy,
      'timestamp': timestamp,
    };
  }

  factory ExpenseItem.fromJson(Map<String, dynamic> json) {
    return ExpenseItem(
      id: json['id'] ?? '',
      date: json['date'] ?? '',
      category: json['category'] ?? 'General',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      notes: json['notes'] ?? '',
      addedBy: json['addedBy'] ?? '',
      timestamp: json['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  ExpenseItem copyWith({
    String? id,
    String? date,
    String? category,
    double? amount,
    String? notes,
    String? addedBy,
    int? timestamp,
  }) {
    return ExpenseItem(
      id: id ?? this.id,
      date: date ?? this.date,
      category: category ?? this.category,
      amount: amount ?? this.amount,
      notes: notes ?? this.notes,
      addedBy: addedBy ?? this.addedBy,
      timestamp: timestamp ?? this.timestamp,
    );
  }
}
