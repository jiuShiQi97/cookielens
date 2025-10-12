"""
Vanta API Client
Interfaces with Vanta MCP Server to retrieve compliance frameworks and controls
"""
import os
import json
import subprocess
from typing import Dict, List, Optional, Any


class VantaClient:
    """Client for interacting with Vanta MCP Server"""
    
    def __init__(self, env_file_path: Optional[str] = None):
        """
        Initialize Vanta client
        
        Args:
            env_file_path: Path to vanta-credentials.env file
        """
        self.env_file_path = env_file_path or os.getenv('VANTA_ENV_FILE')
        self.region = os.getenv('REGION', 'us')
        
        if not self.env_file_path:
            print("Warning: VANTA_ENV_FILE not set. Vanta features will be disabled.")
            self.enabled = False
        else:
            self.enabled = True
    
    def _call_mcp_server(self, tool: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call Vanta MCP Server using npx
        
        Args:
            tool: MCP tool name (e.g., 'frameworks', 'controls')
            arguments: Tool arguments
            
        Returns:
            Tool response as dictionary
        """
        # For now, always return mock data for development/demo
        # In production with real Vanta credentials, you'd call the actual MCP server
        try:
            if not self.enabled:
                # Even without credentials, return mock data for testing
                return self._get_mock_data(tool, arguments)
            
            # Prepare environment variables
            env = os.environ.copy()
            env['VANTA_ENV_FILE'] = self.env_file_path
            env['REGION'] = self.region
            
            # Call MCP server via npx
            # Note: This is a simplified approach. In production, you'd use the MCP SDK properly
            cmd = ['npx', '-y', '@vantasdk/vanta-mcp-server']
            
            # For now, return mock data since direct MCP calls need proper SDK integration
            # In production, you'd integrate with the MCP protocol properly
            return self._get_mock_data(tool, arguments)
            
        except Exception as e:
            print(f"Vanta MCP call failed: {e}")
            # Return mock data as fallback
            return self._get_mock_data(tool, arguments)
    
    def _get_mock_data(self, tool: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Return mock data for development/testing
        In production, replace with actual MCP server calls
        """
        if tool == 'frameworks':
            return {
                "frameworks": [
                    {
                        "id": "gdpr",
                        "name": "GDPR",
                        "description": "General Data Protection Regulation",
                        "completionPercentage": 0,
                        "controlCount": 15
                    },
                    {
                        "id": "ccpa",
                        "name": "CCPA",
                        "description": "California Consumer Privacy Act",
                        "completionPercentage": 0,
                        "controlCount": 12
                    },
                    {
                        "id": "soc2",
                        "name": "SOC 2",
                        "description": "Service Organization Control 2",
                        "completionPercentage": 0,
                        "controlCount": 25
                    }
                ]
            }
        
        elif tool == 'list_framework_controls':
            framework_id = arguments.get('frameworkId', 'gdpr')
            
            if framework_id == 'gdpr':
                return {
                    "controls": [
                        {
                            "id": "gdpr-consent",
                            "name": "User Consent Management",
                            "description": "Obtain explicit consent before processing personal data",
                            "requirement": "Cookies must not be set without user consent",
                            "category": "Privacy"
                        },
                        {
                            "id": "gdpr-secure-transmission",
                            "name": "Secure Data Transmission",
                            "description": "Ensure data is transmitted securely",
                            "requirement": "All cookies must have 'Secure' flag set",
                            "category": "Security"
                        },
                        {
                            "id": "gdpr-httponly",
                            "name": "Protection Against XSS",
                            "description": "Prevent client-side script access to sensitive cookies",
                            "requirement": "Session cookies must have 'httpOnly' flag set",
                            "category": "Security"
                        },
                        {
                            "id": "gdpr-samesite",
                            "name": "CSRF Protection",
                            "description": "Protect against cross-site request forgery",
                            "requirement": "Cookies should have 'sameSite' attribute set",
                            "category": "Security"
                        },
                        {
                            "id": "gdpr-third-party",
                            "name": "Third-Party Data Processing",
                            "description": "Document and control third-party data processors",
                            "requirement": "All third-party services must be documented",
                            "category": "Privacy"
                        }
                    ]
                }
            
            elif framework_id == 'ccpa':
                return {
                    "controls": [
                        {
                            "id": "ccpa-consent",
                            "name": "User Consent Management",
                            "description": "Inform users about data collection and obtain consent",
                            "requirement": "Privacy policy and consent mechanism must be present",
                            "category": "Privacy"
                        },
                        {
                            "id": "ccpa-secure-transmission",
                            "name": "Secure Data Transmission",
                            "description": "Ensure consumer data is transmitted securely",
                            "requirement": "All cookies must have 'Secure' flag set",
                            "category": "Security"
                        },
                        {
                            "id": "ccpa-disclosure",
                            "name": "Privacy Policy Disclosure",
                            "description": "Inform users about data collection practices",
                            "requirement": "Privacy policy must be accessible",
                            "category": "Privacy"
                        },
                        {
                            "id": "ccpa-opt-out",
                            "name": "Right to Opt-Out",
                            "description": "Provide mechanism for users to opt-out of data sale",
                            "requirement": "Cookie banner must offer opt-out options",
                            "category": "Privacy"
                        },
                        {
                            "id": "ccpa-third-party",
                            "name": "Third-Party Disclosure",
                            "description": "Disclose third parties with whom data is shared",
                            "requirement": "List all third-party services in privacy policy",
                            "category": "Privacy"
                        }
                    ]
                }
        
        return {"error": "Tool not implemented"}
    
    def get_frameworks(self, framework_filter: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Get compliance frameworks
        
        Args:
            framework_filter: Optional list of framework IDs to filter
            
        Returns:
            List of frameworks
        """
        result = self._call_mcp_server('frameworks', {})
        frameworks = result.get('frameworks', [])
        
        if framework_filter:
            frameworks = [f for f in frameworks if f['id'] in framework_filter]
        
        return frameworks
    
    def get_framework_controls(self, framework_id: str) -> List[Dict[str, Any]]:
        """
        Get controls for a specific framework
        
        Args:
            framework_id: Framework identifier (e.g., 'gdpr', 'ccpa')
            
        Returns:
            List of controls
        """
        result = self._call_mcp_server('list_framework_controls', {
            'frameworkId': framework_id
        })
        
        return result.get('controls', [])
    
    def get_privacy_controls(self, frameworks: List[str] = None) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get privacy-related controls for specified frameworks
        
        Args:
            frameworks: List of framework IDs (defaults to ['gdpr', 'ccpa'])
            
        Returns:
            Dictionary mapping framework ID to list of controls
        """
        if frameworks is None:
            frameworks = ['gdpr', 'ccpa']
        
        controls_by_framework = {}
        
        for framework_id in frameworks:
            controls = self.get_framework_controls(framework_id)
            # Filter for privacy/security related controls
            privacy_controls = [
                c for c in controls 
                if c.get('category') in ['Privacy', 'Security']
            ]
            controls_by_framework[framework_id] = privacy_controls
        
        return controls_by_framework

