import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/tutorial_provider.dart';

class TutorialTarget extends StatefulWidget {
  final String id;
  final Widget child;

  const TutorialTarget({
    super.key,
    required this.id,
    required this.child,
  });

  @override
  State<TutorialTarget> createState() => _TutorialTargetState();
}

class _TutorialTargetState extends State<TutorialTarget> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _updatePosition());
  }

  void _updatePosition() {
    if (!mounted) return;
    final RenderBox? renderBox = context.findRenderObject() as RenderBox?;
    if (renderBox != null) {
      final position = renderBox.localToGlobal(Offset.zero);
      final size = renderBox.size;
      context.read<TutorialProvider>().registerTarget(
            widget.id,
            Rect.fromLTWH(position.dx, position.dy, size.width, size.height),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Also update on build to handle layout changes
    WidgetsBinding.instance.addPostFrameCallback((_) => _updatePosition());
    return widget.child;
  }
}
