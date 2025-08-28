


import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
const firebaseConfig = {
  apiKey: "AIzaSyC5Rs3NfKtTFS5zxd5qNvSJ6sYARGBeA44",
  authDomain: "peerchat-70fab.firebaseapp.com",
  projectId: "peerchat-70fab",
  storageBucket: "peerchat-70fab.appspot.com",
  messagingSenderId: "797423757401",
  appId: "1:797423757401:web:7df091b3f0c9a1e581e948",
  measurementId: "G-62FX7BNBK6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      // 登録済み → ホームにリダイレクト
      window.location.href = "home.html";
    }
  }
});