import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:downloader_v2/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const DiawDownloaderApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
