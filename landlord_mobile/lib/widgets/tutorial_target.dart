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
  ScrollPosition? _scrollPosition;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _updateScrollListener();
  }

  void _updateScrollListener() {
    final newScrollPosition = Scrollable.maybeOf(context)?.position;
    if (newScrollPosition != _scrollPosition) {
      _scrollPosition?.removeListener(_updatePosition);
      _scrollPosition = newScrollPosition;
      _scrollPosition?.addListener(_updatePosition);
    }
  }

  @override
  void dispose() {
    _scrollPosition?.removeListener(_updatePosition);
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _updatePosition());
  }

  void _updatePosition() {
    if (!mounted) return;
    final RenderBox? renderBox = context.findRenderObject() as RenderBox?;
    if (renderBox != null && renderBox.hasSize) {
      final position = renderBox.localToGlobal(Offset.zero);
      final size = renderBox.size;
      
      // Notify provider of new position
      context.read<TutorialProvider>().registerTarget(
            widget.id,
            Rect.fromLTWH(position.dx, position.dy, size.width, size.height),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Also update on build and layout changes
    WidgetsBinding.instance.addPostFrameCallback((_) => _updatePosition());
    return widget.child;
  }
}
