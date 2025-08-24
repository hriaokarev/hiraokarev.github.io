import {
  db,
  auth,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  onAuthStateChanged
} from "./firebase.js";
import { serverTimestamp as firestoreServerTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const messageContainer = document.getElementById("messageContainer");
const messageInput = document.getElementById("messageInput");

const urlParams = new URLSearchParams(window.location.search);
const chatId = urlParams.get("chatId");
if (!chatId) {
  console.error("チャットIDがURLに含まれていません");
  throw new Error("chatId missing");
}

function addMessageBubble(message, isMe) {
  const messageWrapper = document.createElement("div");
  messageWrapper.classList.add("message-wrapper", isMe ? "right" : "left");

  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble");

  const author = document.createElement("div");
  author.classList.add("message-author");
  if (message.authorName) {
    author.textContent = message.authorName;
  } else if (message.userId) {
    const userDocRef = doc(db, "users", message.userId);
    getDoc(userDocRef).then((docSnap) => {
      author.textContent = docSnap.exists() ? docSnap.data().name || "名無し" : "名無し";
    }).catch(() => {
      author.textContent = "名無し";
    });
  } else {
    author.textContent = "名無し";
  }

  const content = document.createElement("div");
  content.classList.add("message-content");
  content.textContent = message.content;

  const meta = document.createElement("div");
  meta.classList.add("message-meta");
  const createdAt = message.createdAt?.toDate?.() || new Date();
  meta.textContent = createdAt.toLocaleString();

  bubble.appendChild(author);
  bubble.appendChild(content);
  bubble.appendChild(meta);
  messageWrapper.appendChild(bubble);
  messageContainer.appendChild(messageWrapper);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

async function sendMessage() {
  const text = messageInput.value.trim();
  if (text === "") return;

  if (!auth.currentUser) {
    console.error("ユーザーが認証されていません");
    return;
  }

  const message = {
    content: text,
    userId: auth.currentUser.uid,
    createdAt: firestoreServerTimestamp()
  };

  try {
    await addDoc(collection(db, "privateChats", chatId, "messages"), message);
    messageInput.value = "";
  } catch (error) {
    console.error("メッセージ送信エラー:", error);
  }
}

document.getElementById("sendBtn").addEventListener("click", sendMessage);

async function displayMessages() {
  if (!auth.currentUser) {
    console.error("ユーザー情報が利用できません");
    return;
  }
  const q = query(
    collection(db, "privateChats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  onSnapshot(q, async (snapshot) => {
    messageContainer.innerHTML = "";
    for (const docChange of snapshot.docs) {
      const data = docChange.data();
      const currentUser = auth.currentUser;
      const isMe = currentUser && data.userId === currentUser.uid;
      addMessageBubble(data, isMe);
    }
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    displayMessages();
    // 相手の名前を取得して表示
    try {
      const chatDoc = await getDoc(doc(db, "privateChats", chatId));
      const chatData = chatDoc.data();
      console.log(chatData);
      const otherUserId = chatData.participants.find(uid => uid !== user.uid);
      if (otherUserId) {
        const userDoc = await getDoc(doc(db, "users", otherUserId));
        if (userDoc.exists()) {
          const roomTitle = document.getElementById("roomTitle");
          roomTitle.textContent = userDoc.data().name || "メッセージ";
        }
      }
    } catch (e) {
      // fallback: keep default title
    }
  } else {
    console.error("ユーザーが認証されていません");
  }
});