import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

class ConnectMeterModal extends StatelessWidget {
  const ConnectMeterModal({super.key});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Close button (skippable)
          Align(
            alignment: Alignment.centerRight,
            child: IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                context.go('/dashboard');
              },
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
            child: Column(
              children: [
                // Illustration
                Image.asset(
                  'assets/images/scan_illustration.png',
                  height: 200,
                  fit: BoxFit.contain,
                ),
                const SizedBox(height: 24),

                Text(
                  'Connect to your Meter',
                  style: GoogleFonts.outfit(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                
                Text(
                  'To start tracking your electricity usage and buy tokens, you need to scan the QR code on your meter relative to your apartment.',
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    color: Colors.grey[600],
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // Scan Button
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () {
                      // TODO: Navigate to scanner
                      // For now we can just dismiss to dashboard or show a "Coming Soon" snackbar
                      // But as per plan, we might want to just skip for now if scanner isn't ready
                      // Or if the user just wants to see the dashboard.
                      // Let's treat this as the primary action leading to dashboard for now
                      // until scanner route is defined.
                      context.go('/dashboard');
                    },
                    icon: const Icon(Icons.qr_code_scanner),
                    label: const Text('Scan QR Code'),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF1ECF49),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      textStyle: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Skip Button
                TextButton(
                  onPressed: () {
                    context.go('/dashboard');
                  },
                  child: Text(
                    'Skip for now',
                    style: GoogleFonts.outfit(
                      color: Colors.grey[600],
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
