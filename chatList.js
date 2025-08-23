
// chatList.js
document.addEventListener("DOMContentLoaded", () => {
  const chatListContainer = document.getElementById("chat-list");

  function renderChatList(chats) {
    chatListContainer.innerHTML = "";
    chats.forEach(chat => {
      const chatItem = document.createElement("div");
      chatItem.className = "chat-item";
      chatItem.innerHTML = `
        <img src="${chat.photoURL || 'img/noimage.png'}" class="chat-icon" />
        <div class="chat-info">
          <div class="chat-name">${chat.name}</div>
          <div class="chat-message">${chat.lastMessage}</div>
        </div>
        ${chat.unread ? '<div class="unread-mark"></div>' : ''}
      `;
      chatItem.addEventListener("click", () => {
        window.location.href = `message.html?chatId=${chat.id}`;
      });
      chatListContainer.appendChild(chatItem);
    });
  }

  // 仮データ（Firestore連携で置き換え）
  const sampleChats = [
    { id: 1, name: "まゆ", lastMessage: "こんにちは", unread: true, photoURL: "img/noimage.png" },
    { id: 2, name: "たかし", lastMessage: "よろしく", unread: false, photoURL: "img/noimage.png" }
  ];

  renderChatList(sampleChats);
});
