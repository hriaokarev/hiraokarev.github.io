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
  const cachedPosts = JSON.parse(localStorage.getItem("cachedSearchPosts") || "[]");
  cachedPosts.slice().reverse().forEach((data) => {
    if (loadedPostIds.has(data.id)) return;
    if (document.querySelector(`[data-post-id="${data.id}"]`)) return;

    loadedPostIds.add(data.id);

    const section = document.querySelector("#search .section") || document.getElementById("search");
    const postCard = document.createElement("div");
    postCard.className = "thread-card";
    postCard.setAttribute("data-post-id", data.id);

    const createdAt = new Date(data.createdAt);
    const userName = data.userName;

    postCard.innerHTML = `
      <div class="meta">${userName}・${createdAt.toLocaleString()}</div>
      <div class="content">${data.content}</div>
    `;
    section.appendChild(postCard);
  });

  const section = document.querySelector("#search .section") || document.getElementById("search");

  // Query is explicitly sorted by descending createdAt to ensure newest posts appear first
  const q = query(
    collection(db, "searchPosts"),
    orderBy("createdAt", "desc"), // Important: 'desc' puts newest posts at the top
    limit(20)
  );

  let isInitialLoad = true;

  onSnapshot(q, async (querySnapshot) => {
    const addedDocs = querySnapshot.docChanges()
      .filter(change => change.type === "added");

    const sortedAddedDocs = addedDocs.sort((a, b) => {
      const timeA = a.doc.data().createdAt?.seconds || 0;
      const timeB = b.doc.data().createdAt?.seconds || 0;
      return timeA - timeB;
    });

    const renderedPosts = [];
    const existingIds = new Set(renderedPosts.map(post => post.id));

    for (const change of sortedAddedDocs) {
      const docId = change.doc.id;
      if (loadedPostIds.has(docId) || existingIds.has(docId)) continue;
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

      if (isInitialLoad) {
        section.insertBefore(postCard, section.firstChild); // Insert at top for initial load too
      } else {
        section.insertBefore(postCard, section.firstChild); // Newest at top
      }

      renderedPosts.push({
        id: docId,
        userName,
        content: data.content,
        createdAt: createdAt.toISOString()
      });
    }

    if (isInitialLoad) {
      localStorage.setItem("cachedSearchPosts", JSON.stringify(renderedPosts));
    }

    isInitialLoad = false;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSearchPosts();
});

window.openPostPopup = openPostPopup;
window.submitPost = submitPost;
