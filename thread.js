export function createThreadFromPopup({ name, description, genre }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;
  const authorName = user && user.displayName ? user.displayName : "未設定";

  addDoc(collection(db, "threads"), {
    name,
    description,
    genre,
    createdAt: serverTimestamp(),
    userId,
    authorName
  }).then(() => {
    closeThreadPopup();
    renderThreadList();
  }).catch((e) => {
    console.error("Error creating thread: ", e);
    alert("スレッドの作成に失敗しました");
  });
}
import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { collection as fsCollection, query, orderBy, onSnapshot, getDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getCountFromServer } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getDocs, query as fsQuery, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

async function renderThreadList() {
  const list = document.getElementById("thread-list");
  list.innerHTML = "";

  const threadsRef = fsCollection(db, "threads");
  const q = query(threadsRef, orderBy("createdAt", "desc"));

  onSnapshot(q, async (querySnapshot) => {
    if (querySnapshot.empty) {
      list.innerHTML = "";
      const none = document.createElement("div");
      none.style.color = "#aaa";
      none.style.textAlign = "center";
      none.style.margin = "20px 0";
      none.textContent = "まだスレッドがありません。右下の＋から作成できます。";
      list.appendChild(none);
      return;
    }

    const newThreads = [];

    querySnapshot.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        const thread = change.doc.data();
        const card = document.createElement("div");
        card.className = "thread-card";
        card.style.cursor = "pointer";
        card.onclick = () => window.location.href = "thread-room.html?id=" + change.doc.id;

        let displayName = "未設定";
        if (thread.userId) {
          try {
            const userDoc = await getDoc(doc(db, "users", thread.userId));
            if (userDoc.exists()) {
              displayName = userDoc.data().name || "未設定";
            }
          } catch (e) {
            console.error("ユーザー情報の取得に失敗しました:", e);
          }
        }

        let messageCount = 0;
        let viewCount = 0;

        try {
          const messagesSnap = await getCountFromServer(collection(db, "threads", change.doc.id, "messages"));
          messageCount = messagesSnap.data().count || 0;
        } catch (e) {
          console.error("メッセージ数取得エラー:", e);
        }

        // Removed automatic view record here

        try {
          const viewsSnap = await getCountFromServer(collection(db, "threads", change.doc.id, "views"));
          viewCount = viewsSnap.data().count || 0;
        } catch (e) {
          console.error("ビュー数取得エラー:", e);
        }

        card.innerHTML = `
          <div class="meta">${escapeHtml(displayName)}・${escapeHtml(thread.genre || "未分類")}</div>
          <div class="content" style="font-weight:bold; font-size:16px;">${escapeHtml(thread.name)}</div>
          <div class="content" style="margin-top:3px; color:#bbb;">${escapeHtml(thread.description || "")}</div>
          <div class="content" style="margin-top:6px; font-size:13px; color:#999;">
            👁 ${viewCount}人 見た ・ 💬 ${messageCount}件
          </div>
        `;

        // Add to the top of the list
        list.insertBefore(card, list.firstChild);
      }
    });
  });
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
}
function openThreadModal() {
  document.getElementById("thread-modal").style.display = "flex";
  document.getElementById("thread-name-input").value = "";
  document.getElementById("thread-desc-input").value = "";
}
function closeThreadModal() {
  document.getElementById("thread-modal").style.display = "none";
}
async function createThread() {
  const name = document.getElementById("thread-name-input").value.trim();
  const desc = document.getElementById("thread-desc-input").value.trim();
  const genre = document.getElementById("thread-genre-select").value.trim();
  if (!name) {
    alert("スレッド名を入力してください");
    return;
  }

  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;
  const authorName = user && user.displayName ? user.displayName : "未設定";

  try {
    await addDoc(collection(db, "threads"), {
      name,
      description: desc,
      genre,
      createdAt: serverTimestamp(),
      userId,
      authorName
    });
    renderThreadList(); // Immediately re-render after adding
    closeThreadModal();
  } catch (e) {
    console.error("Error adding thread: ", e);
    alert("スレッドの作成に失敗しました");
  }
}
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

renderThreadList();

const fabButton = document.getElementById("fab-button");
const createThreadButton = document.getElementById("create-thread-button");

if (fabButton) {
  fabButton.addEventListener("click", openThreadModal);
}
if (createThreadButton) {
  createThreadButton.addEventListener("click", createThread);
}
window.closeThreadModal = closeThreadModal;

function goBack() {
  window.history.back();
}
window.goBack = goBack;

// Export closeThreadPopup for dynamic import usage
window.closeThreadPopup = closeThreadPopup;

// フッターのナビゲーションバークリック遷移
document.querySelectorAll(".footer-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    const target = e.currentTarget.dataset.target;
    if (target) {
      window.location.href = target;
    }
  });
});