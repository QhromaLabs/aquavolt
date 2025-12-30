import 'package:flutter/material.dart';

enum ToastType { success, error, info }

void showTopToast(BuildContext context, String message, {ToastType type = ToastType.success}) {
  final overlay = Overlay.of(context);
  final overlayEntry = OverlayEntry(
    builder: (context) => _TopToastWidget(
      message: message,
      type: type,
      onDismiss: () {},
    ),
  );

  overlay.insert(overlayEntry);
  Future.delayed(const Duration(seconds: 3), () {
    overlayEntry.remove();
  });
}

class _TopToastWidget extends StatelessWidget {
  final String message;
  final ToastType type;
  final VoidCallback onDismiss;

  const _TopToastWidget({
    required this.message,
    required this.type,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    Color bgColor;
    IconData icon;

    switch (type) {
      case ToastType.success:
        bgColor = const Color(0xFF1ECF49);
        icon = Icons.check_circle;
        break;
      case ToastType.error:
        bgColor = const Color(0xFFF5222D);
        icon = Icons.error;
        break;
      case ToastType.info:
        bgColor = const Color(0xFF1890FF);
        icon = Icons.info;
        break;
    }

    return Positioned(
      top: MediaQuery.of(context).padding.top + 10,
      left: 20,
      right: 20,
      child: Material(
        color: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(12),
            boxShadow: const [
              BoxShadow(
                color: Colors.black26,
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(icon, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
