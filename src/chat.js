// UI Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const scenarioBtns = document.querySelectorAll('.scenario-btn[data-scenario]');
const newChatBtn = document.getElementById('new-chat-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const startChatBtn = document.getElementById('start-chat');
const learnMoreBtn = document.getElementById('learn-more');
const welcomeScreen = document.getElementById('chat-welcome');
const webchatArea = document.querySelector('.webchat-area');
const micToggle = document.getElementById('mic-toggle');
const speechDisplay = document.getElementById('speech-display');
const speechText = document.getElementById('speech-text');
const speechCancel = document.getElementById('speech-cancel');
const ttsToggle = document.getElementById('tts-toggle');
const ttsDisplay = document.getElementById('tts-display');
const ttsText = document.getElementById('tts-text');
const ttsStop = document.getElementById('tts-stop');

// Current state
let currentScenario = null;
let pendingScroll = false;
let isUserTurn = false;
let isListening = false;
let recognizer = null;
let ttsEnabled = false;
let isPlayingAudio = false;

// Azure Speech Configuration
const AZURE_CONFIG = {
  key: window.AZURE_SPEECH_KEY || '',
  region: window.AZURE_SPEECH_REGION || 'eastus'
};

// Sidebar toggle functionality
menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});

// Scenario selection
scenarioBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    scenarioBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentScenario = btn.dataset.scenario;
    showChat();
  });
});

// New chat functionality
newChatBtn.addEventListener('click', (e) => {
  e.preventDefault();
  resetChat();
});

// Clear history
clearChatBtn.addEventListener('click', (e) => {
  e.preventDefault();
  clearChatHistory();
});

// Welcome screen buttons
startChatBtn.addEventListener('click', () => {
  showChat();
});

learnMoreBtn.addEventListener('click', () => {
  alert('AI Assistant provides intelligent conversations with scenario-based interactions. Choose a scenario from the left sidebar to get started!');
});

// Microphone and Speech Recognition
micToggle.addEventListener('click', () => {
  if (!isListening) {
    startSpeechRecognition();
  } else {
    stopSpeechRecognition();
  }
});

speechCancel.addEventListener('click', () => {
  stopSpeechRecognition();
});

// Text-to-Speech Toggle
ttsToggle.addEventListener('click', () => {
  ttsEnabled = !ttsEnabled;
  ttsToggle.classList.toggle('active', ttsEnabled);
  console.log('TTS', ttsEnabled ? 'enabled' : 'disabled');
});

ttsStop.addEventListener('click', () => {
  stopAudio();
});

function showChat() {
  welcomeScreen.classList.add('hidden');
  webchatArea.classList.add('active');
  if (!window.chatInitialized) {
    startWebChat();
    window.chatInitialized = true;
  }
}

// Reset chat
function resetChat() {
  if (window.chatObserver) {
    window.chatObserver.disconnect();
    window.chatObserver = null;
  }
  if (window.chatDirectLine) {
    try {
      window.chatDirectLine.end();
    } catch (e) {
      console.log('DirectLine already ended');
    }
    window.chatDirectLine = null;
  }
  const webchatElement = document.getElementById('webchat');
  if (webchatElement) {
    webchatElement.innerHTML = '';
    window.chatInitialized = false;
  }
  welcomeScreen.classList.remove('hidden');
  webchatArea.classList.remove('active');
}

// Clear chat history
function clearChatHistory() {
  const webchatElement = document.getElementById('webchat');
  if (webchatElement) {
    webchatElement.innerHTML = '';
  }
  pendingScroll = false;
  isUserTurn = false;
}

function startWebChat() {
  (async function () {
    const styleOptions = {
      hideUploadButton: true,
      backgroundColor: "#fff",
      bubbleBackground: "#f0f4ff",
      bubbleTextColor: "#333",
      bubbleBorderRadius: 14,
      fontFamily: "'Montserrat', Arial, sans-serif",
      sendBoxBackground: "#fff",
      sendBoxTextColor: "#333",
      sendBoxButtonColor: "#667eea",
      accent: "#667eea",
      botAvatarInitials: "AI",
      userAvatarInitials: "You",
      sendBoxHeight: 48,
      sendBoxBorderTop: "1px solid #e0e0e0",
      paddingBottom: 12
    };

    const tokenEndpointURL = new URL('https://c8ab89428f6be002b5247b562aa5f2.19.environment.api.powerplatform.com/powervirtualagents/botsbyschema/cra6f_masterIvr/directline/token?api-version=2022-03-01-preview');
    const locale = document.documentElement.lang || 'en';
    const apiVersion = tokenEndpointURL.searchParams.get('api-version');

    try {
      const [directLineURL, token] = await Promise.all([
        fetch(new URL(`/powervirtualagents/regionalchannelsettings?api-version=${apiVersion}`, tokenEndpointURL))
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to retrieve regional channel settings.');
            }
            return response.json();
          })
          .then(({ channelUrlsById: { directline } }) => directline),
        fetch(tokenEndpointURL)
          .then(response => {
            if (!response.ok) {
              throw new Error('Failed to retrieve Direct Line token.');
            }
            return response.json();
          })
          .then(({ token }) => token)
      ]);

      const directLine = window.WebChat.createDirectLine({ domain: new URL('v3/directline', directLineURL), token });
      window.chatDirectLine = directLine;

      const store = window.WebChat.createStore(
        {},
        ({ dispatch }) => next => action => {
          const result = next(action);
         
          if (action.type === 'WEB_CHAT/SEND_MESSAGE') {
            isUserTurn = true;
          } else if (action.type === 'DIRECT_LINE/INCOMING_ACTIVITY') {
            const activity = action.payload.activity;
            if (activity.from && activity.from.role === 'bot' && activity.type === 'message' && isUserTurn) {
              pendingScroll = true;
              isUserTurn = false;
            }
          }
         
          return result;
        }
      );

      const subscription = directLine.connectionStatus$.subscribe({
        next(value) {
          if (value === 2) {
            directLine
              .postActivity({
                localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                locale,
                name: 'startConversation',
                type: 'event'
              })
              .subscribe();
            subscription.unsubscribe();
          }
        }
      });

      window.WebChat.renderWebChat({
        directLine,
        locale,
        styleOptions,
        store
      }, document.getElementById('webchat'));

      setTimeout(() => {
        setupScrollingObserver();
        setupBotMessageListener();
      }, 1000);
    } catch (error) {
      console.error('Failed to initialize WebChat:', error);
      document.getElementById('webchat').innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Unable to connect to chat service. Please try again later.</div>';
    }
  })();
}

function setupScrollingObserver() {
  const webchatElement = document.getElementById('webchat');
  if (!webchatElement) return;

  if (window.chatObserver) {
    window.chatObserver.disconnect();
  }

  window.chatObserver = new MutationObserver((mutations) => {
    if (!pendingScroll) return;

    const hasNewActivity = mutations.some(mutation =>
      mutation.type === 'childList' &&
      mutation.addedNodes.length > 0 &&
      Array.from(mutation.addedNodes).some(node =>
        node.nodeType === 1 && (
          node.hasAttribute?.('data-testid') ||
          node.className?.includes?.('webchat') ||
          node.tagName === 'DIV'
        )
      )
    );

    if (hasNewActivity) {
      clearTimeout(window.scrollTimeout);
      window.scrollTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          performOptimizedScroll();
          pendingScroll = false;
        });
      }, 200);
    }
  });

  window.chatObserver.observe(webchatElement, {
    childList: true,
    subtree: true
  });
}

function performOptimizedScroll() {
  const webchatElement = document.getElementById('webchat');
  if (!webchatElement) return;

  const transcriptElement = webchatElement.querySelector('[role="log"]') ||
                           webchatElement.querySelector('.webchat__transcript') ||
                           webchatElement.querySelector('[data-testid="transcript"]');
   
  if (!transcriptElement) return;

  const activities = transcriptElement.children;
  if (activities.length < 2) return;

  const userQuestion = activities[activities.length - 2];
  if (!userQuestion) return;

  const scrollPosition = userQuestion.offsetTop - 10;
   
  transcriptElement.scrollTop = scrollPosition;
}

// Speech Recognition Functions
function initializeWebSpeechAPI() {
  // Use Web Speech API if available (works without Azure credentials)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('Web Speech API not available in this browser');
    micToggle.style.display = 'none';
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    micToggle.classList.add('active');
    speechDisplay.style.display = 'flex';
    speechText.textContent = 'Listening...';
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    // Update display with interim results
    const displayText = finalTranscript || interimTranscript || 'Listening...';
    speechText.textContent = displayText;

    // If final result, send to chat
    if (finalTranscript) {
      sendSpeechToChat(finalTranscript.trim());
    }
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    speechText.textContent = 'Error: ' + event.error;
    setTimeout(() => {
      stopSpeechRecognition();
    }, 2000);
  };

  recognition.onend = () => {
    isListening = false;
    micToggle.classList.remove('active');
    setTimeout(() => {
      speechDisplay.style.display = 'none';
    }, 1000);
  };

  return recognition;
}

function startSpeechRecognition() {
  if (!recognizer) {
    recognizer = initializeWebSpeechAPI();
  }

  if (recognizer && !isListening) {
    try {
      recognizer.start();
      showChat();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }
}

function stopSpeechRecognition() {
  if (recognizer && isListening) {
    try {
      recognizer.stop();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }
}

function sendSpeechToChat(text) {
  // Use DirectLine API to send message directly to the bot
  if (window.chatDirectLine && text.trim()) {
    window.chatDirectLine.postActivity({
      type: 'message',
      text: text.trim(),
      from: { id: 'user', name: 'User' }
    }).subscribe(
      (id) => {
        console.log('Message sent successfully with ID:', id);
        stopSpeechRecognition();
      },
      (error) => {
        console.error('Error sending message via DirectLine:', error);
        stopSpeechRecognition();
      }
    );
  } else {
    console.warn('DirectLine not available or empty text');
    stopSpeechRecognition();
  }
}

// Azure Text-to-Speech Functions
async function synthesizeSpeech(text) {
  if (!ttsEnabled || isPlayingAudio || !text.trim()) {
    return;
  }

  // Check if API key is configured
  if (!AZURE_CONFIG.key) {
    console.warn('Azure Speech API key not configured. Please set AZURE_SPEECH_KEY.');
    ttsDisplay.style.display = 'flex';
    ttsText.textContent = 'Speech service not configured';
    setTimeout(() => {
      ttsDisplay.style.display = 'none';
    }, 3000);
    return;
  }

  try {
    isPlayingAudio = true;
    ttsDisplay.style.display = 'flex';
    ttsText.textContent = 'Generating speech...';

    const url = `https://${AZURE_CONFIG.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    
    const ssml = `<speak version='1.0' xml:lang='en-US'>
      <voice name='en-US-AriaNeural'>
        <prosody rate='1.0' pitch='0%'>
          ${escapeXml(text)}
        </prosody>
      </voice>
    </speak>`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_CONFIG.key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3'
      },
      body: ssml
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure TTS API error:', response.status, errorText);
      throw new Error(`Azure TTS error: ${response.status} - ${response.statusText}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    playAudio(audioUrl, text);
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    ttsText.textContent = 'Error: ' + (error.message || 'Speech generation failed');
    setTimeout(() => {
      ttsDisplay.style.display = 'none';
      isPlayingAudio = false;
    }, 3000);
  }
}

function playAudio(audioUrl, text) {
  const audio = new Audio(audioUrl);
  
  ttsText.textContent = 'Playing: ' + text.substring(0, 50) + (text.length > 50 ? '...' : '');

  audio.addEventListener('ended', () => {
    stopAudio();
  });

  audio.addEventListener('error', (error) => {
    console.error('Audio playback error:', error);
    stopAudio();
  });

  audio.play().catch((error) => {
    console.error('Error playing audio:', error);
    stopAudio();
  });

  window.currentAudio = audio;
}

function stopAudio() {
  if (window.currentAudio) {
    window.currentAudio.pause();
    window.currentAudio = null;
  }
  ttsDisplay.style.display = 'none';
  isPlayingAudio = false;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// Monitor incoming bot messages and speak them
function setupBotMessageListener() {
  if (window.chatDirectLine) {
    window.chatDirectLine.activity$.subscribe((activity) => {
      if (activity.type === 'message' && activity.from.role === 'bot' && ttsEnabled) {
        if (activity.text) {
          synthesizeSpeech(activity.text);
        }
      }
    });
  }
}