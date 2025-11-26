// Configuration for Azure Speech Services
// Set these environment variables in your deployment:
// AZURE_SPEECH_KEY - Your Azure Speech Service API key
// AZURE_SPEECH_REGION - Your Azure Speech Service region

// Load from environment variables (for deployment)
window.AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || '';
window.AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'eastus';

// Alternative: For local development, you can create a config.local.js file:
// window.AZURE_SPEECH_KEY = 'your-key-here';
// window.AZURE_SPEECH_REGION = 'eastus';
