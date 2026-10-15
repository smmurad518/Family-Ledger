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

  void _login() async {
    if (_passwordController.text.isEmpty) return;
    
    final appState = Provider.of<AppState>(context, listen: false);
    setState(() => _isLoading = true);
    bool success = await appState.login(_selectedProfile, _passwordController.text);
    setState(() => _isLoading = false);

    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Incorrect password!'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(Icons.family_restroom, size: 80, color: Colors.blueGrey),
              const SizedBox(height: 24),
              const Text(
                'Welcome to M&M',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 48),
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
                  if (val != null) setState(() => _selectedProfile = val);
                },
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _login,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Login', style: TextStyle(fontSize: 18)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
