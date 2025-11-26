// Configuration for Azure Speech Services
console.log('[config.js] Loading configuration...');

// Initialize window variables from environment or defaults
if (typeof window.AZURE_SPEECH_KEY === 'undefined') {
  // Try to get from environment, otherwise use placeholder
  window.AZURE_SPEECH_KEY = process.env.REACT_APP_AZURE_SPEECH_KEY || 
                            process.env.AZURE_SPEECH_KEY || 
                            process.env.VUE_APP_AZURE_SPEECH_KEY ||
                            '';
  console.log('[config.js] AZURE_SPEECH_KEY set from environment');
}

if (typeof window.AZURE_SPEECH_REGION === 'undefined') {
  window.AZURE_SPEECH_REGION = process.env.REACT_APP_AZURE_SPEECH_REGION ||
                               process.env.AZURE_SPEECH_REGION ||
                               process.env.VUE_APP_AZURE_SPEECH_REGION ||
                               'eastus';
  console.log('[config.js] AZURE_SPEECH_REGION set from environment');
}

// Log current values
console.log('[config.js] After initialization:');
console.log('[config.js] AZURE_SPEECH_KEY length:', window.AZURE_SPEECH_KEY.length);
console.log('[config.js] AZURE_SPEECH_REGION:', window.AZURE_SPEECH_REGION);
