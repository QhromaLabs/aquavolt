import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../providers/landlord_provider.dart';

class PropertiesScreen extends StatefulWidget {
  const PropertiesScreen({super.key});

  @override
  State<PropertiesScreen> createState() => _PropertiesScreenState();
}

class _PropertiesScreenState extends State<PropertiesScreen> {
  @override
  Widget build(BuildContext context) {
    final landlord = context.watch<LandlordProvider>();
    final properties = landlord.properties;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Properties'),
        centerTitle: false,
      ),
      body: landlord.isLoading
          ? const Center(child: CircularProgressIndicator())
          : properties.isEmpty
              ? const Center(child: Text('No properties found'))
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: properties.length + 1, // +1 for header
                  itemBuilder: (context, index) {
                    if (index == 0) {
                      return _buildGlobalStats(landlord);
                    }
                    final p = properties[index - 1];
                    final propertyUnits = landlord.units.where((u) => u['property_id'] == p['id']).toList();
                    final occupiedCount = propertyUnits.where((u) => u['status'] == 'occupied').length;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Container(
                            height: 120,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [const Color(0xFF1ECF49).withValues(alpha: 0.8), const Color(0xFF0EB53E)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                            ),
                            child: Center(
                              child: Icon(PhosphorIcons.buildings(), color: Colors.white, size: 48),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      p['name'] ?? 'Unknown Property',
                                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFE6F9EB),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        '$occupiedCount/${propertyUnits.length} Occupied',
                                        style: const TextStyle(color: Color(0xFF1ECF49), fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(PhosphorIcons.mapPin(), size: 14, color: Colors.grey),
                                    const SizedBox(width: 4),
                                    Text(p['address'] ?? p['location'] ?? 'No location set', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                                  ],
                                ),
                                const SizedBox(height: 20),
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton(
                                        onPressed: () {
                                          // Navigate to Meters tab (index 2)
                                          // Note: Passing filter arguments implies clearer state management or args
                                          // For now, simpler navigation to Meters
                                          context.go(Uri(path: '/meters', queryParameters: {'propertyId': p['id'].toString()}).toString());
                                        },
                                        style: OutlinedButton.styleFrom(
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                          side: BorderSide(color: Colors.grey.shade300),
                                        ),
                                        child: const Text('View Units'),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: ElevatedButton(
                                        onPressed: () {
                                          context.push(Uri(path: '/reports', queryParameters: {'propertyId': p['id'].toString()}).toString());
                                        },
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF1ECF49),
                                          foregroundColor: Colors.white,
                                          elevation: 0,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                        ),
                                        child: const Text('Revenue'),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }

  Widget _buildGlobalStats(LandlordProvider landlord) {
     int totalUnits = landlord.units.length;
     int occupied = landlord.units.where((u) => u['status'] == 'occupied').length;
     int vacant = totalUnits - occupied;
     
     return Container(
       margin: const EdgeInsets.only(bottom: 24),
       padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
       child: Row(
         mainAxisAlignment: MainAxisAlignment.spaceAround,
         children: [
            _statItem('Total Units', totalUnits.toString(), Colors.blue),
            _statItem('Occupied', occupied.toString(), Colors.green),
            _statItem('Vacant', vacant.toString(), Colors.orange), // "Dull units" mapped to Vacant
         ],
       ),
     );
  }

  Widget _statItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: color)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
