import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/auth_provider.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../widgets/top_toast.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isSaving = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) {
      setState(() => _isLoading = false);
      return;
    }
    try {
      final meta = user.userMetadata ?? {};
      _nameController.text = meta['full_name'] ?? '';
      _phoneController.text = meta['phone'] ?? '';

      final res = await Supabase.instance.client
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .maybeSingle();

      if (res != null) {
        _nameController.text = res['full_name']?.toString() ?? _nameController.text;
        _phoneController.text = res['phone']?.toString() ?? _phoneController.text;
      }
    } catch (_) {
      // ignore fetch errors, keep defaults
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveProfile() async {
    final user = context.read<AuthProvider>().user;
    if (user == null) return;

    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    if (name.isEmpty || phone.isEmpty) {
      showTopToast(context, 'Name and phone are required', type: ToastType.error);
      return;
    }

    setState(() => _isSaving = true);
    try {
      await Supabase.instance.client.from('profiles').upsert({
        'id': user.id,
        'full_name': name,
        'phone': phone,
        'phone_number': phone, // syncing both just in case
        'role': 'tenant', // Explicitly provide role for new inserts
        'updated_at': DateTime.now().toIso8601String(),
      });

      if (mounted) {
        showTopToast(context, 'Profile updated', type: ToastType.success);
      }
    } catch (e) {
      if (mounted) {
        // Fallback to standard snackbar if toast isn't visible
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Update failed: $e'), 
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _resetPassword() async {
    final email = context.read<AuthProvider>().user?.email;
    if (email == null) return;
    try {
      await Supabase.instance.client.auth.resetPasswordForEmail(email);
      showTopToast(context, 'Password reset email sent', type: ToastType.success);
    } catch (e) {
      showTopToast(context, 'Could not send reset email: $e', type: ToastType.error);
    }
  }

  Future<void> _openSupport() async {
    final uri = Uri(scheme: 'mailto', path: 'support@aquavolt.com');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      showTopToast(context, 'Unable to open email client', type: ToastType.error);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(PhosphorIconsRegular.caretLeft),
                          onPressed: () => context.go('/dashboard'),
                        ),
                        const SizedBox(width: 8),
                        const Text('Profile', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF1ECF49), Color(0xFF12B33E)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF1ECF49).withValues(alpha: 0.3),
                            blurRadius: 12,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                            ),
                            child: const Icon(PhosphorIconsFill.user, color: Colors.white, size: 36),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _nameController.text.isEmpty ? 'Tenant User' : _nameController.text,
                                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  user?.email ?? '',
                                  style: TextStyle(color: Colors.white.withValues(alpha: 0.8)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Account Info', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _nameController,
                            decoration: InputDecoration(
                              labelText: 'Full Name',
                              prefixIcon: const Icon(PhosphorIconsRegular.user),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              labelText: 'Phone Number',
                              prefixIcon: const Icon(PhosphorIconsRegular.phone),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                              onPressed: _isSaving ? null : _saveProfile,
                              icon: _isSaving
                                  ? const SizedBox(
                                      height: 16,
                                      width: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Icon(PhosphorIconsFill.floppyDiskBack),
                              label: Text(_isSaving ? 'Saving...' : 'Save Changes'),
                              style: FilledButton.styleFrom(
                                backgroundColor: const Color(0xFF1ECF49),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
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
                          _ProfileItem(
                            icon: PhosphorIconsRegular.lock,
                            title: 'Change Password',
                            onTap: _resetPassword,
                          ),
                          const Divider(height: 1),
                          _ProfileItem(
                            icon: PhosphorIconsRegular.bell,
                            title: 'Notifications',
                            onTap: () => context.push('/notifications'),
                          ),
                          const Divider(height: 1),
                          _ProfileItem(
                            icon: PhosphorIconsRegular.question,
                            title: 'Help & Support',
                            onTap: _openSupport,
                          ),
                          const Divider(height: 1),
                          _ProfileItem(
                            icon: PhosphorIconsRegular.signOut,
                            title: 'Sign Out',
                            titleColor: Colors.red,
                            iconColor: Colors.red,
                            onTap: () async {
                              await context.read<AuthProvider>().signOut();
                              if (context.mounted) context.go('/login');
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}

class _ProfileItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? titleColor;
  final Color? iconColor;

  const _ProfileItem({
    required this.icon,
    required this.title,
    required this.onTap,
    this.titleColor,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: (iconColor ?? const Color(0xFF1ECF49)).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor ?? const Color(0xFF1ECF49), size: 20),
      ),
      title: Text(title, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: titleColor ?? Colors.black87)),
      trailing: const Icon(PhosphorIconsRegular.caretRight, size: 20, color: Colors.grey),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
    );
  }
}
