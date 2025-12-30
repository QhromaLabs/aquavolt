import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:go_router/go_router.dart';
import '../providers/landlord_provider.dart';

class MetersScreen extends StatefulWidget {
  const MetersScreen({super.key});

  @override
  State<MetersScreen> createState() => _MetersScreenState();
}

class _MetersScreenState extends State<MetersScreen> {
  Future<void> _refresh() async {
    await context.read<LandlordProvider>().refresh();
  }

  void _showQrDialog(Map<String, dynamic> unit) {
    final qrData = jsonEncode({
      'action': 'claim_unit',
      'unit_id': unit['id'],
      'property_id': unit['property_id'],
    });

    final propertyName = unit['properties']?['name'] ?? 'Unknown Property';
    final unitLabel = unit['label'] ?? 'Unknown Unit';

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                propertyName,
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Unit: $unitLabel',
                style: const TextStyle(fontSize: 16),
              ),
              const SizedBox(height: 24),
              SizedBox(
                height: 250,
                width: 250,
                child: QrImageView(
                  data: qrData,
                  version: QrVersions.auto,
                  size: 250.0,
                  backgroundColor: Colors.white,
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Scan this code with the Aquavolt App to claim this unit.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF1ECF49),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Meters', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(PhosphorIconsRegular.arrowClockwise),
            onPressed: _refresh,
          ),
        ],
      ),
      body: Consumer<LandlordProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final propertyId = GoRouterState.of(context).uri.queryParameters['propertyId'];
          
          List<Map<String, dynamic>> displayedUnits = provider.units;
          if (propertyId != null) {
            displayedUnits = displayedUnits.where((u) {
              final pId = u['property_id'] ?? u['properties']?['id'];
              return pId.toString() == propertyId;
            }).toList();
          }

          if (displayedUnits.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(PhosphorIconsRegular.lightningSlash, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No meters found', style: TextStyle(fontSize: 18, color: Colors.grey)),
                  SizedBox(height: 8),
                  Text('Add units to your properties to see them here.', style: TextStyle(color: Colors.grey)),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: displayedUnits.length,
            separatorBuilder: (ctx, i) => const SizedBox(height: 12),
            itemBuilder: (ctx, i) {
              final unit = displayedUnits[i];
              final meterNumber = unit['meter_number'] ?? 'No Meter';
              final propertyName = unit['properties']?['name'] ?? 'Unknown';
              final label = unit['label'] ?? 'Unknown';
              final status = unit['status'] ?? 'vacant';

              return Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF7E6),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(PhosphorIconsFill.lightning, color: Color(0xFFFAAD14)),
                  ),
                  title: Text(
                    meterNumber,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(PhosphorIconsRegular.house, size: 14, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text('$propertyName • Unit $label', style: const TextStyle(color: Colors.grey)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: status == 'occupied' ? const Color(0xFFE6FFFB) : const Color(0xFFFFF7E6),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(
                            color: status == 'occupied' ? const Color(0xFF5CDBD3) : const Color(0xFFFFD591),
                          ),
                        ),
                        child: Text(
                          status == 'occupied' ? 'Occupied' : 'Vacant',
                          style: TextStyle(
                            fontSize: 11,
                            color: status == 'occupied' ? const Color(0xFF13C2C2) : const Color(0xFFFA8C16),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  trailing: IconButton(
                    icon: const Icon(PhosphorIconsRegular.qrCode),
                    onPressed: () => _showQrDialog(unit),
                    tooltip: 'Generate QR',
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xFFF0F5FF),
                      foregroundColor: const Color(0xFF2F54EB),
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
