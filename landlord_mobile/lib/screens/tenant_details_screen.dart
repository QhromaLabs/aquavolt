import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/landlord_provider.dart';
import '../widgets/top_toast.dart';
import 'landlord_buy_token_screen.dart';

class TenantDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> tenant;

  const TenantDetailsScreen({super.key, required this.tenant});

  @override
  State<TenantDetailsScreen> createState() => _TenantDetailsScreenState();
}

class _TenantDetailsScreenState extends State<TenantDetailsScreen> {
  
  Map<String, dynamic> get tenant => widget.tenant;
  Map<String, dynamic> get unit => tenant['unit'] ?? {};

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(scheme: 'tel', path: phoneNumber);
    if (!await launchUrl(launchUri)) {
      if (mounted) showTopToast(context, 'Could not launch dialer', type: ToastType.error);
    }
  }
  
  Future<void> _sendEmail(String email) async {
    final Uri launchUri = Uri(scheme: 'mailto', path: email);
    if (!await launchUrl(launchUri)) {
      if (mounted) showTopToast(context, 'Could not launch email app', type: ToastType.error);
    }
  }

  Future<void> _showTerminateModal() async {
    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
               child: Container(
                 width: 50,
                 height: 5,
                 decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(12)),
               ),
             ),
             const SizedBox(height: 24),
             Container(
               padding: const EdgeInsets.all(16),
               decoration: BoxDecoration(
                 color: const Color(0xFFFFF1F0),
                 shape: BoxShape.circle,
               ),
               child: const Icon(PhosphorIconsFill.warning, color: Colors.red, size: 48),
             ),
             const SizedBox(height: 24),
             const Text(
               'Terminate Tenancy?',
               textAlign: TextAlign.center,
               style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
             ),
             const SizedBox(height: 12),
             Text(
               'This action will remove ${tenant['tenant_name']} from Unit ${unit['label']}.\nThe unit will effectively become vacant.',
               textAlign: TextAlign.center,
               style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
             ),
             const SizedBox(height: 32),
             FilledButton(
               onPressed: () async {
                  Navigator.pop(ctx);
                  await _performTermination();
               },
               style: FilledButton.styleFrom(
                 backgroundColor: Colors.red,
                 foregroundColor: Colors.white,
                 minimumSize: const Size(double.infinity, 56),
                 shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                 elevation: 0,
               ),
               child: const Text('Terminate Access', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
             ),
             const SizedBox(height: 12),
             TextButton(
               onPressed: () => Navigator.pop(ctx),
               child: const Text('Cancel', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
             ),
          ],
        ),
      ),
    );
  }

  Future<void> _performTermination() async {
    try {
      await context.read<LandlordProvider>().terminateTenancy(unit['id']);
      if (mounted) {
         showTopToast(context, 'Tenancy terminated successfully', type: ToastType.success);
         context.pop(); // Go back
      }
    } catch (e) {
      if (mounted) showTopToast(context, 'Error: $e', type: ToastType.error);
    }
  }

  void _navigateToBuyToken() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => LandlordBuyTokenScreen(tenant: tenant, unit: unit),
      ),
    );
  }

  Future<void> _showMaintenanceDialog() async {
    final titleController = TextEditingController();
    final descController = TextEditingController();

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Submit Request'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(labelText: 'Issue Title', hintText: 'e.g., Leaking Tap'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descController,
              decoration: const InputDecoration(labelText: 'Description', hintText: 'Describe the issue...'),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              if (titleController.text.isEmpty) return;
              try {
                Navigator.pop(ctx); // Close dialog first
                await context.read<LandlordProvider>().submitIssue(
                  unitId: unit['id'],
                  title: titleController.text,
                  description: descController.text,
                );
                if (mounted) showTopToast(context, 'Request submitted', type: ToastType.success);
              } catch (e) {
                if (mounted) showTopToast(context, 'Error: $e', type: ToastType.error);
              }
            },
            child: const Text('Submit'),
          ),
        ],
      ),
    );
  }

  Future<void> _showReassignModal() async {
    final provider = context.read<LandlordProvider>();
    final currentPropertyId = unit['properties']?['id']; // Map assumes populated structure
    
    // Smart Filter: Get vacant units in the SAME property first
    final vacantUnits = provider.units.where((u) {
      final isVacant = u['status'] == 'vacant';
      final propId = u['properties'] is Map ? u['properties']['id'] : u['property_id'];
      // Just check vacancy for now, user can see property name in list
      return isVacant;
    }).toList();

    // Sort: Same property first
    vacantUnits.sort((a, b) {
      final aPropId = a['properties'] is Map ? a['properties']['id'] : a['property_id'];
      final bPropId = b['properties'] is Map ? b['properties']['id'] : b['property_id'];
      if (aPropId == currentPropertyId && bPropId != currentPropertyId) return -1;
      if (aPropId != currentPropertyId && bPropId == currentPropertyId) return 1;
      return 0;
    });

    await showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 12),
        constraints: BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.7),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
             Center(
               child: Container(
                 width: 50,
                 height: 5,
                 decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(12)),
               ),
             ),
             const SizedBox(height: 24),
             Padding(
               padding: const EdgeInsets.symmetric(horizontal: 24),
               child: Text(
                 vacantUnits.isEmpty ? 'No Vacant Units' : 'Select New Unit',
                 style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
               ),
             ),
             const SizedBox(height: 8),
             Padding(
               padding: const EdgeInsets.symmetric(horizontal: 24),
               child: Text(
                 vacantUnits.isEmpty 
                    ? 'There are no vacant units available to reassign this tenant to.' 
                    : 'Reassigning ${tenant['tenant_name']} from Unit ${unit['label']}',
                 style: TextStyle(color: Colors.grey.shade600),
               ),
             ),
             const SizedBox(height: 24),
             
             if (vacantUnits.isEmpty)
               Padding(
                 padding: const EdgeInsets.all(24),
                 child: FilledButton(
                   onPressed: () => Navigator.pop(ctx),
                   style: FilledButton.styleFrom(
                     backgroundColor: Colors.grey.shade200,
                     foregroundColor: Colors.black87,
                     minimumSize: const Size(double.infinity, 56),
                     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                   ),
                   child: const Text('Close'),
                 ),
               )
             else 
               Flexible(
                 child: ListView.separated(
                   padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                   itemCount: vacantUnits.length,
                   separatorBuilder: (c, i) => const SizedBox(height: 12),
                   itemBuilder: (c, i) {
                     final u = vacantUnits[i];
                     final uPropId = u['properties'] is Map ? u['properties']['id'] : u['property_id'];
                     final isSameProp = uPropId == currentPropertyId;
                     final uPropName = u['properties'] is Map ? u['properties']['name'] : 'Unknown';
                     
                     return InkWell(
                       onTap: () async {
                         Navigator.pop(ctx);
                         await _confirmReassignment(u);
                       },
                       borderRadius: BorderRadius.circular(16),
                       child: Container(
                         padding: const EdgeInsets.all(16),
                         decoration: BoxDecoration(
                           color: isSameProp ? const Color(0xFFF6FFED) : Colors.white,
                           borderRadius: BorderRadius.circular(16),
                           border: Border.all(
                             color: isSameProp ? const Color(0xFFB7EB8F) : Colors.grey.shade200
                           ),
                         ),
                         child: Row(
                           children: [
                             Container(
                               padding: const EdgeInsets.all(12),
                               decoration: BoxDecoration(
                                 color: isSameProp ? const Color(0xFF1ECF49) : Colors.grey.shade100,
                                 borderRadius: BorderRadius.circular(12),
                               ),
                               child: Icon(
                                 PhosphorIcons.house(), 
                                 color: isSameProp ? Colors.white : Colors.black54,
                                 size: 20
                               ),
                             ),
                             const SizedBox(width: 16),
                             Expanded(
                               child: Column(
                                 crossAxisAlignment: CrossAxisAlignment.start,
                                 children: [
                                   Text(
                                     'Unit ${u['label']}', 
                                     style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)
                                   ),
                                   Text(
                                     uPropName, 
                                     style: TextStyle(color: Colors.grey.shade500, fontSize: 13)
                                   ),
                                 ],
                               ),
                             ),
                             if (isSameProp)
                               Container(
                                 padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                 decoration: BoxDecoration(
                                   color: const Color(0xFF1ECF49).withValues(alpha: 0.1),
                                   borderRadius: BorderRadius.circular(8),
                                 ),
                                 child: const Text('Same Prop', style: TextStyle(fontSize: 10, color: Color(0xFF1ECF49), fontWeight: FontWeight.bold)),
                               )
                           ],
                         ),
                       ),
                     );
                   },
                 ),
               ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmReassignment(Map<String, dynamic> newUnit) async {
    // Elegant conformation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Move'),
        content: Text('Move ${tenant['tenant_name']} to Unit ${newUnit['label']}?'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        actions: [
           TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
           FilledButton(
             onPressed: () => Navigator.pop(ctx, true),
             style: FilledButton.styleFrom(backgroundColor: const Color(0xFF1ECF49)),
             child: const Text('Confirm Move'),
           ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await context.read<LandlordProvider>().reassignUnit(
          oldUnitId: unit['id'],
          newUnitId: newUnit['id'],
          tenantId: tenant['tenant_id'],
        );
        if (mounted) {
          showTopToast(context, 'Reassigned successfully', type: ToastType.success);
          context.pop(); // Close details screen to refresh
        }
      } catch (e) {
        if (mounted) showTopToast(context, 'Error: $e', type: ToastType.error);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = tenant['tenant_name'] ?? 'Unknown';
    final phone = tenant['tenant_phone'] ?? 'N/A';
    final email = tenant['tenant_email'] ?? 'N/A';
    final unitLabel = unit['label'] ?? 'Unknown';
    final meterNumber = unit['meter_number'] ?? 'N/A';
    final propertyName = unit['properties']?['name'] ?? 'Unknown Property';

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Tenant Details'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Profile Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 5)),
                ]
              ),
              child: Column(
                children: [
                   Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE6F7FF),
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFF91D5FF), width: 2),
                      ),
                      child: const Icon(PhosphorIconsFill.user, color: Color(0xFF1890FF), size: 40),
                    ),
                    const SizedBox(height: 16),
                    Text(name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('$propertyName • Unit $unitLabel', style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 16),
                    // Contact
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                         _buildContactAction(PhosphorIcons.phone(), 'Call', () => _makePhoneCall(phone)),
                         _buildContactAction(PhosphorIcons.envelopeSimple(), 'Email', () => _sendEmail(email)),
                         _buildContactAction(PhosphorIcons.pencilSimple(), 'Edit', () {}),
                      ],
                    )
                ],
              ),
            ),
            
            const SizedBox(height: 24),

            // Actions Grid
            Row(
              children: [
                Expanded(
                  child: _buildActionCard(
                    title: 'Buy Token',
                    icon: PhosphorIcons.lightning(),
                    color: const Color(0xFF1ECF49),
                    onTap: _navigateToBuyToken,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildActionCard(
                    title: 'Requests',
                    icon: PhosphorIcons.wrench(),
                    color: Colors.orange,
                    onTap: () {
                      _showMaintenanceDialog();
                    },
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Unit Details
             Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Rental Information', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  _buildInfoRow('Property', propertyName),
                  const Divider(height: 24),
                  _buildInfoRow('Unit Number', unitLabel),
                  const Divider(height: 24),
                  _buildInfoRow('Meter Number', meterNumber),
                  const Divider(height: 24),
                  _buildInfoRow('Lease Status', 'Active', color: Colors.green),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Danger Zone
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF1F0),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFFA39E)),
              ),
              child: Column(
                children: [
                   OutlinedButton.icon(
                      onPressed: () => _showReassignModal(),
                      icon: const Icon(PhosphorIconsRegular.arrowBendUpRight),
                      label: const Text('Reassign Unit'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.orange,
                        side: const BorderSide(color: Colors.orange),
                        minimumSize: const Size(double.infinity, 48),
                      ),
                   ),
                   const SizedBox(height: 12),
                   const SizedBox(height: 12),
                   OutlinedButton.icon(
                      onPressed: () => _showTerminateModal(),
                      icon: const Icon(PhosphorIconsRegular.userMinus),
                      label: const Text('Terminate Tenancy'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        minimumSize: const Size(double.infinity, 48),
                      ),
                   ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactAction(IconData icon, String label, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 20, color: Colors.black87),
            ),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard({required String title, required IconData icon, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 100,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
             Icon(icon, size: 32, color: color),
             const SizedBox(height: 8),
             Text(title, style: TextStyle(color: color, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: Colors.grey.shade600)),
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, color: color ?? Colors.black87)),
      ],
    );
  }
}
