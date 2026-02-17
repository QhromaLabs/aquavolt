import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../providers/auth_provider.dart';
import '../providers/landlord_provider.dart';

class CaretakerDashboardScreen extends StatefulWidget {
  const CaretakerDashboardScreen({super.key});

  @override
  State<CaretakerDashboardScreen> createState() =>
      _CaretakerDashboardScreenState();
}

class _CaretakerDashboardScreenState extends State<CaretakerDashboardScreen> {
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

    final firstName = auth.profile?['full_name']?.split(' ')[0] ?? 'Caretaker';

    // Mock property data for now, ideally filter properties assigned to this caretaker
    final propertyCount = landlord.properties.length;
    final tenantCount = landlord.activeTenantsCount;
    final occupiedCount = landlord.activeTenantsCount;

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
                              'Hello,',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey.shade600,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              firstName,
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
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
                              child: Icon(PhosphorIcons.bell(),
                                  color: Colors.black87),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Property Info Green Card
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF1ECF49), Color(0xFF15B040)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color:
                                const Color(0xFF1ECF49).withValues(alpha: 0.25),
                            blurRadius: 15,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            top: -20,
                            right: -20,
                            child: Container(
                              width: 120,
                              height: 120,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.08),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: -10,
                            left: -10,
                            child: Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.05),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(28),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(PhosphorIconsRegular.buildings,
                                              color: Colors.white, size: 14),
                                          const SizedBox(width: 4),
                                          Text(
                                            'Assigned Property',
                                            style: GoogleFonts.outfit(
                                              color: Colors.white,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'AquaVolt Estate', // Placeholder
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontSize: 26,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 32),
                                Row(
                                  children: [
                                    _MiniStat(
                                        label: 'Tenants',
                                        value: tenantCount.toString()),
                                    Container(
                                      height: 30,
                                      width: 1,
                                      margin:
                                          const EdgeInsets.symmetric(horizontal: 24),
                                      color: Colors.white.withValues(alpha: 0.3),
                                    ),
                                    _MiniStat(
                                        label: 'Occupied',
                                        value: occupiedCount.toString()),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Action Buttons (Tenant Hub, Meters, Support)
                    Row(
                      children: [
                        Expanded(
                          child: _LandlordActionCard(
                            icon: PhosphorIcons.users(),
                            iconColor: const Color(0xFF1890FF),
                            bgColor: const Color(0xFFE6F7FF),
                            label: 'Tenant Hub',
                            onTap: () => context.go('/caretaker/tenants'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _LandlordActionCard(
                            icon: PhosphorIcons.lightning(),
                            iconColor: const Color(0xFFFA8C16),
                            bgColor: const Color(0xFFFFF7E6),
                            label: 'Meters',
                            onTap: () => context.go('/caretaker/meters'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _LandlordActionCard(
                            icon: PhosphorIcons.headset(),
                            iconColor: const Color(0xFF722ED1),
                            bgColor: const Color(0xFFF9F0FF),
                            label: 'Support',
                            onTap: () {}, // TODO: Contact Support
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 32),

                    // Meters List
                    const Text('Assigned Meters',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        )),
                    const SizedBox(height: 12),

                    // Example list of meters - using mock or real data if available
                    // For now, list Topups/Vends or Meters from LandlordProvider
                    // But requirement says "Meters assigned to property with qr button"
                    // Assuming we list meters, not vends.
                    // If LandlordProvider has meters, use that.
                    if (landlord.properties.isEmpty)
                      const Center(
                          child: Padding(
                        padding: EdgeInsets.all(20.0),
                        child: Text('No assigned properties found.'),
                      ))
                    else
                      // Flatten meters from properties
                      ...landlord.properties.expand((prop) {
                        final units = (prop['units'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ?? [];
                        return units
                            .where((u) => u['meter_number'] != null && u['meter_number'].toString().isNotEmpty)
                            .map((unit) {
                          return _CaretakerMeterCard(
                            unit: unit,
                            propertyName: prop['name'], 
                          );
                        });
                      }).take(20),
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
        Text(label,
            style: const TextStyle(color: Colors.white70, fontSize: 11)),
        Text(value,
            style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18)),
      ],
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
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
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
            const SizedBox(height: 12),
            Text(
              label,
              style: GoogleFonts.outfit(
                fontWeight: FontWeight.w500,
                fontSize: 13,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _CaretakerMeterCard extends StatelessWidget {
  final Map<String, dynamic> unit;
  final String propertyName;

  const _CaretakerMeterCard({
    required this.unit,
    required this.propertyName,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(PhosphorIconsRegular.lightning,
                color: Colors.black54, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  unit['meter_number'] ?? 'Unknown Meter',
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$propertyName • Unit ${unit['label']}',
                  style: GoogleFonts.outfit(
                    color: Colors.grey.shade500,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () {
              // TODO: Show QR code
            },
            icon: const Icon(PhosphorIconsRegular.qrCode),
            style: IconButton.styleFrom(
              backgroundColor: const Color(0xFFF0FDF4),
              foregroundColor: const Color(0xFF1ECF49),
              padding: const EdgeInsets.all(12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
