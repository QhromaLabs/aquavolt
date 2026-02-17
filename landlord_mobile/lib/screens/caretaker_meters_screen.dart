import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../providers/landlord_provider.dart';

class CaretakerMetersScreen extends StatelessWidget {
  const CaretakerMetersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final landlord = context.watch<LandlordProvider>();
    final properties = landlord.properties;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: Text(
          'Assigned Meters',
          style: GoogleFonts.outfit(
            color: Colors.black87,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.black87),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: Colors.grey.shade100, height: 1),
        ),
      ),
      body: properties.isEmpty
          ? const Center(child: Text('No meters found'))
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: properties.length,
              itemBuilder: (context, index) {
                final property = properties[index];
                final units = property['units'] as List<dynamic>? ?? [];
                // Filter units with meters
                final meteredUnits =
                    units.where((u) => u['meters'] != null).toList();

                if (meteredUnits.isEmpty) return const SizedBox.shrink();

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12, left: 4),
                      child: Row(
                        children: [
                          const Icon(PhosphorIconsRegular.buildings,
                              size: 16, color: Colors.grey),
                          const SizedBox(width: 8),
                          Text(
                            property['name'] ?? 'Unknown Property',
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade700,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                    ...meteredUnits.map((unit) {
                      final meter = unit['meters'];
                      return _MeterListCard(
                        meterNumber: meter['meter_number'],
                        unitLabel: unit['label'],
                        status: 'Active', // Mock status
                      );
                    }),
                    const SizedBox(height: 24),
                  ],
                );
              },
            ),
    );
  }
}

class _MeterListCard extends StatelessWidget {
  final String meterNumber;
  final String unitLabel;
  final String status;

  const _MeterListCard({
    required this.meterNumber,
    required this.unitLabel,
    required this.status,
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
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              PhosphorIconsRegular.lightning,
              color: Color(0xFF1ECF49),
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  meterNumber,
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Unit $unitLabel',
                        style: GoogleFonts.outfit(
                          fontSize: 11,
                          color: Colors.grey.shade600,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      status,
                      style: GoogleFonts.outfit(
                        fontSize: 12,
                        color: const Color(0xFF1ECF49),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () {}, // QR Action
            icon: const Icon(PhosphorIconsRegular.qrCode),
            color: Colors.grey.shade400,
          ),
        ],
      ),
    );
  }
}
