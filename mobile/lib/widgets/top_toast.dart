import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

enum ToastType { success, error, info }

void showTopToast(BuildContext context, String message,
    {ToastType type = ToastType.info, Duration duration = const Duration(seconds: 3)}) {
  final color = switch (type) {
    ToastType.success => const Color(0xFF16A34A),
    ToastType.error => const Color(0xFFE11D48),
    ToastType.info => const Color(0xFF2563EB),
  };

  ScaffoldMessenger.of(context).hideCurrentSnackBar();
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(
        message,
        style: GoogleFonts.outfit(fontWeight: FontWeight.w600, color: Colors.white),
      ),
      backgroundColor: color,
      elevation: 6,
      behavior: SnackBarBehavior.floating,
      duration: duration,
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}

