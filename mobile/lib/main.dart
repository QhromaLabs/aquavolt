import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/tenant_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/buy_token_screen.dart';
import 'screens/history_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/connect_meter_screen.dart';
import 'screens/pin_screen.dart';
import 'services/biometric_service.dart';

import 'screens/security_intro_screen.dart';
import 'widgets/scaffold_with_navbar.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Load environment variables
  try {
    await dotenv.load(fileName: "assets/env");
  } catch (e) {
    print("Error loading .env file: $e");
  }

  // Initialize Supabase
  final supabaseUrl = dotenv.env['SUPABASE_URL'];
  final supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'];
  
  if (supabaseUrl != null && supabaseAnonKey != null && !supabaseUrl.contains("YOUR_SUPABASE_URL")) {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    );
  }

  // Initialize AuthProvider early to pass to Router
  final authProvider = AuthProvider();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider(create: (_) => TenantProvider()),
      ],
      child: MyApp(authProvider: authProvider),
    ),
  );
}

final _rootNavigatorKey = GlobalKey<NavigatorState>();

class MyApp extends StatelessWidget {
  final AuthProvider authProvider;
  late final GoRouter _router;

  MyApp({super.key, required this.authProvider}) {
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
          path: '/signup',
          builder: (context, state) => const SignUpScreen(),
        ),
        GoRoute(
          path: '/security-intro',
          builder: (context, state) => const SecurityIntroScreen(),
        ),
        GoRoute(
          path: '/connect-meter',
          builder: (context, state) => const ConnectMeterScreen(),
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
                  builder: (context, state) => const DashboardScreen(),
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
        GoRoute(
          parentNavigatorKey: _rootNavigatorKey,
          path: '/buy-token',
          builder: (context, state) => const BuyTokenScreen(),
        ),
        GoRoute(
          parentNavigatorKey: _rootNavigatorKey,
          path: '/notifications',
          builder: (context, state) => const NotificationsScreen(),
        ),
      ],
      redirect: (context, state) {
        final isAuthenticated = authProvider.isAuthenticated;
        final isLoggingIn = state.uri.path == '/login' || state.uri.path == '/signup';

        if (!isAuthenticated) {
          // If not logged in and not on login/signup page, redirect to login
          return isLoggingIn ? null : '/login';
        }

        // If authenticated and on login/signup page, redirect to dashboard
        if (isLoggingIn) {
          return '/dashboard';
        }

        return null;
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'AquaVolt Tenant',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1ECF49),
          primary: const Color(0xFF1ECF49),
        ),
        useMaterial3: true,
        fontFamily: GoogleFonts.outfit().fontFamily,
        scaffoldBackgroundColor: const Color(0xFFF3F4F6),
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.white,
          elevation: 0,
          titleTextStyle: GoogleFonts.outfit(
            color: Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
          iconTheme: const IconThemeData(color: Colors.black),
        ),
      ),
      routerConfig: _router,
      builder: (context, child) {
        return AppLifecycleManager(child: child!);
      },
    );
  }
}

class AppLifecycleManager extends StatefulWidget {
  final Widget child;
  const AppLifecycleManager({super.key, required this.child});

  @override
  State<AppLifecycleManager> createState() => _AppLifecycleManagerState();
}

class _AppLifecycleManagerState extends State<AppLifecycleManager> with WidgetsBindingObserver {
  final BiometricService _biometricService = BiometricService();
  bool _isLocked = false;
  DateTime _lastUnlockTime = DateTime.fromMillisecondsSinceEpoch(0);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Check lock on startup
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkAppLock();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Ignore resume if we just unlocked (e.g. biometric prompt closing)
      if (DateTime.now().difference(_lastUnlockTime) < const Duration(seconds: 1)) {
        return;
      }
      _checkAppLock();
    }
  }

  Future<void> _checkAppLock() async {
    if (_isLocked) return;

    final enabled = await _biometricService.isAppLockEnabled();
    if (!enabled) return;
    
    // Don't show lock screen if we are not authenticated yet (e.g. at login screen)
    // We can check Supabase auth state directly or use the provider if available in context.
    // However, this widget wraps the whole app.
    // Ideally, we only lock if there is a session.
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) return;

    setState(() => _isLocked = true);

    if (!mounted) return;
    final context = _rootNavigatorKey.currentContext;
    if (context != null) {
      await Navigator.of(context).push(
        MaterialPageRoute(
          fullscreenDialog: true,
            builder: (ctx) => const PinScreen(
              mode: PinMode.verify,
            ),
        ),
      );
      _lastUnlockTime = DateTime.now();
      if (mounted) setState(() => _isLocked = false);
    } else {
       if (mounted) setState(() => _isLocked = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
