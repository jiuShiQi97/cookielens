#!/bin/bash

# Test script for compliance analysis feature
# Make sure the server is running before executing this script

echo "========================================="
echo "CookieLens Compliance Analysis Test"
echo "========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health check
echo -e "${BLUE}Test 1: Health Check${NC}"
echo "GET http://localhost:8000/"
curl -s http://localhost:8000/ | jq '.'
echo ""
echo ""

# Test 2: Basic compliance scan (GDPR + CCPA)
echo -e "${BLUE}Test 2: Basic Compliance Scan (GDPR + CCPA)${NC}"
echo "POST /scan-with-compliance"
echo "URL: https://example.com"
curl -s -X POST "http://localhost:8000/scan-with-compliance" \
  -H "Content-Type: application/json" \
  -d '{
    "web_link": "https://example.com"
  }' | jq '{
    overall_summary: .overall_summary,
    gdpr_score: .compliance_analysis.gdpr.score,
    gdpr_status: .compliance_analysis.gdpr.status,
    gdpr_recommendations: .compliance_analysis.gdpr.recommendations,
    third_party_count: (.third_party_risks | length)
  }'
echo ""
echo ""

# Test 3: GDPR only
echo -e "${BLUE}Test 3: GDPR Only Check${NC}"
echo "POST /scan-with-compliance"
echo "URL: https://github.com"
echo "Frameworks: [gdpr]"
curl -s -X POST "http://localhost:8000/scan-with-compliance" \
  -H "Content-Type: application/json" \
  -d '{
    "web_link": "https://github.com",
    "frameworks": ["gdpr"]
  }' | jq '{
    frameworks_analyzed: .overall_summary.frameworks_analyzed,
    gdpr: {
      score: .compliance_analysis.gdpr.score,
      status: .compliance_analysis.gdpr.status,
      passed: (.compliance_analysis.gdpr.passed_controls | length),
      failed: (.compliance_analysis.gdpr.failed_controls | length)
    }
  }'
echo ""
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Tests completed!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} Scans may take 30-90 seconds depending on the website."
echo -e "${YELLOW}Tip:${NC} Visit http://localhost:8000/docs for interactive API documentation."

