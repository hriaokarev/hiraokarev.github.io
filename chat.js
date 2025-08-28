import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc as docRef,
  orderBy,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const chatListContainer = document.getElementById("chatList");

function renderChatList(chats) {
  if (!chatListContainer) return;
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
    chatItem.className = "dm-item";
    chatItem.innerHTML = `
      <div class="dm-avatar">${userName[0] || "U"}</div>
      <div class="dm-content">
        <div class="dm-name">${userName}</div>
        <div class="dm-last-message" id="lastMessage-${doc.id}">読み込み中...</div>
      </div>
      <div class="dm-meta">
        <div class="dm-time">${chat.updatedAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ""}</div>
        ${chat.unread ? '<div class="unread-badge">●</div>' : ""}
      </div>
    `;
    // 最新メッセージ取得
    try {
      const messagesRef = collection(docRef(db, "privateChats", doc.id), "messages");
      const latestQuery = query(messagesRef, orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(latestQuery, (snap) => {
        if (!snap.empty) {
          const latest = snap.docs[0].data();
          const lastMsgEl = document.getElementById(`lastMessage-${doc.id}`);
          if (lastMsgEl) lastMsgEl.textContent = latest.content || "（メッセージなし）";
        }
      });
    } catch (err) {
      console.error("最新メッセージ取得失敗:", err);
    }
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
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );
    onSnapshot(q, (snapshot) => {
      renderChatList(snapshot.docs);
    });
  }
});
// フッターのナビゲーションバークリック遷移
document.querySelectorAll(".footer-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    const target = e.currentTarget.dataset.target;
    if (target) {
      window.location.href = target;
    }
  });
});