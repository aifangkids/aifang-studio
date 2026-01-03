// ----------------- POPUP -----------------
const popup = document.getElementById('popup');
const popupSlides = document.getElementById('popup-slides');
const popupClose = document.getElementById('popup-close');
let currentSlide = 0;

// 自動掃描 ./images/popup/ 生成圖片列表
// 注意：由於瀏覽器安全限制，無法直接讀取資料夾
// 需要你在 api.js 或後端提供圖片清單 JSON
// 我們這裡使用手動陣列，如果你將來想自動掃描，可用後端 API 返回圖片列表
let popupImages = [
    "./images/popup/popup_01.jpg",
    "./images/popup/popup_02.jpg",
    "./images/popup/popup_03.jpg"
];

// 初始化 POPUP
function initPopup() {
    popupSlides.innerHTML = '';

    if (!popupImages || popupImages.length === 0) return;

    popupImages.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.style.width = "100%";
        img.style.height = "400px"; // 統一尺寸
        img.style.objectFit = "cover";
        popupSlides.appendChild(img);
    });

    showSlide(currentSlide);

    // 只有沒關過才顯示
    if (!localStorage.getItem('popupClosed')) {
        popup.style.display = 'flex';
    }
}

// 顯示指定輪播
function showSlide(index) {
    const slides = popupSlides.querySelectorAll('img');
    slides.forEach(s => s.style.display = 'none');
    slides[index].style.display = 'block';
}

// 自動輪播
setInterval(() => {
    if (!popup || popup.style.display === 'none') return;
    currentSlide = (currentSlide + 1) % popupImages.length;
    showSlide(currentSlide);
}, 3000);

// 關閉 POPUP
popupClose.addEventListener('click', () => {
    popup.style.display = 'none';
    localStorage.setItem('popupClosed', 'true');
});

// 初始化
initPopup();
