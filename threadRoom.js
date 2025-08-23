
document.addEventListener("DOMContentLoaded", function () {
  const threadTitle = localStorage.getItem("currentThreadTitle") || "スレッド";
  document.getElementById("thread-room-title").textContent = threadTitle;

  const messageInput = document.getElementById("thread-message-input");
  const sendButton = document.getElementById("thread-send-button");
  const messagesContainer = document.getElementById("thread-messages");

  function renderMessage(message, isCurrentUser) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message-bubble", isCurrentUser ? "right" : "left");

    const content = document.createElement("div");
    content.classList.add("message-content");
    content.textContent = message;
    messageElement.appendChild(content);

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  sendButton.addEventListener("click", function () {
    const message = messageInput.value.trim();
    if (message) {
      renderMessage(message, true);
      messageInput.value = "";
    }
  });
});
