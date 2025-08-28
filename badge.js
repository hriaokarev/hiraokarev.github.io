import { db, auth } from "./firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

export function setupUnreadBadge() {
  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    const q = query(
      collection(db, "privateChats"),
      where("participants", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );
    onSnapshot(q, (snapshot) => {
      let hasUnread = false;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if ((data.unreadBy || []).includes(user.uid)) {
          hasUnread = true;
        }
      });
      const navChatItem = document.getElementById("nav-chat");
      if (navChatItem) {
        navChatItem.classList.toggle("has-unread", hasUnread);
      }
    });
  });
}