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

// Current state
let currentScenario = null;
let pendingScroll = false;
let isUserTurn = false;

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

// Show chat function
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