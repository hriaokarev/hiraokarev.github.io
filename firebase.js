// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  query,
  orderBy,
  increment
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

// サインイン（匿名ログイン）
signInAnonymously(auth).catch((error) => {
  console.error("ログインエラー:", error);
});

// PWA Service Worker 登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('✅ SW registered', reg))
      .catch(err => console.log('❌ SW failed', err));
  });
}

export {
  db,
  auth,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  query,
  orderBy,
  onAuthStateChanged,
  increment
};
