import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_state.dart';
import 'screens/home_screen.dart';

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
    final scaffoldBg = isDark
        ? (isHusband ? const Color(0xFF0A0A0C) : const Color(0xFF0C0A0B))
        : (isHusband ? const Color(0xFFFAF9F6) : const Color(0xFFFFF5F6));

    final cardBg = isDark
        ? (isHusband ? const Color(0xFF15161A) : const Color(0xFF171415))
        : Colors.white;

    final textDark = isDark ? const Color(0xFFF3F4F6) : const Color(0xFF1F2937);

    return MaterialApp(
      title: 'M&M Family Ledger',
      debugShowCheckedModeBanner: false,
      themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
        scaffoldBackgroundColor: scaffoldBg,
        cardColor: cardBg,
        primaryColor: primaryColor,
        dialogBackgroundColor: cardBg,
        colorScheme: ColorScheme.light(
          primary: primaryColor,
          secondary: isHusband ? const Color(0xFF0D9488) : const Color(0xFFBE185D),
          surface: cardBg,
          background: scaffoldBg,
        ),
        textTheme: TextTheme(
          bodyLarge: TextStyle(color: textDark, fontFamily: 'Nunito'),
          bodyMedium: TextStyle(color: textDark, fontFamily: 'Nunito'),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: cardBg,
          foregroundColor: textDark,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: scaffoldBg,
        cardColor: cardBg,
        primaryColor: primaryColor,
        dialogBackgroundColor: cardBg,
        colorScheme: ColorScheme.dark(
          primary: primaryColor,
          secondary: isHusband ? const Color(0xFF34D399) : const Color(0xFFF472B6),
          surface: cardBg,
          background: scaffoldBg,
        ),
        textTheme: TextTheme(
          bodyLarge: TextStyle(color: textDark, fontFamily: 'Nunito'),
          bodyMedium: TextStyle(color: textDark, fontFamily: 'Nunito'),
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: cardBg,
          foregroundColor: textDark,
        ),
      ),
      home: const HomeScreen(),
    );
  }
}
