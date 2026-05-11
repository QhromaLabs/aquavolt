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
  String _selectedPerformanceFilter = 'Current';

  Future<void> _refresh() async {
    await context.read<LandlordProvider>().refresh();
  }

  @override
  Widget build(BuildContext context) {
    final landlord = context.watch<LandlordProvider>();
    final units = landlord.units;
    final issues = landlord.issues;
    final topups = landlord.topups;

    final propertyId = GoRouterState.of(context).uri.queryParameters['propertyId'];

    // Filter Logic for Revenue & Unit Performance
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    final startOfYear = DateTime(now.year, 1, 1);

    List<Map<String, dynamic>> filteredTopups = topups;
    if (_selectedPerformanceFilter == 'Monthly') {
      filteredTopups = topups.where((t) => DateTime.parse(t['created_at']).isAfter(startOfMonth)).toList();
    } else if (_selectedPerformanceFilter == 'Annually') {
      filteredTopups = topups.where((t) => DateTime.parse(t['created_at']).isAfter(startOfYear)).toList();
    } else if (_selectedPerformanceFilter == 'Current') {
      // "Current" could mean this month or specifically available balance logic.
      // User said "Current balance to be default... since there's sometimes when some balance might be from the previous month"
      // Let's treat "Current" as this month's revenue for the performance list, but maybe we show Available Balance in the summary.
      filteredTopups = topups.where((t) => DateTime.parse(t['created_at']).isAfter(startOfMonth)).toList();
    }

    if (propertyId != null) {
      filteredTopups = filteredTopups.where((t) {
        final unit = t['units'] ?? {};
        final pId = unit['property_id'] ?? unit['properties']?['id'];
        return pId.toString() == propertyId;
      }).toList();
    }

    // Recalculate Per-Unit Performance based on filteredTopups
    final Map<String, Map<String, dynamic>> unitPerformance = {};
    for (var t in filteredTopups) {
      final unitId = t['unit_id'].toString();
      if (!unitPerformance.containsKey(unitId)) {
        unitPerformance[unitId] = {'revenue': 0.0, 'units': 0.0, 'count': 0};
      }
      unitPerformance[unitId]!['revenue'] += (double.tryParse(t['amount_paid'].toString()) ?? 0.0);
      unitPerformance[unitId]!['units'] += (double.tryParse(t['amount_vended'].toString()) ?? 0.0);
      unitPerformance[unitId]!['count'] += 1;
    }

    List<Map<String, dynamic>> displayedUnits = units;
    if (propertyId != null) {
      displayedUnits = units.where((u) {
        final pId = u['property_id'] ?? u['properties']?['id'];
        return pId.toString() == propertyId;
      }).toList();
    }

    double totalDisplayedRevenue = filteredTopups.fold(0.0, (sum, item) => sum + (double.tryParse(item['amount_paid'].toString()) ?? 0.0));
    
    // Issues Filter
    List<Map<String, dynamic>> displayedIssues = issues;
    if (propertyId != null) {
      displayedIssues = issues.where((i) {
         final unit = i['units'] ?? {};
         final pId = unit['property_id'] ?? unit['properties']?['id'];
         return pId.toString() == propertyId;
      }).toList();
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
                  // Filter Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: ['Current', 'Monthly', 'Annually', 'Overall'].map((filter) {
                        final isSelected = _selectedPerformanceFilter == filter;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(filter),
                            selected: isSelected,
                            onSelected: (val) {
                              if (val) setState(() => _selectedPerformanceFilter = filter);
                            },
                            selectedColor: const Color(0xFF1ECF49),
                            labelStyle: TextStyle(
                              color: isSelected ? Colors.white : Colors.black87,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            ),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 20),

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
                          icon: PhosphorIconsFill.coins,
                          iconColor: const Color(0xFFFAAD14),
                          label: '$_selectedPerformanceFilter Revenue',
                          value: 'KES ${NumberFormat('#,###').format(totalDisplayedRevenue)}',
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _ReportStatCard(
                          icon: PhosphorIconsFill.chartLineUp,
                          iconColor: const Color(0xFF1ECF49),
                          label: 'Lifetime Revenue',
                          value: 'KES ${NumberFormat('#,###').format(landlord.lifetimeRevenue)}',
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  const Text('Financial Performance by Unit', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  
                  if (displayedUnits.isEmpty)
                    const Text('No units available for this property.', style: TextStyle(color: Colors.grey))
                  else
                    ...displayedUnits.map((unit) {
                      final unitId = unit['id'].toString();
                      final label = unit['label'] ?? 'Unknown';
                      final perf = unitPerformance[unitId] ?? {'revenue': 0.0, 'units': 0.0, 'count': 0};
                      final revenue = perf['revenue'];
                      final unitsVended = perf['units'];
                      final txCount = perf['count'];
                      
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.02),
                              blurRadius: 5,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(12),
                            onTap: () => _showUnitPerformanceDetails(context, unit, perf),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF0F2F5),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(PhosphorIconsFill.houseLine, color: Colors.blueGrey, size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Unit $label', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                        Text('$txCount transactions', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        'KES ${NumberFormat('#,###').format(revenue)}',
                                        style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1ECF49)),
                                      ),
                                      Text(
                                        '${unitsVended.toStringAsFixed(1)} Units',
                                        style: const TextStyle(fontSize: 12, color: Colors.grey),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    }),

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

  void _showUnitPerformanceDetails(BuildContext context, Map<String, dynamic> unit, Map<String, dynamic> perf) {
    final label = unit['label'] ?? 'Unknown';
    final revenue = perf['revenue'];
    final unitsVended = perf['units'];
    final txCount = perf['count'];
    final status = unit['status'] ?? 'N/A';
    final propertyName = unit['properties']?['name'] ?? 'Unknown Property';

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Unit $label Performance',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(ctx),
                  icon: const Icon(PhosphorIconsRegular.x),
                ),
              ],
            ),
            const Divider(height: 32),
            _ReportDetailRow(label: 'Property', value: propertyName),
            const SizedBox(height: 16),
            _ReportDetailRow(label: 'Total Revenue ($_selectedPerformanceFilter)', value: 'KES ${NumberFormat('#,###').format(revenue)}', isValueBold: true),
            const SizedBox(height: 16),
            _ReportDetailRow(label: 'Units Consumed', value: '${unitsVended.toStringAsFixed(1)} Units'),
            const SizedBox(height: 16),
            _ReportDetailRow(label: 'Transaction Count', value: '$txCount vends'),
            const SizedBox(height: 16),
            _ReportDetailRow(label: 'Current Status', value: status.toUpperCase(), isStatus: true),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => Navigator.pop(ctx),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF1ECF49),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReportDetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isValueBold;
  final bool isStatus;

  const _ReportDetailRow({
    required this.label,
    required this.value,
    this.isValueBold = false,
    this.isStatus = false,
  });

  @override
  Widget build(BuildContext context) {
    Color valueColor = isStatus 
        ? (value == 'OCCUPIED' || value == 'ACTIVE' ? const Color(0xFF52C41A) : const Color(0xFFFA8C16))
        : Colors.black87;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 14)),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontWeight: isValueBold || isStatus ? FontWeight.bold : FontWeight.normal,
              fontSize: 14,
              color: valueColor,
            ),
          ),
        ),
      ],
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
