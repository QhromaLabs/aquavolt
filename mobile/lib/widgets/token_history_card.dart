import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'token_receipt_modal.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

class TokenHistoryCard extends StatelessWidget {
  final Map<String, dynamic> tokenData;

  const TokenHistoryCard({super.key, required this.tokenData});

  @override
  Widget build(BuildContext context) {
    final amount = double.parse(tokenData['amount_paid'].toString());
    final date = tokenData['created_at'] != null 
        ? DateTime.parse(tokenData['created_at']).toLocal() 
        : DateTime.now();
    
    // Format date: Dec 12, 2025
    final dateStr = "${_getMonth(date.month)} ${date.day}, ${date.year}";
    // Format time: 7:54 AM
    final timeStr = "${_formatHour(date.hour)}:${date.minute.toString().padLeft(2, '0')} ${_getAmPm(date.hour)}";
    
    final token = tokenData['token']?.toString() ?? 'Pending';
    final isPending = token == 'Pending';
    
    // Get units to show confirmation
    // User requested to use amount_vended as it is the column that is populated
    final units = tokenData['units_kwh'] ?? tokenData['amount_vended'] ?? tokenData['units']?['units_kwh'] ?? 0;

    return GestureDetector(
      onTap: () {
        if (!isPending) {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (ctx) => Padding(
              padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
              child: TokenReceiptModal(tokenData: tokenData),
            ),
          );
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Row(
          children: [
            // Icon
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFE6F9EB),
                borderRadius: BorderRadius.circular(50),
              ),
              child: Icon(PhosphorIcons.clock(), color: Color(0xFF1ECF49), size: 24),
            ),
            
            const SizedBox(width: 16),
            
            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'KES ${amount.toStringAsFixed(0)}',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$dateStr\n$timeStr',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      color: Colors.grey.shade500,
                      height: 1.2
                    ),
                  ),
                ],
              ),
            ),
            
            // Trailing Data
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (!isPending)
                  Text(
                   token,
                   style: GoogleFonts.outfit(
                     fontSize: 12,
                     fontWeight: FontWeight.bold,
                     color: Colors.black87,
                   ),
                   maxLines: 1,
                   overflow: TextOverflow.ellipsis,
                  )
                 else 
                  Text(
                    'Processing',
                    style: GoogleFonts.outfit(color: Colors.orange, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                  
                const SizedBox(height: 4),
                
                Text(
                  '+${double.tryParse(units.toString())?.toStringAsFixed(2) ?? 0} Units',
                  style: GoogleFonts.outfit(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1ECF49), // Green text
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getMonth(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  }

  String _formatHour(int hour) {
    if (hour == 0) return '12';
    if (hour > 12) return '${hour - 12}';
    return '$hour';
  }

  String _getAmPm(int hour) {
    return hour >= 12 ? 'PM' : 'AM';
  }
}
