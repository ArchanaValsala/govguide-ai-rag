const WEBHOOK_URL = "/api/webhook/govguide-question";
const conversationHistory = [];

const chatForm = document.getElementById("chatForm");
const questionInput = document.getElementById("questionInput");
const characterCount = document.getElementById("characterCount");
const sendButton = document.getElementById("sendButton");
const chatMessages = document.getElementById("chatMessages");
const composerLabel = document.getElementById("composerLabel");
const composerHelp = document.getElementById("composerHelp");

questionInput.addEventListener("input", () => {
  characterCount.textContent =
    `${questionInput.value.length} / 1000`;
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = questionInput.value.trim();

  if (question.length < 5) {
    addMessage(
      "assistant",
      "Please enter a question with at least 5 characters."
    );
    return;
  }

  addMessage("user", question);
  
  conversationHistory.push({
  role: "user",
  content: question
  });
  
  questionInput.value = "";
  characterCount.textContent = "0 / 1000";

  setLoadingState(true);

  const loadingMessage = addLoadingMessage();

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question,
        history: conversationHistory
      })
    });

    const data = await response.json();

    loadingMessage.remove();

    if (!response.ok) {
      const errorMessage =
        data.error ||
        "Something went wrong while processing your question.";

      addMessage("assistant", errorMessage);
      return;
    }

    addAssistantResponse(data);
    
    composerLabel.textContent = "Ask a follow-up";

    composerHelp.textContent = "Continue the conversation or ask a new question.";

    questionInput.placeholder = "For example: What if I cannot pay it all at once?";

    conversationHistory.push({
     role: "assistant",
     content: data.answer
    });

    if (conversationHistory.length > 6) {
     conversationHistory.splice(
     0,
     conversationHistory.length - 6
    );
  }
  } catch (error) {
    loadingMessage.remove();

    addMessage(
      "assistant",
      "I could not connect to the answer service. Make sure n8n and Ollama are running."
    );

    console.error("GovGuide request failed:", error);
  } finally {
    setLoadingState(false);
    questionInput.focus();
  }
});

function addMessage(role, text) {
  const article = document.createElement("article");

  article.className =
    role === "user"
      ? "message user-message"
      : "message assistant-message";

  const content = document.createElement("div");
  content.className = "message-content";

  const label = document.createElement("p");
  label.className = "message-label";
  label.textContent =
    role === "user" ? "You" : "GovGuide AI";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  bubble.appendChild(paragraph);
  content.appendChild(label);
  content.appendChild(bubble);
  article.appendChild(content);
  chatMessages.appendChild(article);

  scrollToLatestMessage();

  return article;
}

function addAssistantResponse(data) {
  const article = document.createElement("article");
  article.className = "message assistant-message";

  const content = document.createElement("div");
  content.className = "message-content";

  const label = document.createElement("p");
  label.className = "message-label";
  label.textContent = "GovGuide AI";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  const answer = document.createElement("p");
  answer.textContent =
    data.answer || "No answer was returned.";

  bubble.appendChild(answer);

  if (Array.isArray(data.sources) && data.sources.length > 0) {
    const sourcesTitle = document.createElement("p");
    sourcesTitle.className = "sources-title";
    sourcesTitle.textContent = "Official sources";

    const sourcesList = document.createElement("ul");
    sourcesList.className = "sources-list";

    data.sources.forEach((source) => {
      const listItem = document.createElement("li");

      const link = document.createElement("a");
      link.href = source.source_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent =
        source.source_title ||
        source.source_id ||
        "Official source";

      listItem.appendChild(link);
      sourcesList.appendChild(listItem);
    });

    bubble.appendChild(sourcesTitle);
    bubble.appendChild(sourcesList);
  }

  content.appendChild(label);
  content.appendChild(bubble);
  article.appendChild(content);
  chatMessages.appendChild(article);

  scrollToLatestMessage();
}

function addLoadingMessage() {
  const article = document.createElement("article");
  article.className = "message assistant-message";

  const content = document.createElement("div");
  content.className = "message-content";

  const label = document.createElement("p");
  label.className = "message-label";
  label.textContent = "GovGuide AI";

  const bubble = document.createElement("div");
  bubble.className = "message-bubble loading-bubble";
  bubble.textContent = "Searching official sources...";

  content.appendChild(label);
  content.appendChild(bubble);
  article.appendChild(content);
  chatMessages.appendChild(article);

  scrollToLatestMessage();

  return article;
}

function setLoadingState(isLoading) {
  sendButton.disabled = isLoading;
  questionInput.disabled = isLoading;

  sendButton.querySelector("span").textContent =
    isLoading ? "Working..." : "Send question";
}

function scrollToLatestMessage() {
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: "smooth"
  });
}
