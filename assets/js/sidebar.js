// sidebar.js
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');

    if (!sidebar || !toggleBtn) return; // 防呆：元素不存在就不做任何事

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // 動態生成分類列表 (如果有 data)
    const categories = window.categories || []; // 假設全域變數 categories
    const categoryList = document.getElementById('category-list');
    if (categoryList && categories.length > 0) {
        categoryList.innerHTML = '';
        categories.forEach(cat => {
            const li = document.createElement('li');
            li.textContent = cat;
            categoryList.appendChild(li);
        });
    }

    // 防呆：監聽子元素點擊
    if (categoryList) {
        categoryList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                console.log('點擊分類:', e.target.textContent);
            }
        });
    }
});
