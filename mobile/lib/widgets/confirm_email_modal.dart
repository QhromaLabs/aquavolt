import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'top_toast.dart';

class ConfirmEmailModal extends StatefulWidget {
  final String email;
  final String password;

  const ConfirmEmailModal({
    super.key, 
    required this.email,
    required this.password,
  });

  @override
  State<ConfirmEmailModal> createState() => _ConfirmEmailModalState();
}

class _ConfirmEmailModalState extends State<ConfirmEmailModal> {
  bool _isChecking = false;

  Future<void> _checkVerification() async {
    setState(() => _isChecking = true);
    
    final authProvider = context.read<AuthProvider>();
    try {
      // Attempt to sign in. 
      // If email is NOT verified, Supabase (default config) often returns an error 
      // or simply doesn't create a session effectively preventing access if RLS relies on it.
      // However, typical Supabase behavior for unconfirmed email depends on project settings.
      // E.g. "Email Confirmations" enabled -> Login fails saying "Email not confirmed".
      
      await authProvider.signIn(widget.email, widget.password);
      
      if (mounted) {
        if (authProvider.user != null) {
           // Success!
           context.pushReplacement('/connect-meter');
        } else {
           // Should ideally be caught by catch block if signIn throws on failure
           showTopToast(context, 'Verification incomplete. Please check your email.', type: ToastType.error);
        }
      }
    } catch (e) {
      if (mounted) {
        // Parse error message comfortably
        final msg = e.toString().toLowerCase();
        if (msg.contains('email not confirmed')) {
           showTopToast(context, 'Email not yet verified. Please click the link in your inbox.', type: ToastType.info);
        } else {
           showTopToast(context, 'Verification failed: ${e.toString().replaceAll('AuthException:', '').trim()}', type: ToastType.error);
        }
      }
    } finally {
      if (mounted) setState(() => _isChecking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1ECF49).withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.mark_email_unread_outlined,
                size: 48,
                color: Color(0xFF1ECF49),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Verify your email',
              style: GoogleFonts.outfit(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'We\'ve sent a verification link to:',
              style: GoogleFonts.outfit(
                fontSize: 14,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            Text(
              widget.email,
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Text(
              'Please check your inbox and click the link to verify your account.',
              style: GoogleFonts.outfit(
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _isChecking ? null : _checkVerification,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF1ECF49),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isChecking 
                  ? const SizedBox(
                      height: 20, 
                      width: 20, 
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)
                    )
                  : const Text('I\'ve verified my email'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
