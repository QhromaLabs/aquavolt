import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import '../providers/tenant_provider.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../widgets/token_receipt_modal.dart';
import '../widgets/top_toast.dart';

class BuyTokenScreen extends StatefulWidget {
  const BuyTokenScreen({super.key});

  @override
  State<BuyTokenScreen> createState() => _BuyTokenScreenState();
}

class _BuyTokenScreenState extends State<BuyTokenScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedUnitId;
  double? _amount;
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _amountController = TextEditingController();


  bool _isPurchasing = false;

  
  // Settings from DB
  double _serviceFeePercent = 5.0; // Default
  double? _tariffRate;

  double _asDouble(dynamic value) {
    if (value is num) return value.toDouble();
    if (value == null) return 0;
    return double.tryParse(value.toString()) ?? 0;
  }

  @override
  void initState() {
    super.initState();
    _fetchPhoneNumber();
    _fetchSettings(); // Fetch dynamic settings
    
    // Auto-select unit setup
    final tenantProvider = context.read<TenantProvider>();
    if (tenantProvider.units.isNotEmpty) {
      _selectedUnitId = tenantProvider.units[0]['unitId'];
    }
  }

  Future<void> _fetchSettings() async {
    try {
      final response = await Supabase.instance.client
          .from('admin_settings')
          .select('key, value')
          .inFilter('key', ['service_fee_percent', 'tariff_ksh_per_kwh']);
      
      if (response != null) {
        for (var item in response) {
          if (item['key'] == 'service_fee_percent') {
            setState(() {
              _serviceFeePercent = double.tryParse(item['value'].toString()) ?? 5.0;
            });
          } else if (item['key'] == 'tariff_ksh_per_kwh') {
            setState(() {
              _tariffRate = double.tryParse(item['value'].toString());
            });
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching settings: $e');
    }
  }

  Future<void> _fetchPhoneNumber() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user != null) {
      final data = await Supabase.instance.client
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .single();
      
      if (data['phone'] != null) {
        String phone = data['phone'].toString().replaceAll(' ', '');
        if (phone.startsWith('0')) phone = '254${phone.substring(1)}';
        _phoneController.text = phone;
      }
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  void _handleQuickAmount(double amount) {
    setState(() {
      _amount = amount;
      _amountController.text = amount.toInt().toString();
    });
  }

  // Calculation Helpers
  double get _netAmount {
    if (_amount == null) return 0;
    return _amount! * (1 - _serviceFeePercent / 100);
  }

  double get _feeAmount {
    if (_amount == null) return 0;
    return _amount! * (_serviceFeePercent / 100);
  }

  double get _estimatedUnits {
    if (_tariffRate == null || _tariffRate! <= 0) return 0;
    return _netAmount / _tariffRate!;
  }

  Future<void> _initiatePurchase() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedUnitId == null) {
      showTopToast(context, 'Please select a unit', type: ToastType.error);
      return;
    }

    setState(() {
      _isPurchasing = true;
    });

    try {
      final user = Supabase.instance.client.auth.currentUser;
      final amount = double.parse(_amountController.text);
      final phone = _phoneController.text.trim();

      // 1. Invoke Edge Function for STK Push
      final FunctionResponse response = await Supabase.instance.client.functions.invoke(
        'mpesa-stk-push',
        body: {
          'phoneNumber': phone,
          'amount': amount,
          'unitId': _selectedUnitId,
          'tenantId': user?.id,
        },
      );

      final data = response.data;
      if (data == null || data['success'] != true) {
        throw Exception(data?['message'] ?? 'STK Push failed');
      }

      final checkoutRequestId = data['checkoutRequestId'];
      if (checkoutRequestId == null) throw Exception('No checkout request ID returned');

      setState(() {
        // _statusMessage = 'Enter M-Pesa PIN on your phone...'; 
      });

      // 2. Poll for payment status
      await _pollPaymentStatus(checkoutRequestId);

    } catch (e) {
      if (mounted) {
        showTopToast(context, 'Error: ${e.toString().replaceAll('Exception:', '')}', type: ToastType.error);
      }
    } finally {
      if (mounted) {
        setState(() {
          _isPurchasing = false;
        });
      }
    }
  }

  Future<void> _pollPaymentStatus(String checkoutRequestId) async {
    int attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout
    bool confirmed = false;

    while (attempts < maxAttempts && !confirmed) {
      await Future.delayed(const Duration(seconds: 1));
      attempts++;

      final res = await Supabase.instance.client
          .from('mpesa_payments')
          .select('status, token_vended, topup_id')
          .eq('checkout_request_id', checkoutRequestId)
          .single();
      
      final status = res['status'];
      final tokenVended = res['token_vended'];
      final topupId = res['topup_id'];

      if (status == 'success' && tokenVended == true && topupId != null) {
        confirmed = true;
        // Fetch the generated token
        final topupRes = await Supabase.instance.client
            .from('topups')
            .select('token, amount_paid, units_kwh, units(meter_number)')
            .eq('id', topupId)
            .maybeSingle();

        if (mounted) {
          final fetchedUnits = _asDouble(topupRes?['units_kwh']);
          final computedUnits = _estimatedUnits;
          final unitsToUse = fetchedUnits > 0 ? fetchedUnits : computedUnits;
          final amountPaid = _asDouble(topupRes?['amount_paid']);
          final token = topupRes?['token'] as String?;
          final meterNumber = topupRes?['units']?['meter_number'] as String?;

          _showSuccessDialog(token, unitsToUse, amountPaid, meterNumber);
          // Refresh dashboard data in background
          context.read<TenantProvider>().refresh();
        }
      } else if (status == 'failed' || status == 'cancelled') {
        throw Exception('Payment $status by user or network.');
      }
    }

    if (!confirmed) {
      throw Exception('Payment monitoring timed out. Check history later.');
    }
  }

  void _showSuccessDialog(String? token, num? units, double? amountPaid, String? meterNumber) {
    final tenantProvider = context.read<TenantProvider>();
    final selectedUnit = tenantProvider.units.firstWhere(
      (u) => u['unitId'] == _selectedUnitId,
      orElse: () => {},
    );

    final modalData = {
      'token': token ?? 'Pending',
      'amount_paid': amountPaid ?? _amount ?? 0,
      'units_kwh': units ?? _estimatedUnits,
      'created_at': DateTime.now().toIso8601String(),
      'meter_number': meterNumber ?? (selectedUnit is Map ? selectedUnit['meterNumber'] : '') ?? '',
    };

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: TokenReceiptModal(tokenData: modalData),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final tenantProvider = context.watch<TenantProvider>();
    final units = tenantProvider.units;

    // Custom Input Decoration
    InputDecoration customInputDecoration(String label, IconData icon, {String? hintText, String? prefixText}) {
      return InputDecoration(
        labelText: label,
        hintText: hintText,
        prefixText: prefixText,
        prefixIcon: Icon(icon, color: Colors.grey.shade600),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFF1ECF49), width: 2),
        ),
        labelStyle: TextStyle(color: Colors.grey.shade600),
        floatingLabelStyle: const TextStyle(color: Color(0xFF1ECF49)),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: Column(
          children: [
             // Custom Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                child: Row(
                  children: [
                      IconButton(
                        icon: Icon(PhosphorIcons.caretLeft(), size: 20),
                      onPressed: () => context.go('/dashboard'),
                    ),
                    const SizedBox(width: 8),
                    const Text('Buy Tokens', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),

             Expanded(
               child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Unit Selection
                      DropdownButtonFormField<String>(
                        value: _selectedUnitId,
                        decoration: customInputDecoration('Select Unit', PhosphorIcons.house()),
                        dropdownColor: Colors.white,
                        items: units.map((u) {
                          return DropdownMenuItem(
                            value: u['unitId'] as String,
                            child: Text('${u['unitLabel']} (${u['meterNumber']})', style: const TextStyle(fontWeight: FontWeight.w500)),
                          );
                        }).toList(),
                        onChanged: (val) => setState(() => _selectedUnitId = val),
                        validator: (val) => val == null ? 'Required' : null,
                      ),
                      const SizedBox(height: 24),

                      // Quick Amounts
                      const Text('Quick Amount', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [100, 200, 500, 1000, 2000].map((amt) {
                          final isSelected = _amount == amt.toDouble();
                          return InkWell(
                            onTap: () => _handleQuickAmount(amt.toDouble()),
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFF1ECF49) : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? const Color(0xFF1ECF49) : Colors.grey.shade300,
                                ),
                                boxShadow: [
                                  if (!isSelected)
                                    BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2))
                                ],
                              ),
                              child: Text(
                                'KES $amt',
                                style: TextStyle(
                                  color: isSelected ? Colors.white : Colors.black87,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 24),

                      // Amount Input
                      TextFormField(
                        controller: _amountController,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                        decoration: customInputDecoration('Amount', PhosphorIcons.wallet(), prefixText: 'KES '),
                        onChanged: (val) {
                          setState(() {
                            _amount = double.tryParse(val);
                          });
                        },
                        validator: (val) {
                          if (val == null || val.isEmpty) return 'Enter amount';
                          final n = double.tryParse(val);
                          if (n == null || n < 10) return 'Min KES 10';
                          return null;
                        },
                      ),
                      
                      // Detailed Breakdown Display
                      if (_amount != null && _amount! > 0) ...[
                         const SizedBox(height: 16),
                         Container(
                           padding: const EdgeInsets.all(20),
                           decoration: BoxDecoration(
                             color: Colors.white,
                             borderRadius: BorderRadius.circular(16),
                             border: Border.all(color: Colors.grey.shade200),
                           ),
                           child: Column(
                             children: [
                               // Amount
                               Row(
                                 mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                 children: [
                                   Text('Amount', style: TextStyle(color: Colors.grey.shade600)),
                                   Text('KES ${_amount!.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                 ],
                               ),
                               const Divider(height: 24),
                               // Est Units
                               Row(
                                 mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                 children: [
                                   const Column(
                                     crossAxisAlignment: CrossAxisAlignment.start,
                                     children: [
                                       Text('Est. Units (kWh)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                       // Hiding Rate Text as requested
                                     ],
                                   ),
                                   Text(
                                     '${_estimatedUnits.toStringAsFixed(2)} kWh',
                                     style: const TextStyle(
                                       fontWeight: FontWeight.bold, 
                                       color: Color(0xFF1ECF49), 
                                       fontSize: 20
                                     ),
                                   ),
                                 ],
                               ),
                             ],
                           ),
                         ),
                      ],

                      const SizedBox(height: 24),

                      // Phone Number
                      TextFormField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: customInputDecoration('M-Pesa Number', PhosphorIcons.deviceMobile(), hintText: '2547...'),
                        validator: (val) {
                          if (val == null || val.isEmpty) return 'Required';
                          if (!val.startsWith('254') && !val.startsWith('07')) return 'Invalid format';
                          return null;
                        },
                      ),

                      const SizedBox(height: 80), // Spacer
                    ],
                  ),
                ),
              ),
             ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -5),
            )
          ]
        ),
        child: SafeArea(
          child: FilledButton(
             onPressed: (_isPurchasing || _amount == null || _amount! < 10) ? null : _initiatePurchase,
             style: FilledButton.styleFrom(
               backgroundColor: const Color(0xFF1ECF49),
               minimumSize: const Size(double.infinity, 56),
               shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
               elevation: 0, // Flat premium look
             ),
             child: _isPurchasing 
                ? const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                      SizedBox(width: 12),
                      Text('Processing...', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  )
                : Text(
                    'Pay KES ${_amount?.toStringAsFixed(0) ?? '0'}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
          ),
        ),
      ),
    );
  }
}
