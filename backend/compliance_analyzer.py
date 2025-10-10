"""
Compliance Analyzer
Maps website scan results to compliance framework requirements
"""
from typing import Dict, List, Any, Optional
from vanta_client import VantaClient


class ComplianceAnalyzer:
    """Analyzes scan results against compliance frameworks"""
    
    def __init__(self, vanta_client: VantaClient):
        """
        Initialize compliance analyzer
        
        Args:
            vanta_client: Vanta API client instance
        """
        self.vanta_client = vanta_client
    
    def analyze_compliance(
        self, 
        scan_results: Dict[str, Any], 
        frameworks: List[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze scan results for compliance
        
        Args:
            scan_results: Results from website scan
            frameworks: List of frameworks to check (defaults to ['gdpr', 'ccpa'])
            
        Returns:
            Compliance analysis results
        """
        if frameworks is None:
            frameworks = ['gdpr', 'ccpa']
        
        # Get controls for each framework
        controls_by_framework = self.vanta_client.get_privacy_controls(frameworks)
        
        # Analyze compliance for each framework
        compliance_results = {}
        for framework_id, controls in controls_by_framework.items():
            compliance_results[framework_id] = self._analyze_framework(
                scan_results, 
                framework_id, 
                controls
            )
        
        # Analyze third-party risks
        third_party_risks = self._analyze_third_party_risks(scan_results)
        
        return {
            "scan_results": scan_results,
            "compliance_analysis": compliance_results,
            "third_party_risks": third_party_risks,
            "overall_summary": self._generate_summary(compliance_results)
        }
    
    def _analyze_framework(
        self, 
        scan_results: Dict[str, Any], 
        framework_id: str,
        controls: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze compliance for a specific framework
        
        Args:
            scan_results: Scan results
            framework_id: Framework identifier
            controls: List of controls for the framework
            
        Returns:
            Framework compliance analysis
        """
        passed_controls = []
        failed_controls = []
        warnings = []
        recommendations = []
        
        cookies = scan_results.get('cookies', [])
        local_storage = scan_results.get('localStorage', {})
        third_parties = scan_results.get('thirdParties', [])
        
        # Check cookie security attributes
        for control in controls:
            control_id = control.get('id', '')
            
            if 'consent' in control_id.lower():
                # Check for consent mechanism
                result = self._check_consent_mechanism(scan_results)
                if result['passed']:
                    passed_controls.append(result['message'])
                else:
                    failed_controls.append(result['message'])
                    recommendations.append(result['recommendation'])
            
            elif 'secure' in control_id.lower():
                # Check Secure flag on cookies
                result = self._check_secure_flag(cookies)
                if result['passed']:
                    passed_controls.append(result['message'])
                else:
                    failed_controls.append(result['message'])
                    recommendations.append(result['recommendation'])
            
            elif 'httponly' in control_id.lower():
                # Check httpOnly flag on cookies
                result = self._check_httponly_flag(cookies)
                if result['passed']:
                    passed_controls.append(result['message'])
                else:
                    failed_controls.append(result['message'])
                    recommendations.append(result['recommendation'])
            
            elif 'samesite' in control_id.lower():
                # Check sameSite attribute
                result = self._check_samesite_attribute(cookies)
                if result['passed']:
                    passed_controls.append(result['message'])
                else:
                    warnings.append(result['message'])
                    recommendations.append(result['recommendation'])
            
            elif 'third-party' in control_id.lower():
                # Check third-party documentation
                result = self._check_third_party_disclosure(third_parties)
                if result['passed']:
                    passed_controls.append(result['message'])
                else:
                    warnings.append(result['message'])
                    recommendations.append(result['recommendation'])
        
        # Calculate compliance score
        total_checks = len(passed_controls) + len(failed_controls)
        score = (len(passed_controls) / total_checks * 100) if total_checks > 0 else 0
        
        # Determine status
        if score >= 80:
            status = "compliant"
        elif score >= 60:
            status = "needs_improvement"
        else:
            status = "non_compliant"
        
        return {
            "framework": framework_id.upper(),
            "score": round(score, 1),
            "status": status,
            "passed_controls": passed_controls,
            "failed_controls": failed_controls,
            "warnings": warnings,
            "recommendations": recommendations
        }
    
    def _check_consent_mechanism(self, scan_results: Dict[str, Any]) -> Dict[str, Any]:
        """Check if consent mechanism is present"""
        # This is a simplified check - in reality, you'd need more sophisticated detection
        # For now, we'll assume presence of cookies indicates some mechanism exists
        cookies = scan_results.get('cookies', [])
        
        if len(cookies) > 0:
            return {
                "passed": True,
                "message": "Cookie consent mechanism detected",
                "recommendation": ""
            }
        else:
            return {
                "passed": False,
                "message": "No clear consent mechanism detected",
                "recommendation": "Implement a cookie consent banner to obtain user permission before setting cookies"
            }
    
    def _check_secure_flag(self, cookies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Check if cookies have Secure flag"""
        insecure_cookies = [c for c in cookies if not c.get('secure', False)]
        
        if not cookies:
            return {"passed": True, "message": "No cookies found", "recommendation": ""}
        
        if not insecure_cookies:
            return {
                "passed": True,
                "message": "All cookies have 'Secure' flag set",
                "recommendation": ""
            }
        else:
            return {
                "passed": False,
                "message": f"{len(insecure_cookies)} cookie(s) missing 'Secure' flag: {', '.join([c.get('name', 'unknown') for c in insecure_cookies[:3]])}",
                "recommendation": "Set 'Secure' flag on all cookies to ensure they're only transmitted over HTTPS"
            }
    
    def _check_httponly_flag(self, cookies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Check if session cookies have httpOnly flag"""
        # Identify likely session cookies
        session_cookies = [c for c in cookies if 'session' in c.get('name', '').lower() or 'auth' in c.get('name', '').lower()]
        non_httponly_session = [c for c in session_cookies if not c.get('httpOnly', False)]
        
        if not session_cookies:
            return {"passed": True, "message": "No session cookies detected", "recommendation": ""}
        
        if not non_httponly_session:
            return {
                "passed": True,
                "message": "Session cookies have 'httpOnly' flag set",
                "recommendation": ""
            }
        else:
            return {
                "passed": False,
                "message": f"{len(non_httponly_session)} session cookie(s) missing 'httpOnly' flag",
                "recommendation": "Set 'httpOnly' flag on session cookies to prevent XSS attacks"
            }
    
    def _check_samesite_attribute(self, cookies: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Check if cookies have sameSite attribute"""
        no_samesite = [c for c in cookies if not c.get('sameSite')]
        
        if not cookies:
            return {"passed": True, "message": "No cookies found", "recommendation": ""}
        
        if not no_samesite:
            return {
                "passed": True,
                "message": "All cookies have 'sameSite' attribute set",
                "recommendation": ""
            }
        else:
            return {
                "passed": False,
                "message": f"{len(no_samesite)} cookie(s) missing 'sameSite' attribute",
                "recommendation": "Set 'sameSite' attribute (Lax or Strict) on cookies to prevent CSRF attacks"
            }
    
    def _check_third_party_disclosure(self, third_parties: List[str]) -> Dict[str, Any]:
        """Check third-party services"""
        if not third_parties:
            return {
                "passed": True,
                "message": "No third-party services detected",
                "recommendation": ""
            }
        else:
            return {
                "passed": False,
                "message": f"Detected {len(third_parties)} third-party service(s)",
                "recommendation": f"Document these third-party services in your privacy policy: {', '.join(third_parties[:5])}"
            }
    
    def _analyze_third_party_risks(self, scan_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyze risks from third-party services"""
        third_parties = scan_results.get('thirdParties', [])
        
        risks = []
        for domain in third_parties:
            # Categorize common third-party services
            risk_level = "unknown"
            category = "Unknown"
            
            if 'google-analytics' in domain or 'googletagmanager' in domain:
                risk_level = "low"
                category = "Analytics"
            elif 'facebook' in domain or 'doubleclick' in domain:
                risk_level = "medium"
                category = "Advertising"
            elif 'cloudflare' in domain or 'cloudfront' in domain:
                risk_level = "low"
                category = "CDN"
            else:
                risk_level = "medium"
                category = "Unknown"
            
            risks.append({
                "domain": domain,
                "category": category,
                "risk_level": risk_level,
                "recommendation": f"Review data processing agreement with {domain}"
            })
        
        return risks
    
    def _generate_summary(self, compliance_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate overall compliance summary"""
        total_score = sum(r['score'] for r in compliance_results.values())
        avg_score = total_score / len(compliance_results) if compliance_results else 0
        
        all_passed = sum(len(r['passed_controls']) for r in compliance_results.values())
        all_failed = sum(len(r['failed_controls']) for r in compliance_results.values())
        all_warnings = sum(len(r['warnings']) for r in compliance_results.values())
        
        return {
            "overall_score": round(avg_score, 1),
            "total_passed": all_passed,
            "total_failed": all_failed,
            "total_warnings": all_warnings,
            "frameworks_analyzed": len(compliance_results)
        }

