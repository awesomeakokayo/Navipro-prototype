// runtime state
let currentUserId = null;
let messageContainer = null;
let chatTextarea = null;
let sendBtn = null;

function getAuthHeaders(additional = {}) {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    null;

  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_id") || null;

  const headers = {
    "Content-Type": "application/json",
    ...additional,
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (userId) headers["X-User-ID"] = userId;

  return headers;
}

// sanitize text to avoid XSS
function sanitizeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// DOM initialization
function initializeElements() {
  messageContainer = document.querySelector(".direct-message");
  chatTextarea = document.querySelector(".auto-expand");
  sendBtn =
    document.querySelector(".send-btn") || document.querySelector("#sendBtn");

  console.log("Message container found:", !!messageContainer);
  console.log("Chat textarea found:", !!chatTextarea);
  console.log("Send button found:", !!sendBtn);

  if (chatTextarea) {
    function autoExpand() {
      chatTextarea.style.height = "auto";
      chatTextarea.style.height = chatTextarea.scrollHeight + "px";
      const container = document.querySelector(".container");
      if (container) {
        container.style.marginBottom = chatTextarea.offsetHeight + 70 + "px";
      }
    }
    chatTextarea.addEventListener("input", autoExpand);
    chatTextarea.addEventListener("change", autoExpand);
    chatTextarea.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });
    autoExpand();
  }

  // Attach click listener to send button if present
  if (sendBtn) {
    sendBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sendMessage();
    });
  }
}

// session initialization
function initializeUserSession() {
  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_id");
  if (!userId) {
    console.log("No user session found, redirecting to onboarding...");
    window.location.href = "../onboarding/index.html";
    return false;
  }
  currentUserId = userId;
  console.log("User session initialized:", currentUserId);
  return true;
}

// UI helpers
function addUserMessage(message) {
  if (!messageContainer) return;
  const sanitizedMessage = sanitizeHTML(message);
  messageContainer.innerHTML += `
    <div class="chat-container user">
      <div class="user-chat">
        <div class="user-name">You</div>
        <div class="chat-message">${sanitizedMessage}</div>
      </div>
    </div>
  `;
  scrollToBottom();
}

function addAIMessage(message, timestamp = null) {
  if (!messageContainer) return;
  const sanitizedMessage = sanitizeHTML(message);
  const timestampStr = timestamp
    ? `<small class="timestamp">${new Date(
        timestamp
      ).toLocaleTimeString()}</small>`
    : "";
  messageContainer.innerHTML += `
    <div class="chat-container ai">
      <div><img src="Images/Naviprologo_only.png" alt="logo"></div>
      <div class="ai-chat">
        <div class="ai-name">Navi</div>
        <div class="chat-message">${sanitizedMessage}${timestampStr}</div>
      </div>
    </div>
  `;
  scrollToBottom();
}

function addTypingIndicator() {
  if (!messageContainer) return;
  removeTypingIndicator();
  const typingHTML = `
    <div class="chat-container" id="typingIndicator">
      <div><img src="Images/Naviprologo_only.png" alt="logo"></div>
      <div class="ai-chat">
        <div class="ai-name">Navi</div>
        <div class="typing-animation"><span class="typing-dot">Navi is Typing...</span></div>
      </div>
    </div>
  `;
  messageContainer.innerHTML += typingHTML;
  scrollToBottom();
}

function removeTypingIndicator() {
  const existing = document.getElementById("typingIndicator");
  if (existing) existing.remove();
}

function scrollToBottom() {
  if (!messageContainer) return;
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

// network call to backend chat endpoint
async function sendChatMessage(message) {
  if (!currentUserId) {
    console.error("No user ID available");
    return null;
  }
  if (!message || !message.trim()) return null;

  const headers = getAuthHeaders();
  try {
    const resp = await fetch("https://navipro-backend.onrender.com/api/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: currentUserId,
        message: message,
       }),
    });

    if (resp.status === 401) {
      console.warn("Chat API returned 401 — redirecting to login");
      window.location.href = "../login/index.html";
      return null;
    }

    if (!resp.ok) {
      const txt = await resp.text().catch(() => "");
      console.error("Chat API error:", resp.status, txt);
      return null;
    }

    const data = await resp.json();
    return data;
  } catch (err) {
    console.error("sendChatMessage network error:", err);
    return null;
  }
}

async function sendMessage() {
  if (!chatTextarea) {
    console.error("Textarea not found!");
    return;
  }
  let msg = chatTextarea.value || "";
  msg = msg.trim();
  if (!msg) return;

  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.dataset.origText = sendBtn.textContent;
    sendBtn.textContent = "Sending...";
  }
  chatTextarea.disabled = true;

  addUserMessage(msg);
  chatTextarea.value = "";
  chatTextarea.style.height = "auto";
  addTypingIndicator();

  try {
    const response = await sendChatMessage(msg);
    removeTypingIndicator();

    if (response) {
      const messageText =
        response.response || response.message || response.answer || "";
      const timestamp = response.timestamp || new Date().toISOString();
      if (messageText) addAIMessage(messageText, timestamp);
      else
        addAIMessage(
          "I'm having trouble responding right now. Please try again."
        );
    } else {
      addAIMessage(
        "I'm having trouble responding right now. Please try again."
      );
    }
  } catch (err) {
    console.error("Error in sendMessage:", err);
    removeTypingIndicator();
    addAIMessage("Sorry, there was an error processing your message.");
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = sendBtn.dataset.origText || "Send";
    }
    if (chatTextarea) chatTextarea.disabled = false;
    scrollToBottom();
  }
}

// expose globally for old HTML onclick handlers
window.sendMessage = sendMessage;

// initialize app
function initializeApp() {
  console.log("Initializing chat app...");
  initializeElements();
  const ok = initializeUserSession();
  if (!ok) return;
  addAIMessage(
    "Hello! I'm here to help you with your learning journey. What would you like to know?"
  );
  // focus textarea
  if (chatTextarea) chatTextarea.focus();
}

// DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
