import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/landlord_provider.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  Future<void> _refresh() async {
    await context.read<LandlordProvider>().refresh();
  }

  @override
  Widget build(BuildContext context) {
    final landlord = context.watch<LandlordProvider>();
    final units = landlord.units;
    final issues = landlord.issues;

    final propertyId = GoRouterState.of(context).uri.queryParameters['propertyId'];

    // Filter Logic
    List<Map<String, dynamic>> displayedUnits = units;
    List<Map<String, dynamic>> displayedIssues = issues;
    double displayedRevenue = landlord.totalRevenue;

    if (propertyId != null) {
      displayedUnits = units.where((u) {
         final pId = u['property_id'] ?? u['properties']?['id'];
         return pId.toString() == propertyId;
      }).toList();

      displayedIssues = issues.where((i) {
         final unit = i['units'] ?? {};
         final pId = unit['property_id'] ?? unit['properties']?['id'];
         return pId.toString() == propertyId;
      }).toList();

      // Recalculate revenue for specific property
      final propertyTopups = landlord.topups.where((t) {
         final unit = t['units'] ?? {};
         final pId = unit['property_id'] ?? unit['properties']?['id'];
         return pId.toString() == propertyId;
      }).toList();
      
      displayedRevenue = propertyTopups.fold(0.0, (sum, item) => sum + (double.tryParse(item['amount_paid'].toString()) ?? 0.0));
    }

    int totalUnits = displayedUnits.length;
    int occupiedUnits = displayedUnits.where((u) => u['status'] == 'occupied').length;
    double occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) : 0.0;
    
    // Status counting logic
    int pendingIssues = displayedIssues.where((i) => i['status'] == 'pending' || i['status'] == 'new' || i['status'] == 'open').length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports & Analytics'),
        actions: [
          IconButton(
            icon: const Icon(PhosphorIconsRegular.arrowClockwise),
            onPressed: _refresh,
          ),
        ],
      ),
      body: landlord.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Occupancy Overview
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Occupancy Rate',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: occupancyRate >= 0.8
                                    ? const Color(0xFFF6FFED)
                                    : (occupancyRate >= 0.5 ? const Color(0xFFFFF7E6) : const Color(0xFFFFF1F0)),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '${(occupancyRate * 100).toStringAsFixed(1)}%',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: occupancyRate >= 0.8
                                      ? const Color(0xFF52C41A)
                                      : (occupancyRate >= 0.5 ? const Color(0xFFFA8C16) : const Color(0xFFF5222D)),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: LinearProgressIndicator(
                            value: occupancyRate,
                            minHeight: 12,
                            backgroundColor: Colors.grey[100],
                            valueColor: AlwaysStoppedAnimation<Color>(
                              occupancyRate >= 0.8
                                  ? const Color(0xFF52C41A)
                                  : (occupancyRate >= 0.5 ? const Color(0xFFFA8C16) : const Color(0xFFF5222D)),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            _LegendItem(color: Colors.grey[400]!, label: 'Vacant (${totalUnits - occupiedUnits})'),
                            const SizedBox(width: 16),
                            _LegendItem(
                              color: occupancyRate >= 0.8
                                  ? const Color(0xFF52C41A)
                                  : (occupancyRate >= 0.5 ? const Color(0xFFFA8C16) : const Color(0xFFF5222D)),
                              label: 'Occupied ($occupiedUnits)',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Quick Stats Row
                  Row(
                    children: [
                      Expanded(
                        child: _ReportStatCard(
                          icon: PhosphorIconsFill.warningCircle,
                          iconColor: const Color(0xFFF5222D),
                          label: 'Pending Issues',
                          value: pendingIssues.toString(),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _ReportStatCard(
                          icon: PhosphorIconsFill.coins,
                          iconColor: const Color(0xFF1ECF49),
                          label: 'Revenue (Mo.)',
                          value: '${displayedRevenue.toInt()}', // Simplified for demo
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),
                  const Text('Maintenance Issues', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),

                  if (displayedIssues.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade100),
                      ),
                      child: const Column(
                        children: [
                          Icon(PhosphorIconsRegular.checkCircle, size: 48, color: Colors.grey),
                          SizedBox(height: 12),
                          Text('No reported issues', style: TextStyle(color: Colors.grey, fontSize: 16)),
                        ],
                      ),
                    )
                  else
                    ...displayedIssues.map((issue) {
                      final status = issue['status'] ?? 'pending';
                      final category = issue['category'] ?? 'General';
                      final description = issue['description'] ?? '';
                      final date = DateTime.parse(issue['created_at']);
                      final formattedDate = DateFormat('MMM d, y').format(date);
                      
                      final unit = issue['units'] ?? {};
                      final propertyName = unit['properties']?['name'] ?? 'Unknown';
                      final unitLabel = unit['label'] ?? 'Unknown';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border(
                            left: BorderSide(
                              color: status == 'resolved' ? const Color(0xFF52C41A) : const Color(0xFFFA8C16),
                              width: 4,
                            ),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 5,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  category.toString().toUpperCase(),
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: status == 'resolved' ? const Color(0xFFF6FFED) : const Color(0xFFFFF7E6),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    status.toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: status == 'resolved' ? const Color(0xFF52C41A) : const Color(0xFFFA8C16),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(description, style: const TextStyle(fontSize: 15)),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                const Icon(PhosphorIconsRegular.house, size: 14, color: Colors.grey),
                                const SizedBox(width: 4),
                                Text('$propertyName • Unit $unitLabel', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                const Spacer(),
                                Text(formattedDate, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
      ],
    );
  }
}

class _ReportStatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;

  const _ReportStatCard({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: iconColor, size: 24),
          const SizedBox(height: 12),
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
        ],
      ),
    );
  }
}
