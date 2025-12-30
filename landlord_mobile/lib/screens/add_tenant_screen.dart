import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:go_router/go_router.dart';
import '../providers/landlord_provider.dart';
import '../widgets/top_toast.dart';

class AddTenantScreen extends StatefulWidget {
  const AddTenantScreen({super.key});

  @override
  State<AddTenantScreen> createState() => _AddTenantScreenState();
}

class _AddTenantScreenState extends State<AddTenantScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  
  String? _selectedPropertyId;
  String? _selectedUnitId;
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedUnitId == null) {
      showTopToast(context, 'Please select a unit', type: ToastType.error);
      return;
    }

    setState(() => _isSaving = true);

    try {
      await context.read<LandlordProvider>().addTenant(
        fullName: _nameController.text.trim(),
        email: _emailController.text.trim(),
        phoneNumber: _phoneController.text.trim(),
        unitId: _selectedUnitId!,
      );

      if (mounted) {
        showTopToast(context, 'Tenant added successfully!', type: ToastType.success);
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        showTopToast(context, 'Failed to add tenant: $e', type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    print('AddTenantScreen: Rebuilding');
    final landlord = context.watch<LandlordProvider>();
    final properties = landlord.properties;
    
    // Filter units based on selected property and vacant status
    // Note: Our provider now intelligently marks units as occupied if assigned.
    final availableUnits = landlord.units.where((u) {
      final matchesProperty = _selectedPropertyId == null || u['property_id'] == _selectedPropertyId;
      final isVacant = u['status'] == 'vacant';
      return matchesProperty && isVacant;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Tenant'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Tenant Information',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Create an account for the new tenant. They will receive an email to set their permanent password.',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),

                TextFormField(
                  controller: _nameController,
                  validator: (value) => value == null || value.isEmpty ? 'Enter full name' : null,
                  decoration: InputDecoration(
                    labelText: 'Full Name',
                    prefixIcon: const Icon(PhosphorIconsRegular.user),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 16),
                
                TextFormField(
                  controller: _emailController,
                  validator: (value) => value == null || !value.contains('@') ? 'Enter valid email' : null,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: 'Email Address',
                    prefixIcon: const Icon(PhosphorIconsRegular.envelopeSimple),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 16),
                
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: 'Phone Number',
                    prefixIcon: const Icon(PhosphorIconsRegular.phone),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),

                const SizedBox(height: 32),
                const Text(
                  'Unit Assignment',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),

                DropdownButtonFormField<String>(
                  value: _selectedPropertyId,
                  decoration: InputDecoration(
                    labelText: 'Select Property',
                    prefixIcon: const Icon(PhosphorIconsRegular.buildings),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  items: properties.map((p) {
                    return DropdownMenuItem(
                      value: p['id'].toString(),
                      child: Text(p['name'] ?? 'Unknown'),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedPropertyId = value;
                      _selectedUnitId = null; // Reset unit
                    });
                  },
                ),
                const SizedBox(height: 16),
                
                DropdownButtonFormField<String>(
                  value: _selectedUnitId,
                  decoration: InputDecoration(
                    labelText: 'Select Unit (Vacant)',
                    prefixIcon: const Icon(PhosphorIconsRegular.door),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  items: availableUnits.map((u) {
                    final label = u['label'] ?? 'Unknown';
                    final meter = u['meter_number'] ?? 'No Meter';
                    return DropdownMenuItem(
                      value: u['id'].toString(),
                      child: Text('Unit $label ($meter)'),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedUnitId = value;
                    });
                  },
                  validator: (value) => value == null ? 'Please select a unit' : null,
                ),

                const SizedBox(height: 32),

                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _isSaving ? null : _handleSubmit,
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF1ECF49),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isSaving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Add Tenant'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
