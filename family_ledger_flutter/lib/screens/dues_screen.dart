import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/due_item.dart';

class DuesScreen extends StatefulWidget {
  const DuesScreen({Key? key}) : super(key: key);

  @override
  State<DuesScreen> createState() => _DuesScreenState();
}

class _DuesScreenState extends State<DuesScreen> {
  final _formKey = GlobalKey<FormState>();
  final _personController = TextEditingController();
  final _amountController = TextEditingController();
  String _dueType = 'give'; // 'give' (dena), 'take' (pawna)
  String _activeFilter = 'give'; // 'give' (dena), 'take' (pawna)

  @override
  void dispose() {
    _personController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  void _showEditDialog(DueItem item, AppState appState, Color primaryCol, Color textDark, Color cardBg, Color borderCol) {
    if (!appState.editDeleteAll) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Editing is disabled! Enable Edit & Delete in Settings.')),
      );
      return;
    }

    final editPersonController = TextEditingController(text: item.person);
    final editAmountController = TextEditingController(text: item.amount.toStringAsFixed(0));
    String editType = item.type;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: cardBg,
              title: Text('Edit Due Entry', style: TextStyle(color: textDark, fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: borderCol)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: editPersonController,
                    style: TextStyle(color: textDark),
                    decoration: const InputDecoration(labelText: 'Person Name'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: editAmountController,
                    style: TextStyle(color: textDark),
                    decoration: const InputDecoration(labelText: 'Amount (৳)'),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    value: editType,
                    dropdownColor: cardBg,
                    style: TextStyle(color: textDark),
                    decoration: const InputDecoration(labelText: 'Type'),
                    items: const [
                      DropdownMenuItem(value: 'give', child: Text('Dena (I owe them / Pay back)')),
                      DropdownMenuItem(value: 'take', child: Text('Pawna (They owe me / Collect)')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setDialogState(() {
                          editType = val;
                        });
                      }
                    },
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
                    final amt = double.tryParse(editAmountController.text);
                    if (editPersonController.text.isNotEmpty && amt != null && amt > 0) {
                      await appState.updateDueItem(
                        item.id,
                        editPersonController.text.trim(),
                        amt,
                        editType,
                      );
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

    // Calculate Dena/Pawna totals (only pending dues)
    final totalDena = appState.dueItems
        .where((item) => item.type == 'give' && item.status == 'pending')
        .fold<double>(0.0, (sum, i) => sum + i.amount);

    final totalPawna = appState.dueItems
        .where((item) => item.type == 'take' && item.status == 'pending')
        .fold<double>(0.0, (sum, i) => sum + i.amount);

    // Filter Items
    final filteredDues = appState.dueItems.where((item) => item.type == _activeFilter).toList();

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Add Due Card
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
                  Row(
                    children: [
                      Icon(Icons.monetization_on, color: primaryInteractive, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Record Loan/Due',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textDark, fontFamily: 'Outfit'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: TextFormField(
                          controller: _personController,
                          style: TextStyle(color: textDark, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'e.g. John, Shopkeeper',
                            hintStyle: TextStyle(color: textMuted),
                            labelText: 'Person Name',
                            labelStyle: TextStyle(color: textMuted),
                            filled: true,
                            fillColor: inputBg,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderCol)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          ),
                          validator: (value) => value == null || value.trim().isEmpty ? 'Enter name' : null,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        flex: 2,
                        child: TextFormField(
                          controller: _amountController,
                          style: TextStyle(color: textDark, fontSize: 14),
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          decoration: InputDecoration(
                            hintText: 'Amount',
                            hintStyle: TextStyle(color: textMuted),
                            labelText: 'Amount (৳)',
                            labelStyle: TextStyle(color: textMuted),
                            filled: true,
                            fillColor: inputBg,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderCol)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) return 'Amt';
                            if (double.tryParse(value) == null) return 'Invalid';
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    value: _dueType,
                    dropdownColor: cardBg,
                    style: TextStyle(color: textDark, fontSize: 14),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: inputBg,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderCol)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'give', child: Text('Dena (I owe them / Pay back)')),
                      DropdownMenuItem(value: 'take', child: Text('Pawna (They owe me / Collect)')),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setState(() {
                          _dueType = val;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () async {
                      if (_formKey.currentState!.validate()) {
                        final amt = double.parse(_amountController.text);
                        await appState.addDueItem(_personController.text, amt, _dueType);
                        _personController.clear();
                        _amountController.clear();
                        FocusScope.of(context).unfocus();
                      }
                    },
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Record Entry', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryInteractive,
                      foregroundColor: isDark ? Colors.black : Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),

          // Filters Tab Row
          Row(
            children: [
              _buildFilterTab('give', 'Dena (Payables)', const Color(0xFFF87171), textDark, textMuted),
              const SizedBox(width: 8),
              _buildFilterTab('take', 'Pawna (Receivables)', const Color(0xFF60A5FA), textDark, textMuted),
            ],
          ),

          const SizedBox(height: 12),

          // Due Items List
          Expanded(
            child: filteredDues.isEmpty
                ? Center(child: Text('No dues recorded', style: TextStyle(color: textMuted)))
                : ListView.separated(
                    itemCount: filteredDues.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = filteredDues[index];
                      final isPaid = item.status == 'paid';
                      final typeColor = item.type == 'give' ? const Color(0xFFF87171) : const Color(0xFF60A5FA);

                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(16),
                          border: BorderSide(color: borderCol),
                        ),
                        child: Row(
                          children: [
                            // Checkbox to toggle paid status
                            GestureDetector(
                              onTap: () => appState.toggleDueStatus(item.id),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: isPaid ? typeColor : Colors.transparent,
                                  border: BorderSide(color: isPaid ? typeColor : textMuted, width: 2),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                width: 22,
                                height: 22,
                                child: isPaid
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
                                    item.person,
                                    style: TextStyle(
                                      color: textDark,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      decoration: isPaid ? TextDecoration.lineThrough : null,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Amount: ৳ ${item.amount.toStringAsFixed(0)}',
                                    style: TextStyle(color: typeColor, fontSize: 12, fontWeight: FontWeight.bold, decoration: isPaid ? TextDecoration.lineThrough : null),
                                  ),
                                  const SizedBox(height: 1),
                                  Text(
                                    'Recorded by ${item.addedBy} on ${item.date}',
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
                                    await appState.deleteDueItem(item.id);
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

          const SizedBox(height: 10),

          // Dues Totals Box
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(16),
              border: BorderSide(color: borderCol),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    Text('Total Dena (Payable):', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textDark)),
                    Text('৳ ${totalDena.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFFF87171))),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    Text('Total Pawna (Receivable):', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textDark)),
                    Text('৳ ${totalPawna.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF60A5FA))),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTab(String filter, String label, Color color, Color textDark, Color textMuted) {
    final isActive = _activeFilter == filter;
    return GestureDetector(
      onTap: () {
        setState(() {
          _activeFilter = filter;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: BorderSide(color: isActive ? color : textMuted.withOpacity(0.3)),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isActive ? (Theme.of(context).brightness == Brightness.dark ? Colors.black : Colors.white) : textMuted,
          ),
        ),
      ),
    );
  }
}
