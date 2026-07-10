import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/tutorial_provider.dart';
import '../providers/landlord_provider.dart';
import '../screens/tenant_details_screen.dart';
import 'buy_tokens_bottom_sheet.dart';

class HelpBottomSheet extends StatelessWidget {
  const HelpBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Help & Tutorials',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(PhosphorIconsRegular.x),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Learn how to manage your properties and tenants efficiently.',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 32),
          _TutorialTile(
            title: 'Register a Tenant',
            subtitle: 'How to add and connect a tenant to a unit',
            icon: PhosphorIconsRegular.userPlus,
            color: const Color(0xFF1ECF49),
            onTap: () {
              Navigator.pop(context);
              _startTenantRegistrationTutorial(context);
            },
          ),
          const SizedBox(height: 16),
          _TutorialTile(
            title: 'Manage Tenancy',
            subtitle: 'Update details, check history, and manage units',
            icon: PhosphorIconsRegular.usersThree,
            color: const Color(0xFF1890FF),
            onTap: () {
              Navigator.pop(context);
              _startTenancyManagementTutorial(context);
            },
          ),
          const SizedBox(height: 16),
          _TutorialTile(
            title: 'Withdraw Earnings',
            subtitle: 'How to transfer your balance to your wallet',
            icon: PhosphorIconsRegular.wallet,
            color: const Color(0xFFFA8C16),
            onTap: () {
              Navigator.pop(context);
              _startWithdrawalTutorial(context);
            },
          ),
          const SizedBox(height: 16),
          _TutorialTile(
            title: 'Buy Tokens',
            subtitle: 'How to purchase tokens for your units',
            icon: PhosphorIconsRegular.lightning,
            color: const Color(0xFF722ED1),
            onTap: () {
              Navigator.pop(context); // Close help sheet
              
              // Open modal first
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (context) => const BuyTokensBottomSheet(),
              );

              // Start tutorial with targets
              final tutorial = context.read<TutorialProvider>();
              tutorial.startTutorial([
                TutorialStep(
                  title: 'Token Amount',
                  description: 'First, enter the KSh amount you want to purchase. You can also use the quick select buttons.',
                  targetId: 'buy_tokens_amount_field',
                  route: '/landlord-dashboard',
                ),
                TutorialStep(
                  title: 'Choose Destination',
                  description: 'Use the "Tenants" tab to pick a registered tenant, or "Manual" to enter a custom number.',
                  targetId: 'buy_tokens_tabs',
                  route: '/landlord-dashboard',
                ),
                TutorialStep(
                  title: 'Unit Assignment',
                  description: 'In the Manual tab, you can search and select the specific unit you are buying tokens for.',
                  targetId: 'buy_tokens_unit_select',
                  route: '/landlord-dashboard',
                  onStepStarted: () => BuyTokensBottomSheet.switchToManualTab(),
                ),
                TutorialStep(
                  title: 'M-Pesa Number',
                  description: 'Enter the M-Pesa number that will receive the payment prompt (STK Push).',
                  targetId: 'buy_tokens_phone_field',
                  route: '/landlord-dashboard',
                ),
                TutorialStep(
                  title: 'Complete Purchase',
                  description: 'Once ready, click "Buy Tokens Now" to receive the M-Pesa prompt on your phone.',
                  targetId: 'buy_tokens_submit',
                  route: '/landlord-dashboard',
                ),
              ]);
            },
          ),
          const SizedBox(height: 32),
          Center(
            child: Text(
              'Need more help? Contact Support',
              style: TextStyle(
                color: Colors.grey.shade400,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  void _startTenantRegistrationTutorial(BuildContext context) {
    final tutorial = context.read<TutorialProvider>();
    final size = MediaQuery.of(context).size;
    
    tutorial.startTutorial([
      TutorialStep(
        title: 'View Meters',
        description: 'First, let\'s go to the Meters page to see all your units.',
        route: '/meters',
        onStepStarted: () => context.go('/meters'),
      ),
      TutorialStep(
        title: 'Unit QR Code',
        description: 'You can click on the QR code icon for any unit. Have your tenant scan it to automatically connect.',
        route: '/meters',
        targetId: 'meter_qr_0',
      ),
      TutorialStep(
        title: 'Manual Registration',
        description: 'Alternatively, you can manually add a tenant and assign them to a property.',
        route: '/add-tenant',
        onStepStarted: () => context.push('/add-tenant'),
      ),
    ]);
  }

  void _startTenancyManagementTutorial(BuildContext context) {
    final tutorial = context.read<TutorialProvider>();
    final size = MediaQuery.of(context).size;

    tutorial.startTutorial([
      TutorialStep(
        title: 'Tenants Hub',
        description: 'Your central dashboard for managing all current and past tenancies across your properties.',
        route: '/tenants',
        onStepStarted: () => context.go('/tenants'),
      ),
      TutorialStep(
        title: 'Manage Tenant',
        description: 'Click on any tenant card to view their detailed profile, contact info, and unit history.',
        route: '/tenants',
        targetId: 'tenant_card_0',
      ),
      TutorialStep(
        title: 'Tenant Profile',
        description: 'Inside the details, you can see the tenant\'s unit assignment, property, and contact details.',
        route: '/tenants',
        targetId: 'tenant_profile_card',
        onStepStarted: () {
          final tenants = context.read<LandlordProvider>().tenants;
          if (tenants.isNotEmpty) {
            context.push('/tenants/details', extra: tenants.first);
          }
        },
      ),
      TutorialStep(
        title: 'Buy Tokens',
        description: 'Need to buy tokens for this tenant? Use this shortcut to open the purchase modal instantly.',
        route: '/tenants',
        targetId: 'tenant_buy_token_button',
      ),
      TutorialStep(
        title: 'Maintenance Requests',
        description: 'Track and manage any issues or requests submitted by this tenant for their specific unit.',
        route: '/tenants',
        targetId: 'tenant_requests_button',
      ),
      TutorialStep(
        title: 'Reassign Unit',
        description: 'Moving a tenant to a different room? Use this to transfer them to any vacant unit you own.',
        route: '/tenants',
        targetId: 'tenant_reassign_button',
        onStepStarted: () => TenantDetailsScreen.scrollToBottom(),
      ),
      TutorialStep(
        title: 'Terminate Tenancy',
        description: 'When a tenant moves out, use this to vacate the unit and stop their access to the meter.',
        route: '/tenants',
        targetId: 'tenant_terminate_button',
        onStepStarted: () => TenantDetailsScreen.scrollToBottom(),
      ),
    ]);
  }

  void _startWithdrawalTutorial(BuildContext context) {
    final tutorial = context.read<TutorialProvider>();
    final size = MediaQuery.of(context).size;

    tutorial.startTutorial([
      TutorialStep(
        title: 'Your Wallet',
        description: 'This is where you track all revenue generated across your properties.',
        route: '/wallet',
        onStepStarted: () => context.push('/wallet'),
      ),
      TutorialStep(
        title: 'Withdraw Balance',
        description: 'Your available balance can be withdrawn instantly. Click the withdrawal button to start.',
        route: '/wallet',
        highlightPosition: Offset(size.width / 2, 220),
        highlightSize: Size(size.width - 60, 100),
      ),
    ]);
  }
}

class _TutorialTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _TutorialTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.1), width: 1),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            Icon(PhosphorIconsRegular.caretRight, color: Colors.grey.shade400, size: 20),
          ],
        ),
      ),
    );
  }
}
