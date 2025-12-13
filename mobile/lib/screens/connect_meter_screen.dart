import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../widgets/scan_modal.dart';
import '../providers/tenant_provider.dart';
import '../widgets/top_toast.dart';

class ConnectMeterScreen extends StatefulWidget {
  const ConnectMeterScreen({super.key});

  @override
  State<ConnectMeterScreen> createState() => _ConnectMeterScreenState();
}

class _ConnectMeterScreenState extends State<ConnectMeterScreen> {
  bool _isProcessing = false;

  Future<void> _handleScan(String rawData) async {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);

    try {
      final tenantProvider = context.read<TenantProvider>();
      final error = await tenantProvider.linkUnit(rawData);

      if (mounted) {
        if (error == null) {
          showTopToast(context, 'Meter connected successfully!', type: ToastType.success);
          // Wait a moment for the toast then go to dashboard
          await Future.delayed(const Duration(seconds: 1));
          if (mounted) context.go('/dashboard');
        } else {
          showTopToast(context, error, type: ToastType.error);
        }
      }
    } catch (e) {
      if (mounted) {
        showTopToast(context, 'Failed to process QR code: $e', type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  void _openScanner() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ScanModal(onScan: _handleScan),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => context.go('/dashboard'),
                  child: Text(
                    'Skip',
                    style: GoogleFonts.outfit(
                      color: Colors.grey[600],
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
              const Spacer(),
              // Illustration
              Image.asset(
                'assets/images/scan_illustration.png',
                height: 250,
                fit: BoxFit.contain,
              ),
              const SizedBox(height: 48),

              Text(
                'Connect to your Meter',
                style: GoogleFonts.outfit(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              
              Text(
                'To start tracking your electricity usage and buy tokens, simply scan the QR code located on your meter.',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  color: Colors.grey[600],
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const Spacer(),

              // Scan Button
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _isProcessing ? null : _openScanner,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF1ECF49),
                    padding: const EdgeInsets.symmetric(vertical: 20), // Increased padding
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: _isProcessing
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.qr_code_scanner, size: 28), // Bigger icon
                            const SizedBox(width: 12),
                            Text(
                              'Scan QR Code',
                              style: GoogleFonts.outfit(
                                fontSize: 20, // Bigger font
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
