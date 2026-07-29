import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class SettingsModal extends StatefulWidget {
  const SettingsModal({Key? key}) : super(key: key);

  @override
  State<SettingsModal> createState() => _SettingsModalState();
}

class _SettingsModalState extends State<SettingsModal> {
  bool _firebaseEnabled = false;
  bool _editDeleteAll = false;
  bool _wifeCanSwitch = false;
  final _apiKeyController = TextEditingController();
  final _projectIdController = TextEditingController();
  final _authDomainController = TextEditingController();
  final _appIdController = TextEditingController();
  final _serverUrlController = TextEditingController();
  bool _showFirebaseConfig = false;

  @override
  void initState() {
    super.initState();
    final appState = Provider.of<AppState>(context, listen: false);
    _firebaseEnabled = appState.firebaseEnabled;
    _editDeleteAll = appState.editDeleteAll;
    _wifeCanSwitch = appState.wifeCanSwitch;
    _apiKeyController.text = appState.firebaseConfig['apiKey'] ?? '';
    _projectIdController.text = appState.firebaseConfig['projectId'] ?? '';
    _authDomainController.text = appState.firebaseConfig['authDomain'] ?? '';
    _appIdController.text = appState.firebaseConfig['appId'] ?? '';
    _serverUrlController.text = appState.localServerUrl;
  }

  @override
  void dispose() {
    _apiKeyController.dispose();
    _projectIdController.dispose();
    _authDomainController.dispose();
    _appIdController.dispose();
    _serverUrlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final isHusband = appState.currentProfile == 'Husband';

    // Theme values
    final isDark = appState.theme == 'dark';
    final cardBg = isDark ? const Color(0xFF15161A) : Colors.white;
    final textDark = isDark ? const Color(0xFFF3F4F6) : const Color(0xFF1F2937);
    final textMuted = isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280);
    final borderCol = isDark ? const Color(0xFF24262B) : const Color(0xFFE5E7EB);
    final inputBg = isDark ? const Color(0xFF1C1D22) : const Color(0xFFFCFBF9);

    final primaryInteractive = isDark
        ? (appState.currentProfile == 'Husband' ? const Color(0xFFB5F148) : const Color(0xFFFF4B72))
        : (appState.currentProfile == 'Husband' ? const Color(0xFF4D7C0F) : const Color(0xFFBE185D));

    return Dialog(
      backgroundColor: cardBg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24.0),
        side: BorderSide(color: borderCol, width: 1),
      ),
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 450),
        padding: const EdgeInsets.all(20.0),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  Text(
                    'App Settings',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: textDark,
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close, color: textDark),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 15),

              // Setting Card 1: Edit/Delete/Drag
              _buildSettingRow(
                label: 'Edit & Delete (All Items)',
                subtitle: 'Enable modifying records created by other profiles.',
                textDark: textDark,
                textMuted: textMuted,
                value: _editDeleteAll,
                onChanged: (val) {
                  setState(() {
                    _editDeleteAll = val;
                  });
                },
                activeColor: primaryInteractive,
              ),
              
              // Setting Card 2: Wife Profile Switch (Only visible for Husband)
              if (isHusband) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
                  decoration: BoxDecoration(
                    color: inputBg,
                    borderRadius: BorderRadius.circular(16),
                    border: BorderSide(color: borderCol),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Wife can switch profile?',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textDark),
                            ),
                            Text(
                              'Allow profile switching from wife avatar.',
                              style: TextStyle(fontSize: 12, color: textMuted),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Segmented style control
                      ToggleButtons(
                        borderRadius: BorderRadius.circular(10),
                        selectedColor: Colors.black,
                        fillColor: primaryInteractive,
                        color: textMuted,
                        borderWidth: 1,
                        borderColor: borderCol,
                        selectedBorderColor: borderCol,
                        constraints: const BoxConstraints(minWidth: 45, minHeight: 32),
                        isSelected: [!_wifeCanSwitch, _wifeCanSwitch],
                        onPressed: (index) {
                          setState(() {
                            _wifeCanSwitch = index == 1;
                          });
                        },
                        children: const [
                          Text('No', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          Text('Yes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 12),

              // Setting Card 3: Local Server URL Sync config
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: inputBg,
                  borderRadius: BorderRadius.circular(16),
                  border: BorderSide(color: borderCol),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Local Sync Server URL',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textDark),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _serverUrlController,
                      style: TextStyle(color: textDark, fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'e.g. http://localhost:8000',
                        hintStyle: TextStyle(color: textMuted),
                        filled: true,
                        fillColor: cardBg,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: borderCol),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Setting Card 4: Firebase Cloud Sync Toggle
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
                decoration: BoxDecoration(
                  color: inputBg,
                  borderRadius: BorderRadius.circular(16),
                  border: BorderSide(color: borderCol),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        Row(
                          children: [
                            IconButton(
                              icon: Icon(
                                _showFirebaseConfig ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                color: textMuted,
                              ),
                              onPressed: () {
                                setState(() {
                                  _showFirebaseConfig = !_showFirebaseConfig;
                                });
                              },
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Firebase Cloud Sync',
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textDark),
                                ),
                                Text(
                                  'Real-time Firestore backup.',
                                  style: TextStyle(fontSize: 12, color: textMuted),
                                ),
                              ],
                            ),
                          ],
                        ),
                        Switch(
                          value: _firebaseEnabled,
                          onChanged: (val) {
                            setState(() {
                              _firebaseEnabled = val;
                              if (val) _showFirebaseConfig = true;
                            });
                          },
                          activeColor: primaryInteractive,
                        ),
                      ],
                    ),
                    if (_showFirebaseConfig) ...[
                      const Divider(height: 15),
                      const SizedBox(height: 5),
                      _buildTextField('API Key', _apiKeyController, true, textDark, textMuted, borderCol, cardBg),
                      const SizedBox(height: 10),
                      _buildTextField('Project ID', _projectIdController, false, textDark, textMuted, borderCol, cardBg),
                      const SizedBox(height: 10),
                      _buildTextField('Auth Domain', _authDomainController, false, textDark, textMuted, borderCol, cardBg),
                      const SizedBox(height: 10),
                      _buildTextField('App ID', _appIdController, true, textDark, textMuted, borderCol, cardBg),
                    ]
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Save Button
              ElevatedButton(
                onPressed: () async {
                  await appState.saveSettings(
                    firebaseEnabled: _firebaseEnabled,
                    firebaseConfig: {
                      'apiKey': _apiKeyController.text.trim(),
                      'projectId': _projectIdController.text.trim(),
                      'authDomain': _authDomainController.text.trim(),
                      'appId': _appIdController.text.trim(),
                    },
                    editDeleteAll: _editDeleteAll,
                    wifeCanSwitch: _wifeCanSwitch,
                    serverUrl: _serverUrlController.text.trim(),
                  );
                  Navigator.of(context).pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryInteractive,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 0,
                ),
                child: const Text(
                  'Save Settings',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingRow({
    required String label,
    required String subtitle,
    required Color textDark,
    required Color textMuted,
    required bool value,
    required ValueChanged<bool> onChanged,
    required Color activeColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1D22).withOpacity(0.03), // Subtle background
        borderRadius: BorderRadius.circular(16),
        border: BorderSide(color: textDark.withOpacity(0.08)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.between,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textDark),
                ),
                Text(
                  subtitle,
                  style: TextStyle(fontSize: 12, color: textMuted),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: activeColor,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller,
    bool isPassword,
    Color textDark,
    Color textMuted,
    Color borderCol,
    Color cardBg,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: textDark),
        ),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          obscureText: isPassword,
          style: TextStyle(color: textDark, fontSize: 13),
          decoration: InputDecoration(
            hintText: 'Enter $label',
            hintStyle: TextStyle(color: textMuted),
            filled: true,
            fillColor: cardBg,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: borderCol),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          ),
        ),
      ],
    );
  }
}
