// Environment variables - populated by build process or server
// This file loads environment variables and makes them available to the client
window.ENV = {
  AZURE_SPEECH_KEY: null,
  AZURE_SPEECH_REGION: 'eastus'
};

// Try to load from window variables set by the server or inline in HTML
// The server should inject these values, or they can be set as data attributes
if (typeof window.INJECTED_ENV !== 'undefined') {
  window.ENV = { ...window.ENV, ...window.INJECTED_ENV };
  console.log('[env.js] Loaded injected environment variables');
}

console.log('[env.js] Environment initialized:', { 
  hasKey: !!window.ENV.AZURE_SPEECH_KEY,
  region: window.ENV.AZURE_SPEECH_REGION
});
