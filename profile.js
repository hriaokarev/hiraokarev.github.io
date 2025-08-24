import { db, auth } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("user");
  let userName = params.get("name");

  const nameElement = document.getElementById("name");
  if (userName) nameElement.textContent = `名前: ${userName}`;
  else if (userId) {
    const docRef = doc(db, "users", userId);
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        userName = data.name || "未設定";
        nameElement.textContent = `名前: ${userName}`;
        const regionElement = document.getElementById("region");
        const ageElement = document.getElementById("age");
        regionElement.textContent = `地域: ${data.region || "未設定"}`;
        ageElement.textContent = `年齢: ${data.age || "未設定"}`;
      }
    });
  }

  const messageBtn = document.getElementById("messageButton");
  messageBtn.addEventListener("click", () => {
    if (userId && userName) {
      startPrivateChat(userId, userName);
    } else {
      alert("ユーザー情報が見つかりません");
    }
  });
});

async function startPrivateChat(targetUserId, targetUserName) {
  const user = auth.currentUser;
  if (!user) return alert("ログインしていません");

  // チャットがすでに存在するか確認
  const q = query(
    collection(db, "privateChats"),
    where("participants", "array-contains", user.uid)
  );
  const snapshot = await getDocs(q);
  let existingChat = null;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.participants.includes(targetUserId)) {
      existingChat = doc;
    }
  });

  let chatId;
  if (existingChat) {
    chatId = existingChat.id;
  } else {
    // 新しく作成
    const newChat = await addDoc(collection(db, "privateChats"), {
      participants: [user.uid, targetUserId],
      names: {
        [user.uid]: user.displayName || "自分",
        [targetUserId]: targetUserName
      },
      lastMessage: "",
      updatedAt: serverTimestamp()
    });
    chatId = newChat.id;
  }

  // チャットリストページへ遷移
  window.location.href = `chat.html`;
}