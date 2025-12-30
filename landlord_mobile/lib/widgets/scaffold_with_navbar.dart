import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

class ScaffoldWithNavBar extends StatelessWidget {
  const ScaffoldWithNavBar({
    required this.navigationShell,
    Key? key,
  }) : super(key: key ?? const ValueKey<String>('LandlordScaffoldWithNavBar'));

  final StatefulNavigationShell navigationShell;

  void _goBranch(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  Widget _glowingIcon(IconData data) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Color(0x331ECF49),
            blurRadius: 5,
            spreadRadius: 0.4,
          ),
        ],
      ),
      child: Icon(data, color: const Color(0xFF1ECF49)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
           color: Colors.white,
           boxShadow: [
             BoxShadow(
               color: Colors.black.withValues(alpha: 0.05),
               blurRadius: 10,
               offset: const Offset(0, -5),
             ),
           ],
        ),
        child: NavigationBar(
          selectedIndex: navigationShell.currentIndex,
          destinations: [
            NavigationDestination(
              icon: const Icon(PhosphorIconsRegular.house, color: Colors.black54),
              selectedIcon: _glowingIcon(PhosphorIconsFill.house),
              label: 'Home',
            ),
            NavigationDestination(
              icon: const Icon(PhosphorIconsRegular.buildings, color: Colors.black54),
              selectedIcon: _glowingIcon(PhosphorIconsFill.buildings),
              label: 'Properties',
            ),
            NavigationDestination(
              icon: const Icon(PhosphorIconsRegular.lightning, color: Colors.black54),
              selectedIcon: _glowingIcon(PhosphorIconsFill.lightning),
              label: 'Meters',
            ),
             NavigationDestination(
              icon: const Icon(PhosphorIconsRegular.clockCounterClockwise, color: Colors.black54),
              selectedIcon: _glowingIcon(PhosphorIconsFill.clockCounterClockwise),
              label: 'History',
            ),
            NavigationDestination(
              icon: const Icon(PhosphorIconsRegular.user, color: Colors.black54),
              selectedIcon: _glowingIcon(PhosphorIconsFill.user),
              label: 'Profile',
            ),
          ],
          onDestinationSelected: _goBranch,
          height: 65,
          backgroundColor: Colors.white,
          indicatorColor: Colors.transparent,
          surfaceTintColor: Colors.transparent,
        ),
      ),
    );
  }
}

