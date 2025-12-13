import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class TenantProvider extends ChangeNotifier {
  final SupabaseClient _supabase = Supabase.instance.client;
  
  List<Map<String, dynamic>> _units = [];
  List<Map<String, dynamic>> _topups = [];
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get units => _units;
  List<Map<String, dynamic>> get topups => _topups;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  bool get hasUnits => _units.isNotEmpty;

  TenantProvider() {
    _init();
  }

  void _init() {
    // Listen for auth changes to fetch data automatically
    _supabase.auth.onAuthStateChange.listen((data) {
      if (data.session?.user != null) {
        fetchData();
      } else {
        // Clear data on logout
        _units = [];
        _topups = [];
        notifyListeners();
      }
    });
  }

  Future<void> fetchData() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // 1. Fetch Assigned Units
      final unitsResponse = await _supabase
          .from('unit_assignments')
          .select('unit_id, units(id, meter_number, label, properties(name, id))')
          .eq('tenant_id', user.id)
          .eq('status', 'active');
      
      // Transform data for easier consumption
      _units = List<Map<String, dynamic>>.from(unitsResponse).map((item) {
        final unit = item['units'] as Map<String, dynamic>;
        final property = unit['properties'] as Map<String, dynamic>;
        return {
          'unitId': unit['id'],
          'meterNumber': unit['meter_number'],
          'unitLabel': unit['label'], // Fixed column name
          'propertyName': property['name'],
          'propertyId': property['id'],
        };
      }).toList();

      // 2. Fetch Topups History
      final topupsResponse = await _supabase
          .from('topups')
          .select('*, units(label, meter_number, properties(name))')
          .eq('tenant_id', user.id)
          .order('created_at', ascending: false);

      _topups = List<Map<String, dynamic>>.from(topupsResponse);

    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refresh() async {
    await fetchData();
  }

  Future<String?> linkUnit(String qrData) async {
    final user = _supabase.auth.currentUser;
    if (user == null) return 'User not logged in';

    try {
      final Map<String, dynamic> data = jsonDecode(qrData);
      
      if (data['action'] == 'claim_unit' && data['unit_id'] != null) {
        await _supabase.from('unit_assignments').insert({
          'unit_id': data['unit_id'],
          'tenant_id': user.id,
          'status': 'active',
          'start_date': DateTime.now().toIso8601String(),
        });
        
        await fetchData(); // Refresh data
        return null; // Success
      } else {
        return 'Invalid QR Code';
      }
    } on PostgrestException catch (e) {
      if (e.code == '23505') {
        return 'You are already assigned to this unit.';
      }
      return 'Failed to link unit: ${e.message}';
    } catch (e) {
      return 'Error processing QR code: $e';
    }
  }
}
