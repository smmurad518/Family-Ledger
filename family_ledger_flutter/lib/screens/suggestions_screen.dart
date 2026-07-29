import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/suggestion_item.dart';

class SuggestionsScreen extends StatefulWidget {
  const SuggestionsScreen({Key? key}) : super(key: key);

  @override
  State<SuggestionsScreen> createState() => _SuggestionsScreenState();
}

class _SuggestionsScreenState extends State<SuggestionsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _textController = TextEditingController();

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  void _showEditDialog(SuggestionItem item, AppState appState, Color primaryCol, Color textDark, Color cardBg, Color borderCol) {
    if (!appState.editDeleteAll) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Editing is disabled! Enable Edit & Delete in Settings.')),
      );
      return;
    }

    final editTextController = TextEditingController(text: item.text);

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: cardBg,
          title: Text('Edit Suggestion Idea', style: TextStyle(color: textDark, fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: borderCol)),
          content: TextField(
            controller: editTextController,
            style: TextStyle(color: textDark),
            decoration: const InputDecoration(labelText: 'Suggestion Text'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text('Cancel', style: TextStyle(color: textDark.withOpacity(0.6))),
            ),
            ElevatedButton(
              onPressed: () async {
                if (editTextController.text.isNotEmpty) {
                  await appState.updateSuggestionItem(item.id, editTextController.text.trim());
                  Navigator.of(context).pop();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryCol,
                foregroundColor: Colors.black,
              ),
              child: const Text('Update'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final isDark = appState.theme == 'dark';

    // Theme Tokens
    final cardBg = isDark ? const Color(0xFF15161A) : Colors.white;
    final textDark = isDark ? const Color(0xFFF3F4F6) : const Color(0xFF1F2937);
    final textMuted = isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280);
    final borderCol = isDark ? const Color(0xFF24262B) : const Color(0xFFE5E7EB);
    final inputBg = isDark ? const Color(0xFF1C1D22) : const Color(0xFFFCFBF9);

    final primaryColor = appState.currentProfile == 'Husband' 
        ? const Color(0xFFB5F148) 
        : const Color(0xFFFF4B72);

    final primaryInteractive = isDark
        ? primaryColor
        : (appState.currentProfile == 'Husband' ? const Color(0xFF4D7C0F) : const Color(0xFFBE185D));

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Banner Info
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: appState.currentProfile == 'Husband'
                    ? [const Color(0xFFB5F148), const Color(0xFF86EFAC)]
                    : [const Color(0xFFFF4B72), const Color(0xFFFDA4AF)],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Next Suggestions',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black, fontFamily: 'Outfit'),
                ),
                SizedBox(height: 4),
                Text(
                  'Add your ideas and recommendations for the next updates here.',
                  style: TextStyle(fontSize: 12, color: Colors.black87),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),

          // Add Suggestion Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(20),
              border: BorderSide(color: borderCol),
            ),
            child: Form(
              key: _formKey,
              child: Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _textController,
                      style: TextStyle(color: textDark, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Write ideas for next update...',
                        hintStyle: TextStyle(color: textMuted),
                        filled: true,
                        fillColor: inputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderCol)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      ),
                      validator: (value) => value == null || value.trim().isEmpty ? 'Enter text' : null,
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () async {
                      if (_formKey.currentState!.validate()) {
                        await appState.addSuggestionItem(_textController.text);
                        _textController.clear();
                        FocusScope.of(context).unfocus();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryInteractive,
                      foregroundColor: isDark ? Colors.black : Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                    ),
                    child: const Text('Add', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),

          // Suggestions List
          Expanded(
            child: appState.suggestionItems.isEmpty
                ? Center(child: Text('No suggestions registered yet', style: TextStyle(color: textMuted)))
                : ListView.separated(
                    itemCount: appState.suggestionItems.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = appState.suggestionItems[index];
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(16),
                          border: BorderSide(color: borderCol),
                        ),
                        child: Row(
                          children: [
                            // Checkbox to toggle done status
                            GestureDetector(
                              onTap: () => appState.toggleSuggestionStatus(item.id),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: item.done ? primaryInteractive : Colors.transparent,
                                  border: BorderSide(color: item.done ? primaryInteractive : textMuted, width: 2),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                width: 22,
                                height: 22,
                                child: item.done
                                    ? Icon(Icons.check, size: 16, color: isDark ? Colors.black : Colors.white)
                                    : null,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.text,
                                    style: TextStyle(
                                      color: textDark,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      decoration: item.done ? TextDecoration.lineThrough : null,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Suggested by ${item.addedBy}',
                                    style: TextStyle(color: textMuted.withOpacity(0.7), fontSize: 10),
                                  ),
                                ],
                              ),
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, size: 18),
                                  color: textMuted,
                                  onPressed: () => _showEditDialog(item, appState, primaryInteractive, textDark, cardBg, borderCol),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, size: 18),
                                  color: const Color(0xFFF87171),
                                  onPressed: () async {
                                    if (!appState.editDeleteAll) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Deletion is disabled! Enable Edit & Delete in Settings.')),
                                      );
                                      return;
                                    }
                                    await appState.deleteSuggestionItem(item.id);
                                  },
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
