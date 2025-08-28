// フッターのナビゲーションバークリック遷移
document.querySelectorAll(".footer-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    const target = e.currentTarget.dataset.target;
    if (target) {
      window.location.href = target;
    }
  });
});