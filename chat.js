import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc as docRef,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const chatListContainer = document.getElementById("chatList");

function renderChatList(chats) {
  chatListContainer.innerHTML = "";
  chats.forEach(async (doc) => {
    const chat = doc.data();
    const otherUserId = chat.participants.find(uid => uid !== auth.currentUser.uid);
    
    // Fetch user info from Firestore
    let userName = "名無し";
    let userIcon = "icon.png";
    try {
      const userDoc = await getDoc(docRef(db, "users", otherUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userName = userData.name || userName;
        userIcon = userData.iconURL || userIcon;
      }
    } catch (error) {
      console.error("ユーザー情報の取得に失敗:", error);
    }

    const chatItem = document.createElement("div");
    chatItem.className = "chat-item";
    chatItem.innerHTML = `
      <div class="chat-left">
        <img src="${userIcon}" class="chat-icon" />
      </div>
      <div class="chat-center">
        <div class="chat-name">${userName}</div>
        <div class="chat-message">${chat.lastMessage || ""}</div>
      </div>
      <div class="chat-right">
        ${chat.unread ? '<div class="unread-mark"></div>' : ""}
      </div>
    `;
    chatItem.addEventListener("click", () => {
      window.location.href = `message.html?chatId=${doc.id}`;
    });
    chatListContainer.appendChild(chatItem);
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    const q = query(
      collection(db, "privateChats"),
      where("participants", "array-contains", user.uid)
    );
    onSnapshot(q, (snapshot) => {
      renderChatList(snapshot.docs);
    });
  }
});
