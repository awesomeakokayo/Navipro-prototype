let currentUserId = null;
let messageContainer = null;
let chatTextarea = null;

/**
 * Initialize DOM elements after page loads
 */
function initializeElements() {
  messageContainer = document.querySelector(".direct-message");
  chatTextarea = document.querySelector(".auto-expand");

  console.log("Message container found:", messageContainer);
  console.log("Chat textarea found:", chatTextarea);

  if (!messageContainer) {
    console.error("Could not find .direct-message container");
  }

  if (!chatTextarea) {
    console.error("Could not find .auto-expand textarea");
  }

  if (chatTextarea) {
    // Auto-expand function
    function autoExpand() {
      // Reset height to auto first to shrink if needed
      chatTextarea.style.height = "auto";
      // Set new height based on scrollHeight
      chatTextarea.style.height = chatTextarea.scrollHeight + "px";

      // Adjust container padding if textarea is getting too tall
      const container = document.querySelector(".container");
      if (container) {
        const textareaHeight = chatTextarea.offsetHeight;
        container.style.marginBottom = textareaHeight + 70 + "px";
      }
    }

    // Add event listeners for content changes
    chatTextarea.addEventListener("input", autoExpand);
    chatTextarea.addEventListener("change", autoExpand);

    // Handle Enter key (with Shift for new line)
    chatTextarea.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    // Initial expansion
    autoExpand();
  }
}

// Initialize user session
function initializeUserSession() {
  // For demo purposes, set a mock user ID
  currentUserId = "demo-user-123";
  localStorage.setItem("userId", currentUserId);
  localStorage.setItem(
    "roadmapData",
    JSON.stringify({ goal: "Learn web development" })
  );

  console.log("User session initialized:", currentUserId);
  return true;
}

// Sanitize HTML to prevent XSS
function sanitizeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function sendChatMessage(message) {
  if (!currentUserId) {
    console.error("No user ID available");
    return null;
  }

  if (!message.trim()) {
    return null;
  }

  try {
     const response = await fetch(
          `https://naviprobackend.onrender.com/api/chat/${currentUserId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: message,
              user_id: currentUserId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error sending chat message:", error);
        return null;
      }
    }

/**
 * Add a new user message to the chat
 */
function addUserMessage(message) {
  if (!messageContainer) {
    console.error("Message container not available");
    return;
  }

  const sanitizedMessage = sanitizeHTML(message);
  const userMessageHTML = `
                <div class="chat-container user">
                    <div class="user-chat">
                        <div class="user-name">You</div>
                        <div>${sanitizedMessage}</div>
                    </div>
                </div>
            `;
  messageContainer.innerHTML += userMessageHTML;
}

/**
 * Add a new AI message to the chat
 */
function addAIMessage(message, timestamp = null) {
  if (!messageContainer) {
    console.error("Message container not available");
    return;
  }

  const sanitizedMessage = sanitizeHTML(message);
  const timestampStr = timestamp
    ? `<small class="timestamp">${new Date(
        timestamp
      ).toLocaleTimeString()}</small>`
    : "";
  const aiMessageHTML = `
                <div class="chat-container">
                    <div><img src="Images/Naviprologo_only.png" alt="logo"></div>
                    <div class="ai-chat">
                        <div class="ai-name">Navi</div>
                        <div>${sanitizedMessage}${timestampStr}</div>
                    </div>
                </div>
            `;
  messageContainer.innerHTML += aiMessageHTML;
}

/**
 * Add typing indicator
 */
function addTypingIndicator() {
  if (!messageContainer) return;

  const typingHTML = `
                <div class="chat-container" id="typingIndicator">
                    <div><img src="Images/Naviprologo_only.png" alt="logo"></div>
                    <div class="ai-chat">
                        <div class="ai-name">Navi</div>
                        <div>Navi is typing...</div>
                    </div>
                </div>
            `;
  messageContainer.innerHTML += typingHTML;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
  if (messageContainer) {
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }
}

/**
 * Handle sending a chat message
 */
async function sendMessage() {
  console.log("sendMessage function called!");

  if (!chatTextarea) {
    console.error("Textarea not found!");
    return;
  }

  const message = chatTextarea.value.trim();
  console.log("Message to send:", message);

  if (!message) {
    console.log("Empty message, returning");
    return;
  }

  // Add user message to chat
  addUserMessage(message);

  // Clear input and reset height
  chatTextarea.value = "";
  chatTextarea.style.height = "auto";
  document.querySelector(".container").style.marginBottom = "120px";

  // Show typing indicator
  addTypingIndicator();

  // Scroll to bottom
  scrollToBottom();

  try {
    // Get AI response
    const response = await sendChatMessage(message);

    // Remove typing indicator
    removeTypingIndicator();

    if (response && response.response) {
      // Add AI message to chat
      addAIMessage(response.response, response.timestamp);
    } else {
      // Handle error case
      addAIMessage(
        "I'm having trouble responding right now. Please try again."
      );
    }

    // Scroll to bottom after new message
    scrollToBottom();
  } catch (error) {
    console.error("Error getting AI response:", error);
    removeTypingIndicator();
    addAIMessage("Sorry, there was an error processing your message.");
    scrollToBottom();
  }
}

/**
 * Initialize chat functionality
 */
function initializeApp() {
  console.log("Initializing app...");

  // Initialize elements first
  initializeElements();

  // Check for user session
  if (initializeUserSession()) {
    console.log("Chat initialized for user:", currentUserId);
  }
}

// Initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  // DOM already loaded
  initializeApp();
}

// Make sendMessage globally accessible for onclick handler
window.sendMessage = sendMessage;

console.log("Script setup complete");
