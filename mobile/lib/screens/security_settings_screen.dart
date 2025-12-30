import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../services/biometric_service.dart';
import '../widgets/top_toast.dart';
import 'pin_screen.dart';

class SecuritySettingsScreen extends StatefulWidget {
  const SecuritySettingsScreen({super.key});

  @override
  State<SecuritySettingsScreen> createState() => _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState extends State<SecuritySettingsScreen> {
  final BiometricService _biometricService = BiometricService();
  bool _appLockEnabled = false;
  bool _biometricEnabled = false;
  bool _canCheckBiometrics = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    if (!mounted) return;
    
    try {
      // Add a timeout to prevent infinite spinning if plugins are broken/not-linked
      await Future.delayed(const Duration(milliseconds: 500)); // Small delay for smooth UI

      final results = await Future.wait([
        _biometricService.isAppLockEnabled(),
        _biometricService.isBiometricEnabled(),
        _biometricService.isBiometricAvailable,
      ]).timeout(const Duration(seconds: 5));

      if (mounted) {
        setState(() {
          _appLockEnabled = results[0];
          _biometricEnabled = results[1];
          _canCheckBiometrics = results[2];
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading security settings: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        showTopToast(context, 'Failed to load settings. Please restart app.', type: ToastType.error);
      }
    }
  }

  Future<void> _toggleAppLock(bool value) async {
    if (value) {
      // Enabling App Lock
      // Check if PIN exists
      final hasPin = await _biometricService.hasPin();
      if (!hasPin) {
        if (mounted) {
          // Go to Setup PIN
          await Navigator.of(context).push(
            MaterialPageRoute(
              builder: (ctx) => PinScreen(
                mode: PinMode.setup,
                onSuccess: () {
                  // If setup success, enable lock
                  _loadSettings();
                },
              ),
            ),
          );
        }
      } else {
        // PIN exists, just enable
        await _biometricService.setAppLockEnabled(true);
        setState(() => _appLockEnabled = true);
      }
    } else {
      // Disabling App Lock -> Verify PIN first
      if (mounted) {
        final verified = await Navigator.of(context).push<bool>(
          MaterialPageRoute(
            builder: (ctx) => const PinScreen(mode: PinMode.verify),
          ),
        );

        if (verified == true) {
          await _biometricService.setAppLockEnabled(false);
          await _biometricService.setBiometricEnabled(false); // Disable bio too
          setState(() {
            _appLockEnabled = false;
            _biometricEnabled = false;
          });
        }
      }
    }
  }

  Future<void> _toggleBiometrics(bool value) async {
    await _biometricService.setBiometricEnabled(value);
    setState(() => _biometricEnabled = value);
  }

  Future<void> _changePin() async {
    if (mounted) {
      // Security measure: Verify old PIN first
      final verified = await Navigator.of(context).push<bool>(
        MaterialPageRoute(
          builder: (ctx) => const PinScreen(mode: PinMode.verify),
        ),
      );

      if (verified == true && mounted) {
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (ctx) => PinScreen(
              mode: PinMode.change,
              onSuccess: () {
                showTopToast(context, 'PIN changed successfully', type: ToastType.success);
                Navigator.of(context).pop();
              },
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(PhosphorIconsRegular.caretLeft, color: Colors.black),
          onPressed: () => context.pop(),
        ),
        title: const Text('Security', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.03),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      SwitchListTile(
                        value: _appLockEnabled,
                        onChanged: _toggleAppLock,
                        activeColor: const Color(0xFF1ECF49),
                        title: const Text('App Lock', style: TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: const Text('Require PIN to open app'),
                        secondary: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF1ECF49).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(PhosphorIconsRegular.lockKey, color: Color(0xFF1ECF49)),
                        ),
                      ),
                      if (_appLockEnabled && _canCheckBiometrics) ...[
                        const Divider(height: 1),
                        SwitchListTile(
                          value: _biometricEnabled,
                          onChanged: _toggleBiometrics,
                          activeColor: const Color(0xFF1ECF49),
                          title: const Text('Biometric Unlock', style: TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: const Text('Use FaceID or Fingerprint'),
                          secondary: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.blue.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(PhosphorIconsRegular.fingerprint, color: Colors.blue),
                          ),
                        ),
                      ],
                      if (_appLockEnabled) ...[
                        const Divider(height: 1),
                        ListTile(
                          onTap: _changePin,
                          title: const Text('Change PIN', style: TextStyle(fontWeight: FontWeight.w600)),
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(PhosphorIconsRegular.password, color: Colors.orange),
                          ),
                          trailing: const Icon(PhosphorIconsRegular.caretRight, size: 20, color: Colors.grey),
                        ),
                      ]
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}
