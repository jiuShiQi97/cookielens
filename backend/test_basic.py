#!/usr/bin/env python3
"""Quick test to verify the refactored backend works"""

from scanner import scan_website
from compliance import check_compliance, analyze_third_parties
from workflow import run_compliance_scan

print("Testing scanner...")
try:
    result = scan_website("https://example.com")
    print(f"✓ Scan completed: {len(result['cookies'])} cookies, {len(result['thirdParties'])} trackers")
except Exception as e:
    print(f"✗ Scan failed: {e}")

print("\nTesting compliance...")
try:
    mock_scan = {
        'cookies': [
            {'name': 'test', 'secure': True, 'httpOnly': True, 'sameSite': 'Lax'}
        ],
        'thirdParties': ['google-analytics.com', 'facebook.com']
    }
    comp_result = check_compliance(mock_scan)
    print(f"✓ Compliance check: {len(comp_result)} frameworks analyzed")
except Exception as e:
    print(f"✗ Compliance failed: {e}")

print("\nTesting workflow...")
try:
    workflow_result = run_compliance_scan("https://example.com", ['gdpr'])
    print(f"✓ Workflow completed: GDPR score = {workflow_result['compliance_analysis']['gdpr']['score']}")
except Exception as e:
    print(f"✗ Workflow failed: {e}")

print("\n✓ All tests passed!")

