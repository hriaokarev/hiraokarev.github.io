import { db, auth } from "./firebase.js";
import { collection, addDoc, query, orderBy, getDocs, getDoc, doc, onSnapshot, limit } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

  const q = query(
    collection(db, "searchPosts"),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  onSnapshot(q, async (querySnapshot) => {
    for (const change of querySnapshot.docChanges()) {
      if (change.type === "added") {
        const data = change.doc.data();
        const postCard = document.createElement("div");
        postCard.className = "thread-card";

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
          <div class="meta">${userName}・${createdAt.toLocaleDateString()}</div>
          <div class="content">${data.content}</div>
        `;

        const section = document.querySelector("#search .section") || document.getElementById("search");
        section.prepend(postCard);
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSearchPosts();
});

window.openPostPopup = openPostPopup;
window.submitPost = submitPost;
