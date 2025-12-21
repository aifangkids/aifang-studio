// assets/js/detail.js
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("detail-container");
  if (!container) return;

  /* =========================
     Skeleton
  ========================= */
  container.innerHTML = `
    <div class="detail-skeleton">
      <div class="skeleton-img"></div>
      <div class="skeleton-text"></div>
      <div class="skeleton-text short"></div>
    </div>
  `;

  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  if (!code) {
    container.innerHTML = "<p>商品代碼錯誤</p>";
    return;
  }

  const detail = await fetchDetailByCode(code);
  if (!detail) {
    container.innerHTML = "<p>找不到商品資料</p>";
    return;
  }

  /* =========================
     初始狀態
  ========================= */
  let currentColorIndex = 0;
  let currentSlideIndex = 0;
  let selectedSize = null;
  let selectedPrice = null;

  /* =========================
     Helpers
  ========================= */
  function renderPrice(size) {
    if (!size) return "";
    if (size.salePrice) {
      return `
        <span class="price-sale">NT$ ${size.salePrice}</span>
        <span class="price-origin">NT$ ${size.price}</span>
      `;
    }
    return `<span class="price-sale">NT$ ${size.price}</span>`;
  }

  function buildSizeOptions() {
    const groups = detail.sizes || {};
    let html = "";
    Object.values(groups).forEach(group => {
      if (!group) return;
      html += `
        <div class="size-group">
          <h4>${group.label}</h4>
          <div class="size-options">
            ${group.options.map(opt =>
              `<button class="size-btn" data-price="${group.price}" data-sale="${group.salePrice || ""}">
                ${opt}
              </button>`
            ).join("")}
          </div>
        </div>
      `;
    });
    return html;
  }

  function renderCarousel() {
    const imgs = detail.carousel?.[currentColorIndex] || detail.carousel || [];
    if (!imgs.length) return "";
    return `
      <div class="carousel-track">
        ${imgs.map((img, i) =>
          `<img src="${img}" class="carousel-img ${i === 0 ? "active" : ""}">`
        ).join("")}
      </div>
      <button class="carousel-prev">‹</button>
      <button class="carousel-next">›</button>
    `;
  }

  function updateCarousel(direction) {
    const imgs = container.querySelectorAll(".carousel-img");
    imgs[currentSlideIndex].classList.remove("active");
    currentSlideIndex =
      (currentSlideIndex + direction + imgs.length) % imgs.length;
    imgs[currentSlideIndex].classList.add("active");
  }

  function addToCart() {
    if (!selectedSize) {
      alert("請先選擇尺寸");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const itemKey = `${detail.code}_${currentColorIndex}_${selectedSize}`;

    const existing = cart.find(i => i.key === itemKey);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        key: itemKey,
        code: detail.code,
        name: detail.name,
        brand: detail.brand,
        colorIndex: currentColorIndex,
        size: selectedSize,
        price: selectedPrice,
        qty: 1,
        image: detail.carousel?.[currentColorIndex]?.[0] || ""
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    document.dispatchEvent(new Event("cartUpdated"));
    alert("已加入購物車");
  }

  /* =========================
     Render
  ========================= */
  container.innerHTML = `
    <h1 class="detail-title">${detail.name}</h1>
    <div class="detail-meta">${detail.brand} ｜ ${detail.category}</div>

    <section class="detail-carousel">
      ${renderCarousel()}
    </section>

    <section class="detail-colors">
      ${(detail.colors || []).map((c, i) => `
        <span class="color-swatch ${i === 0 ? "active" : ""}"
              data-index="${i}"
              style="${c.type === "hex" ? `background:${c.value}` : ""}">
          ${c.type === "image" ? `<img src="${c.value}">` : ""}
        </span>
      `).join("")}
    </section>

    <section class="detail-price" id="price-box">請選擇尺寸</section>

    <section class="detail-sizes">
      ${buildSizeOptions()}
    </section>

    <button class="btn btn-primary" id="add-to-cart">加入購物車</button>

    <section class="detail-info">
      <p><strong>材質：</strong>${detail.material || "-"}</p>
      <p><strong>商品說明：</strong>${detail.description || "-"}</p>
      <p><strong>本集造型：</strong>${detail.stylingtips || "-"}</p>
    </section>

    <section class="detail-sizechart">
      <h3>尺寸表</h3>
      <table>
        <tbody>
          ${(detail.sizechartinfo || []).map(row =>
            `<tr><td>${row}</td></tr>`
          ).join("")}
        </tbody>
      </table>
    </section>

    <section class="detail-images">
      ${(detail.detailImages || []).map(img =>
        `<img src="${img}">`
      ).join("")}
    </section>
  `;

  /* =========================
     Events
  ========================= */
  container.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      selectedSize = btn.textContent.trim();
      selectedPrice = btn.dataset.sale || btn.dataset.price;
      document.getElementById("price-box").innerHTML =
        renderPrice({
          price: btn.dataset.price,
          salePrice: btn.dataset.sale
        });
    });
  });

  container.querySelectorAll(".color-swatch").forEach(sw => {
    sw.addEventListener("click", () => {
      container.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("active"));
      sw.classList.add("active");

      currentColorIndex = Number(sw.dataset.index);
      currentSlideIndex = 0;
      container.querySelector(".detail-carousel").innerHTML = renderCarousel();
    });
  });

  container.addEventListener("click", e => {
    if (e.target.classList.contains("carousel-prev")) updateCarousel(-1);
    if (e.target.classList.contains("carousel-next")) updateCarousel(1);
  });

  document.getElementById("add-to-cart").addEventListener("click", addToCart);
});
