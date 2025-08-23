
// thread.js - スレッド関連のロジックを分離

const THREADS_KEY = "peerchat_threads_v1";
const THREAD_MESSAGES_KEY = "peerchat_thread_messages_v1";

function getThreads() {
  try {
    return JSON.parse(localStorage.getItem(THREADS_KEY)) || [];
  } catch(e) {
    return [];
  }
}
function saveThreads(threads) {
  localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
}
function getThreadMessages() {
  try {
    return JSON.parse(localStorage.getItem(THREAD_MESSAGES_KEY)) || {};
  } catch(e) {
    return {};
  }
}
function saveThreadMessages(msgs) {
  localStorage.setItem(THREAD_MESSAGES_KEY, JSON.stringify(msgs));
}
function renderThreadList() {
  const threads = getThreads();
  const list = document.getElementById("thread-list");
  list.innerHTML = "";
  if (!threads.length) {
    const none = document.createElement("div");
    none.style.color = "#aaa";
    none.style.textAlign = "center";
    none.style.margin = "20px 0";
    none.textContent = "まだスレッドがありません。右下の＋から作成できます。";
    list.appendChild(none);
    return;
  }
  threads.forEach(thread => {
    const card = document.createElement("div");
    card.className = "thread-card";
    card.style.cursor = "pointer";
    card.onclick = () => openThreadRoom(thread.id);
    let displayName = thread.authorName;
    if (!displayName || displayName === "匿名") {
      displayName = "未設定";
    }
    card.innerHTML = `
      <div class="meta">${escapeHtml(displayName)}・${thread.createdAt}</div>
      <div class="content" style="font-weight:bold; font-size:16px;">${escapeHtml(thread.name)}</div>
      <div class="content" style="margin-top:3px; color:#bbb;">${escapeHtml(thread.desc || "")}</div>
    `;
    list.appendChild(card);
  });
}
function openThreadModal() {
  document.getElementById("thread-modal").style.display = "flex";
  document.getElementById("thread-name-input").value = "";
  document.getElementById("thread-desc-input").value = "";
}
function closeThreadModal() {
  document.getElementById("thread-modal").style.display = "none";
}
function createThread() {
  const name = document.getElementById("thread-name-input").value.trim();
  const desc = document.getElementById("thread-desc-input").value.trim();
  if (!name) {
    alert("スレッド名を入力してください");
    return;
  }
  const threads = getThreads();
  const id = "thread_" + Date.now();
  const authorName = localStorage.getItem("profileName") || "匿名";
  const createdAt = new Date().toISOString().split("T")[0].replace(/-/g, "/");
  threads.unshift({ id, name, desc, authorName, createdAt });
  saveThreads(threads);
  closeThreadModal();
  renderThreadList();
}
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}
document.getElementById("thread").addEventListener("show", function() {
  document.getElementById("thread-list").style.display = "block";
  document.getElementById("thread-fab").style.display = "flex";
  document.getElementById("thread-room-section").style.display = "none";
  const threadListHeader = document.getElementById("thread-list-header");
  if (threadListHeader) threadListHeader.style.display = "block";
  renderThreadList();
});
document.addEventListener("mousedown", function(e) {
  const modal = document.getElementById("thread-modal");
  if (modal && modal.style.display !== "none" && !modal.firstElementChild.contains(e.target)) {
    closeThreadModal();
  }
});
document.addEventListener("DOMContentLoaded", function() {
  const threadSendBtn = document.getElementById("thread-send-btn");
  if (threadSendBtn) threadSendBtn.onclick = sendThreadMessage;
  const threadInput = document.getElementById("thread-input-text");
  if (threadInput) {
    threadInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") sendThreadMessage();
    });
  }
});
