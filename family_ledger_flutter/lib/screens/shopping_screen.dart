import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/shopping_item.dart';

class ShoppingScreen extends StatefulWidget {
  const ShoppingScreen({Key? key}) : super(key: key);

  @override
  State<ShoppingScreen> createState() => _ShoppingScreenState();
}

class _ShoppingScreenState extends State<ShoppingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _qtyController = TextEditingController();
  String _activeFilter = 'all'; // 'all', 'pending', 'bought'

  @override
  void dispose() {
    _nameController.dispose();
    _qtyController.dispose();
    super.dispose();
  }

  void _showEditDialog(ShoppingItem item, AppState appState, Color primaryCol, Color textDark, Color cardBg, Color borderCol) {
    if (!appState.editDeleteAll) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Editing is disabled! Enable Edit & Delete in Settings.')),
      );
      return;
    }

    final editNameController = TextEditingController(text: item.name);
    final editQtyController = TextEditingController(text: item.qty);

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: cardBg,
          title: Text('Edit Shopping Item', style: TextStyle(color: textDark, fontFamily: 'Outfit', fontWeight: FontWeight.bold)),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: borderCol)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: editNameController,
                style: TextStyle(color: textDark),
                decoration: const InputDecoration(labelText: 'Item Name'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: editQtyController,
                style: TextStyle(color: textDark),
                decoration: const InputDecoration(labelText: 'Quantity'),
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
                if (editNameController.text.isNotEmpty && editQtyController.text.isNotEmpty) {
                  await appState.updateShoppingItem(
                    item.id,
                    editNameController.text.trim(),
                    editQtyController.text.trim(),
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

    // Filter Items
    final filteredItems = appState.shoppingItems.where((item) {
      if (_activeFilter == 'pending') return !item.bought;
      if (_activeFilter == 'bought') return item.bought;
      return true;
    }).toList();

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Add Item Card
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
                      Icon(Icons.add_shopping_cart, color: primaryInteractive, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Add New Item',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textDark, fontFamily: 'Outfit'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _nameController,
                          style: TextStyle(color: textDark, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'e.g. Potato, Milk',
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
                        child: TextFormField(
                          controller: _qtyController,
                          style: TextStyle(color: textDark, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'e.g. 2 kg, 1 Litre',
                            hintStyle: TextStyle(color: textMuted),
                            labelText: 'Quantity',
                            labelStyle: TextStyle(color: textMuted),
                            filled: true,
                            fillColor: inputBg,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: borderCol)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          ),
                          validator: (value) => value == null || value.trim().isEmpty ? 'Enter qty' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: () async {
                      if (_formKey.currentState!.validate()) {
                        await appState.addShoppingItem(_nameController.text, _qtyController.text);
                        _nameController.clear();
                        _qtyController.clear();
                        FocusScope.of(context).unfocus();
                      }
                    },
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Add to List', style: TextStyle(fontWeight: FontWeight.bold)),
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
              _buildFilterTab('all', 'All Items', primaryInteractive, textDark, textMuted),
              const SizedBox(width: 8),
              _buildFilterTab('pending', 'Pending', primaryInteractive, textDark, textMuted),
              const SizedBox(width: 8),
              _buildFilterTab('bought', 'Bought', primaryInteractive, textDark, textMuted),
            ],
          ),

          const SizedBox(height: 12),

          // Items List
          Expanded(
            child: filteredItems.isEmpty
                ? Center(child: Text('No items found', style: TextStyle(color: textMuted)))
                : ListView.separated(
                    itemCount: filteredItems.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = filteredItems[index];
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: cardBg,
                          borderRadius: BorderRadius.circular(16),
                          border: BorderSide(color: borderCol),
                        ),
                        child: Row(
                          children: [
                            // Checkbox to toggle bought
                            GestureDetector(
                              onTap: () => appState.toggleShoppingItem(item.id),
                              child: Container(
                                decoration: BoxDecoration(
                                  color: item.bought ? primaryInteractive : Colors.transparent,
                                  border: BorderSide(color: item.bought ? primaryInteractive : textMuted, width: 2),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                width: 22,
                                height: 22,
                                child: item.bought
                                    ? Icon(Icons.check, size: 16, color: isDark ? Colors.black : Colors.white)
                                    : null,
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Text Name & Qty
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    style: TextStyle(
                                      color: textDark,
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      decoration: item.bought ? TextDecoration.lineThrough : null,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Qty: ${item.qty}',
                                    style: TextStyle(color: textMuted, fontSize: 12),
                                  ),
                                  const SizedBox(height: 1),
                                  Text(
                                    'Added by ${item.addedBy}' + (item.bought && item.boughtBy != null ? ' • Bought by ${item.boughtBy}' : ''),
                                    style: TextStyle(color: textMuted.withOpacity(0.7), fontSize: 10),
                                  ),
                                ],
                              ),
                            ),
                            // Edit & Delete
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
                                    await appState.deleteShoppingItem(item.id);
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

  Widget _buildFilterTab(String filter, String label, Color primaryInteractive, Color textDark, Color textMuted) {
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
          color: isActive ? primaryInteractive : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: BorderSide(color: isActive ? primaryInteractive : textMuted.withOpacity(0.3)),
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
