import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  String _selectedProfile = 'Husband';
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(() {
      if (_errorMessage != null) {
        setState(() => _errorMessage = null);
      }
      final pass = _passwordController.text.trim();
      final appState = Provider.of<AppState>(context, listen: false);
      final users = appState.users;
      if (pass.isNotEmpty) {
        if (users['Wife'] == pass && users['Husband'] != pass && _selectedProfile != 'Wife') {
          setState(() => _selectedProfile = 'Wife');
        } else if (users['Husband'] == pass && users['Wife'] != pass && _selectedProfile != 'Husband') {
          setState(() => _selectedProfile = 'Husband');
        }
      }
    });
  }

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  void _login() async {
    final password = _passwordController.text.trim();
    if (password.isEmpty) return;
    
    final appState = Provider.of<AppState>(context, listen: false);
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    bool success = await appState.login(_selectedProfile, password);
    setState(() => _isLoading = false);

    if (!success) {
      setState(() {
        _errorMessage = 'Incorrect password! Please enter the correct password.';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: const [
              Icon(Icons.error_outline, color: Colors.white, size: 24),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Incorrect password! Please enter the correct password.',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ],
          ),
          backgroundColor: Colors.redAccent.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          margin: const EdgeInsets.all(16),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final isDark = appState.theme == 'dark';

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode : Icons.dark_mode,
            ),
            tooltip: 'Toggle Theme',
            onPressed: () => appState.toggleTheme(),
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.family_restroom, size: 80, color: Colors.blueGrey),
              const SizedBox(height: 20),
              const Text(
                'Welcome to M&M',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 36),
              DropdownButtonFormField<String>(
                value: _selectedProfile,
                decoration: const InputDecoration(
                  labelText: 'Select Profile',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'Husband', child: Text('Husband 🧔')),
                  DropdownMenuItem(value: 'Wife', child: Text('Wife 👩')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _selectedProfile = val;
                      _errorMessage = null;
                    });
                  }
                },
              ),
              const SizedBox(height: 20),
              if (_errorMessage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.red.shade900.withOpacity(0.3) : Colors.red.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade400, width: 1.5),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.error, color: isDark ? Colors.redAccent : Colors.red.shade700, size: 22),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: TextStyle(
                            color: isDark ? Colors.red.shade200 : Colors.red.shade900,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Password',
                  border: const OutlineInputBorder(),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: _errorMessage != null ? Colors.red : Theme.of(context).primaryColor,
                      width: 2,
                    ),
                  ),
                ),
              ),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => _showForgotPasswordDialog(context),
                  child: const Text('Forgot Password?'),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _isLoading ? null : _login,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _isLoading 
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Text('Login', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showForgotPasswordDialog(BuildContext context) {
    String resetProfile = _selectedProfile;
    final codeController = TextEditingController();
    final newPassController = TextEditingController();
    String? generatedCode;
    int currentStep = 1;

    showDialog(
      context: context,
      builder: (dialogCtx) => StatefulBuilder(
        builder: (context, setModalState) {
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Row(
              children: const [
                Icon(Icons.lock_reset, color: Colors.blueAccent),
                SizedBox(width: 8),
                Text('Forgot Password', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (currentStep == 1) ...[
                    const Text(
                      'An approval code will be sent to the administrator email:\nsmmurad518@gmail.com',
                      style: TextStyle(fontSize: 13, color: Colors.grey),
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: resetProfile,
                      decoration: const InputDecoration(
                        labelText: 'Select Profile to Reset',
                        border: OutlineInputBorder(),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Husband', child: Text('Husband 🧔')),
                        DropdownMenuItem(value: 'Wife', child: Text('Wife 👩')),
                      ],
                      onChanged: (val) {
                        if (val != null) setModalState(() => resetProfile = val);
                      },
                    ),
                  ] else if (currentStep == 2) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.green.shade400),
                      ),
                      child: const Text(
                        'Approval code sent to smmurad518@gmail.com!\nEnter the 6-digit approval code below:',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: codeController,
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      maxLength: 6,
                      style: const TextStyle(fontSize: 22, letterSpacing: 6, fontWeight: FontWeight.bold),
                      decoration: const InputDecoration(
                        labelText: '6-Digit Code',
                        counterText: '',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ] else if (currentStep == 3) ...[
                    Text(
                      'Approved! Set new password for $resetProfile:',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: newPassController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'New Password (min 3 chars)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogCtx).pop(),
                child: const Text('Cancel'),
              ),
              if (currentStep == 1)
                ElevatedButton(
                  onPressed: () {
                    final code = (100000 + (DateTime.now().millisecondsSinceEpoch % 900000)).toString();
                    generatedCode = code;
                    setModalState(() => currentStep = 2);
                  },
                  child: const Text('Send Email ✉️'),
                )
              else if (currentStep == 2)
                ElevatedButton(
                  onPressed: () {
                    if (codeController.text.trim() == generatedCode) {
                      setModalState(() => currentStep = 3);
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Invalid code! Check smmurad518@gmail.com')),
                      );
                    }
                  },
                  child: const Text('Verify Code'),
                )
              else if (currentStep == 3)
                ElevatedButton(
                  onPressed: () async {
                    final newPass = newPassController.text.trim();
                    if (newPass.length < 3) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Password must be at least 3 characters.')),
                      );
                      return;
                    }
                    final appState = Provider.of<AppState>(context, listen: false);
                    await appState.changeUserPassword(resetProfile, newPass);
                    Navigator.of(dialogCtx).pop();
                    setState(() => _selectedProfile = resetProfile);
                    if (context.mounted) {
                      showDialog(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          content: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.check_circle_rounded, color: Colors.green, size: 58),
                              const SizedBox(height: 14),
                              const Text('Password Updated! 🎉', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              Text('Password for $resetProfile has been successfully updated! You can now log in.', textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: Colors.grey)),
                              const SizedBox(height: 18),
                              ElevatedButton(
                                onPressed: () => Navigator.of(ctx).pop(),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.green,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  minimumSize: const Size.fromHeight(42),
                                ),
                                child: const Text('Login Now 🚀', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        ),
                      );
                    }
                  },
                  child: const Text('Save Password'),
                ),
            ],
          );
        },
      ),
    );
  }
}
