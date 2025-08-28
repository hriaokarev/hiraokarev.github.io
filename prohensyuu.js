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
const bioInput = document.getElementById("settingsBio");
const saveButton = document.getElementById("saveSettings");

const displayName = document.getElementById("displayName");
const displayRegion = document.getElementById("displayRegion");
const displayAge = document.getElementById("displayAge");

// modal elements
const modal = document.getElementById('editModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalSaveBtn = document.getElementById('saveBtn');
const modalCancelBtn = document.getElementById('cancelBtn');

let currentField = null; // '名前' | '住んでいるエリア' | '年齢'

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      nameInput.value = data.name || "";
      regionSelect.value = data.region || "";
      ageInput.value = data.age || "";
      bioInput.value = data.bio || "";

      displayName.textContent = nameInput.value || '未設定';
      displayRegion.textContent = regionSelect.value || '未設定';
      displayAge.textContent = ageInput.value ? `${ageInput.value}歳` : '未設定';
    }
  } else {
    window.location.href = "register.html"; // ログインしていない場合
  }
});

// List item -> open modal
document.querySelectorAll('.list-item').forEach(item => {
  item.addEventListener('click', () => {
    currentField = item.dataset.field;
    modalTitle.textContent = `${currentField} を編集`;

    if (currentField === '名前') {
      modalBody.innerHTML = `<input type="text" id="editInput" value="${nameInput.value || ''}">`;
    } else if (currentField === '住んでいるエリア') {
      const areas = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","静岡県","愛知県","三重県","大阪府","兵庫県","京都府","奈良県","滋賀県","和歌山県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];
      let options = `<option value="">未設定</option>`;
      areas.forEach(a => { options += `<option ${regionSelect.value === a ? 'selected' : ''}>${a}</option>`; });
      modalBody.innerHTML = `<select id="editInput">${options}</select>`;
    } else if (currentField === '年齢') {
      let options = `<option value="">未設定</option>`;
      for (let i = 18; i <= 80; i++) {
        options += `<option ${String(ageInput.value) === String(i) ? 'selected' : ''}>${i}</option>`;
      }
      modalBody.innerHTML = `<select id="editInput">${options}</select>`;
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });
});

// Modal actions
modalSaveBtn.addEventListener('click', () => {
  const val = document.getElementById('editInput').value || '';
  if (currentField === '名前') {
    nameInput.value = val;
    displayName.textContent = val || '未設定';
  } else if (currentField === '住んでいるエリア') {
    regionSelect.value = val;
    displayRegion.textContent = val || '未設定';
  } else if (currentField === '年齢') {
    ageInput.value = val;
    displayAge.textContent = val ? `${val}歳` : '未設定';
  }
  modal.style.display = 'none';
  document.body.style.overflow = '';
});

modalCancelBtn.addEventListener('click', () => {
  modal.style.display = 'none';
  document.body.style.overflow = '';
});

saveButton.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      name: nameInput.value || '',
      region: regionSelect.value || '',
      age: ageInput.value || '',
      bio: bioInput.value || ''
    }, { merge: true });
    alert("保存しました");
  }
});