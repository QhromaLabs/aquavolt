import 'package:flutter/material.dart';

class TutorialStep {
  final String title;
  final String description;
  final String route;
  final String? targetId;
  final Offset? highlightPosition;
  final Size? highlightSize;
  final VoidCallback? onStepStarted;

  TutorialStep({
    required this.title,
    required this.description,
    required this.route,
    this.targetId,
    this.highlightPosition,
    this.highlightSize,
    this.onStepStarted,
  });
}

class TutorialProvider extends ChangeNotifier {
  bool _isTutorialActive = false;
  int _currentStepIndex = 0;
  List<TutorialStep> _currentTutorialSteps = [];
  final Map<String, Rect> _targets = {};

  bool get isTutorialActive => _isTutorialActive;
  int get currentStepIndex => _currentStepIndex;
  List<TutorialStep> get currentTutorialSteps => _currentTutorialSteps;
  TutorialStep? get currentStep => _isTutorialActive ? _currentTutorialSteps[_currentStepIndex] : null;

  void registerTarget(String id, Rect rect) {
    _targets[id] = rect;
    if (_isTutorialActive) notifyListeners();
  }

  Rect? getTargetRect(String id) => _targets[id];

  void startTutorial(List<TutorialStep> steps) {
    _currentTutorialSteps = steps;
    _currentStepIndex = 0;
    _isTutorialActive = true;
    notifyListeners();
    _executeStepAction();
  }

  void nextStep() {
    if (_currentStepIndex < _currentTutorialSteps.length - 1) {
      _currentStepIndex++;
      notifyListeners();
      _executeStepAction();
    } else {
      stopTutorial();
    }
  }

  void stopTutorial() {
    _isTutorialActive = false;
    _currentTutorialSteps = [];
    _currentStepIndex = 0;
    notifyListeners();
  }

  void _executeStepAction() {
    if (currentStep?.onStepStarted != null) {
      currentStep!.onStepStarted!();
    }
  }
}
