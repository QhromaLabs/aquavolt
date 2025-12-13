import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../providers/tenant_provider.dart';
import '../widgets/token_history_card.dart'; // Import TokenHistoryCard
import 'package:phosphor_flutter/phosphor_flutter.dart';

class HistoryScreen extends StatelessWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final topups = context.watch<TenantProvider>().topups;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(PhosphorIcons.caretLeft(), size: 20),
                    onPressed: () => context.go('/dashboard'),
                  ),
                  const SizedBox(width: 8),
                  const Text('Topup History', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            Expanded(
              child: topups.isEmpty
                ? const Center(child: Text('No history found'))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: topups.length,
                    itemBuilder: (context, index) {
                      final item = topups[index];
                      final date = DateTime.parse(item['created_at']);
                      final amount = double.tryParse(item['amount_paid'].toString()) ?? 0;
                      final units = item['units_kwh'];
                      final token = item['token'] ?? 'Pending';
                      final status = item['futurise_status'] ?? 'unknown';

                      return TokenHistoryCard(tokenData: item);
                    },
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
