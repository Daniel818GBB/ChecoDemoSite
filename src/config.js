// Configuration for Azure Speech Services
console.log('[config.js] Loading configuration...');

// Initialize default values if not already set
if (!window.AZURE_SPEECH_KEY) {
  window.AZURE_SPEECH_KEY = '';
  console.log('[config.js] AZURE_SPEECH_KEY not set, initialized to empty string');
}
if (!window.AZURE_SPEECH_REGION) {
  window.AZURE_SPEECH_REGION = 'eastus';
  console.log('[config.js] AZURE_SPEECH_REGION not set, initialized to eastus');
}

// Log current values
console.log('[config.js] After initialization:');
console.log('[config.js] AZURE_SPEECH_KEY length:', window.AZURE_SPEECH_KEY.length);
console.log('[config.js] AZURE_SPEECH_REGION:', window.AZURE_SPEECH_REGION);
