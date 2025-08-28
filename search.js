import { db, auth } from "./firebase.js";
import { collection, addDoc, query, orderBy, getDocs, getDoc, doc, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const loadedPostIds = new Set();

function openPostPopup() {
  document.getElementById("post-popup").style.display = "flex";
}

async function submitPost() {
  const popupTextarea = document.getElementById("popupTextarea");
  const content = popupTextarea ? popupTextarea.value.trim() : "";
  if (content === "") return;

  const user = auth.currentUser;
  const userId = user ? user.uid : "anonymous";

  try {
    await addDoc(collection(db, "searchPosts"), {
      content,
      userId,
      createdAt: new Date()
    });
    popupTextarea.value = "";
    popupTextarea.dispatchEvent(new Event("input")); // カウンターなどを更新
    document.getElementById("popupOverlay")?.classList.remove("active");
    loadSearchPosts();
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

// New function for posting from popup
async function submitPostToFirebase(content) {
  if (!content) return;

  const user = auth.currentUser;
  const userId = user ? user.uid : "anonymous";

  try {
    await addDoc(collection(db, "searchPosts"), {
      content,
      userId,
      createdAt: new Date()
    });
    loadSearchPosts();
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
}

function loadSearchPosts() {
  const section = document.querySelector("#search .section") || document.getElementById("search");

  section.innerHTML = "";
  loadedPostIds.clear();

  // Query is explicitly sorted by descending createdAt to ensure newest posts appear first
  const q = query(
    collection(db, "searchPosts"),
    orderBy("createdAt", "desc"), // Important: 'desc' puts newest posts at the top
    limit(20)
  );

  let isInitialLoad = true;

  onSnapshot(q, async (querySnapshot) => {
    if (isInitialLoad) {
      // Initial batch rendering
      querySnapshot.forEach(async (docSnap) => {
        const docId = docSnap.id;
        if (loadedPostIds.has(docId)) return;
        loadedPostIds.add(docId);

        const data = docSnap.data();
        const userIdVal = data.userId || "anonymous";
        const userHandle = userIdVal !== "anonymous" ? userIdVal : "anonymous";
        const postCard = document.createElement("div");
        postCard.className = "tweet-card";
        postCard.setAttribute("data-post-id", docId);

        const createdAt = data.createdAt?.seconds
          ? new Date(data.createdAt.seconds * 1000)
          : new Date();

        let userName = "anonymous";
        if (data.userId && data.userId !== "anonymous") {
          const userDoc = await getDoc(doc(db, "users", data.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userName = userData.name || "anonymous";
          }
        }
        const profileHref = userIdVal !== "anonymous" ? `profile.html?uid=${encodeURIComponent(userIdVal)}` : `profile.html`;

        postCard.innerHTML = `
          <div class="tweet-header">
              <div class="tweet-avatar">匿</div>
              <div class="tweet-user-info">
                  <a class="tweet-username" href="${profileHref}">${userName}</a>
                  <span class="tweet-handle">@${userHandle}</span>
                  <span>•</span>
                  <span class="tweet-time">${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
          </div>
          <div class="tweet-content">${data.content}</div>
          <div class="tweet-actions">
              <button class="action-btn">
                  <svg class="action-icon" viewBox="0 0 24 24">
                      <path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828a.5.5 0 00.85.354l7.877-7.876a1.885 1.885 0 000-2.671L14.046 2.242z"/>
                  </svg>
                  <span>0</span>
              </button>
              <button class="action-btn">
                  <svg class="action-icon" viewBox="0 0 24 24">
                      <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.156-6.853.942-1.502 2.367-2.5 4.040-2.5 1.672 0 3.097.998 4.040 2.5.943-1.502 2.368-2.5 4.040-2.5 1.673 0 3.098.998 4.040 2.5 1.255 1.993 1.205 4.353-.155 6.853z"/>
                  </svg>
                  <span>0</span>
              </button>
              <button class="action-btn">
                  <svg class="action-icon" viewBox="0 0 24 24">
                      <path d="M17.53 7.47l-5-5a.75.75 0 00-1.06 0l-5 5a.75.75 0 101.06 1.06L11 5.06V19a.75.75 0 001.5 0V5.06l3.47 3.47a.75.75 0 101.06-1.06z"/>
                  </svg>
              </button>
          </div>
        `;

        section.appendChild(postCard);
      });

      isInitialLoad = false;
      return;
    }

    // Realtime new additions
    querySnapshot.docChanges().forEach(async (change) => {
      if (change.type !== "added") return;

      const docId = change.doc.id;
      if (loadedPostIds.has(docId)) return;
      loadedPostIds.add(docId);

      const data = change.doc.data();
      const userIdVal = data.userId || "anonymous";
      const userHandle = userIdVal !== "anonymous" ? userIdVal : "anonymous";
      const postCard = document.createElement("div");
      postCard.className = "tweet-card";
      postCard.setAttribute("data-post-id", docId);

      const createdAt = data.createdAt?.seconds
        ? new Date(data.createdAt.seconds * 1000)
        : new Date();

      let userName = "anonymous";
      if (data.userId && data.userId !== "anonymous") {
        const userDoc = await getDoc(doc(db, "users", data.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userName = userData.name || "anonymous";
        }
      }
      const profileHref = userIdVal !== "anonymous" ? `profile.html?uid=${encodeURIComponent(userIdVal)}` : `profile.html`;

      postCard.innerHTML = `
        <div class="tweet-header">
            <div class="tweet-avatar">匿</div>
            <div class="tweet-user-info">
                <a class="tweet-username" href="${profileHref}">${userName}</a>
                <span class="tweet-handle">@${userHandle}</span>
                <span>•</span>
                <span class="tweet-time">${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
        <div class="tweet-content">${data.content}</div>
        <div class="tweet-actions">
            <button class="action-btn">
                <svg class="action-icon" viewBox="0 0 24 24">
                    <path d="M14.046 2.242l-4.148-.01h-.002c-4.374 0-7.8 3.427-7.8 7.802 0 4.098 3.186 7.206 7.465 7.37v3.828a.5.5 0 00.85.354l7.877-7.876a1.885 1.885 0 000-2.671L14.046 2.242z"/>
                </svg>
                <span>0</span>
            </button>
            <button class="action-btn">
                <svg class="action-icon" viewBox="0 0 24 24">
                    <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.156-6.853.942-1.502 2.367-2.5 4.040-2.5 1.672 0 3.097.998 4.040 2.5.943-1.502 2.368-2.5 4.040-2.5 1.673 0 3.098.998 4.040 2.5 1.255 1.993 1.205 4.353-.155 6.853z"/>
                </svg>
                <span>0</span>
            </button>
            <button class="action-btn">
                <svg class="action-icon" viewBox="0 0 24 24">
                    <path d="M17.53 7.47l-5-5a.75.75 0 00-1.06 0l-5 5a.75.75 0 101.06 1.06L11 5.06V19a.75.75 0 001.5 0V5.06l3.47 3.47a.75.75 0 101.06-1.06z"/>
                </svg>
            </button>
        </div>
      `;

      section.insertBefore(postCard, section.firstChild);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSearchPosts();
});

window.openPostPopup = openPostPopup;
window.submitPost = submitPost;

export { submitPost, submitPostToFirebase };
// フッターのナビゲーションバークリック遷移
document.querySelectorAll(".footer-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    const target = e.currentTarget.dataset.target;
    if (target) {
      window.location.href = target;
    }
  });
});