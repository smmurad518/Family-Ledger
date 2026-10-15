import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_state.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ChangeNotifierProvider(
      create: (context) => AppState(),
      child: const FamilyLedgerApp(),
    ),
  );
}

class FamilyLedgerApp extends StatelessWidget {
  const FamilyLedgerApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final isDark = appState.theme == 'dark';
    final isHusband = appState.currentProfile == 'Husband';

    // Theme setup based on profile & theme settings
    final primaryColor = isHusband ? const Color(0xFFB5F148) : const Color(0xFFFF4B72);
    final lightScaffoldBg = isHusband ? const Color(0xFFFAF9F6) : const Color(0xFFFFF5F6);
    final darkScaffoldBg = isHusband ? const Color(0xFF0A0A0C) : const Color(0xFF0C0A0B);

    final lightCardBg = Colors.white;
    final darkCardBg = isHusband ? const Color(0xFF15161A) : const Color(0xFF171415);

    const lightTextDark = Color(0xFF1F2937);
    const darkTextDark = Color(0xFFF3F4F6);

    return MaterialApp(
      title: 'M&M Family Ledger',
      debugShowCheckedModeBanner: false,
      themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        scaffoldBackgroundColor: lightScaffoldBg,
        cardColor: lightCardBg,
        primaryColor: primaryColor,
        dialogBackgroundColor: lightCardBg,
        colorScheme: ColorScheme.light(
          primary: primaryColor,
          secondary: isHusband ? const Color(0xFF0D9488) : const Color(0xFFBE185D),
          surface: lightCardBg,
          background: lightScaffoldBg,
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: lightTextDark, fontFamily: 'Nunito'),
          bodyMedium: TextStyle(color: lightTextDark, fontFamily: 'Nunito'),
          titleLarge: TextStyle(color: lightTextDark, fontFamily: 'Outfit', fontWeight: FontWeight.bold),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: lightTextDark,
          elevation: 0.5,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: darkScaffoldBg,
        cardColor: darkCardBg,
        primaryColor: primaryColor,
        dialogBackgroundColor: darkCardBg,
        colorScheme: ColorScheme.dark(
          primary: primaryColor,
          secondary: isHusband ? const Color(0xFF34D399) : const Color(0xFFF472B6),
          surface: darkCardBg,
          background: darkScaffoldBg,
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: darkTextDark, fontFamily: 'Nunito'),
          bodyMedium: TextStyle(color: darkTextDark, fontFamily: 'Nunito'),
          titleLarge: TextStyle(color: darkTextDark, fontFamily: 'Outfit', fontWeight: FontWeight.bold),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: darkCardBg,
          foregroundColor: darkTextDark,
          elevation: 0.5,
        ),
      ),
      home: appState.loggedInUser == null ? const LoginScreen() : const HomeScreen(),
    );
  }
}
