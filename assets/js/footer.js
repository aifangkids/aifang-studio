// 自動載入 footer.html
function loadFooter() {
  const footerDiv = document.getElementById('footer');
  if (!footerDiv) return;

  fetch('/partials/footer.html')
    .then(res => res.text())
    .then(html => {
      footerDiv.innerHTML = html;
      setFooterYear();
      initBackToTop();
    })
    .catch(err => console.error('Footer load error:', err));
}

// 更新版權年份
function setFooterYear() {
  const yearSpan = document.getElementById('year');
  if(yearSpan){
    yearSpan.textContent = new Date().getFullYear();
  }
}

// 回到頂部功能
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if(!btn) return;

  window.addEventListener('scroll', () => {
    if(window.scrollY > 200){
      btn.style.display = 'flex';
    } else {
      btn.style.display = 'none';
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({top:0, behavior:'smooth'});
  });
}

// DOMContentLoaded 時自動載入 Footer
document.addEventListener('DOMContentLoaded', loadFooter);
