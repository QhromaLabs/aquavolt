import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../providers/landlord_provider.dart';
import '../widgets/top_toast.dart';

class AddPropertyScreen extends StatefulWidget {
  const AddPropertyScreen({super.key});

  @override
  State<AddPropertyScreen> createState() => _AddPropertyScreenState();
}

class _AddPropertyScreenState extends State<AddPropertyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _addressController = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      await context.read<LandlordProvider>().addProperty(
        _nameController.text.trim(),
        _addressController.text.trim(),
      );

      if (mounted) {
        showTopToast(context, 'Property added successfully!', type: ToastType.success);
        Navigator.pop(context); // Go back usually, but if using GoRouter could be different
      }
    } catch (e) {
      if (mounted) {
        showTopToast(context, 'Failed to add property: $e', type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add New Property'),
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
                  'Property Details',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Enter the details of the new property you want to manage.',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),
                
                // Property Name
                TextFormField(
                  controller: _nameController,
                  validator: (value) => value == null || value.isEmpty ? 'Please enter a name' : null,
                  decoration: InputDecoration(
                    labelText: 'Property Name',
                    hintText: 'e.g. Sunrise Apartments',
                    prefixIcon: const Icon(PhosphorIconsRegular.buildings),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
                const SizedBox(height: 16),
                
                // Address
                TextFormField(
                  controller: _addressController,
                  validator: (value) => value == null || value.isEmpty ? 'Please enter an address' : null,
                  decoration: InputDecoration(
                    labelText: 'Address / Location',
                    hintText: 'e.g. 123 Main St, Nairobi',
                    prefixIcon: const Icon(PhosphorIconsRegular.mapPin),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
                
                const SizedBox(height: 32),
                
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _isSaving ? null : _handleSubmit,
                    icon: _isSaving 
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(PhosphorIconsBold.plus),
                    label: Text(_isSaving ? 'Adding Property...' : 'Add Property'),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF1ECF49),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
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
