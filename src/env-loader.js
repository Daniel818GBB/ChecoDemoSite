// Load environment from .env.local file
fetch('/.env.local')
  .then(response => response.text())
  .then(envText => {
    // Parse the .env file format
    const lines = envText.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const env = {};
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    });

    // Set global environment
    window.INJECTED_ENV = {
      AZURE_SPEECH_KEY: env.AZURE_SPEECH_KEY || env.REACT_APP_AZURE_SPEECH_KEY || env.VUE_APP_AZURE_SPEECH_KEY || '',
      AZURE_SPEECH_REGION: env.AZURE_SPEECH_REGION || env.REACT_APP_AZURE_SPEECH_REGION || env.VUE_APP_AZURE_SPEECH_REGION || 'eastus'
    };

    console.log('[env-loader.js] Loaded environment from .env.local');
    console.log('[env-loader.js] AZURE_SPEECH_KEY:', window.INJECTED_ENV.AZURE_SPEECH_KEY ? `set (${window.INJECTED_ENV.AZURE_SPEECH_KEY.length} chars)` : 'NOT SET');
    console.log('[env-loader.js] AZURE_SPEECH_REGION:', window.INJECTED_ENV.AZURE_SPEECH_REGION);
  })
  .catch(err => {
    console.warn('[env-loader.js] Could not load .env.local, using defaults');
    window.INJECTED_ENV = {
      AZURE_SPEECH_KEY: '',
      AZURE_SPEECH_REGION: 'eastus'
    };
  });
