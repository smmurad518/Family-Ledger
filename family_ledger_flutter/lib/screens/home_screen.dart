import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../widgets/curved_nav_bar.dart';
import '../widgets/settings_modal.dart';
import 'dashboard_screen.dart';
import 'shopping_screen.dart';
import 'expense_screen.dart';
import 'dues_screen.dart';
import 'suggestions_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<Widget> _screens = const [
    DashboardScreen(),
    ShoppingScreen(),
    DuesScreen(),
    ExpenseScreen(),
    SuggestionsScreen(), // Suggestion screen is linked from drawer
  ];

  void _onNavTap(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  void _switchScreenFromDrawer(int index) {
    setState(() {
      _currentIndex = index;
    });
    Navigator.of(context).pop(); // Close drawer
  }

  void _handleProfileToggle(AppState appState) {
    final curProfile = appState.currentProfile;

    if (curProfile == 'Wife' && !appState.wifeCanSwitch) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Wife cannot switch profile! Permission denied by Husband.'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    final newProfile = curProfile == 'Husband' ? 'Wife' : 'Husband';
    appState.switchProfile(newProfile);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Switched to $newProfile profile.'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final isDark = appState.theme == 'dark';

    // Dynamic colors based on profile and theme
    final isHusband = appState.currentProfile == 'Husband';
    final primaryColor = isHusband ? const Color(0xFFB5F148) : const Color(0xFFFF4B72);

    final bgPrimary = isDark
        ? (isHusband ? const Color(0xFF0A0A0C) : const Color(0xFF0C0A0B))
        : (isHusband ? const Color(0xFFFAF9F6) : const Color(0xFFFFF5F6));

    final cardBg = isDark
        ? (isHusband ? const Color(0xFF15161A) : const Color(0xFF171415))
        : Colors.white;

    final textDark = isDark ? const Color(0xFFF3F4F6) : const Color(0xFF1F2937);
    final textMuted = isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280);
    final borderCol = isDark ? const Color(0xFF24262B) : const Color(0xFFE5E7EB);

    final primaryInteractive = isDark
        ? primaryColor
        : (isHusband ? const Color(0xFF4D7C0F) : const Color(0xFFBE185D));

    // Sync State Dot Color
    Color syncDotColor;
    String syncLabel;
    if (appState.firebaseEnabled) {
      if (appState.syncState == 'connected') {
        syncDotColor = const Color(0xFF34D399); // Green
        syncLabel = 'Cloud Mode';
      } else if (appState.syncState == 'connecting') {
        syncDotColor = Colors.amber;
        syncLabel = 'Connecting...';
      } else {
        syncDotColor = const Color(0xFFF87171); // Red
        syncLabel = 'Sync Error';
      }
    } else {
      syncDotColor = const Color(0xFF60A5FA); // Blue
      syncLabel = 'Local Mode';
    }

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: bgPrimary,
      appBar: AppBar(
        backgroundColor: cardBg,
        elevation: 0.5,
        iconTheme: IconThemeData(color: textDark),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: borderCol, height: 1.0),
        ),
        titleSpacing: 12,
        title: Row(
          children: [
            // Logo
            Text(
              'M',
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: primaryColor,
              ),
            ),
            Text(
              '&',
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 16,
                fontWeight: FontWeight.w400,
                color: textMuted,
              ),
            ),
            Text(
              'M',
              style: TextStyle(
                fontFamily: 'Outfit',
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: primaryColor,
              ),
            ),
            const SizedBox(width: 14),
            // Sync status Pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1C1D22) : const Color(0xFFFCFBF9),
                borderRadius: BorderRadius.circular(10),
                border: BorderSide(color: borderCol),
              ),
              child: Row(
                children: [
                  Container(
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: syncDotColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    syncLabel,
                    style: TextStyle(fontSize: 10, color: textDark, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // Theme Toggle
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode : Icons.dark_mode,
              color: textDark,
              size: 20,
            ),
            onPressed: () => appState.toggleTheme(),
          ),
          // Profile switch badge
          GestureDetector(
            onTap: () => _handleProfileToggle(appState),
            child: Container(
              margin: const EdgeInsets.only(right: 12, top: 10, bottom: 10),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(20),
                border: BorderSide(color: primaryColor.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Text(
                    appState.currentProfile == 'Husband' ? '🧔' : '👩',
                    style: const TextStyle(fontSize: 14),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    appState.currentProfile,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: primaryInteractive,
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Menu Toggle
          IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => _scaffoldKey.currentState?.openEndDrawer(),
          ),
        ],
      ),
      endDrawer: Drawer(
        backgroundColor: cardBg,
        child: Column(
          children: [
            // Drawer Header
            DrawerHeader(
              decoration: BoxDecoration(
                color: primaryColor.withOpacity(0.08),
                border: BorderSide(color: borderCol, width: 0.5),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'M&M Ledger',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: primaryInteractive,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Family tracking made private & simple',
                      style: TextStyle(fontSize: 12, color: textMuted),
                    ),
                  ],
                ),
              ),
            ),
            // Nav Options
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _buildDrawerTile(0, Icons.dashboard_outlined, 'Home', textDark, primaryInteractive),
                  _buildDrawerTile(1, Icons.shopping_bag_outlined, 'Bajar List', textDark, primaryInteractive),
                  _buildDrawerTile(2, Icons.monetization_on_outlined, 'DenaPawna (Dues)', textDark, primaryInteractive),
                  _buildDrawerTile(3, Icons.list_alt_outlined, 'Needs (Expenses)', textDark, primaryInteractive),
                  _buildDrawerTile(4, Icons.lightbulb_outline, 'Next Suggestions', textDark, primaryInteractive),
                ],
              ),
            ),
            const Divider(),
            // Settings Button at bottom
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: ElevatedButton.icon(
                icon: const Icon(Icons.settings_outlined, size: 18),
                label: const Text('Settings', style: TextStyle(fontWeight: FontWeight.bold)),
                onPressed: () {
                  Navigator.of(context).pop(); // Close drawer
                  showDialog(
                    context: context,
                    builder: (context) => const SettingsModal(),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: isDark ? const Color(0xFF1C1D22) : const Color(0xFFFCFBF9),
                  foregroundColor: textDark,
                  side: BorderSide(color: borderCol),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  minimumSize: const Size.fromHeight(48),
                  elevation: 0,
                ),
              ),
            ),
          ],
        ),
      ),
      // Body switches screens (use IndexedStack to preserve state)
      body: SafeArea(
        child: IndexedStack(
          index: _currentIndex >= _screens.length ? 0 : _currentIndex,
          children: _screens,
        ),
      ),
      // Bottom Navigation bar
      bottomNavigationBar: CurvedNavBar(
        currentIndex: _currentIndex >= 4 ? 0 : _currentIndex, // Suggestion screen is open via drawer
        onTap: _onNavTap,
        backgroundColor: cardBg,
        activeColor: primaryColor,
        inactiveColor: textMuted,
        borderColor: borderCol,
        items: [
          CurvedNavItem(icon: Icons.home_outlined, label: 'Home'),
          CurvedNavItem(icon: Icons.shopping_bag_outlined, label: 'Bajar List'),
          CurvedNavItem(icon: Icons.monetization_on_outlined, label: 'DenaPawna'),
          CurvedNavItem(icon: Icons.list_alt_outlined, label: 'Needs'),
        ],
      ),
    );
  }

  Widget _buildDrawerTile(int index, IconData icon, String title, Color textDark, Color primaryInteractive) {
    final isSelected = _currentIndex == index;
    return ListTile(
      leading: Icon(icon, color: isSelected ? primaryInteractive : textDark.withOpacity(0.7)),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? primaryInteractive : textDark,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      selected: isSelected,
      onTap: () => _switchScreenFromDrawer(index),
    );
  }
}
