import {
  db,
  auth,
  doc,
  getDoc,
  setDoc,
  onAuthStateChanged
} from "./firebase.js";

const nameInput = document.getElementById("settingsName");
const regionSelect = document.getElementById("settingsRegion");
const ageInput = document.getElementById("settingsAge");
const saveButton = document.getElementById("saveSettings");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      nameInput.value = data.name || "";
      regionSelect.value = data.region || "";
      ageInput.value = data.age || "";
    }
  } else {
    window.location.href = "register.html"; // ログインしていない場合
  }
});

saveButton.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      name: nameInput.value,
      region: regionSelect.value,
      age: ageInput.value
    }, { merge: true });
    alert("保存しました");
  }
});
