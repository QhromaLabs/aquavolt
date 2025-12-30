import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:pdf/pdf.dart' as pdf;
import 'package:pdf/widgets.dart' as pw;
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:printing/printing.dart';
import 'top_toast.dart';

class TokenReceiptModal extends StatelessWidget {
  final Map<String, dynamic> tokenData;

  const TokenReceiptModal({super.key, required this.tokenData});

  double _asDouble(dynamic value) {
    if (value is num) return value.toDouble();
    if (value == null) return 0;
    return double.tryParse(value.toString()) ?? 0;
  }

  String _formatToken(String token) {
    token = token.replaceAll('-', '');
    if (token.length != 20) return token; // Fallback
    return '${token.substring(0, 4)}-${token.substring(4, 8)}-${token.substring(8, 12)}-${token.substring(12, 16)}-${token.substring(16, 20)}';
  }

  Future<void> _copyToken(BuildContext context, String token) async {
    await Clipboard.setData(ClipboardData(text: token));
    if (context.mounted) {
      showTopToast(context, 'Token copied', type: ToastType.success);
    }
  }

  Future<Uint8List> _buildReceiptPdf(
    Map<String, dynamic> data,
    String formattedToken,
    String dateStr,
  ) async {
    final logoBytes = await rootBundle.load('assets/images/logo.png');
    final logo = pw.MemoryImage(logoBytes.buffer.asUint8List());
    final doc = pw.Document();

    final amount = _asDouble(data['amount_paid']);
    final units = _asDouble(data['units_kwh'] ?? data['amount_vended'] ?? data['units']?['units_kwh']);
    final meterNumber = data['units']?['meter_number'] ?? data['meter_number'] ?? 'N/A';
    final customerName = data['customer_name'] ?? 'Tenant';

    doc.addPage(
      pw.Page(
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Row(
                  children: [
                    pw.Image(logo, height: 40),
                    pw.SizedBox(width: 8),
                    pw.Text('aquavolt', style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
                  ],
                ),
                pw.Text('Receipt', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
              ],
            ),
            pw.SizedBox(height: 8),
            pw.Text(dateStr, style: pw.TextStyle(color: pdf.PdfColors.grey)),
            pw.Divider(),
            pw.SizedBox(height: 12),
            pw.Text('Amount Paid', style: pw.TextStyle(color: pdf.PdfColors.grey)),
            pw.Text('KES ${amount.toStringAsFixed(2)}', style: pw.TextStyle(fontSize: 26, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 12),
            pw.Container(
              padding: const pw.EdgeInsets.all(12),
              decoration: pw.BoxDecoration(
                color: pdf.PdfColor.fromInt(0xFFE6F9EB),
                borderRadius: pw.BorderRadius.circular(10),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('TOKEN NUMBER', style: pw.TextStyle(color: pdf.PdfColors.grey, fontSize: 10)),
                  pw.SizedBox(height: 6),
                  pw.Text(formattedToken, style: pw.TextStyle(fontSize: 18, fontWeight: pw.FontWeight.bold)),
                ],
              ),
            ),
            pw.SizedBox(height: 16),
            pw.Text('Details', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 8),
            pw.Text('Customer: $customerName'),
            pw.Text('Meter No.: $meterNumber'),
            pw.Text('Units (kWh): ${double.tryParse(units.toString())?.toStringAsFixed(2) ?? "N/A"}'),
          ],
        ),
      ),
    );

    return doc.save();
  }

  Future<void> _downloadAndShare(BuildContext context, String formattedToken, String dateStr) async {
    final bytes = await _buildReceiptPdf(tokenData, formattedToken, dateStr);
    await Printing.sharePdf(bytes: bytes, filename: 'aquavolt-receipt.pdf');
  }

  @override
  Widget build(BuildContext context) {
    final token = tokenData['token'] ?? 'N/A';
    final formattedToken = _formatToken(token);
    final amount = _asDouble(tokenData['amount_paid']);
    final units = _asDouble(tokenData['units_kwh'] ?? tokenData['amount_vended'] ?? tokenData['units']?['units_kwh']);
    final date = tokenData['created_at'] != null 
        ? DateTime.parse(tokenData['created_at']).toLocal()
        : DateTime.now();
    final dateStr = date.toString().split('.')[0];
    final meterNumber = tokenData['units']?['meter_number'] ?? tokenData['meter_number'] ?? 'N/A';
    final customerName = tokenData['customer_name'] ?? 'Tenant';

    return SafeArea(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 50,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset('assets/images/logo.png', height: 36),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'ELECTRICITY TOKEN RECEIPT',
                style: GoogleFonts.outfit(
                  color: Colors.grey.shade500,
                  fontSize: 12,
                  letterSpacing: 2,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    children: [
                      const SizedBox(height: 8),
                      Text(
                        'KES ${amount.toStringAsFixed(2)}',
                        style: GoogleFonts.outfit(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1ECF49),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1ECF49).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFF1ECF49).withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(PhosphorIcons.checkCircle(), size: 16, color: const Color(0xFF1ECF49)),
                            const SizedBox(width: 6),
                            Text(
                              'Paid Successfully',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF1ECF49),
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        dateStr,
                        style: GoogleFonts.outfit(color: Colors.grey.shade500, fontSize: 13),
                      ),
                      const SizedBox(height: 20),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF1ECF49).withValues(alpha: 0.2)),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'TOKEN NUMBER',
                              style: GoogleFonts.outfit(
                                color: Colors.grey.shade500,
                                fontSize: 11,
                                letterSpacing: 1,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              formattedToken,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.spaceMono(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildDetailRow('Customer', customerName),
                      const SizedBox(height: 12),
                      _buildDetailRow('Units (kWh)', '${double.tryParse(units.toString())?.toStringAsFixed(2) ?? "N/A"}'),
                      const SizedBox(height: 12),
                      _buildDetailRow('Meter No.', meterNumber, isMono: true),
                    ],
                  ),
                ),
              ),
              Column(
                children: [
                  OutlinedButton.icon(
                    onPressed: () => _copyToken(context, token),
                    icon: Icon(PhosphorIcons.copy(), size: 18),
                    label: const Text('Copy Token'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.black87,
                      side: BorderSide(color: Colors.grey.shade300),
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      textStyle: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () => _downloadAndShare(context, formattedToken, dateStr),
                    icon: Icon(PhosphorIcons.shareNetwork(), size: 18),
                    label: const Text('Download & Share'),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF1ECF49),
                      foregroundColor: Colors.white,
                      minimumSize: const Size(double.infinity, 52),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      textStyle: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isMono = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(
            color: Colors.grey.shade500,
            fontSize: 14,
          ),
        ),
        Text(
          value,
          style: isMono
              ? GoogleFonts.spaceMono(
                  color: Colors.black87,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                )
              : GoogleFonts.outfit(
                  color: Colors.black87,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
        ),
      ],
    );
  }
}
