import { db, auth, doc, setDoc, onAuthStateChanged } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  // ✅ すでにログインしてる場合はホームに飛ばす
  onAuthStateChanged(auth, (user) => {
    if (user) {
      window.location.href = 'home.html';
    }
  });

  const images = document.querySelectorAll('.selectable-image');
  const preview = document.getElementById('registerProfileImage');
  const hiddenInput = document.getElementById('selectedImage');

  images.forEach(img => {
    img.addEventListener('click', () => {
      const selected = img.getAttribute('data-img');
      preview.src = selected;
      hiddenInput.value = selected;

      images.forEach(i => {
        i.classList.remove('selected');
        i.style.border = '2px solid transparent';
      });

      img.classList.add('selected');
      img.style.border = '2px solid #4CAF50';
    });
  });

  const registerButton = document.getElementById('registerBtn');
  if (registerButton) {
    registerButton.addEventListener('click', () => {
      saveProfile(true);
    });
  }
});

async function saveProfile(isNew) {
  const name = document.getElementById('registerName').value;
  const region = document.getElementById('registerRegion').value;
  const age = document.getElementById('registerAge').value;
  const profileImage = document.getElementById('selectedImage').value;

  try {
    const user = auth.currentUser;

    if (!user) {
      alert("ユーザーがログインしていません");
      return;
    }

    await setDoc(doc(db, "users", user.uid), {
      name,
      region,
      age,
      profileImage,
      updatedAt: new Date()
    });

    alert("登録が完了しました！");
    window.location.href = "home.html";
  } catch (error) {
    console.error("登録エラー:", error);
    alert("登録に失敗しました。");
  }
}

window.saveProfile = saveProfile;