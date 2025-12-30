import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/landlord_provider.dart';
import '../widgets/top_toast.dart';
import 'tenant_details_screen.dart';

class TenantsScreen extends StatefulWidget {
  const TenantsScreen({super.key});

  @override
  State<TenantsScreen> createState() => _TenantsScreenState();
}

class _TenantsScreenState extends State<TenantsScreen> {
  Future<void> _refresh() async {
    await context.read<LandlordProvider>().refresh();
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(scheme: 'tel', path: phoneNumber);
    if (!await launchUrl(launchUri)) {
      if (mounted) showTopToast(context, 'Could not launch dialer', type: ToastType.error);
    }
  }

  Future<void> _sendEmail(String email) async {
    final Uri launchUri = Uri(scheme: 'mailto', path: email);
    if (!await launchUrl(launchUri)) {
      if (mounted) showTopToast(context, 'Could not launch email', type: ToastType.error);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tenants Hub'),
        actions: [
          IconButton(
            icon: const Icon(PhosphorIconsRegular.arrowClockwise),
            onPressed: _refresh,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/add-tenant'),
        icon: const Icon(PhosphorIconsBold.plus),
        label: const Text('Add Tenant'),
        backgroundColor: const Color(0xFF1ECF49),
      ),
      body: Consumer<LandlordProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.tenants.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(PhosphorIconsRegular.usersThree, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No active tenants found', style: TextStyle(fontSize: 18, color: Colors.grey)),
                  SizedBox(height: 8),
                  Text('Occupied units will appear here.', style: TextStyle(color: Colors.grey)),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: provider.tenants.length,
            separatorBuilder: (ctx, i) => const SizedBox(height: 12),
            itemBuilder: (ctx, i) {
              final tenant = provider.tenants[i];
              final name = tenant['tenant_name'] ?? 'Unknown';
              final phone = tenant['tenant_phone'] ?? '';
              final email = tenant['tenant_email'] ?? '';
              
              final unit = tenant['unit'] ?? {};
              final propertyName = unit['properties']?['name'] ?? 'Unknown Property';
              final unitLabel = unit['label'] ?? 'Unknown Unit';

              return InkWell(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => TenantDetailsScreen(tenant: tenant),
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
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
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Row(
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE6F7FF),
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFF91D5FF)),
                          ),
                          child: const Icon(PhosphorIconsFill.user, color: Color(0xFF1890FF), size: 24),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '$propertyName • Unit $unitLabel',
                                style: const TextStyle(color: Colors.grey, fontSize: 13),
                              ),
                              if (phone.isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    const Icon(PhosphorIconsRegular.phone, size: 12, color: Colors.grey),
                                    const SizedBox(width: 4),
                                    Text(phone, style: const TextStyle(color: Colors.black54, fontSize: 12)),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            if (phone.isNotEmpty)
                              IconButton(
                                icon: const Icon(PhosphorIconsFill.phoneCall, color: Color(0xFF1ECF49)),
                                onPressed: () => _makePhoneCall(phone),
                                style: IconButton.styleFrom(
                                  backgroundColor: const Color(0xFFF6FFED),
                                  padding: const EdgeInsets.all(8),
                                ),
                              ),
                          ],
                        ),
                      ],
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
