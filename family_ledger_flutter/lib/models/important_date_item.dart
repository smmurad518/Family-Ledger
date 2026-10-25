class ImportantDateItem {
  final String id;
  final String date;
  final String title;
  final String? description;
  final String addedBy;
  final int timestamp;

  ImportantDateItem({
    required this.id,
    required this.date,
    required this.title,
    this.description,
    required this.addedBy,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date,
      'title': title,
      'description': description,
      'addedBy': addedBy,
      'timestamp': timestamp,
    };
  }

  factory ImportantDateItem.fromJson(Map<String, dynamic> json) {
    return ImportantDateItem(
      id: json['id'] ?? '',
      date: json['date'] ?? '',
      title: json['title'] ?? json['description'] ?? '',
      description: json['description'],
      addedBy: json['addedBy'] ?? '',
      timestamp: json['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  ImportantDateItem copyWith({
    String? id,
    String? date,
    String? title,
    String? description,
    String? addedBy,
    int? timestamp,
  }) {
    return ImportantDateItem(
      id: id ?? this.id,
      date: date ?? this.date,
      title: title ?? this.title,
      description: description ?? this.description,
      addedBy: addedBy ?? this.addedBy,
      timestamp: timestamp ?? this.timestamp,
    );
  }

  static ({int month, int day}) parseMonthDay(String dateStr) {
    final parts = dateStr.trim().split('-');
    int m = 1;
    int d = 1;
    if (parts.length >= 3) {
      m = int.tryParse(parts[1]) ?? 1;
      d = int.tryParse(parts[2]) ?? 1;
    } else if (parts.length == 2) {
      m = int.tryParse(parts[0]) ?? 1;
      d = int.tryParse(parts[1]) ?? 1;
    }
    return (month: m.clamp(1, 12), day: d.clamp(1, 31));
  }

  static ({DateTime nextDate, int diffDays}) getNextOccurrence(String dateStr) {
    final md = parseMonthDay(dateStr);
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    DateTime target = DateTime(now.year, md.month, md.day);
    if (target.isBefore(today)) {
      target = DateTime(now.year + 1, md.month, md.day);
    }
    final diffDays = target.difference(today).inDays;
    return (nextDate: target, diffDays: diffDays);
  }
}
