import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../providers/landlord_provider.dart';
import '../widgets/top_toast.dart';
import 'package:intl/intl.dart';

class WalletScreen extends StatelessWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final landlord = context.watch<LandlordProvider>();
    final revenue = landlord.totalRevenue;
    
    // Check for pending withdrawals
    final pendingWithdrawal = landlord.withdrawalRequests
        .where((r) => r['status'] == 'pending')
        .firstOrNull;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Wallet'),
        elevation: 0,
        backgroundColor: const Color(0xFFF8F9FA),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Balance Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFA8C16), Color(0xFFD46B08)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFFA8C16).withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Stack(
                children: [
                   Positioned(
                    right: -20,
                    bottom: -20,
                    child: Icon(
                      PhosphorIconsFill.wallet,
                      size: 150,
                      color: Colors.white.withValues(alpha: 0.15),
                    ),
                  ),
                  Column(
                    children: [
                       const Text(
                        'Available Balance',
                        style: TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'KSh ${revenue.toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: () {
                          _showWithdrawBottomSheet(context, revenue);
                        },
                        icon: const Icon(PhosphorIconsBold.bank),
                        label: const Text('Withdraw Funds'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFFD46B08),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Recent Transactions',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (landlord.allTransactions.isEmpty)
              const Center(child: Padding(
                padding: EdgeInsets.only(top: 40),
                child: Text('No transactions found', style: TextStyle(color: Colors.grey)),
              ))
            else
              ...landlord.allTransactions.take(20).map((t) {
                final isCredit = t['type'] == 'credit';
                final amount = t['amount'];
                final date = t['date'] as DateTime;
                final formattedDate = DateFormat('MMM d, h:mm a').format(date);
                final status = t['status'];

                // Determine Icon and Color based on Type and Status
                IconData icon;
                Color color;
                Color bgColor;
                String title = t['title'];
                String subtitle = formattedDate; // Default
                
                if (isCredit) {
                   icon = PhosphorIconsFill.arrowDownLeft;
                   color = const Color(0xFF52C41A); // Green
                   bgColor = const Color(0xFFF6FFED);
                } else {
                   // Withdrawal Logic
                   if (status == 'pending') {
                      icon = PhosphorIconsFill.clock;
                      color = const Color(0xFFFA8C16); // Orange
                      bgColor = const Color(0xFFFFF7E6);
                      subtitle = 'Pending Review • $formattedDate';
                   } else if (status == 'rejected') {
                      icon = PhosphorIconsFill.xCircle;
                      color = const Color(0xFFF5222D); // Red
                      bgColor = const Color(0xFFFFF1F0);
                      subtitle = 'Rejected • $formattedDate';
                   } else { // Approved/Completed
                      icon = PhosphorIconsFill.checkCircle;
                      color = const Color(0xFF52C41A); // Green
                      bgColor = const Color(0xFFF6FFED);
                      subtitle = 'Paid • $formattedDate'; 
                   }
                }

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 5)],
                  ),
                  child: ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: bgColor,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: color, size: 20),
                    ),
                    title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    trailing: Text(
                      '${isCredit ? '+' : '-'} KSh ${amount.toStringAsFixed(2)}',
                      style: TextStyle(
                        fontWeight: FontWeight.bold, 
                        color: (isCredit) ? const Color(0xFF52C41A) : (status == 'rejected' ? Colors.grey : Colors.black87),
                        decoration: status == 'rejected' ? TextDecoration.lineThrough : null,
                        fontSize: 16
                      ),
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  void _showWithdrawBottomSheet(BuildContext context, double maxAmount) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _WithdrawBottomSheet(maxAmount: maxAmount),
    );
  }
}

class _WithdrawBottomSheet extends StatefulWidget {
  final double maxAmount;
  const _WithdrawBottomSheet({required this.maxAmount});

  @override
  State<_WithdrawBottomSheet> createState() => _WithdrawBottomSheetState();
}

class _WithdrawBottomSheetState extends State<_WithdrawBottomSheet> {
  final _amountController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        left: 24,
        right: 24,
        top: 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Withdraw Funds', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text(
            'Transfer your earnings securely to your M-Pesa account. Please confirm your details below.',
            style: TextStyle(color: Colors.grey, height: 1.4),
          ),
          const SizedBox(height: 24),
          
          Container(
             padding: const EdgeInsets.all(16),
             decoration: BoxDecoration(
               color: const Color(0xFFF0F5FF),
               borderRadius: BorderRadius.circular(12),
               border: Border.all(color: const Color(0xFFADC6FF)),
             ),
             child: Row(
               mainAxisAlignment: MainAxisAlignment.spaceBetween,
               children: [
                 const Text('Available Balance', style: TextStyle(color: Color(0xFF1D39C4), fontWeight: FontWeight.w500)),
                 Text('KSh ${widget.maxAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF1D39C4))),
               ],
             ),
          ),
          const SizedBox(height: 24),
          
          TextField(
            controller: _amountController,
            keyboardType: TextInputType.number,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            decoration: InputDecoration(
              labelText: 'Amount to Withdraw',
              prefixText: 'KSh ',
              filled: true,
              fillColor: Colors.grey[50],
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
          const SizedBox(height: 16),
           TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              labelText: 'M-Pesa Number',
              hintText: '07...',
              prefixIcon: const Icon(PhosphorIconsRegular.phone),
              filled: true,
              fillColor: Colors.grey[50],
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
          
          const SizedBox(height: 32),
          
          SizedBox(
            width: double.infinity,
            height: 54,
            child: FilledButton(
              onPressed: _isLoading ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF1ECF49),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _isLoading 
                ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Confirm Withdrawal', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    final amountStr = _amountController.text.trim();
    final phone = _phoneController.text.trim();

    if (amountStr.isEmpty) return;
    final amount = double.tryParse(amountStr);

    if (amount == null || amount <= 0) {
      showTopToast(context, 'Invalid amount', type: ToastType.error);
      return;
    }
    if (amount > widget.maxAmount) {
       showTopToast(context, 'Insufficient funds', type: ToastType.error);
       return;
    }
    if (phone.isEmpty) {
       showTopToast(context, 'Please enter M-Pesa number', type: ToastType.error);
       return;
    }

    setState(() => _isLoading = true);
    try {
      await context.read<LandlordProvider>().requestWithdrawal(amount, phone);
      if (mounted) {
         Navigator.pop(context);
         showTopToast(context, 'Request submitted successfully', type: ToastType.success);
      }
    } catch (e) {
       if (mounted) {
         showTopToast(context, 'Failed: $e', type: ToastType.error);
         setState(() => _isLoading = false);
       }
    }
  }
}
