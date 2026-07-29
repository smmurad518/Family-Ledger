import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final isDark = appState.theme == 'dark';

    // Theme tokens
    final textDark = isDark ? const Color(0xFFF3F4F6) : const Color(0xFF1F2937);
    final textMuted = isDark ? const Color(0xFF9CA3AF) : const Color(0xFF6B7280);
    final primaryColor = appState.currentProfile == 'Husband' 
        ? const Color(0xFFB5F148) 
        : const Color(0xFFFF4B72);

    final bannerBg = isDark 
        ? const Color(0xFF15161A) 
        : primaryColor.withOpacity(0.08);

    // Calculate Stats
    final pendingBajarCount = appState.shoppingItems.where((item) => !item.bought).length;
    
    final totalPawna = appState.dueItems
        .where((item) => item.type == 'take' && item.status == 'pending')
        .fold<double>(0.0, (sum, item) => sum + item.amount);

    final totalDena = appState.dueItems
        .where((item) => item.type == 'give' && item.status == 'pending')
        .fold<double>(0.0, (sum, item) => sum + item.amount);

    final totalNeeds = appState.expenseItems
        .fold<double>(0.0, (sum, item) => sum + item.amount);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Welcome Banner
          Container(
            padding: const EdgeInsets.all(20.0),
            decoration: BoxDecoration(
              color: bannerBg,
              borderRadius: BorderRadius.circular(24.0),
              border: BorderSide(
                color: isDark ? const Color(0xFF24262B) : primaryColor.withOpacity(0.15),
                width: 1,
              ),
              boxShadow: isDark ? [] : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Hello, ',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 22,
                        fontWeight: FontWeight.w400,
                        color: textDark,
                      ),
                    ),
                    Text(
                      '${appState.currentProfile}!',
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: primaryColor,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  "Welcome back to your family ledger. Let's see what's happening today.",
                  style: TextStyle(
                    fontSize: 14,
                    color: textMuted,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),

          // Stats Grid
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.25,
            children: [
              // Pending Bajar
              _buildStatCard(
                title: 'Bajar List',
                value: '$pendingBajarCount',
                subtitle: 'Pending Items',
                backgroundColor: const Color(0xFF34D399).withOpacity(0.1),
                borderColor: const Color(0xFF34D399).withOpacity(0.2),
                valueColor: const Color(0xFF34D399),
                icon: Icons.shopping_bag_outlined,
                textDark: textDark,
                textMuted: textMuted,
              ),
              
              // Receivables (Pawna)
              _buildStatCard(
                title: 'Pawna',
                value: '৳ ${totalPawna.toStringAsFixed(0)}',
                subtitle: 'Receivables',
                backgroundColor: const Color(0xFF60A5FA).withOpacity(0.1),
                borderColor: const Color(0xFF60A5FA).withOpacity(0.2),
                valueColor: const Color(0xFF60A5FA),
                icon: Icons.trending_up,
                textDark: textDark,
                textMuted: textMuted,
              ),

              // Payables (Dena)
              _buildStatCard(
                title: 'Dena',
                value: '৳ ${totalDena.toStringAsFixed(0)}',
                subtitle: 'Payables',
                backgroundColor: const Color(0xFFF87171).withOpacity(0.1),
                borderColor: const Color(0xFFF87171).withOpacity(0.2),
                valueColor: const Color(0xFFF87171),
                icon: Icons.trending_down,
                textDark: textDark,
                textMuted: textMuted,
              ),

              // Needs Budget
              _buildStatCard(
                title: 'Needs',
                value: '৳ ${totalNeeds.toStringAsFixed(0)}',
                subtitle: 'Total Needed',
                backgroundColor: primaryColor.withOpacity(0.1),
                borderColor: primaryColor.withOpacity(0.2),
                valueColor: primaryColor,
                icon: Icons.monetization_on_outlined,
                textDark: textDark,
                textMuted: textMuted,
              ),
            ],
          ),

          const SizedBox(height: 25),

          // Overview Header
          Text(
            'Quick Summary',
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: textDark,
            ),
          ),
          const SizedBox(height: 10),

          // A decorative summary box
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF15161A) : Colors.white,
              borderRadius: BorderRadius.circular(16.0),
              border: BorderSide(
                color: isDark ? const Color(0xFF24262B) : const Color(0xFFE5E7EB),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.amber.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.info_outline, color: Colors.amber, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Net Balance Status',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textDark),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        totalPawna >= totalDena
                            ? 'You are in positive standing (Receiving ৳ ${(totalPawna - totalDena).toStringAsFixed(0)} net).'
                            : 'You have net dues of ৳ ${(totalDena - totalPawna).toStringAsFixed(0)} to clear.',
                        style: TextStyle(fontSize: 12, color: textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String subtitle,
    required Color backgroundColor,
    required Color borderColor,
    required Color valueColor,
    required IconData icon,
    required Color textDark,
    required Color textMuted,
  }) {
    return Container(
      padding: const EdgeInsets.all(14.0),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20.0),
        border: BorderSide(color: borderColor, width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: textDark.withOpacity(0.8),
                ),
              ),
              Icon(icon, color: valueColor, size: 18),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: valueColor,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 10,
                  color: textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
