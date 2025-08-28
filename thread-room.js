import {
  db,
  auth,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  doc,
  updateDoc,
  onAuthStateChanged,
  increment
} from "./firebase.js";
import { getDocs, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const threadId = urlParams.get("id");

  // 👁️ 観覧数の加算（サブコレクションに記録）
  onAuthStateChanged(auth, async (user) => {
    if (!user || !threadId) return;

    try {
      const viewRef = doc(db, "threads", threadId, "views", user.uid);
      const viewSnap = await getDoc(viewRef);

      if (!viewSnap.exists()) {
        await setDoc(viewRef, {
          viewedAt: serverTimestamp()
        });

        console.log("✅ 観覧数をサブコレクションに加算しました");
      }
    } catch (error) {
      console.error("👁️ 観覧数の加算エラー:", error);
    }
  });

  if (threadId) {
    const threadDocRef = doc(db, "threads", threadId);
    const threadSnapshot = await getDoc(threadDocRef).catch((err) => {
      console.error("❌ スレッドデータの取得失敗:", err);
    });
    console.log("ThreadDocRef:", threadDocRef.path);
    if (threadSnapshot && threadSnapshot.exists()) {
      const threadData = threadSnapshot.data();
      console.log(threadData); // ← デバッグ用追加
      const titleEl = document.getElementById("thread-room-title");
      const descriptionEl = document.getElementById("thread-room-description");
      const genreEl = document.getElementById("thread-room-genre");
      if (titleEl) {
        titleEl.textContent = threadData.name || "スレッド";
      }
      if (descriptionEl) {
        descriptionEl.textContent = threadData.description || "";
      }
      if (genreEl) {
        genreEl.textContent = threadData.genre || "";
      }
      // --- Insert fetching and rendering latest message here ---
      const messagesQuery = query(collection(db, "threads", threadId, "messages"), orderBy("createdAt", "desc"));
      const messageSnapshot = await getDocs(messagesQuery);
      const latestMessage = messageSnapshot.docs[0]?.data();
      const latestMessageEl = document.getElementById("thread-room-latest-message");
      console.log("latestMessage", latestMessage);
      if (latestMessage && latestMessageEl) {
        latestMessageEl.textContent = latestMessage.content || "";
      }
    }
  }

  const messageInput = document.getElementById("thread-message-input");
  const sendButton = document.getElementById("thread-send-button");
  const messagesContainer = document.getElementById("thread-messages");

  // === Auto-scroll state ===
  let pinToBottom = true; // whether the view should stay pinned to bottom
  function isAtBottom(threshold = 100) {
    if (!messagesContainer) return true;
    return (messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight) < threshold;
  }

  // 🔧 Ensure the messages container can actually scroll like LINE
  function ensureScrollableContainer() {
    if (!messagesContainer) return;
    // If it doesn't have a fixed height or overflow, make it scrollable inline.
    const computed = window.getComputedStyle(messagesContainer);
    const hasOverflow = computed.overflowY === "auto" || computed.overflowY === "scroll";
    const hasFixedHeight = !!messagesContainer.style.height || (computed.height && computed.height !== "auto");

    if (!hasOverflow) {
      messagesContainer.style.overflowY = "auto";
      messagesContainer.style.webkitOverflowScrolling = "touch";
      messagesContainer.style.overscrollBehavior = "contain";
      messagesContainer.style.paddingRight = messagesContainer.style.paddingRight || "6px";
    }
    if (!hasFixedHeight) {
      // Reserve space for header + input (tweak 200px to fit your layout)
      messagesContainer.style.height = "calc(100vh - 200px)";
    }
  }
  ensureScrollableContainer();

  function renderMessage(message, isCurrentUser) {
    const bubble = document.createElement("div");
    bubble.classList.add("chat-bubble");
    bubble.classList.add(isCurrentUser ? "bubble-right" : "bubble-left");

    const content = document.createElement("div");
    content.classList.add("bubble-content");

    if (!isCurrentUser && message.authorName) {
      content.innerHTML = `<strong>@${message.authorName}</strong><br>${message.content}`;
    } else {
      content.textContent = message.content;
    }

    const time = document.createElement("div");
    time.classList.add("bubble-time");
    const createdAt = message.createdAt?.toDate?.() || new Date();
    time.textContent = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    bubble.appendChild(content);
    bubble.appendChild(time);

    messagesContainer.appendChild(bubble);
    scrollToBottom();
  }

  function scrollToBottom(force = false) {
    if (!messagesContainer) return;

    // If the container is not scrollable (height fits content), fall back to window scroll
    const containerScrollable =
      messagesContainer.scrollHeight > messagesContainer.clientHeight;

    const threshold = 100;
    const atBottom =
      (messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight) < threshold;

    if (containerScrollable) {
      if (!atBottom && !force) return;
      // Double-RAF to ensure layout/painting has settled
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
      });
    } else {
      // Fallback: scroll the page itself
      if (!force) {
        const pageAtBottom =
          (document.documentElement.scrollHeight - window.scrollY - window.innerHeight) < threshold;
        if (!pageAtBottom) return;
      }
      requestAnimationFrame(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
    }
  }

  sendButton.addEventListener("click", async function () {
    const content = messageInput.value.trim();
    const user = auth.currentUser;
    let authorName = user.displayName || "名無し";
    const userDocSnap = await getDoc(doc(db, "users", user.uid));
    if (!user.displayName && userDocSnap.exists()) {
      authorName = userDocSnap.data().name || "名無し";
    }
    if (content && user && threadId) {
      await addDoc(collection(db, "threads", threadId, "messages"), {
        content,
        userId: user.uid,
        authorName,
        createdAt: serverTimestamp()
      });
      messageInput.value = "";
      scrollToBottom(true);
    }
  });

  let enterPressCount = 0;
  let enterTimer = null;

  messageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      enterPressCount++;

      if (enterPressCount === 2) {
        sendButton.click();
        enterPressCount = 0;
        clearTimeout(enterTimer);
        enterTimer = null;
      } else {
        enterTimer = setTimeout(() => {
          enterPressCount = 0;
        }, 400); // reset if second Enter not pressed within 400ms
      }
    }
  });

  if (threadId) {
    messagesContainer.addEventListener('scroll', () => {
      pinToBottom = isAtBottom(100);
    });

    const messagesRef = collection(db, "threads", threadId, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

    requestAnimationFrame(scrollToBottom);

    onSnapshot(messagesQuery, (snapshot) => {
      // Remember whether user was at bottom before we render incoming messages
      const wasAtBottom = isAtBottom(100);
      messagesContainer.innerHTML = "";
      const fragment = document.createDocumentFragment();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const isCurrentUser = data.userId === auth.currentUser?.uid;

        const bubble = document.createElement("div");
        bubble.classList.add("chat-bubble", isCurrentUser ? "bubble-right" : "bubble-left");

        const content = document.createElement("div");
        content.classList.add("bubble-content");

        if (!isCurrentUser && data.authorName) {
          content.innerHTML = `<strong>@${data.authorName}</strong><br>${data.content}`;
        } else {
          content.textContent = data.content;
        }

        const time = document.createElement("div");
        time.classList.add("bubble-time");
        const createdAt = data.createdAt?.toDate?.() || new Date();
        time.textContent = createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        bubble.appendChild(content);
        bubble.appendChild(time);
        fragment.appendChild(bubble);
      });

      messagesContainer.appendChild(fragment);
      if (snapshot.empty) {
        console.log("💬 このスレッドにはまだメッセージがありません。");
      }

      // Only scroll if user was already at bottom (avoid jumping during history reading)
      scrollToBottom(wasAtBottom);
    });
  }
  window.addEventListener("load", () => {
    scrollToBottom(true);
  });

  window.addEventListener("resize", () => scrollToBottom(pinToBottom));

  // If messages are added by other code (images load, etc.), observe size changes and keep bottom
  const resizeObserver = new ResizeObserver(() => scrollToBottom(pinToBottom));
  if (messagesContainer) {
    resizeObserver.observe(messagesContainer);
  }
});
