FRAMEWORKS = {
    'gdpr': {
        'name': 'GDPR',
        'controls': [
            {'id': 'secure-flag', 'name': 'Secure cookies'},
            {'id': 'httponly-flag', 'name': 'HttpOnly protection'},
            {'id': 'samesite-attr', 'name': 'SameSite attribute'},
            {'id': 'third-party', 'name': 'Third-party tracking'}
        ]
    },
    'ccpa': {
        'name': 'CCPA',
        'controls': [
            {'id': 'consent', 'name': 'User consent'},
            {'id': 'third-party', 'name': 'Third-party disclosure'}
        ]
    }
}

TRACKER_CATEGORIES = {
    'google-analytics': ('Analytics', 'low'),
    'googletagmanager': ('Analytics', 'low'),
    'facebook': ('Advertising', 'medium'),
    'doubleclick': ('Advertising', 'medium'),
    'cloudflare': ('CDN', 'low'),
    'cloudfront': ('CDN', 'low')
}


def check_compliance(scan_data, frameworks=None):
    if frameworks is None:
        frameworks = ['gdpr', 'ccpa']
    
    cookies = scan_data.get('cookies', [])
    third_parties = scan_data.get('thirdParties', [])
    
    results = {}
    for fw_id in frameworks:
        if fw_id not in FRAMEWORKS:
            continue
        
        passed, failed, warnings = [], [], []
        
        # Check secure flag
        insecure = [c for c in cookies if not c.get('secure')]
        if not insecure:
            passed.append("All cookies use Secure flag")
        else:
            failed.append(f"{len(insecure)} cookies missing Secure flag")
        
        # Check httpOnly
        session_cookies = [c for c in cookies if 'session' in c.get('name', '').lower() or 'auth' in c.get('name', '').lower()]
        non_httponly = [c for c in session_cookies if not c.get('httpOnly')]
        if session_cookies and not non_httponly:
            passed.append("Session cookies use HttpOnly")
        elif non_httponly:
            failed.append(f"{len(non_httponly)} session cookies missing HttpOnly")
        
        # Check sameSite
        no_samesite = [c for c in cookies if not c.get('sameSite')]
        if not no_samesite:
            passed.append("All cookies have SameSite attribute")
        else:
            warnings.append(f"{len(no_samesite)} cookies missing SameSite")
        
        # Third parties
        if third_parties:
            warnings.append(f"{len(third_parties)} third-party services detected")
        
        score = (len(passed) / (len(passed) + len(failed)) * 100) if (passed or failed) else 0
        
        results[fw_id] = {
            'framework': FRAMEWORKS[fw_id]['name'],
            'score': round(score, 1),
            'passed': passed,
            'failed': failed,
            'warnings': warnings
        }
    
    return results


def analyze_third_parties(third_parties):
    risks = []
    for domain in third_parties:
        category, risk_level = 'Unknown', 'medium'
        
        for pattern, (cat, risk) in TRACKER_CATEGORIES.items():
            if pattern in domain:
                category, risk_level = cat, risk
                break
        
        risks.append({
            'domain': domain,
            'category': category,
            'risk_level': risk_level
        })
    
    return risks

