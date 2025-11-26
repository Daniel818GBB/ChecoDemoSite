// Configuration for Azure Speech Services
// Set these environment variables in your deployment:
// AZURE_SPEECH_KEY - Your Azure Speech Service API key
// AZURE_SPEECH_REGION - Your Azure Speech Service region

// Initialize default values
if (!window.AZURE_SPEECH_KEY) {
  window.AZURE_SPEECH_KEY = '';
}
if (!window.AZURE_SPEECH_REGION) {
  window.AZURE_SPEECH_REGION = 'eastus';
}

console.log('Config loaded. AZURE_SPEECH_KEY exists:', !!window.AZURE_SPEECH_KEY);
console.log('AZURE_SPEECH_REGION:', window.AZURE_SPEECH_REGION);
