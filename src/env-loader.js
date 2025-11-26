// Load environment from multiple sources
// Priority: .env.local (file) > localStorage > prompt > defaults

async function loadEnvironment() {
  let env = {
    AZURE_SPEECH_KEY: '',
    AZURE_SPEECH_REGION: 'eastus'
  };

  // Try to load from .env.local file first (development)
  try {
    const response = await fetch('/.env.local');
    if (response.ok) {
      const envText = await response.text();
      const lines = envText.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      lines.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        const trimmedKey = key.trim();
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (trimmedKey.includes('AZURE_SPEECH_KEY')) {
          env.AZURE_SPEECH_KEY = value || env.AZURE_SPEECH_KEY;
        }
        if (trimmedKey.includes('AZURE_SPEECH_REGION')) {
          env.AZURE_SPEECH_REGION = value || env.AZURE_SPEECH_REGION;
        }
      });
      console.log('[env-loader.js] ✅ Loaded from .env.local');
    }
  } catch (err) {
    console.log('[env-loader.js] ℹ️  .env.local not found, trying other sources');
  }

  // Fallback to localStorage if .env.local didn't have the key
  if (!env.AZURE_SPEECH_KEY && localStorage.getItem('AZURE_SPEECH_KEY')) {
    env.AZURE_SPEECH_KEY = localStorage.getItem('AZURE_SPEECH_KEY');
    env.AZURE_SPEECH_REGION = localStorage.getItem('AZURE_SPEECH_REGION') || env.AZURE_SPEECH_REGION;
    console.log('[env-loader.js] ✅ Loaded from localStorage');
  }

  // If still no key, prompt the user (development only)
  if (!env.AZURE_SPEECH_KEY) {
    console.warn('[env-loader.js] ⚠️  No Azure Speech credentials found');
    
    // Only prompt if in development (not in production with proper env setup)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const key = prompt('Enter your Azure Speech Service API Key (or leave blank to skip):');
      if (key) {
        env.AZURE_SPEECH_KEY = key;
        env.AZURE_SPEECH_REGION = prompt('Enter Azure region (default: eastus):', 'eastus') || 'eastus';
        // Save to localStorage for future sessions
        localStorage.setItem('AZURE_SPEECH_KEY', env.AZURE_SPEECH_KEY);
        localStorage.setItem('AZURE_SPEECH_REGION', env.AZURE_SPEECH_REGION);
        console.log('[env-loader.js] ✅ Credentials saved to localStorage');
      }
    }
  }

  // Set global environment
  window.INJECTED_ENV = env;

  console.log('[env-loader.js] Environment loaded:');
  console.log('[env-loader.js] AZURE_SPEECH_KEY:', env.AZURE_SPEECH_KEY ? `set (${env.AZURE_SPEECH_KEY.length} chars)` : '❌ NOT SET');
  console.log('[env-loader.js] AZURE_SPEECH_REGION:', env.AZURE_SPEECH_REGION);
}

// Load environment when script loads
loadEnvironment();
