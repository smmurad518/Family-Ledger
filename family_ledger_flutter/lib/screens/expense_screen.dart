import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/expense_item.dart';

class ExpenseScreen extends StatefulWidget {
  const ExpenseScreen({Key? key}) : super(key: key);

  @override
  State<ExpenseScreen> createState() => _ExpenseScreenState();
}

class _ExpenseScreenState extends State<ExpenseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  final _amountController = TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  void _showEditDialog(ExpenseItem item, AppState appState, Color primaryCol, Color textDark, Color cardBg, Color borderCol) {
    if (!appState.editDeleteAll) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Editing is disabled! Enable Edit & Delete in Settings.')),
      );
      return;
    }

    final editNotesController = TextEditingController(text: item.notes);
    final editAmountController = TextEditingController(text: item.amount.toStringAsFixed(0));

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: cardBg,
          title: Text('Edit Expense Entry', style: TextStyle(color: textDark, fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: borderCol)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: editNotesController,
                style: TextStyle(color: textDark),
                decoration: const InputDecoration(labelText: 'Item Name'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: editAmountController,
                style: TextStyle(color: textDark),
                decoration: const InputDecoration(labelText: 'Estimated Price (৳)'),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
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
                if (editNotesController.text.isNotEmpty && amt != null && amt > 0) {
                  await appState.updateExpenseItem(
                    item.id,
                    editNotesController.text.trim(),
                    amt,
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

    // Calculate sum of estimated needs
    final totalNeeds = appState.expenseItems.fold<double>(0.0, (sum, i) => sum + i.amount);

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Add Need Form
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
                      Icon(Icons.list_alt, color: primaryInteractive, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Add New Need',
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
                          controller: _notesController,
                          style: TextStyle(color: textDark, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'e.g. Bed, Table',
                            hintStyle: TextStyle(color: textMuted),
                            labelText: 'Item Name',
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
                            hintText: 'Price',
                            hintStyle: TextStyle(color: textMuted),
                            labelText: 'Est. Price (৳)',
                            labelStyle: TextStyle(color: textMuted),
                            filled: true,
                            fillColor: inputBg,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderCol)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          ),
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) return 'Price';
                            if (double.tryParse(value) == null) return 'Invalid';
                            return null;
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () async {
                      if (_formKey.currentState!.validate()) {
                        final amt = double.parse(_amountController.text);
                        await appState.addExpenseItem(_notesController.text, amt);
                        _notesController.clear();
                        _amountController.clear();
                        FocusScope.of(context).unfocus();
                      }
                    },
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Add to Needs List', style: TextStyle(fontWeight: FontWeight.bold)),
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

          // Total Needed Widget
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: primaryInteractive.withOpacity(0.08),
              borderRadius: BorderRadius.circular(16),
              border: BorderSide(color: primaryInteractive.withOpacity(0.2)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Text(
                  'Total Needs Estimated:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: textDark),
                ),
                Text(
                  '৳ ${totalNeeds.toStringAsFixed(0)}',
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: primaryInteractive),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Required Items List
          Expanded(
            child: appState.expenseItems.isEmpty
                ? Center(child: Text('No needs registered', style: TextStyle(color: textMuted)))
                : ListView.separated(
                    itemCount: appState.expenseItems.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = appState.expenseItems[index];
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(16),
                          border: BorderSide(color: borderCol),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: primaryInteractive.withOpacity(0.1),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(Icons.shopping_basket_outlined, color: primaryInteractive, size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.notes,
                                    style: TextStyle(
                                      color: textDark,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Estimated: ৳ ${item.amount.toStringAsFixed(0)}',
                                    style: TextStyle(color: primaryInteractive, fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 1),
                                  Text(
                                    'Added by ${item.addedBy} on ${item.date}',
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
                                    await appState.deleteExpenseItem(item.id);
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
