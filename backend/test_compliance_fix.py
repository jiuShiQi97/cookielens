#!/usr/bin/env python3
"""
Test script to verify compliance analysis is working correctly
"""
import json
from vanta_client import VantaClient
from compliance_analyzer import ComplianceAnalyzer

# Sample scan results (simplified from text.json)
sample_scan = {
    "url": "https://www.yami.com/en",
    "cookies": [
        {"name": "ymb_track_visitor_id", "secure": False, "httpOnly": False, "sameSite": "Lax"},
        {"name": "YMB_TK", "secure": False, "httpOnly": False, "sameSite": "Lax"},
        {"name": "_rdt_uuid", "secure": True, "httpOnly": False, "sameSite": "Strict"},
        {"name": "CLID", "secure": True, "httpOnly": True, "sameSite": "None"},
    ],
    "thirdParties": [
        "bat.bing.com",
        "www.clarity.ms",
        "connect.facebook.net",
        "googleads.g.doubleclick.net",
        "www.googletagmanager.com"
    ]
}

def test_compliance():
    print("=" * 60)
    print("Testing Compliance Analysis")
    print("=" * 60)
    
    # Initialize
    vanta_client = VantaClient()
    analyzer = ComplianceAnalyzer(vanta_client)
    
    # Get controls
    print("\n1. Testing Vanta Controls Retrieval...")
    gdpr_controls = vanta_client.get_framework_controls('gdpr')
    ccpa_controls = vanta_client.get_framework_controls('ccpa')
    
    print(f"   GDPR controls: {len(gdpr_controls)} found")
    print(f"   CCPA controls: {len(ccpa_controls)} found")
    
    if len(gdpr_controls) > 0:
        print(f"   First GDPR control: {gdpr_controls[0].get('name', 'N/A')}")
    if len(ccpa_controls) > 0:
        print(f"   First CCPA control: {ccpa_controls[0].get('name', 'N/A')}")
    
    # Run compliance analysis
    print("\n2. Running Compliance Analysis...")
    results = analyzer.analyze_compliance(sample_scan, ['gdpr', 'ccpa'])
    
    # Display results
    print("\n3. Results Summary:")
    print(f"   Overall Score: {results['overall_summary']['overall_score']}%")
    print(f"   Total Passed: {results['overall_summary']['total_passed']}")
    print(f"   Total Failed: {results['overall_summary']['total_failed']}")
    print(f"   Total Warnings: {results['overall_summary']['total_warnings']}")
    
    # GDPR Details
    print("\n4. GDPR Analysis:")
    gdpr = results['compliance_analysis']['gdpr']
    print(f"   Score: {gdpr['score']}%")
    print(f"   Status: {gdpr['status']}")
    print(f"   Passed Controls: {len(gdpr['passed_controls'])}")
    if gdpr['passed_controls']:
        for control in gdpr['passed_controls']:
            print(f"      ✓ {control}")
    print(f"   Failed Controls: {len(gdpr['failed_controls'])}")
    if gdpr['failed_controls']:
        for control in gdpr['failed_controls']:
            print(f"      ✗ {control}")
    print(f"   Warnings: {len(gdpr['warnings'])}")
    if gdpr['warnings']:
        for warning in gdpr['warnings']:
            print(f"      ⚠ {warning}")
    print(f"   Recommendations: {len(gdpr['recommendations'])}")
    if gdpr['recommendations']:
        for rec in gdpr['recommendations'][:3]:  # Show first 3
            print(f"      💡 {rec}")
    
    # CCPA Details
    print("\n5. CCPA Analysis:")
    ccpa = results['compliance_analysis']['ccpa']
    print(f"   Score: {ccpa['score']}%")
    print(f"   Status: {ccpa['status']}")
    print(f"   Passed Controls: {len(ccpa['passed_controls'])}")
    print(f"   Failed Controls: {len(ccpa['failed_controls'])}")
    print(f"   Warnings: {len(ccpa['warnings'])}")
    print(f"   Recommendations: {len(ccpa['recommendations'])}")
    
    # Check if fix worked
    print("\n6. Validation:")
    total_issues = (
        results['overall_summary']['total_passed'] +
        results['overall_summary']['total_failed'] +
        results['overall_summary']['total_warnings']
    )
    
    if total_issues > 0:
        print("   ✅ SUCCESS: Compliance analysis is working!")
        print(f"   Found {total_issues} total checks across all frameworks")
    else:
        print("   ❌ FAILURE: No compliance checks were executed")
        print("   This means controls list is empty or checks aren't running")
    
    print("\n" + "=" * 60)
    
    # Save full results to file
    with open('test_compliance_output.json', 'w') as f:
        json.dump(results, f, indent=2)
    print("\nFull results saved to: test_compliance_output.json")
    print("=" * 60)

if __name__ == "__main__":
    test_compliance()

