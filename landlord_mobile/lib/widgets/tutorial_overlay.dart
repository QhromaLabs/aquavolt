import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../providers/tutorial_provider.dart';

class TutorialOverlay extends StatelessWidget {
  final Widget child;

  const TutorialOverlay({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Consumer<TutorialProvider>(
      builder: (context, tutorial, _) {
        return Stack(
          children: [
            child,
            if (tutorial.isTutorialActive)
              Positioned.fill(
                child: _TutorialUI(tutorial: tutorial),
              ),
          ],
        );
      },
    );
  }
}

class _TutorialUI extends StatefulWidget {
  final TutorialProvider tutorial;
  const _TutorialUI({required this.tutorial});

  @override
  State<_TutorialUI> createState() => _TutorialUIState();
}

class _TutorialUIState extends State<_TutorialUI> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _fadeAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeIn);
    _controller.forward();
  }

  @override
  void didUpdateWidget(_TutorialUI oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.tutorial.currentStepIndex != oldWidget.tutorial.currentStepIndex) {
      _controller.reset();
      _controller.forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final step = widget.tutorial.currentStep;
    if (step == null) return const SizedBox.shrink();

    Offset? highlightPos = step.highlightPosition;
    Size? highlightSize = step.highlightSize;

    if (step.targetId != null) {
      final rect = widget.tutorial.getTargetRect(step.targetId!);
      if (rect != null) {
        highlightPos = rect.center;
        highlightSize = rect.size;
      }
    }

    return Material(
      color: Colors.transparent,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Stack(
          children: [
            // Punched-hole background
            if (highlightPos != null)
              ColorFiltered(
                colorFilter: ColorFilter.mode(
                  Colors.black.withValues(alpha: 0.7),
                  BlendMode.srcOut,
                ),
                child: Stack(
                  children: [
                    Container(
                      decoration: const BoxDecoration(
                        color: Colors.black,
                        backgroundBlendMode: BlendMode.dstOut,
                      ),
                    ),
                    Positioned(
                      left: highlightPos.dx - (highlightSize?.width ?? 60) / 2,
                      top: highlightPos.dy - (highlightSize?.height ?? 60) / 2,
                      child: Container(
                        width: highlightSize?.width ?? 60,
                        height: highlightSize?.height ?? 60,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24), // Match modal/card radius
                        ),
                      ),
                    ),
                  ],
                ),
              )
            else
              Container(color: Colors.black.withValues(alpha: 0.7)),

            // Glowing Outline
            if (highlightPos != null)
              Positioned(
                left: highlightPos.dx - (highlightSize?.width ?? 60) / 2 - 4,
                top: highlightPos.dy - (highlightSize?.height ?? 60) / 2 - 4,
                child: _GlowingRect(
                  size: Size((highlightSize?.width ?? 60) + 8, (highlightSize?.height ?? 60) + 8),
                ),
              ),

            // Instruction Card
            AnimatedAlign(
              duration: const Duration(milliseconds: 400),
              curve: Curves.easeOutBack,
              alignment: (highlightPos != null && highlightPos.dy > MediaQuery.of(context).size.height * 0.5)
                  ? Alignment.topCenter
                  : Alignment.bottomCenter,
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Container(
                  margin: EdgeInsets.only(
                    top: (highlightPos != null && highlightPos.dy > MediaQuery.of(context).size.height * 0.5) ? 40 : 0,
                    bottom: (highlightPos != null && highlightPos.dy <= MediaQuery.of(context).size.height * 0.5) ? 40 : 0,
                  ),
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 30,
                        offset: const Offset(0, 15),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1ECF49).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              'Step ${widget.tutorial.currentStepIndex + 1} of ${widget.tutorial.currentTutorialSteps.length}',
                              style: const TextStyle(
                                color: Color(0xFF1ECF49),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          IconButton(
                            onPressed: () => widget.tutorial.stopTutorial(),
                            icon: const Icon(PhosphorIconsRegular.x, size: 20),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        step.title,
                        style: GoogleFonts.outfit(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        step.description,
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => widget.tutorial.stopTutorial(),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                side: BorderSide(color: Colors.grey.shade200),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: Text('Skip', style: GoogleFonts.outfit(color: Colors.grey.shade600)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => widget.tutorial.nextStep(),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF1ECF49),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                elevation: 0,
                              ),
                              child: Text(
                                widget.tutorial.currentStepIndex == widget.tutorial.currentTutorialSteps.length - 1
                                    ? 'Finish'
                                    : 'Next',
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GlowingRect extends StatefulWidget {
  final Size size;
  const _GlowingRect({required this.size});

  @override
  State<_GlowingRect> createState() => _GlowingRectState();
}

class _GlowingRectState extends State<_GlowingRect> with SingleTickerProviderStateMixin {
  late AnimationController _glowController;

  @override
  void initState() {
    super.initState();
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _glowController,
      builder: (context, child) {
        return Container(
          width: widget.size.width,
          height: widget.size.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(26), // 24 (hole) + 2 (offset)
            border: Border.all(
              color: const Color(0xFF1ECF49).withValues(alpha: 0.8 * _glowController.value),
              width: 3 * _glowController.value,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1ECF49).withValues(alpha: 0.3 * _glowController.value),
                blurRadius: 10 * _glowController.value,
                spreadRadius: 2 * _glowController.value,
              ),
            ],
          ),
        );
      },
    );
  }
}
