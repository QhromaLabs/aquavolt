import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../providers/auth_provider.dart';
import '../providers/landlord_provider.dart';
import '../widgets/top_toast.dart';

class LandlordDashboardScreen extends StatefulWidget {
  const LandlordDashboardScreen({super.key});

  @override
  State<LandlordDashboardScreen> createState() => _LandlordDashboardScreenState();
}

class _LandlordDashboardScreenState extends State<LandlordDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LandlordProvider>().fetchData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final landlord = context.watch<LandlordProvider>();
    
    final firstName = auth.profile?['full_name']?.split(' ')[0] ?? 'Landlord';

    return Scaffold(
      body: landlord.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // --- Header ---
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Portfolio Overview,',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey.shade600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Text(
                                  firstName,
                                  style: const TextStyle(
                                    fontSize: 32,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                const Text('🏢', style: TextStyle(fontSize: 32)),
                              ],
                            ),
                          ],
                        ),
                        Material(
                          color: Colors.white,
                          shape: const CircleBorder(),
                          elevation: 2,
                          shadowColor: Colors.black12,
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: () {}, // TODO: Notifications
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              child: Icon(PhosphorIcons.bell(), color: Colors.black87),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Revenue Card
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
                          Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Total Monthly Revenue',
                                  style: TextStyle(color: Colors.white70, fontSize: 13),
                                ),
                                Text(
                                  'KSh ${landlord.totalRevenue.toStringAsFixed(2)}',
                                  style: GoogleFonts.spaceMono(
                                    textStyle: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 32,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    _MiniStat(label: 'Properties', value: landlord.properties.length.toString()),
                                    const SizedBox(width: 24),
                                    _MiniStat(label: 'Total Units', value: landlord.totalUnitsCount.toString()),
                                    const SizedBox(width: 24),
                                    _MiniStat(label: 'Occupied', value: landlord.activeTenantsCount.toString()),
                                  ],
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
                          child: _LandlordActionCard(
                            icon: PhosphorIcons.plus(),
                            iconColor: const Color(0xFF1ECF49),
                            bgColor: const Color(0xFFE6F9EB),
                            label: 'Add Property',
                            onTap: () => context.push('/add-property'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _LandlordActionCard(
                            icon: PhosphorIcons.wallet(),
                            iconColor: const Color(0xFFFA8C16),
                            bgColor: const Color(0xFFFFF7E6),
                            label: 'View Wallet',
                            onTap: () => context.push('/wallet'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                       children: [
                        Expanded(
                          child: _LandlordActionCard(
                            icon: PhosphorIcons.users(),
                            iconColor: const Color(0xFF1890FF),
                            bgColor: const Color(0xFFE6F7FF),
                            label: 'Tenants Hub',
                            onTap: () => context.push('/tenants'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _LandlordActionCard(
                            icon: PhosphorIcons.chartBar(),
                            iconColor: const Color(0xFF722ED1),
                            bgColor: const Color(0xFFF9F0FF),
                            label: 'Reports',
                            onTap: () => context.push('/reports'),
                          ),
                        ),
                      ], 
                    ),

                    const SizedBox(height: 24),

                    // Recent Vends
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Recent Vends', style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold,
                        )),
                        TextButton(
                          onPressed: () {},
                          child: const Text('View All'),
                        ),
                      ],
                    ),
                    
                    if (landlord.topups.isEmpty)
                      const Center(child: Padding(
                        padding: EdgeInsets.all(20.0),
                        child: Text('No transactions yet'),
                      ))
                    else
                      ...landlord.topups.take(5).map((t) => _LandlordVendCard(vendData: t)),
                  ],
                ),
              ),
            ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  const _MiniStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
      ],
    );
  }
}

class _LandlordVendCard extends StatelessWidget {
  final Map<String, dynamic> vendData;
  const _LandlordVendCard({required this.vendData});

  @override
  Widget build(BuildContext context) {
    final unit = vendData['units'] ?? {};
    final property = unit['properties'] ?? {};
    final tenantName = vendData['profiles']?['full_name'] ?? 'Unknown Tenant';
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFE6F9EB),
              shape: BoxShape.circle,
            ),
            child: Icon(PhosphorIcons.lightning(), color: const Color(0xFF1ECF49), size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tenantName,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                Text(
                  '${property['name'] ?? 'Unknown'} - Unit ${unit['label'] ?? 'N/A'}',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '+ KSh ${vendData['amount_paid']}',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1ECF49)),
              ),
              Text(
                'Today',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 10),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LandlordActionCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String label;
  final VoidCallback onTap;

  const _LandlordActionCard({
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
              color: Colors.black.withValues(alpha: 0.03),
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
