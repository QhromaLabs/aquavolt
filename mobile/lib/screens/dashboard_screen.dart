import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart'; // Import Google Fonts
import 'package:phosphor_flutter/phosphor_flutter.dart'; // Import Phosphor
import '../providers/auth_provider.dart';
import '../providers/tenant_provider.dart';
import '../widgets/scan_modal.dart';
import '../widgets/token_history_card.dart'; // Import TokenHistoryCard
import '../widgets/top_toast.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch data on load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TenantProvider>().fetchData();
    });
  }

  void _handleScan(String rawData) async {
    // Show loading?
    showTopToast(context, 'Processing QR Code...', type: ToastType.info);

    final error = await context.read<TenantProvider>().linkUnit(rawData);
    
    if (!mounted) return;
    
    if (error != null) {
      showTopToast(context, error, type: ToastType.error);
    } else {
      showTopToast(context, 'Unit linked successfully!', type: ToastType.success);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final tenant = context.watch<TenantProvider>();
    
    final user = auth.user;
    final firstName = user?.userMetadata?['full_name']?.split(' ')[0] ?? 'Tenant';
    final primaryUnit = tenant.units.isNotEmpty ? tenant.units[0] : null;
    final recentTopups = tenant.topups.take(3).toList();

    return Scaffold(
      body: tenant.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea( // Replaced AppBar with SafeArea + Custom Header
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // --- Custom Header ---
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hello,',
                              style: TextStyle(
                                fontSize: 16, // Increased from 13
                                color: Colors.grey.shade600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Text(
                                  firstName,
                                  style: const TextStyle(
                                    fontSize: 32, // Increased from 24
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Text('👋', style: TextStyle(fontSize: 32)), // Increased emoji too
                              ],
                            ),
                          ],
                        ),
                        Row(
                          children: [
                            // Scan Button
                            Material(
                              color: Colors.white,
                              shape: const CircleBorder(),
                              elevation: 2,
                              shadowColor: Colors.black12,
                              child: InkWell(
                                customBorder: const CircleBorder(),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => ScanModal(onScan: _handleScan),
                                    ),
                                  );
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  child: Icon(PhosphorIcons.qrCode(), color: Colors.black87),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Notification Button
                            Material(
                              color: Colors.white,
                              shape: const CircleBorder(),
                              elevation: 2,
                              shadowColor: Colors.black12,
                              child: InkWell(
                                customBorder: const CircleBorder(),
                                onTap: () => context.push('/notifications'),
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  child: Icon(PhosphorIcons.bell(), color: Colors.black87),
                                ),
                              ),
                            ),
                          ],
                        )
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Main Card
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF1ECF49), Color(0xFF0EB53E)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF1ECF49).withValues(alpha: 0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Stack(
                        children: [
                          // Decorative Circles
                          Positioned(
                            top: -20,
                            right: -20,
                            child: Container(
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: -30,
                            left: -10,
                            child: Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                          
                          // Content
                          Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (primaryUnit != null) ...[
                                  const Text(
                                    'Meter Number',
                                    style: TextStyle(color: Colors.white70, fontSize: 13),
                                  ),
                                  Row(
                                    children: [
                                      Text(
                                        primaryUnit['meterNumber'] ?? 'N/A',
                                        style: GoogleFonts.spaceMono( // Use Techy Font (Space Mono)
                                          textStyle: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 28,
                                            fontWeight: FontWeight.bold,
                                            letterSpacing: 1,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      InkWell(
                                        onTap: () {
                                          if (primaryUnit['meterNumber'] != null) {
                                            // TODO: Copy to clipboard
                                            showTopToast(context, 'Copied Meter Number', type: ToastType.success);
                                          }
                                        },
                                        child: Icon(PhosphorIcons.copy(), color: Colors.white70, size: 20),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Apartment', style: TextStyle(color: Colors.white70, fontSize: 12)),
                                          Text(
                                            primaryUnit['propertyName'] ?? 'Unknown',
                                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('Unit', style: TextStyle(color: Colors.white70, fontSize: 12)),
                                          Text(
                                            primaryUnit['unitLabel'] ?? 'Unknown',
                                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ] else
                                  const Center(
                                    child: Text(
                                      'No Unit Assigned',
                                      style: TextStyle(color: Colors.white, fontSize: 18),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Quick Actions
                    const Text('Quick Actions', style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.bold,
                    )),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _ActionCard(
                            icon: PhosphorIcons.lightning(),
                            iconColor: const Color(0xFF1ECF49),
                            bgColor: const Color(0xFFE6F9EB),
                            label: 'Buy Token',
                            onTap: () => context.push('/buy-token'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _ActionCard(
                            icon: PhosphorIcons.clock(),
                            iconColor: const Color(0xFFFA8C16),
                            bgColor: const Color(0xFFFFF7E6),
                            label: 'History',
                            onTap: () => context.push('/history'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                       children: [
                        Expanded(
                          child: _ActionCard(
                            icon: PhosphorIcons.user(),
                            iconColor: const Color(0xFF1890FF),
                            bgColor: const Color(0xFFE6F7FF),
                            label: 'Profile',
                            onTap: () => context.push('/profile'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _ActionCard(
                            icon: PhosphorIcons.headset(),
                            iconColor: const Color(0xFF25D366),
                            bgColor: const Color(0xFFF0F5FF),
                            label: 'Contact Support',
                            onTap: () {}, // TODO: Url Launcher
                          ),
                        ),
                      ], 
                    ),

                    const SizedBox(height: 24),

                    // Recent Tokens
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Recent Tokens', style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold,
                        )),
                        TextButton(
                          onPressed: () => context.push('/history'),
                          child: const Text('View All'),
                        ),
                      ],
                    ),
                    
                    if (recentTopups.isEmpty)
                      const Center(child: Padding(
                        padding: EdgeInsets.all(20.0),
                        child: Text('No tokens yet'),
                      ))
                    else
                      ...recentTopups.map((t) => TokenHistoryCard(tokenData: t)),
                  ],
                ),
              ),
            ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String label;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03), // Lighter shadow as per react
              spreadRadius: 0,
              blurRadius: 10,
              offset: const Offset(0, 2),
            )
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: bgColor,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
