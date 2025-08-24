import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const messageContainer = document.getElementById("messageContainer");
const messageInput = document.getElementById("messageInput");

const urlParams = new URLSearchParams(window.location.search);
const chatId = urlParams.get("id");

function addMessageBubble(message, isMe) {
  const div = document.createElement("div");
  div.className = "message " + (isMe ? "me" : "other");
  div.textContent = message.content;
  messageContainer.appendChild(div);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

function sendMessage() {
  const text = messageInput.value.trim();
  if (text === "") return;

  const message = {
    content: text,
    userId: auth.currentUser.uid,
    createdAt: serverTimestamp()
  };

  addDoc(collection(db, "privateChats", chatId, "messages"), message);
  messageInput.value = "";
}

async function displayMessages() {
  const q = query(
    collection(db, "privateChats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  onSnapshot(q, async (snapshot) => {
    messageContainer.innerHTML = "";
    for (const docChange of snapshot.docs) {
      const data = docChange.data();
      const isMe = data.userId === auth.currentUser.uid;
      addMessageBubble(data, isMe);
    }
  });
}

displayMessages();

window.sendMessage = sendMessage;