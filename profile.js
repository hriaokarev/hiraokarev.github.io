import { db, auth } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("uid") || params.get("user");
  let userNameParam = params.get("name");

  const nameElement = document.getElementById("name");
  const titleEl = document.getElementById("profileTitle");
  const handleEl = document.getElementById("handle");
  const avatarInitial = document.getElementById("avatarInitial");
  const regionElement = document.getElementById("region");
  const ageElement = document.getElementById("age");
  const bioElement = document.getElementById("bio");

  function setAvatarFromName(n) {
    const ch = (n || "匿").trim().charAt(0) || "匿";
    avatarInitial.textContent = ch;
  }

  if (userNameParam) {
    nameElement.textContent = `名前: ${userNameParam}`;
    titleEl.textContent = userNameParam;
    handleEl.textContent = `@${userId || 'anonymous'}`;
    setAvatarFromName(userNameParam);
  }

  if (userId) {
    const docRef = doc(db, "users", userId);
    getDoc(docRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const displayName = data.name || userNameParam || "未設定";
        nameElement.textContent = `名前: ${displayName}`;
        titleEl.textContent = displayName;
        handleEl.textContent = `@${userId}`;
        regionElement.textContent = `地域: ${data.region || "未設定"}`;
        ageElement.textContent = `年齢: ${data.age || "未設定"}`;
        bioElement.textContent = data.bio || "自己紹介は未設定です";
        setAvatarFromName(displayName);
        // 活動の読み込み
        loadActivities(userId);
      } else {
        // ドキュメントがない場合もハンドルだけは表示
        handleEl.textContent = `@${userId}`;
        loadActivities(userId);
      }
    });
  }

  const messageBtn = document.getElementById("messageButton");
  messageBtn.addEventListener("click", () => {
    const currentName = (document.getElementById('name').textContent || '').replace(/^名前:\s*/, '') || '相手';
    if (userId) {
      startPrivateChat(userId, currentName);
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
    await setDoc(doc(db, "privateChats", chatId), {
      updatedAt: serverTimestamp()
    }, { merge: true });
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
  window.location.href = `message.html?chatId=${chatId}`;
}
async function loadActivities(uid) {
  try {
    const q = query(
      collection(db, "searchPosts"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snap = await getDocs(q);
    const list = document.getElementById("activityList");
    list.innerHTML = "";

    if (snap.empty) {
      list.innerHTML = `<div class="card"><p style="color: var(--muted);">投稿はまだありません</p></div>`;
      return;
    }

    snap.forEach(ds => {
      const d = ds.data();
      const text = d.content || d.text || "";
      const ts = (d.createdAt && typeof d.createdAt.toDate === 'function') ? d.createdAt.toDate() : new Date();
      const timeStr = ts.toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
      const item = document.createElement('div');
      item.className = 'card';
      item.innerHTML = `
        <p style="color: var(--muted); font-size: 14px; margin-bottom: 8px;">${timeStr}</p>
        <p>${escapeHtml(text)}</p>
      `;
      list.appendChild(item);
    });
  } catch (e) {
    console.error('活動の取得に失敗', e);
    const list = document.getElementById("activityList");
    list.innerHTML = `<div class="card"><p style="color: var(--muted);">投稿の読み込みに失敗しました</p></div>`;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}