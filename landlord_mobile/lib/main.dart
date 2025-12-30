import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import 'providers/auth_provider.dart';
import 'providers/landlord_provider.dart';
import 'screens/landlord_dashboard_screen.dart';
import 'screens/properties_screen.dart';
import 'screens/meters_screen.dart';
import 'screens/history_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/login_screen.dart';
import 'screens/add_property_screen.dart';
import 'screens/add_tenant_screen.dart';
import 'screens/wallet_screen.dart';
import 'screens/tenants_screen.dart';
import 'screens/reports_screen.dart';
import 'widgets/scaffold_with_navbar.dart';

import 'constants.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  );

  final authProvider = AuthProvider();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider(create: (_) => LandlordProvider()),
      ],
      child: LandlordApp(authProvider: authProvider),
    ),
  );
}

final _rootNavigatorKey = GlobalKey<NavigatorState>();

class LandlordApp extends StatelessWidget {
  final AuthProvider authProvider;
  late final GoRouter _router;

  LandlordApp({super.key, required this.authProvider}) {
    _router = GoRouter(
      navigatorKey: _rootNavigatorKey,
      initialLocation: '/login',
      refreshListenable: authProvider,
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/add-property',
          builder: (context, state) => const AddPropertyScreen(),
        ),
         GoRoute(
          path: '/add-tenant',
          builder: (context, state) => const AddTenantScreen(),
        ),
        GoRoute(
          path: '/wallet',
          builder: (context, state) => const WalletScreen(),
        ),
        GoRoute(
          path: '/tenants',
          builder: (context, state) => const TenantsScreen(),
        ),
         GoRoute(
          path: '/reports',
          builder: (context, state) => const ReportsScreen(),
        ),
        StatefulShellRoute.indexedStack(
          builder: (context, state, navigationShell) {
            return ScaffoldWithNavBar(navigationShell: navigationShell);
          },
          branches: [
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/dashboard',
                  builder: (context, state) => const LandlordDashboardScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/properties',
                  builder: (context, state) => const PropertiesScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/meters',
                  builder: (context, state) => const MetersScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/history',
                  builder: (context, state) => const HistoryScreen(),
                ),
              ],
            ),
            StatefulShellBranch(
              routes: [
                GoRoute(
                  path: '/profile',
                  builder: (context, state) => const ProfileScreen(),
                ),
              ],
            ),
          ],
        ),
      ],
      redirect: (context, state) {
        final isAuthenticated = authProvider.isAuthenticated;
        final isLoggingIn = state.uri.path == '/login';

        if (!isAuthenticated) {
          return isLoggingIn ? null : '/login';
        }

        if (isLoggingIn) {
          return '/dashboard';
        }
        
        // Ensure landlord role
        // if (authProvider.role != null && authProvider.role != 'landlord') { ... }

        return null;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'aquaVOLT Landlord',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1ECF49),
          primary: const Color(0xFF1ECF49),
        ),
        textTheme: GoogleFonts.outfitTextTheme(),
        scaffoldBackgroundColor: const Color(0xFFF8F9FA),
      ),
      routerConfig: _router,
    );
  }
}
