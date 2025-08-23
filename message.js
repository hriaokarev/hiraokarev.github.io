document.addEventListener("DOMContentLoaded", function () {
  const messageContainer = document.getElementById("messageContainer");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendMessage");

  sendButton.addEventListener("click", () => {
    const text = messageInput.value.trim();
    if (text !== "") {
      const message = {
        content: text,
        timestamp: new Date().toISOString(),
        sender: "me"
      };
      addMessageBubble(message);
      messageInput.value = "";
    }
  });

  function addMessageBubble(message) {
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble " + (message.sender === "me" ? "me" : "other");
    bubble.textContent = message.content;
    messageContainer.appendChild(bubble);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }
});