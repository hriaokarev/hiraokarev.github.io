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
import { serverTimestamp as firestoreServerTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const messageContainer = document.getElementById("messageContainer");
const messageInput = document.getElementById("messageInput");

const urlParams = new URLSearchParams(window.location.search);
const chatId = urlParams.get("chatId");
if (!chatId) {
  console.error("チャットIDがURLに含まれていません");
  throw new Error("chatId missing");
}

// ===== Scroll helpers & state =====
function ensureScrollableContainer() {
  if (!messageContainer) return;
  const computed = window.getComputedStyle(messageContainer);
  const hasOverflow = computed.overflowY === "auto" || computed.overflowY === "scroll";
  const hasFixedHeight = !!messageContainer.style.height || (computed.height && computed.height !== "auto");
  if (!hasOverflow) {
    messageContainer.style.overflowY = "auto";
    messageContainer.style.webkitOverflowScrolling = "touch";
    messageContainer.style.overscrollBehavior = "contain";
    messageContainer.style.paddingRight = messageContainer.style.paddingRight || "6px";
  }
  if (!hasFixedHeight) {
    // 画面全体からヘッダーと入力欄ぶんを差し引く
    messageContainer.style.height = "calc(100vh - var(--header-h, 64px) - 200px)";
  }
}
let pinToBottom = true;
function isAtBottom(threshold = 100) {
  if (!messageContainer) return true;
  return (messageContainer.scrollHeight - messageContainer.scrollTop - messageContainer.clientHeight) < threshold;
}
function scrollToBottom(force = false) {
  if (!messageContainer) return;
  const threshold = 100;
  const atBottom = isAtBottom(threshold);
  const containerScrollable = messageContainer.scrollHeight > messageContainer.clientHeight;
  if (containerScrollable) {
    if (!atBottom && !force) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      });
    });
  } else {
    if (!force) {
      const pageAtBottom = (document.documentElement.scrollHeight - window.scrollY - window.innerHeight) < threshold;
      if (!pageAtBottom) return;
    }
    requestAnimationFrame(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
  }
}
// keep pin state updated when user scrolls
messageContainer.addEventListener("scroll", () => {
  pinToBottom = isAtBottom(100);
});

function addMessageBubble(message, isMe) {
  const bubble = document.createElement("div");
  bubble.classList.add("chat-bubble", isMe ? "bubble-right" : "bubble-left");

  const content = document.createElement("div");
  content.textContent = message.content;
  bubble.appendChild(content);

  const meta = document.createElement("div");
  meta.classList.add("bubble-time");

  const createdAt = message.createdAt instanceof Date
    ? message.createdAt
    : message.createdAt?.toDate?.() || new Date();

  const formatted = `${createdAt.getHours()}:${String(createdAt.getMinutes()).padStart(2, '0')}`;
  meta.textContent = formatted;

  bubble.appendChild(meta);

  messageContainer.appendChild(bubble);
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
    await setDoc(doc(db, "privateChats", chatId), {
      updatedAt: firestoreServerTimestamp()
    }, { merge: true });
    messageInput.value = "";
    scrollToBottom(true);
  } catch (error) {
    console.error("メッセージ送信エラー:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("sendBtn").addEventListener("click", sendMessage);
  ensureScrollableContainer();
  // 初期表示は最下部へ
  scrollToBottom(true);
  // レイアウト変化時に下端維持（ユーザーが下端にいる場合のみ）
  window.addEventListener("resize", () => scrollToBottom(pinToBottom));
  const ro = new ResizeObserver(() => scrollToBottom(pinToBottom));
  ro.observe(messageContainer);
});

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
    const wasAtBottom = isAtBottom(100);
    messageContainer.innerHTML = "";
    const sortedDocs = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeA - timeB;
      });

    for (const msg of sortedDocs) {
      const currentUser = auth.currentUser;
      const isMe = currentUser && msg.userId === currentUser.uid;
      addMessageBubble(msg, isMe);
    }
    scrollToBottom(wasAtBottom);
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