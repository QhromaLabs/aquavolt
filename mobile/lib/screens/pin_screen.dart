import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:go_router/go_router.dart';
import '../services/biometric_service.dart';
import '../widgets/top_toast.dart';

enum PinMode { setup, verify, change }

class PinScreen extends StatefulWidget {
  final PinMode mode;
  final VoidCallback? onSuccess;
  final VoidCallback? onCancel;

  const PinScreen({
    super.key,
    required this.mode,
    this.onSuccess,
    this.onCancel,
  });

  @override
  State<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends State<PinScreen> with SingleTickerProviderStateMixin {
  String _currentPin = '';
  String _firstPinInput = ''; // For setup mode confirmation
  String _headerText = '';
  bool _isConfirming = false; // For setup mode
  bool _isLoading = false;
  bool _canCheckBiometrics = false;
  
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  final BiometricService _biometricService = BiometricService();

  @override
  void initState() {
    super.initState();
    _checkBiometricAvailability();
    
    // Pulse animation for fingerprint icon
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat(reverse: true);
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Auto-trigger biometric if in verify mode and enabled
    if (widget.mode == PinMode.verify) {
       _attemptAutoBiometric();
    }
    _updateHeaderText();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }
  
  Future<void> _attemptAutoBiometric() async {
    // Small delay to let UI render first
    await Future.delayed(const Duration(milliseconds: 500));
    final enabled = await _biometricService.isBiometricEnabled();
    if (enabled && mounted) {
      _handleBiometricAuth();
    }
  }

  Future<void> _checkBiometricAvailability() async {
    final available = await _biometricService.isBiometricAvailable;
    final enabled = await _biometricService.isBiometricEnabled();
    if (mounted) {
      setState(() {
        _canCheckBiometrics = available && (widget.mode == PinMode.setup || (widget.mode == PinMode.verify && enabled));
      });
    }
  }

  Future<void> _handleBiometricAuth() async {
    if (_isLoading) return; // Prevent multiple calls
    
    setState(() => _isLoading = true);
    
    try {
      final authenticated = await _biometricService.authenticate();
      
      if (authenticated) {
        if (mounted) {
           if (widget.onSuccess != null) {
             widget.onSuccess!();
           } else {
             if (context.canPop()) {
               context.pop(true);
             }
           }
        }
      } else {
        // Authentication failed or cancelled
        if (mounted) {
           // Optional: Show a message? Usually system UI shows "Not recognized".
           // If it sends us back here, it means the user cancelled or max attempts reached.
           setState(() => _isLoading = false);
        }
      }
    } catch (e) {
      if (mounted) {
        showTopToast(context, 'Biometric error: $e', type: ToastType.error);
        setState(() => _isLoading = false);
      }
    }
  }

  void _updateHeaderText() {
    setState(() {
      if (widget.mode == PinMode.setup) {
        _headerText = _isConfirming ? 'Confirm your PIN' : 'Create a PIN';
      } else if (widget.mode == PinMode.verify) {
        _headerText = 'Enter your PIN';
      } else if (widget.mode == PinMode.change) {
        // For change, first we might ask for old PIN, but let's assume
        // we've already verified identity or just asking for new pin?
        // Simpler flow: "Enter new PIN" -> "Confirm new PIN".
        // Realistically, security wise, we should ask for OLD pin first.
        // For now, let's treat 'change' as 'setup new pin'.
        _headerText = _isConfirming ? 'Confirm new PIN' : 'Enter new PIN';
      }
    });
  }

  void _onDigitPress(String digit) {
    if (_currentPin.length < 4) {
      setState(() {
        _currentPin += digit;
      });
      if (_currentPin.length == 4) {
        _handlePinComplete();
      }
    }
  }

  void _onDeletePress() {
    if (_currentPin.isNotEmpty) {
      setState(() {
        _currentPin = _currentPin.substring(0, _currentPin.length - 1);
      });
    }
  }

  Future<void> _handlePinComplete() async {
    setState(() => _isLoading = true);
    
    // Tiny delay for UX
    await Future.delayed(const Duration(milliseconds: 100));

    try {
      if (widget.mode == PinMode.setup || widget.mode == PinMode.change) {
        if (!_isConfirming) {
          // First entry done, ask for confirm
          setState(() {
            _firstPinInput = _currentPin;
            _currentPin = '';
            _isConfirming = true;
            _updateHeaderText();
            _isLoading = false;
          });
        } else {
          // Confirmation entry done
          if (_currentPin == _firstPinInput) {
            // Match! Save it.
            await _biometricService.setPin(_currentPin);
            // Also enable app lock if setting up
             if (widget.mode == PinMode.setup) {
              await _biometricService.setAppLockEnabled(true);
            }
            if (mounted) {
               showTopToast(context, 'PIN set successfully', type: ToastType.success);
               
               // Ensure we reset loading state before navigation/callback
               setState(() => _isLoading = false);
               
               if (widget.onSuccess != null) {
                 widget.onSuccess!();
               } else {
                 if (context.canPop()) {
                   context.pop();
                 }
               }
            }
          } else {
            // Mismatch
            if (mounted) {
               showTopToast(context, 'PINs do not match. Try again.', type: ToastType.error);
            }
            if (mounted) {
              setState(() {
                _currentPin = '';
                _firstPinInput = '';
                _isConfirming = false;
                _updateHeaderText();
                _isLoading = false;
              });
            }
          }
        }
      } else if (widget.mode == PinMode.verify) {
        final isValid = await _biometricService.checkPin(_currentPin);
        if (isValid) {
          if (mounted) {
            setState(() => _isLoading = false); // Reset before nav
            
            if (widget.onSuccess != null) {
              widget.onSuccess!();
            } else {
               context.pop(true);
            }
          }
        } else {
             if (mounted) {
               showTopToast(context, 'Incorrect PIN', type: ToastType.error);
            }
            if(mounted) {
              setState(() {
                _currentPin = '';
                _isLoading = false;
              });
            }
        }
      }
    } catch (e) {
      if(mounted) showTopToast(context, 'Error: $e', type: ToastType.error);
      if(mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Prevent back button in verify mode unless cancelled explicitly (which might not be allowed for lock screen)
    final canPop = widget.mode != PinMode.verify; 

    return PopScope(
      canPop: canPop,
      child: Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false, // Handle leading manually
        leading: (widget.onCancel != null || (context.canPop() && canPop))
            ? IconButton(
                icon: const Icon(PhosphorIconsRegular.x, color: Colors.black),
                onPressed: () {
                   widget.onCancel?.call();
                   if (widget.onCancel == null && context.canPop()) context.pop();
                },
              )
            : null,
      ),
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(PhosphorIconsFill.lockKey, size: 48, color: Color(0xFF1ECF49)),
            const SizedBox(height: 24),
            Text(
              _headerText,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 32),
            // PIN Dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(4, (index) {
                final isFilled = index < _currentPin.length;
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    color: isFilled ? const Color(0xFF1ECF49) : Colors.grey.shade300,
                    shape: BoxShape.circle,
                  ),
                );
              }),
            ),
            const SizedBox(height: 64),
            // Numpad
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else
              _buildNumPad(),
          ],
        ),
      ),
    ),
    );
  }

  Widget _buildNumPad() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 48),
      child: Column(
        children: [
          _buildRow(['1', '2', '3']),
          const SizedBox(height: 24),
          _buildRow(['4', '5', '6']),
          const SizedBox(height: 24),
          _buildRow(['7', '8', '9']),
          const SizedBox(height: 24),
          _buildRow([null, '0', 'del']),
        ],
      ),
    );
  }

  Widget _buildRow(List<String?> items) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: items.map((item) {
        if (item == null) return const SizedBox(width: 64, height: 64);
        if (item == 'del') {
          return SizedBox(
            width: 64,
            height: 64,
            child: InkWell(
              onTap: _onDeletePress,
              borderRadius: BorderRadius.circular(32),
              child: const Icon(PhosphorIconsRegular.backspace, size: 28),
            ),
          );
        }
        return SizedBox(
          width: 64,
          height: 64,
          child: InkWell(
            onTap: () => _onDigitPress(item),
            borderRadius: BorderRadius.circular(32),
            child: Center(
              child: Text(
                item,
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w500),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
