import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme/app_theme.dart';
import 'screens/home_screen.dart';
import 'widgets/no_internet_screen.dart';

void main() {
  runApp(const DiawDownloaderApp());
}

class DiawDownloaderApp extends StatelessWidget {
  const DiawDownloaderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DIAW Downloader V2',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      home: const _ConnectivityWrapper(),
    );
  }
}

/// Wraps the app with a connectivity check.
/// Shows NoInternetScreen when offline, HomeScreen when online.
class _ConnectivityWrapper extends StatefulWidget {
  const _ConnectivityWrapper();

  @override
  State<_ConnectivityWrapper> createState() => _ConnectivityWrapperState();
}

class _ConnectivityWrapperState extends State<_ConnectivityWrapper> {
  bool _isOnline = true;

  @override
  void initState() {
    super.initState();
    _checkConnectivity();
    Connectivity().onConnectivityChanged.listen((results) {
      setState(() {
        _isOnline = results.isNotEmpty &&
            !results.contains(ConnectivityResult.none);
      });
    });
  }

  Future<void> _checkConnectivity() async {
    final results = await Connectivity().checkConnectivity();
    setState(() {
      _isOnline =
          results.isNotEmpty && !results.contains(ConnectivityResult.none);
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 500),
      child: _isOnline
          ? const HomeScreen(key: ValueKey('home'))
          : NoInternetScreen(
              key: const ValueKey('offline'),
              onRetry: _checkConnectivity,
            ),
    );
  }
}
