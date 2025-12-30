import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../widgets/token_receipt_modal.dart';
import '../widgets/top_toast.dart';
import '../providers/landlord_provider.dart';

class LandlordBuyTokenScreen extends StatefulWidget {
  final Map<String, dynamic> tenant;
  final Map<String, dynamic> unit;

  const LandlordBuyTokenScreen({
    super.key,
    required this.tenant,
    required this.unit,
  });

  @override
  State<LandlordBuyTokenScreen> createState() => _LandlordBuyTokenScreenState();
}

class _LandlordBuyTokenScreenState extends State<LandlordBuyTokenScreen> {
  final _formKey = GlobalKey<FormState>();
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
    _fetchSettings();
    _setupInitialData();
  }

  void _setupInitialData() {
    // Pre-fill phone if available in tenant data
    // Tenant data comes from LandlordProvider's tenant list which has 'tenant_phone'
    final phone = widget.tenant['tenant_phone'] ?? widget.tenant['phone'] ?? '';
    if (phone.isNotEmpty) {
      String cleanPhone = phone.toString().replaceAll(' ', '');
      if (cleanPhone.startsWith('0')) cleanPhone = '254${cleanPhone.substring(1)}';
      _phoneController.text = cleanPhone;
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

  double get _estimatedUnits {
    if (_tariffRate == null || _tariffRate! <= 0) return 0;
    return _netAmount / _tariffRate!;
  }

  Future<void> _initiatePurchase() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isPurchasing = true;
    });

    try {
      final amount = double.parse(_amountController.text);
      final phone = _phoneController.text.trim();
      
      // Use logic similar to Client app but identifying source as 'landlord' if possible,
      // or just "on behalf of".
      // We pass the tenantId (from widget.tenant) so the history goes to them.
      // We assume user is Landlord, logged in.
      
      // The Edge Function 'mpesa-stk-push' expects: { phoneNumber, amount, unitId, tenantId }
      // This is perfect! We can just pass the tenant's ID directly.
      
      final tenantId = widget.tenant['tenant_id'] ?? widget.tenant['id'];
      
      if (tenantId == null) {
         throw Exception('Cannot identify tenant ID');
      }

      final FunctionResponse response = await Supabase.instance.client.functions.invoke(
        'mpesa-stk-push',
        body: {
          'phoneNumber': phone,
          'amount': amount,
          'unitId': widget.unit['id'],
          'tenantId': tenantId, // Attribution to tenant!
          'initiatedBy': 'landlord' // Optional metadata if needed later
        },
      );

      final data = response.data;
      if (data == null || data['success'] != true) {
        throw Exception(data?['message'] ?? 'STK Push failed');
      }

      final checkoutRequestId = data['checkoutRequestId'];
      if (checkoutRequestId == null) throw Exception('No checkout request ID returned');
      
      showTopToast(context, 'STK Push sent to $phone', type: ToastType.info);

      // Poll for payment status
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
          .maybeSingle();
      
      if (res == null) {
         // Record not found yet or not visible due to RLS. Wait and retry.
         continue;
      }
      
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

          // Show Success Dialog
          _showSuccessDialog(token, unitsToUse, amountPaid, meterNumber);
          
          // Refresh provider to show updated stats later
          context.read<LandlordProvider>().refresh();
        }
      } else if (status == 'failed' || status == 'cancelled') {
        throw Exception('Payment $status by user or network.');
      }
    }

    if (!confirmed) {
      throw Exception('Payment monitoring timed out. Check Tenant History.');
    }
  }

  void _showSuccessDialog(String? token, num? units, double? amountPaid, String? meterNumber) {
    final tenantName = widget.tenant['tenant_name'] ?? 'Tenant';

    final modalData = {
      'token': token ?? 'Pending',
      'amount_paid': amountPaid ?? _amount ?? 0,
      'units_kwh': units ?? _estimatedUnits,
      'created_at': DateTime.now().toIso8601String(),
      'meter_number': meterNumber ?? widget.unit['meter_number'] ?? '',
      'customer_name': tenantName
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

  @override
  Widget build(BuildContext context) {
    final tenantName = widget.tenant['tenant_name'] ?? 'Tenant';
    final unitLabel = widget.unit['label'] ?? 'Unknown Unit';
    final meterNum = widget.unit['meter_number'] ?? 'N/A';

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
                        onPressed: () => context.pop(),
                    ),
                    const SizedBox(width: 8),
                    const Text('Purchase Token', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
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
                      // Target Info Card
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE6F7FF),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF91D5FF)),
                        ),
                        child: Row(
                          children: [
                            const Icon(PhosphorIconsFill.info, color: Color(0xFF1890FF)),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Buying for $tenantName',
                                    style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0050B3)),
                                  ),
                                  Text(
                                    'Unit $unitLabel • Meter $meterNum',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF003A8C)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
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
               elevation: 0,
             ),
             child: _isPurchasing 
                ? const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                      SizedBox(width: 12),
                      Text('Processing Request...', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  )
                : Text(
                    'Purchase KES ${_amount?.toStringAsFixed(0) ?? '0'}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
          ),
        ),
      ),
    );
  }
}
