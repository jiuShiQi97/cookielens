// Heuristic explainer for CookieLens
// Analyzes page signals to generate cookie explanations

// Collect page signals for analysis
function collectPageSignals() {
  const signals = {
    scripts: [],
    cookies: [],
    queryParams: []
  };
  
  try {
    // Collect script hostnames
    const scriptTags = document.querySelectorAll('script[src]');
    scriptTags.forEach(script => {
      try {
        const url = new URL(script.src);
        const hostname = url.hostname;
        if (hostname && !signals.scripts.includes(hostname)) {
          signals.scripts.push(hostname);
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    });
    
    // Collect cookie names (not values)
    if (document.cookie) {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const name = cookie.trim().split('=')[0];
        if (name && !signals.cookies.includes(name)) {
          signals.cookies.push(name);
        }
      });
    }
    
    // Collect query parameter keys
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => {
      if (!signals.queryParams.includes(key)) {
        signals.queryParams.push(key);
      }
    });
    
  } catch (error) {
    console.warn('Error collecting page signals:', error);
  }
  
  return signals;
}

// Classify host into category
function classify(host) {
  const hostLower = host.toLowerCase();
  
  // Analytics patterns
  const analyticsPatterns = [
    'google-analytics',
    'googletagmanager',
    'mixpanel',
    'segment',
    'hotjar',
    'amplitude'
  ];
  
  // Marketing patterns
  const marketingPatterns = [
    'doubleclick',
    'facebook',
    'adsrvr',
    'criteo',
    'outbrain',
    'taboola',
    'adsystem'
  ];
  
  // Check patterns
  for (const pattern of analyticsPatterns) {
    if (hostLower.includes(pattern)) {
      return 'analytics';
    }
  }
  
  for (const pattern of marketingPatterns) {
    if (hostLower.includes(pattern)) {
      return 'marketing';
    }
  }
  
  return 'functional';
}

// Infer field types from keys
function inferFields(keys) {
  const fields = {
    identifiers: [],
    tracking: [],
    marketing: [],
    analytics: []
  };
  
  keys.forEach(key => {
    const keyLower = key.toLowerCase();
    
    // Identifier patterns
    if (keyLower.match(/(cid|client_id|device_id|user_id|session_id)/)) {
      fields.identifiers.push(key);
    }
    // Tracking patterns
    else if (keyLower.match(/(utm_|ref|dl|page|path|url|source|medium|campaign)/)) {
      fields.tracking.push(key);
    }
    // Marketing patterns
    else if (keyLower.match(/(fbp|fbc|external_id|ad_id|click_id)/)) {
      fields.marketing.push(key);
    }
    // Analytics patterns
    else if (keyLower.match(/(ga|gid|gtm|analytics|measurement)/)) {
      fields.analytics.push(key);
    }
  });
  
  return fields;
}

// Build explanation from signals
function buildExplanation(signals) {
  const explanation = {
    short: "We use necessary cookies to run the site. Analytics and marketing tools may collect page information and device identifiers. You can reject non-essential cookies.",
    details: []
  };
  
  // Analyze detected hosts
  const detectedHosts = new Set();
  
  signals.scripts.forEach(host => {
    const category = classify(host);
    if (category !== 'functional' && !detectedHosts.has(host)) {
      detectedHosts.add(host);
      
      let recipient = 'Unknown Service';
      let purpose = category;
      let dataExamples = ['page_url', 'device_info'];
      
      // Map specific hosts to known services
      if (host.includes('google-analytics')) {
        recipient = 'Google Analytics';
        dataExamples = ['page_url', 'client_id', 'screen/browser info', 'referrer'];
      } else if (host.includes('googletagmanager')) {
        recipient = 'Google Tag Manager';
        dataExamples = ['page_url', 'client_id', 'event data', 'custom dimensions'];
      } else if (host.includes('facebook')) {
        recipient = 'Meta Pixel';
        dataExamples = ['event name', 'page url', 'ad click identifiers (fbc/fbp)', 'user interactions'];
      } else if (host.includes('doubleclick')) {
        recipient = 'Google Ads';
        dataExamples = ['ad interactions', 'conversion data', 'audience targeting', 'remarketing'];
      } else if (host.includes('mixpanel')) {
        recipient = 'Mixpanel';
        dataExamples = ['user events', 'funnel analysis', 'cohort data', 'user properties'];
      } else if (host.includes('segment')) {
        recipient = 'Segment';
        dataExamples = ['user events', 'identity data', 'custom properties', 'integration data'];
      } else if (category === 'analytics') {
        recipient = 'Analytics Service';
        dataExamples = ['page views', 'user behavior', 'performance metrics', 'custom events'];
      } else if (category === 'marketing') {
        recipient = 'Marketing Platform';
        dataExamples = ['ad performance', 'conversion tracking', 'audience data', 'campaign metrics'];
      }
      
      explanation.details.push({
        recipient: recipient,
        domain: host,
        purpose: purpose,
        data_examples: dataExamples
      });
    }
  });
  
  // Add default examples if no specific hosts detected
  if (explanation.details.length === 0) {
    explanation.details.push(
      {
        recipient: 'Google Analytics',
        domain: 'google-analytics.com',
        purpose: 'analytics',
        data_examples: ['page_url', 'client_id', 'screen/browser info']
      },
      {
        recipient: 'Meta Pixel',
        domain: 'facebook.com',
        purpose: 'marketing',
        data_examples: ['event name', 'page url', 'ad click identifiers (fbc/fbp)']
      }
    );
  }
  
  // Limit to 3 details max for readability
  explanation.details = explanation.details.slice(0, 3);
  
  return explanation;
}

// Export functions for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    collectPageSignals,
    classify,
    inferFields,
    buildExplanation
  };
}
