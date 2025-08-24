import {
  db,
  auth,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  doc
} from "./firebase.js";
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async function () {
  const urlParams = new URLSearchParams(window.location.search);
  const threadId = urlParams.get("id");

  if (threadId) {
    const threadDocRef = doc(db, "threads", threadId);
    const threadSnapshot = await getDoc(threadDocRef);
    console.log("ThreadDocRef:", threadDocRef.path);
    if (threadSnapshot.exists()) {
      const threadData = threadSnapshot.data();
      const titleEl = document.getElementById("thread-room-title");
      const descriptionEl = document.getElementById("thread-room-description");
      if (titleEl) {
        titleEl.textContent = threadData.name || "スレッド";
      }
      if (descriptionEl) {
        descriptionEl.textContent = threadData.description || "";
      }
    }
  }

  const messageInput = document.getElementById("thread-message-input");
  const sendButton = document.getElementById("thread-send-button");
  const messagesContainer = document.getElementById("thread-messages");

  function renderMessage(message, isCurrentUser) {
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message-wrapper", isCurrentUser ? "right" : "left");

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    const author = document.createElement("div");
    author.classList.add("message-author");
    // Fetch and display the user's name from users collection if authorName is not available
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
    messagesContainer.appendChild(messageWrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
    }
  });

  if (threadId) {
    const messagesRef = collection(db, "threads", threadId, "messages");
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

    onSnapshot(messagesQuery, (snapshot) => {
      messagesContainer.innerHTML = "";
      snapshot.forEach((doc) => {
        const data = doc.data();
        const isCurrentUser = data.userId === auth.currentUser?.uid;
        renderMessage(data, isCurrentUser);
      });
    });
  }
});
