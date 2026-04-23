import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design tokens mirrored exactly from globals.css and website theme
class AppColors {
  AppColors._();

  // Core palette from CSS variables
  static const background = Color(0xFF0A0A0A);   // --background: #0a0a0a
  static const foreground = Color(0xFFF5F5F5);   // --foreground: #f5f5f5
  static const accent = Color(0xFFD4AF37);        // --accent: #d4af37 (gold)
  static const maroon = Color(0xFF800000);        // --color-hindia-maroon
  static const gold = Color(0xFFD4AF37);          // --color-hindia-gold

  // Derived
  static const border = Color(0x26F5F5F5);        // rgba(245,245,245,0.15)
  static const cardSurface = Color(0xFF111111);
  static const accentDim = Color(0x1AD4AF37);     // accent/10
  static const accentMid = Color(0x33D4AF37);     // accent/20
  static const maroonDim = Color(0x1A800000);     // maroon/10
  static const success = Color(0xFF059669);        // emerald-600
  static const error = maroon;
}

class AppTextStyles {
  AppTextStyles._();

  /// Fraunces serif — headings (mirrors font-serif)
  static TextStyle serif({
    double size = 32,
    FontWeight weight = FontWeight.w700,
    Color color = AppColors.foreground,
    double height = 1.1,
  }) =>
      GoogleFonts.fraunces(
        fontSize: size,
        fontWeight: weight,
        color: color,
        height: height,
        letterSpacing: -0.5,
      );

  /// JetBrains Mono — body/labels (mirrors font-mono)
  static TextStyle mono({
    double size = 10,
    FontWeight weight = FontWeight.w400,
    Color color = AppColors.foreground,
    double letterSpacing = 1.5,
    double? opacity,
  }) =>
      GoogleFonts.jetBrainsMono(
        fontSize: size,
        fontWeight: weight,
        color: opacity != null ? color.withOpacity(opacity) : color,
        letterSpacing: letterSpacing,
      );
}

class AppTheme {
  AppTheme._();

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: const ColorScheme.dark(
          background: AppColors.background,
          surface: AppColors.cardSurface,
          primary: AppColors.accent,
          secondary: AppColors.maroon,
          onPrimary: AppColors.background,
          onBackground: AppColors.foreground,
          onSurface: AppColors.foreground,
          error: AppColors.maroon,
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.background,
          elevation: 0,
          scrolledUnderElevation: 0,
          centerTitle: false,
          titleTextStyle: GoogleFonts.fraunces(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppColors.foreground,
            letterSpacing: 0.5,
          ),
          iconTheme: const IconThemeData(color: AppColors.foreground),
        ),
        textTheme: TextTheme(
          displayLarge: AppTextStyles.serif(size: 48),
          displayMedium: AppTextStyles.serif(size: 36),
          displaySmall: AppTextStyles.serif(size: 28),
          headlineMedium: AppTextStyles.serif(size: 22),
          bodyLarge: AppTextStyles.mono(size: 13),
          bodyMedium: AppTextStyles.mono(size: 11),
          bodySmall: AppTextStyles.mono(size: 9),
          labelSmall: AppTextStyles.mono(size: 8, letterSpacing: 2.0),
        ),
        dividerTheme: const DividerThemeData(
          color: AppColors.border,
          thickness: 1,
        ),
        splashColor: AppColors.accentDim,
        highlightColor: Colors.transparent,
        inputDecorationTheme: InputDecorationTheme(
          filled: false,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.zero,
            borderSide: const BorderSide(color: AppColors.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.zero,
            borderSide: BorderSide(color: AppColors.border),
          ),
          focusedBorder: const OutlineInputBorder(
            borderRadius: BorderRadius.zero,
            borderSide: BorderSide(color: AppColors.accent, width: 1),
          ),
          hintStyle: AppTextStyles.mono(opacity: 0.3),
        ),
      );
}
