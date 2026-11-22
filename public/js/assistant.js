
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatMessages = document.getElementById("chatMessages");
const subjectSelect = document.getElementById("subject");
const sendButton = document.getElementById("sendButton");
const clearButton = document.getElementById("clearChat");

let conversationHistory = [];
let isWaiting = false;

// Display a message in the chat window

function displayMessage(sender, message) {
    const messageDiv = document.createElement("div");

    messageDiv.className =
        sender === "user"
            ? "message user-message"
            : "message ai-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = sender === "user" ? "You" : "✦";

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("strong");
    name.textContent = sender === "user" ? "You" : "StudyMate AI";

    const text = document.createElement("div");
    text.className = "formatted-response";

    if (sender === "ai" && window.marked && window.DOMPurify) {
        const rawHTML = window.marked.parse(message);
        text.innerHTML = window.DOMPurify.sanitize(rawHTML);
    } else {
        text.textContent = message;
    }

    content.appendChild(name);
    content.appendChild(text);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

// Show loading message
function showLoading() {
    const loadingDiv = displayMessage(
        "ai",
        "Thinking... Please wait."
    );

    return loadingDiv;
}

// Send a question to the backend
async function sendMessage(message) {
    if (isWaiting) return;

    isWaiting = true;
    sendButton.disabled = true;
    sendButton.textContent = "Thinking...";

    displayMessage("user", message);

    const loadingMessage = showLoading();

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                subject: subjectSelect.value,
                history: conversationHistory
            })
        });

        const data = await response.json();

        loadingMessage.remove();

        if (!response.ok) {
            throw new Error(data.error || "Unable to get a response.");
        }

        displayMessage("ai", data.reply);

        // Save conversation context for follow-up questions
        conversationHistory.push(
            { role: "user", text: message },
            { role: "model", text: data.reply }
        );

        // Keep the latest 10 messages
        conversationHistory = conversationHistory.slice(-10);

    } catch (error) {
        loadingMessage.remove();

        displayMessage(
            "ai",
            "Sorry, something went wrong: " + error.message +
            "\n\nPlease check whether the backend server is running."
        );

        console.error("Chat error:", error);

    } finally {
        isWaiting = false;
        sendButton.disabled = false;
        sendButton.textContent = "Send ➤";
        userInput.focus();
    }
}

// Handle form submission
chatForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const message = userInput.value.trim();

    if (!message || isWaiting) return;

    userInput.value = "";
    sendMessage(message);
});

// Handle suggested prompts
document.querySelectorAll(".prompt-button").forEach(button => {
    button.addEventListener("click", function() {
        const prompt = this.dataset.prompt;

        if (prompt && !isWaiting) {
            sendMessage(prompt);
        }
    });
});

// Clear conversation
clearButton.addEventListener("click", function() {
    if (isWaiting) return;

    conversationHistory = [];

    chatMessages.innerHTML = `
        <div class="message ai-message">
            <div class="message-avatar">✦</div>
            <div class="message-content">
                <strong>StudyMate AI</strong>
                <p>Hello! Welcome back to your AI Study Assistant. 👋</p>
                <p>What would you like to learn today?</p>
            </div>
        </div>
    `;
});

console.log("StudyMate AI chat functionality loaded.");
