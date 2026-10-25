import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/important_date_item.dart';

class ImportantDatesScreen extends StatefulWidget {
  const ImportantDatesScreen({Key? key}) : super(key: key);

  @override
  State<ImportantDatesScreen> createState() => _ImportantDatesScreenState();
}

class _ImportantDatesScreenState extends State<ImportantDatesScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  int? _selectedDay;
  int? _selectedMonth;

  static const _monthNames = [
    'January (01)', 'February (02)', 'March (03)', 'April (04)',
    'May (05)', 'June (06)', 'July (07)', 'August (08)',
    'September (09)', 'October (10)', 'November (11)', 'December (12)'
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }



  void _showEditDialog(ImportantDateItem item, AppState appState, Color primaryCol, Color textDark, Color cardBg, Color borderCol) {
    if (!appState.editDeleteAll) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Editing is disabled! Enable Edit & Delete in Settings.')),
      );
      return;
    }

    final editTitleController = TextEditingController(text: item.title);
    final editDescController = TextEditingController(text: item.description ?? '');
    final initialMd = ImportantDateItem.parseMonthDay(item.date);
    int editDay = initialMd.day;
    int editMonth = initialMd.month;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: cardBg,
              title: Text('Edit Important Date', style: TextStyle(color: textDark, fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: borderCol)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: editTitleController,
                    style: TextStyle(color: textDark),
                    decoration: const InputDecoration(labelText: 'Title'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: editDescController,
                    style: TextStyle(color: textDark),
                    decoration: const InputDecoration(labelText: 'Description (Optional)'),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        flex: 1,
                        child: DropdownButtonFormField<int>(
                          value: editDay,
                          decoration: InputDecoration(
                            labelText: 'Day',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: borderCol)),
                          ),
                          dropdownColor: cardBg,
                          style: TextStyle(color: textDark),
                          items: List.generate(31, (i) => i + 1).map((d) {
                            return DropdownMenuItem<int>(value: d, child: Text('$d'));
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setDialogState(() => editDay = val);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 2,
                        child: DropdownButtonFormField<int>(
                          value: editMonth,
                          decoration: InputDecoration(
                            labelText: 'Month',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: borderCol)),
                          ),
                          dropdownColor: cardBg,
                          style: TextStyle(color: textDark, fontSize: 13),
                          items: List.generate(12, (i) => i + 1).map((m) {
                            return DropdownMenuItem<int>(value: m, child: Text(_monthNames[m - 1]));
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setDialogState(() => editMonth = val);
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text('Cancel', style: TextStyle(color: textDark.withOpacity(0.6))),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (editTitleController.text.isNotEmpty) {
                      final dateStr = '${editMonth.toString().padLeft(2, '0')}-${editDay.toString().padLeft(2, '0')}';
                      await appState.updateImportantDate(item.id, dateStr, editTitleController.text.trim(), editDescController.text.trim());
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

    final sortedItems = List<ImportantDateItem>.from(appState.importantDates);
    sortedItems.sort((a, b) {
      final occA = ImportantDateItem.getNextOccurrence(a.date);
      final occB = ImportantDateItem.getNextOccurrence(b.date);
      return occA.diffDays.compareTo(occB.diffDays);
    });

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
                  'Important Dates',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black, fontFamily: 'Outfit'),
                ),
                SizedBox(height: 4),
                Text(
                  'Add and track your important family dates here.',
                  style: TextStyle(fontSize: 12, color: Colors.black87),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),

          // Add Date Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(20),
              border: BorderSide(color: borderCol),
            ),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _titleController,
                    style: TextStyle(color: textDark, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Enter Title...',
                      hintStyle: TextStyle(color: textMuted),
                      filled: true,
                      fillColor: inputBg,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderCol)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                    validator: (value) => value == null || value.trim().isEmpty ? 'Enter title' : null,
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: _descController,
                    style: TextStyle(color: textDark, fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Enter Description (Optional)...',
                      hintStyle: TextStyle(color: textMuted),
                      filled: true,
                      fillColor: inputBg,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderCol)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        flex: 1,
                        child: DropdownButtonFormField<int>(
                          value: _selectedDay,
                          hint: Text('Day', style: TextStyle(color: textMuted)),
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: inputBg,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderCol)),
                          ),
                          dropdownColor: cardBg,
                          style: TextStyle(color: textDark),
                          items: List.generate(31, (i) => i + 1).map((d) {
                            return DropdownMenuItem<int>(value: d, child: Text('$d'));
                          }).toList(),
                          onChanged: (val) => setState(() => _selectedDay = val),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 2,
                        child: DropdownButtonFormField<int>(
                          value: _selectedMonth,
                          hint: Text('Month', style: TextStyle(color: textMuted)),
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: inputBg,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderCol)),
                          ),
                          dropdownColor: cardBg,
                          style: TextStyle(color: textDark, fontSize: 13),
                          items: List.generate(12, (i) => i + 1).map((m) {
                            return DropdownMenuItem<int>(value: m, child: Text(_monthNames[m - 1]));
                          }).toList(),
                          onChanged: (val) => setState(() => _selectedMonth = val),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () async {
                      if (_formKey.currentState!.validate()) {
                        if (_selectedDay == null || _selectedMonth == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please select day and month.')),
                          );
                          return;
                        }
                        final dateStr = '${_selectedMonth!.toString().padLeft(2, '0')}-${_selectedDay!.toString().padLeft(2, '0')}';
                        await appState.addImportantDate(dateStr, _titleController.text.trim(), _descController.text.trim());
                        _titleController.clear();
                        _descController.clear();
                        setState(() {
                          _selectedDay = null;
                          _selectedMonth = null;
                        });
                        FocusScope.of(context).unfocus();
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryInteractive,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Add Date', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Title
          Text(
            'Dates List',
            style: TextStyle(color: textDark, fontFamily: 'Outfit', fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 8),

          // Scrollable List
          Expanded(
            child: sortedItems.isEmpty
                ? Center(
                    child: Text(
                      'No important dates added yet.',
                      style: TextStyle(color: textMuted, fontSize: 13),
                    ),
                  )
                : ListView.builder(
                    itemCount: sortedItems.length,
                    itemBuilder: (context, index) {
                      final item = sortedItems[index];
                      final occ = ImportantDateItem.getNextOccurrence(item.date);

                      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                      const monthsLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                      final monthShort = months[occ.nextDate.month - 1];
                      final monthLong = monthsLong[occ.nextDate.month - 1];
                      final dayNum = occ.nextDate.day.toString().padLeft(2, '0');

                      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                      final dayName = weekdays[occ.nextDate.weekday - 1];
                      final nextText = occ.diffDays == 0 ? 'Today!' : (occ.diffDays == 1 ? 'Tomorrow' : 'Next in ${occ.diffDays} days');

                      return Card(
                        color: cardBg,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14), side: BorderSide(color: borderCol)),
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 14.0, vertical: 12.0),
                          child: Row(
                            children: [
                              // Calendar Card Badge
                              Container(
                                width: 50,
                                height: 52,
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF1C1D22) : const Color(0xFFF3F4F6),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: borderCol),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      monthShort,
                                      style: TextStyle(
                                        color: primaryInteractive,
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                    const SizedBox(height: 1),
                                    Text(
                                      dayNum,
                                      style: TextStyle(
                                        color: textDark,
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 14),
                              // Details block
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.title,
                                      style: TextStyle(
                                        color: textDark,
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    if (item.description != null && item.description!.isNotEmpty) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        item.description!,
                                        style: TextStyle(
                                          color: textDark.withOpacity(0.85),
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                    const SizedBox(height: 4),
                                    Text(
                                      '📅 ${occ.nextDate.day} $monthLong ($dayName) • $nextText • added by ${item.addedBy}',
                                      style: TextStyle(
                                        color: textMuted,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Actions
                              if (appState.editDeleteAll) ...[
                                const SizedBox(width: 8),
                                Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.edit, size: 18),
                                      color: textMuted,
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      onPressed: () => _showEditDialog(item, appState, primaryColor, textDark, cardBg, borderCol),
                                    ),
                                    const SizedBox(height: 8),
                                    IconButton(
                                      icon: const Icon(Icons.delete, size: 18),
                                      color: Colors.redAccent,
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      onPressed: () async {
                                        final confirm = await showDialog<bool>(
                                          context: context,
                                          builder: (context) => AlertDialog(
                                            backgroundColor: cardBg,
                                            title: const Text('Delete Date'),
                                            content: const Text('Are you sure you want to delete this date?'),
                                            actions: [
                                              TextButton(
                                                onPressed: () => Navigator.of(context).pop(false),
                                                child: const Text('Cancel'),
                                              ),
                                              TextButton(
                                                onPressed: () => Navigator.of(context).pop(true),
                                                child: const Text('Delete', style: TextStyle(color: Colors.red)),
                                              ),
                                            ],
                                          ),
                                        );
                                        if (confirm == true) {
                                          await appState.deleteImportantDate(item.id);
                                        }
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
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
