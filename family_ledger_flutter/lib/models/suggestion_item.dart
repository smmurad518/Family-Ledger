class SuggestionItem {
  final String id;
  final String text;
  final bool done;
  final String addedBy;
  final int timestamp;

  SuggestionItem({
    required this.id,
    required this.text,
    this.done = false,
    required this.addedBy,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'done': done,
      'addedBy': addedBy,
      'timestamp': timestamp,
    };
  }

  factory SuggestionItem.fromJson(Map<String, dynamic> json) {
    return SuggestionItem(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      done: json['done'] ?? false,
      addedBy: json['addedBy'] ?? '',
      timestamp: json['timestamp'] ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  SuggestionItem copyWith({
    String? id,
    String? text,
    bool? done,
    String? addedBy,
    int? timestamp,
  }) {
    return SuggestionItem(
      id: id ?? this.id,
      text: text ?? this.text,
      done: done ?? this.done,
      addedBy: addedBy ?? this.addedBy,
      timestamp: timestamp ?? this.timestamp,
    );
  }
}
