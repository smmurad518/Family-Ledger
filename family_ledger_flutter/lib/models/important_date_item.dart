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
}
