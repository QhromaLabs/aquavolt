import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../constants.dart';

class LandlordProvider extends ChangeNotifier {
  final SupabaseClient _supabase = Supabase.instance.client;

  List<Map<String, dynamic>> _properties = [];
  List<Map<String, dynamic>> _units = [];
  List<Map<String, dynamic>> _topups = [];
  List<Map<String, dynamic>> _tenants = [];
  List<Map<String, dynamic>> _issues = [];
  List<Map<String, dynamic>> _withdrawalRequests = [];
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get properties => _properties;
  List<Map<String, dynamic>> get units => _units;
  List<Map<String, dynamic>> get topups => _topups;
  List<Map<String, dynamic>> get tenants => _tenants;
  List<Map<String, dynamic>> get issues => _issues;
  List<Map<String, dynamic>> get withdrawalRequests => _withdrawalRequests;
  bool get isLoading => _isLoading;
  String? get error => _error;

  double get totalRevenue {
    final income = _topups.fold(0.0, (sum, item) => sum + (double.tryParse(item['amount_paid'].toString()) ?? 0.0));
    final withdrawals = _withdrawalRequests
        .where((r) => ['pending', 'approved', 'completed'].contains(r['status']))
        .fold(0.0, (sum, item) => sum + (double.tryParse(item['amount'].toString()) ?? 0.0));
    return income - withdrawals;
  }

  List<Map<String, dynamic>> get allTransactions {
    final List<Map<String, dynamic>> transactions = [];

    // Add Topups (Credits)
    for (var t in _topups) {
      transactions.add({
        'type': 'credit',
        'id': t['id'],
        'amount': double.tryParse(t['amount_paid'].toString()) ?? 0.0,
        'date': DateTime.parse(t['created_at']),
        'status': 'completed',
        'title': 'Token Purchase',
        'description': '${t['units']['properties']['name']} - ${t['units']['label']}',
      });
    }

    // Add Withdrawals (Debits)
    for (var w in _withdrawalRequests) {
      transactions.add({
        'type': 'debit',
        'id': w['id'],
        'amount': double.tryParse(w['amount'].toString()) ?? 0.0,
        'date': DateTime.parse(w['created_at']),
        'status': w['status'],
        'title': 'Withdrawal',
        'description': 'Transfer to M-Pesa',
      });
    }

    // Sort by Date Descending
    transactions.sort((a, b) => b['date'].compareTo(a['date']));
    return transactions;
  }

  int get totalUnitsCount => _units.length;
  int get activeTenantsCount {
    return _units.where((u) => u['status'] == 'active').length;
  }

  LandlordProvider() {
    _init();
  }

  void _init() {
    _supabase.auth.onAuthStateChange.listen((data) {
      if (data.session?.user != null) {
        fetchData();
      } else {
        _properties = [];
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
      // 1. Fetch Properties owned by this landlord
      final propertiesResponse = await _supabase
          .from('properties')
          .select('*')
          .eq('landlord_id', user.id);
      
      _properties = List<Map<String, dynamic>>.from(propertiesResponse);

      if (_properties.isEmpty) {
        _units = [];
        _tenants = [];
        _topups = [];
        _issues = [];
        _withdrawalRequests = [];
        return;
      }

      final propertyIds = _properties.map((p) => p['id']).toList();

      // 2. Fetch all units for these properties
      final unitsResponse = await _supabase
          .from('units')
          .select('*, properties(id, name)')
          .inFilter('property_id', propertyIds);
      
      _units = List<Map<String, dynamic>>.from(unitsResponse);

      // 2.5 Fetch active assignments for these units to identify tenants
      List<Map<String, dynamic>> assignments = [];
      if (_units.isNotEmpty) {
        final unitIds = _units.map((u) => u['id']).toList();
        final assignmentsResponse = await _supabase
            .from('unit_assignments')
            .select('*, profiles(full_name, phone, email)')
            .eq('status', 'active')
            .inFilter('unit_id', unitIds);
        assignments = List<Map<String, dynamic>>.from(assignmentsResponse);
      }

      // Merge assignment info into units and override status
      for (var i = 0; i < _units.length; i++) {
        final unit = _units[i];
        final activeAssignment = assignments.firstWhere(
          (a) => a['unit_id'] == unit['id'],
          orElse: () => {},
        );
        
        // If there is an active assignment, the unit is occupied.
        // Otherwise, it is vacant (regardless of what 'units' table says, to be safe).
        if (activeAssignment.isNotEmpty) {
          _units[i]['status'] = 'occupied';
        } else {
          _units[i]['status'] = 'vacant';
        }
      }

      // Create tenants list from assignments
      _tenants = [];
      for (var assignment in assignments) {
        final unitId = assignment['unit_id'];
        final unit = _units.firstWhere((u) => u['id'] == unitId, orElse: () => {});
        
        final profile = assignment['profiles'] ?? {};
        // Fallback: If profile joined is null, it means no profile exists or RLS blocked it.
        // We typically rely on the profile for the name.
        
        _tenants.add({
          ...assignment,
          'unit': unit,
          'tenant_name': profile['full_name'] ?? 'Unknown Tenant (No Profile)',
          'tenant_phone': profile['phone'] ?? profile['phone_number'] ?? '',
          'tenant_email': profile['email'] ?? '',
        });
      }

      // 3. Fetch all topups for these units
      final topupsResponse = await _supabase
          .from('topups')
          .select('*, units!inner(property_id, label, meter_number, properties(name)), profiles(full_name)')
          .inFilter('units.property_id', propertyIds)
          .order('created_at', ascending: false);

      _topups = List<Map<String, dynamic>>.from(topupsResponse);
      
      // 4. Fetch issues (maintenance reports)
      final issuesResponse = await _supabase
          .from('issues')
          .select('*, units!inner(property_id, label, properties(name))')
          .inFilter('units.property_id', propertyIds)
          .order('created_at', ascending: false);
          
      _issues = List<Map<String, dynamic>>.from(issuesResponse);
      
      // 5. Fetch withdrawal requests
      final withdrawalsResponse = await _supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('landlord_id', user.id)
          .order('created_at', ascending: false);
      
      _withdrawalRequests = List<Map<String, dynamic>>.from(withdrawalsResponse);

    } catch (e) {
      _error = e.toString();
      print("LandlordProvider Error: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addTenant({
    required String fullName,
    required String email,
    required String phoneNumber,
    required String unitId,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Not logged in');

    try {
      _isLoading = true;
      notifyListeners();

      // 1. Create Auth User (requires unauthenticated client for SignUp or Edge Function)
      // Ideally this should be an Edge Function 'create-tenant' so we don't expose anon key logic here.
      // But adhering to the "cook up" request:
      final tempSupabase = SupabaseClient(supabaseUrl, supabaseAnonKey);
      
      final authResponse = await tempSupabase.auth.signUp(
        email: email,
        password: 'ChangeMe123!', // Temp password
        data: {'full_name': fullName, 'role': 'tenant', 'phone_number': phoneNumber},
      );
      
      if (authResponse.user == null) throw Exception('Failed to create user account');
      final newUserId = authResponse.user!.id;
      
      // 2. EXPLICITLY create Profile (Critical: Triggers might fail or be missing)
      // Landlords have RLS permission to INSERT profiles where role='tenant'
      try {
        await _supabase.from('profiles').upsert({
          'id': newUserId,
          'full_name': fullName,
          'email': email,
          'phone': phoneNumber,
          'role': 'tenant',
          'created_at': DateTime.now().toIso8601String(),
        });
      } catch (e) {
        print("Profile creation warning (might already exist): $e");
        // Provide backup mechanism? No, just proceed. If profile fails, tenant shows as "Unknown".
      }

      // 3. Assign unit
      await _supabase.from('unit_assignments').insert({
        'unit_id': unitId,
        'tenant_id': newUserId,
        'status': 'active',
        'start_date': DateTime.now().toIso8601String(),
      });
      
      // 4. Update unit status
      await _supabase.from('units').update({'status': 'occupied'}).eq('id', unitId);

      await fetchData();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addProperty(String name, String address) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Not logged in');

    try {
      _isLoading = true;
      notifyListeners();

      await _supabase.from('properties').insert({
        'landlord_id': user.id,
        'name': name,
        'address': address,
        'created_at': DateTime.now().toIso8601String(),
      });

      await fetchData(); // Refresh list
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> terminateTenancy(String unitId) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Not logged in');

    try {
      _isLoading = true;
      notifyListeners();

      // Deactivate assignment
      await _supabase.from('unit_assignments')
          .update({
            'status': 'inactive',
            'end_date': DateTime.now().toIso8601String()
          })
          .eq('unit_id', unitId)
          .eq('status', 'active');

      // Update unit status to vacant
      await _supabase.from('units')
          .update({'status': 'vacant'})
          .eq('id', unitId);

      await fetchData(); // Refresh all lists
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> submitIssue({
    required String unitId,
    required String title,
    required String description,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Not logged in');

    try {
      _isLoading = true;
      notifyListeners();

      await _supabase.from('issues').insert({
        'unit_id': unitId,
        'title': title,
        'description': description,
        'status': 'pending',
        'created_at': DateTime.now().toIso8601String(),
        // 'reporter_id': user.id  // Optional if schema supports it
      });

      await fetchData();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> reassignUnit({
    required String oldUnitId,
    required String newUnitId,
    required String tenantId,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Not logged in');

    try {
      _isLoading = true;
      notifyListeners();

      // 1. Deactivate old assignment
      await _supabase.from('unit_assignments')
          .update({
            'status': 'transferred',
            'end_date': DateTime.now().toIso8601String()
          })
          .eq('unit_id', oldUnitId)
          .eq('tenant_id', tenantId)
          .eq('status', 'active');

      // 2. Create new assignment
      await _supabase.from('unit_assignments').insert({
        'unit_id': newUnitId,
        'tenant_id': tenantId,
        'status': 'active',
        'start_date': DateTime.now().toIso8601String(),
      });

      // 3. Update unit statuses
      await _supabase.from('units').update({'status': 'vacant'}).eq('id', oldUnitId);
      await _supabase.from('units').update({'status': 'occupied'}).eq('id', newUnitId);

      await fetchData();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> requestWithdrawal(double amount, String? mpesaNumber) async {
    final user = _supabase.auth.currentUser;
    if (user == null) throw Exception('Not logged in');

    try {
      _isLoading = true;
      notifyListeners();

      // 1. Submit Request
      await _supabase.from('withdrawal_requests').insert({
        'landlord_id': user.id,
        'amount': amount,
        'mpesa_number': mpesaNumber,
        'status': 'pending',
        'created_at': DateTime.now().toIso8601String(),
      });
      
      // 2. Update Profile with new M-Pesa number if provided
      if (mpesaNumber != null && mpesaNumber.isNotEmpty) {
          try {
             await _supabase.from('profiles').update({
               'phone': mpesaNumber
             }).eq('id', user.id);
          } catch (e) {
             print("Failed to save phone number: $e");
          }
      }

      await fetchData(); // Refresh so the pending request appears
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refresh() async {
    await fetchData();
  }
}
