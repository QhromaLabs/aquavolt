import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../providers/landlord_provider.dart';
import 'top_toast.dart';
import 'token_receipt_modal.dart';
import 'package:intl/intl.dart';
import 'tutorial_target.dart';

class BuyTokensBottomSheet extends StatefulWidget {
  const BuyTokensBottomSheet({super.key});

  static void switchToManualTab() {
    _instance?._tabController.animateTo(1);
  }

  static _BuyTokensBottomSheetState? _instance;

  @override
  State<BuyTokensBottomSheet> createState() => _BuyTokensBottomSheetState();
}

class _BuyTokensBottomSheetState extends State<BuyTokensBottomSheet> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _customPhoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  
  double? _selectedAmount;
  Map<String, dynamic>? _selectedTenant;
  bool _isProcessing = false;
  
  // Settings from DB
  double _serviceFeePercent = 5.0;
  double? _tariffRate;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchSettings();
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
    _tabController.dispose();
    _amountController.dispose();
    _customPhoneController.dispose();
    super.dispose();
  }

  void _handleQuickAmount(double amount) {
    setState(() {
      _selectedAmount = amount;
      _amountController.text = amount.toInt().toString();
    });
  }

  double get _estimatedUnits {
    if (_selectedAmount == null || _tariffRate == null || _tariffRate! <= 0) return 0;
    double netAmount = _selectedAmount!;
    return netAmount / _tariffRate!;
  }

  Future<void> _initiatePurchase() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_selectedTenant == null) {
      showTopToast(context, 'Please select a unit/tenant first', type: ToastType.error);
      return;
    }

    String phone;
    if (_tabController.index == 0) {
      phone = _selectedTenant!['tenant_phone'] ?? '';
      if (phone.isEmpty) {
        showTopToast(context, 'Tenant has no phone number registered', type: ToastType.error);
        return;
      }
    } else {
      phone = _customPhoneController.text.trim();
      if (phone.isEmpty) {
        showTopToast(context, 'Please enter M-Pesa number', type: ToastType.error);
        return;
      }
    }

    setState(() => _isProcessing = true);

    try {
      final amount = double.parse(_amountController.text);
      final tenantId = _selectedTenant!['tenant_id'] ?? _selectedTenant!['id'];
      final unitId = _selectedTenant!['unit_id'] ?? _selectedTenant!['unit']['id'];

      // Ensure phone is in 254 format
      String cleanPhone = phone.replaceAll(' ', '').replaceAll('+', '');
      if (cleanPhone.startsWith('0')) cleanPhone = '254${cleanPhone.substring(1)}';
      if (!cleanPhone.startsWith('254')) cleanPhone = '254$cleanPhone';

      final FunctionResponse response = await Supabase.instance.client.functions.invoke(
        'mpesa-stk-push',
        body: {
          'phoneNumber': cleanPhone,
          'amount': amount,
          'unitId': unitId,
          'tenantId': tenantId,
          'initiatedBy': 'landlord'
        },
      );

      final data = response.data;
      if (data == null || data['success'] != true) {
        throw Exception(data?['message'] ?? 'STK Push failed');
      }

      final checkoutRequestId = data['checkoutRequestId'];
      showTopToast(context, 'STK Push sent to $cleanPhone', type: ToastType.info);

      await _pollPaymentStatus(checkoutRequestId);

    } catch (e) {
      if (mounted) {
        showTopToast(context, 'Error: ${e.toString().replaceAll('Exception:', '')}', type: ToastType.error);
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  Future<void> _pollPaymentStatus(String checkoutRequestId) async {
    int attempts = 0;
    const maxAttempts = 60;
    bool confirmed = false;

    while (attempts < maxAttempts && !confirmed) {
      await Future.delayed(const Duration(seconds: 1));
      attempts++;

      final res = await Supabase.instance.client
          .from('mpesa_payments')
          .select('status, token_vended, topup_id')
          .eq('checkout_request_id', checkoutRequestId)
          .maybeSingle();
      
      if (res == null) continue;
      
      final status = res['status'];
      if (status == 'success' && res['token_vended'] == true && res['topup_id'] != null) {
        confirmed = true;
        
        final topupRes = await Supabase.instance.client
            .from('topups')
            .select('token, amount_paid, units_kwh, units(meter_number, label, properties(name))')
            .eq('id', res['topup_id'])
            .maybeSingle();

        if (mounted) {
          Navigator.pop(context); // Close bottom sheet
          _showSuccessReceipt(topupRes);
          context.read<LandlordProvider>().refresh();
        }
      } else if (status == 'failed' || status == 'cancelled') {
        throw Exception('Payment $status by user.');
      }
    }

    if (!confirmed) throw Exception('Payment monitoring timed out.');
  }

  void _showSuccessReceipt(Map<String, dynamic>? topupData) {
    if (topupData == null) return;
    
    final modalData = {
      'token': topupData['token'] ?? 'Pending',
      'amount_paid': topupData['amount_paid'] ?? 0,
      'units_kwh': topupData['units_kwh'] ?? 0,
      'created_at': DateTime.now().toIso8601String(),
      'meter_number': topupData['units']?['meter_number'] ?? '',
      'customer_name': _selectedTenant?['tenant_name'] ?? 'Tenant',
      'unit_label': topupData['units']?['label'],
      'property_name': topupData['units']?['properties']?['name'],
    };

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => TokenReceiptModal(tokenData: modalData),
    );
  }

  @override
  Widget build(BuildContext context) {
    final landlord = context.watch<LandlordProvider>();
    final tenants = landlord.tenants;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Center(
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Buy Tokens',
                  style: GoogleFonts.outfit(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(PhosphorIconsRegular.x),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.grey.shade100,
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Amount Field
                    Text(
                      'Amount',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.black54,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TutorialTarget(
                      id: 'buy_tokens_amount_field',
                      child: TextFormField(
                        controller: _amountController,
                        keyboardType: TextInputType.number,
                        style: GoogleFonts.spaceMono(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1ECF49),
                        ),
                        decoration: InputDecoration(
                          hintText: '0.00',
                          prefixText: 'KES ',
                          prefixStyle: GoogleFonts.outfit(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey.shade400,
                          ),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(20),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.all(20),
                        ),
                        onChanged: (val) {
                          setState(() {
                            _selectedAmount = double.tryParse(val);
                          });
                        },
                        validator: (val) {
                          if (val == null || val.isEmpty) return 'Please enter amount';
                          final n = double.tryParse(val);
                          if (n == null || n < 10) return 'Minimum KES 10';
                          return null;
                        },
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Quick Amounts
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [100, 200, 500, 1000, 2000].map((amt) {
                          final isSelected = _selectedAmount == amt.toDouble();
                          return Padding(
                            padding: const EdgeInsets.only(right: 10),
                            child: ChoiceChip(
                              label: Text('KES $amt'),
                              selected: isSelected,
                              onSelected: (_) => _handleQuickAmount(amt.toDouble()),
                              selectedColor: const Color(0xFF1ECF49).withValues(alpha: 0.1),
                              labelStyle: GoogleFonts.outfit(
                                color: isSelected ? const Color(0xFF1ECF49) : Colors.black54,
                                fontWeight: FontWeight.w600,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: BorderSide(
                                  color: isSelected ? const Color(0xFF1ECF49) : Colors.grey.shade200,
                                ),
                              ),
                              showCheckmark: false,
                              backgroundColor: Colors.white,
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    
                    if (_selectedAmount != null && _selectedAmount! >= 10) ...[
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1ECF49).withValues(alpha: 0.05),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(PhosphorIconsFill.lightning, color: Color(0xFF1ECF49), size: 16),
                            const SizedBox(width: 8),
                            Text(
                              'Estimated: ${_estimatedUnits.toStringAsFixed(2)} kWh',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF1ECF49),
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    
                    const SizedBox(height: 32),
                    
                    // Custom Pill Tabs
                    TutorialTarget(
                      id: 'buy_tokens_tabs',
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: TabBar(
                          controller: _tabController,
                          dividerColor: Colors.transparent,
                          indicatorSize: TabBarIndicatorSize.tab,
                          indicator: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.05),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          labelColor: const Color(0xFF1ECF49),
                          unselectedLabelColor: Colors.grey.shade600,
                          labelStyle: GoogleFonts.outfit(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                          unselectedLabelStyle: GoogleFonts.outfit(
                            fontWeight: FontWeight.w500,
                            fontSize: 14,
                          ),
                          tabs: [
                            Tab(
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(PhosphorIconsRegular.users, size: 16),
                                  const SizedBox(width: 8),
                                  const Text("Tenants"),
                                ],
                              ),
                            ),
                            Tab(
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(PhosphorIconsRegular.keyboard, size: 16),
                                  const SizedBox(width: 8),
                                  const Text("Manual"),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    SizedBox(
                      height: 320, 
                      child: TabBarView(
                        controller: _tabController,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          // Tenants Number Tab
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: tenants.isEmpty
                                    ? Center(child: Text('No active tenants', style: TextStyle(color: Colors.grey.shade400)))
                                    : ListView.separated(
                                        padding: EdgeInsets.zero,
                                        itemCount: tenants.length,
                                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                                        itemBuilder: (context, index) {
                                          final tenant = tenants[index];
                                          final isSelected = _selectedTenant == tenant;
                                          return AnimatedContainer(
                                            duration: const Duration(milliseconds: 200),
                                            decoration: BoxDecoration(
                                              color: isSelected ? const Color(0xFF1ECF49).withValues(alpha: 0.08) : Colors.white,
                                              borderRadius: BorderRadius.circular(20),
                                              border: Border.all(
                                                color: isSelected ? const Color(0xFF1ECF49) : Colors.grey.shade100,
                                                width: isSelected ? 2 : 1,
                                              ),
                                            ),
                                            child: ListTile(
                                              onTap: () => setState(() => _selectedTenant = tenant),
                                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                              leading: Container(
                                                padding: const EdgeInsets.all(8),
                                                decoration: BoxDecoration(
                                                  color: isSelected ? const Color(0xFF1ECF49).withValues(alpha: 0.1) : Colors.grey.shade50,
                                                  shape: BoxShape.circle,
                                                ),
                                                child: Icon(
                                                  PhosphorIconsRegular.user,
                                                  size: 20,
                                                  color: isSelected ? const Color(0xFF1ECF49) : Colors.grey,
                                                ),
                                              ),
                                              title: Text(
                                                tenant['tenant_name'],
                                                style: GoogleFonts.outfit(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 15,
                                                  color: isSelected ? const Color(0xFF1ECF49) : Colors.black87,
                                                ),
                                              ),
                                              subtitle: Text(
                                                '${tenant['tenant_phone']} • Unit ${tenant['unit']['label']}',
                                                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                                              ),
                                              trailing: isSelected 
                                                  ? const Icon(PhosphorIconsFill.checkCircle, color: Color(0xFF1ECF49), size: 24)
                                                  : const Icon(PhosphorIconsRegular.circle, color: Colors.black12, size: 24),
                                            ),
                                          );
                                        },
                                      ),
                              ),
                            ],
                          ),
                          
                          // Manual Tab
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Target Unit',
                                style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black54,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TutorialTarget(
                                id: 'buy_tokens_unit_select',
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade50,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Colors.grey.shade100),
                                  ),
                                  child: DropdownButtonHideUnderline(
                                    child: DropdownButton<Map<String, dynamic>>(
                                      value: _selectedTenant,
                                      hint: Text('Select Unit', style: GoogleFonts.outfit(fontSize: 14, color: Colors.grey)),
                                      isExpanded: true,
                                      icon: const Icon(PhosphorIconsRegular.caretDown, size: 20),
                                      items: tenants.map((t) {
                                        return DropdownMenuItem(
                                          value: t,
                                          child: Text(
                                            '${t['tenant_name']} (Unit ${t['unit']['label']})',
                                            style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w500),
                                          ),
                                        );
                                      }).toList(),
                                      onChanged: (val) => setState(() => _selectedTenant = val),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 24),
                              Text(
                                'M-Pesa Number',
                                style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black54,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TutorialTarget(
                                id: 'buy_tokens_phone_field',
                                child: TextFormField(
                                  controller: _customPhoneController,
                                  keyboardType: TextInputType.phone,
                                  style: GoogleFonts.spaceMono(fontWeight: FontWeight.bold, fontSize: 16),
                                  decoration: InputDecoration(
                                    hintText: 'e.g. 2547...',
                                    prefixIcon: const Icon(PhosphorIconsRegular.phone),
                                    filled: true,
                                    fillColor: Colors.grey.shade50,
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: BorderSide(color: Colors.grey.shade100),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: BorderSide(color: Colors.grey.shade100),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(16),
                                      borderSide: const BorderSide(color: Color(0xFF1ECF49), width: 2),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                                  ),
                                  validator: (val) {
                                    if (_tabController.index == 1) {
                                      if (val == null || val.isEmpty) return 'Required';
                                      if (val.length < 9) return 'Too short';
                                    }
                                    return null;
                                  },
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // Buy Button
          TutorialTarget(
            id: 'buy_tokens_submit',
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: FilledButton(
                onPressed: _isProcessing ? null : _initiatePurchase,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF1ECF49),
                  minimumSize: const Size(double.infinity, 64),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  elevation: 8,
                  shadowColor: const Color(0xFF1ECF49).withValues(alpha: 0.3),
                ),
                child: _isProcessing
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(PhosphorIconsBold.lightning, size: 20),
                          const SizedBox(width: 12),
                          Text(
                            'Buy Tokens Now',
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
