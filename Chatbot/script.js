document.addEventListener("DOMContentLoaded", function () {
  const apiBtn = document.getElementById("api-btn");
  const chatContainer = document.getElementById("chat-box");
  const messageInput = document.getElementById("type-box");
  const sendButton = document.getElementById("btn");
  const chatHistory = document.getElementById("chatHistory");
  const newChatButton = document.getElementById("new-chat-btn");
  const apiKeyInput = document.getElementById("api-key-input");
  const modelSelect = document.getElementById("model-select");

  let currentChatId = null;
  let isWaitingForResponse = false;

  loadApiKey();
  loadChatHistory();
  createNewChat();

  messageInput.addEventListener("keydown", handleKeyDown);

  apiBtn.addEventListener("click", saveApiKey);

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
  sendButton.addEventListener("click", sendMessage);
  newChatButton.addEventListener("click", createNewChat);
  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isWaitingForResponse) return;

    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;
    if (!apiKey) {
      alert("Enter API Key first");
      return;
    }

    addMessageToChat("user", message);
    messageInput.value = "";
    isWaitingForResponse = true;
    sendButton.disabled = true;

    try {
      const response = await fetchOpenRouterResponse(apiKey, model, message);
      addMessageToChat("bot", response);
      saveCurrentChat();
    } catch (error) {
      addMessageToChat("bot", `Error: ${error.message}`);
    } finally {
      isWaitingForResponse = false;
      sendButton.disabled = false;
    }
  }

  async function fetchOpenRouterResponse(apiKey, model, message) {
    const messages = getCurrentMessages();
    messages.push({ role: "user", content: message });

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.href,
          "X-Title": "Open Router Chat App",
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to fetch response");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  function addMessageToChat(role, content) {
    if (!currentChatId) createNewChat();

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${role}-message`;

    const contentDiv = document.createElement("div");
    contentDiv.textContent = content;

    const metaDiv = document.createElement("div");
    metaDiv.className = "message-meta";
    metaDiv.textContent = `${
      role === "user" ? "You" : "AI"
    } • ${new Date().toLocaleTimeString()}`;

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(metaDiv);

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    saveMessageToCurrentChat(role, content);
  }

  function createNewChat() {
    currentChatId = Date.now().toString();
    chatContainer.innerHTML = "";
    addChatToHistory(currentChatId, `New Chat ${new Date().toLocaleString()}`);
    saveCurrentChat();
  }

  function loadChat(chatId) {
    currentChatId = chatId;

    document.querySelectorAll(".chat-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.chatId === chatId);
    });

    chatContainer.innerHTML = "";

    getChatMessages(chatId).then((messages) => {
      messages.forEach((msg) => {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${msg.role}-message`;

        const contentDiv = document.createElement("div");
        contentDiv.textContent = msg.content;

        const metaDiv = document.createElement("div");
        metaDiv.className = "message-meta";
        metaDiv.textContent = `${
          msg.role === "user" ? "You" : "AI"
        } • ${new Date(msg.timestamp).toLocaleTimeString()}`;

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(metaDiv);

        chatContainer.appendChild(messageDiv);
      });

      chatContainer.scrollTop = chatContainer.scrollHeight;
    });
  }

  function getCurrentMessages() {
    const messages = [];
    document.querySelectorAll(".message").forEach((msg) => {
      const role = msg.classList.contains("user-message")
        ? "user"
        : "assistant";
      const content = msg.querySelector("div:first-child").textContent;
      messages.push({ role, content });
    });
    return messages;
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("OpenRouterChatDB", 1);

      request.onerror = (event) =>
        reject("Database error: " + event.target.errorCode);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("chats")) {
          const chatsStore = db.createObjectStore("chats", { keyPath: "id" });
          chatsStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        if (!db.objectStoreNames.contains("messages")) {
          const messagesStore = db.createObjectStore("messages", {
            keyPath: "id",
            autoIncrement: true,
          });
          messagesStore.createIndex("chatId", "chatId", { unique: false });
          messagesStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }
      };

      request.onsuccess = (event) => resolve(event.target.result);
    });
  }

  function saveCurrentChat() {
    const title =
      document.querySelector(`.chat-item[data-chat-id="${currentChatId}"]`)
        ?.textContent || `Chat ${new Date().toLocaleString()}`;

    openDatabase().then((db) => {
      const transaction = db.transaction(["chats"], "readwrite");
      const store = transaction.objectStore("chats");

      store.put({
        id: currentChatId,
        title: title,
        model: modelSelect.value,
        timestamp: Date.now(),
      });
    });
  }

  function saveMessageToCurrentChat(role, content) {
    if (!currentChatId) return;

    openDatabase().then((db) => {
      const transaction = db.transaction(["messages"], "readwrite");
      const store = transaction.objectStore("messages");

      store.add({
        chatId: currentChatId,
        role: role,
        content: content,
        timestamp: Date.now(),
      });
    });
  }

  function getChatMessages(chatId) {
    return new Promise((resolve) => {
      openDatabase()
        .then((db) => {
          const transaction = db.transaction(["messages"], "readonly");
          const store = transaction.objectStore("messages");
          const index = store.index("chatId");
          const request = index.getAll(chatId);

          request.onsuccess = () =>
            resolve(request.result.sort((a, b) => a.timestamp - b.timestamp));
          request.onerror = () => resolve([]);
        })
        .catch(() => resolve([]));
    });
  }

  function addChatToHistory(chatId, title) {
    const existingItem = document.querySelector(
      `.chat-item[data-chat-id="${chatId}"]`
    );
    if (existingItem) {
      existingItem.textContent = title;
      return;
    }

    const chatItem = document.createElement("div");
    chatItem.className = "chat-item";
    chatItem.dataset.chatId = chatId;
    chatItem.textContent = title;

    chatItem.addEventListener("click", () => loadChat(chatId));
    chatHistory.insertBefore(chatItem, chatHistory.firstChild);
  }

  function loadChatHistory() {
    openDatabase()
      .then((db) => {
        const transaction = db.transaction(["chats"], "readonly");
        const store = transaction.objectStore("chats");
        const index = store.index("timestamp");
        const request = index.getAll();

        request.onsuccess = () => {
          chatHistory.innerHTML = "";
          request.result.reverse().forEach((chat) => {
            addChatToHistory(chat.id, chat.title);
          });

          if (request.result.length > 0 && !currentChatId) {
            loadChat(request.result[request.result.length - 1].id);
          }
        };
      })
      .catch(console.error);
  }

  function saveApiKey() {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem("openRouterApiKey", key);
      alert("API key saved locally");
    }
  }

  function loadApiKey() {
    const savedKey = localStorage.getItem("openRouterApiKey");
    if (savedKey) {
      apiKeyInput.value = savedKey;
    }
  }
});
