class DueItem {
  final String id;
  final String person;
  final double amount;
  final String type; // 'give' (dena) or 'take' (pawna)
  final String status; // 'pending' or 'paid'
  final String addedBy;
  final String date;
  final int timestamp;

  DueItem({
    required this.id,
    required this.person,
    required this.amount,
    required this.type,
    this.status = 'pending',
    required this.addedBy,
    required this.date,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'person': person,
      'amount': amount,
      'type': type,
      'status': status,
      'addedBy': addedBy,
      'date': date,
      'timestamp': timestamp,
    };
  }

  factory DueItem.fromJson(Map<String, dynamic> json) {
    return DueItem(
      id: json['id'] ?? '',
      person: json['person'] ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      type: json['type'] ?? 'give',
      status: json['status'] ?? 'pending',
      addedBy: json['addedBy'] ?? '',
      date: json['date'] ?? '',
      timestamp: json['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  DueItem copyWith({
    String? id,
    String? person,
    double? amount,
    String? type,
    String? status,
    String? addedBy,
    String? date,
    int? timestamp,
  }) {
    return DueItem(
      id: id ?? this.id,
      person: person ?? this.person,
      amount: amount ?? this.amount,
      type: type ?? this.type,
      status: status ?? this.status,
      addedBy: addedBy ?? this.addedBy,
      date: date ?? this.date,
      timestamp: timestamp ?? this.timestamp,
    );
  }
}
