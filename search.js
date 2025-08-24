import { db, auth } from "./firebase.js";
import { collection, addDoc, query, orderBy, getDocs, getDoc, doc, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const loadedPostIds = new Set();

function openPostPopup() {
  document.getElementById("post-popup").style.display = "flex";
}

async function submitPost() {
  const content = document.getElementById("post-content").value.trim();
  if (content === "") return;

  const user = auth.currentUser;
  const userId = user ? user.uid : "anonymous";

  try {
    await addDoc(collection(db, "searchPosts"), {
      content,
      userId,
      createdAt: new Date()
    });
    document.getElementById("post-popup").style.display = "none";
    document.getElementById("post-content").value = "";
    loadSearchPosts();
  } catch (e) {
    console.error("Error adding document: ", e);
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
        const postCard = document.createElement("div");
        postCard.className = "thread-card";
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

        postCard.innerHTML = `
          <div class="meta">${userName}・${createdAt.toLocaleString()}</div>
          <div class="content">${data.content}</div>
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
      const postCard = document.createElement("div");
      postCard.className = "thread-card";
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

      postCard.innerHTML = `
        <div class="meta">${userName}・${createdAt.toLocaleString()}</div>
        <div class="content">${data.content}</div>
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
