// Configuration for Azure Speech Services
console.log('[config.js] Loading configuration...');

// Initialize window variables from multiple sources
// Priority: injected env > window.ENV > process.env > defaults
if (typeof window.AZURE_SPEECH_KEY === 'undefined') {
  window.AZURE_SPEECH_KEY = (window.INJECTED_ENV && window.INJECTED_ENV.AZURE_SPEECH_KEY) ||
                            (window.ENV && window.ENV.AZURE_SPEECH_KEY) ||
                            (typeof process !== 'undefined' && process.env.AZURE_SPEECH_KEY) ||
                            '';
  console.log('[config.js] AZURE_SPEECH_KEY initialized');
}

if (typeof window.AZURE_SPEECH_REGION === 'undefined') {
  window.AZURE_SPEECH_REGION = (window.INJECTED_ENV && window.INJECTED_ENV.AZURE_SPEECH_REGION) ||
                               (window.ENV && window.ENV.AZURE_SPEECH_REGION) ||
                               (typeof process !== 'undefined' && process.env.AZURE_SPEECH_REGION) ||
                               'eastus';
  console.log('[config.js] AZURE_SPEECH_REGION initialized');
}

// Log current values
console.log('[config.js] Configuration loaded:');
console.log('[config.js] AZURE_SPEECH_KEY length:', window.AZURE_SPEECH_KEY.length);
console.log('[config.js] AZURE_SPEECH_REGION:', window.AZURE_SPEECH_REGION);
