import { db, auth } from './firebase.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // ✅ すでにログインしてる場合はホームに飛ばす（ユーザーデータがあるか確認）
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        // ユーザーデータが存在する場合はホームへリダイレクト
        window.location.href = 'home.html';
      } else {
        // 存在しない場合は登録フォームを表示（何もしない）
        console.log('ユーザーデータが見つかりません。新規登録画面を表示します。');
      }
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