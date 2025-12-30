import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:flutter/foundation.dart'; // for kIsWeb
import '../services/biometric_service.dart';
import '../widgets/top_toast.dart';
import 'pin_screen.dart';

class SecurityIntroScreen extends StatefulWidget {
  const SecurityIntroScreen({super.key});

  @override
  State<SecurityIntroScreen> createState() => _SecurityIntroScreenState();
}

class _SecurityIntroScreenState extends State<SecurityIntroScreen> {
  bool _isLoading = false;
  final BiometricService _biometricService = BiometricService();

  Future<void> _setupSecurity() async {
    // 1. Go to Pin Setup (fullscreen)
    final pinSet = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (ctx) => PinScreen(
          mode: PinMode.setup,
          onSuccess: () {
            // We manually pop here if not handled by PinScreen, but PinScreen handles success callback.
            // PinScreen's onSuccess callback in setup mode with pop creates a result.
            // Actually PinScreen implementation we just fixed calls onSuccess OR pops.
            // Let's rely on onSuccess callback in PinScreen to pop and return true? 
            // The current PinScreen 'onSuccess' overrides the default pop.
            // So we need to handle the flow here.
             Navigator.of(ctx).pop(true);
          },
        ),
      ),
    );

    if (pinSet == true && mounted) {
      // 2. PIN Set successfully. Ask for Biometrics (if available)
      final canBio = await _biometricService.isBiometricAvailable;
      
      if (canBio && mounted) {
         // Show Biometric prompt dialog
         await _promptForBiometrics();
      }

      // 3. Done. Go to Connect Meter
      if (mounted) context.go('/connect-meter');
    }
  }

  Future<void> _promptForBiometrics() async {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Enable Biometrics?'),
        content: const Text('Would you like to use your fingerprint or face to unlock the app?'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
            },
            child: const Text('No'),
          ),
          FilledButton(
            onPressed: () async {
              await _biometricService.setBiometricEnabled(true);
              if (ctx.mounted) Navigator.pop(ctx);
            },
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFF1ECF49)),
            child: const Text('Yes, Enable'),
          ),
        ],
      ),
    );
  }

  void _skip() {
    context.go('/connect-meter');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF1ECF49).withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(PhosphorIconsFill.shieldCheck, size: 64, color: Color(0xFF1ECF49)),
              ),
              const SizedBox(height: 32),
              const Text(
                'Secure Your Account',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              const Text(
                'Set up a PIN to protect your tokens and personal information. You can also use biometrics for faster access.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _setupSecurity,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF1ECF49),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Secure My App', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: _skip,
                child: const Text('Skip for now', style: TextStyle(color: Colors.grey, fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
