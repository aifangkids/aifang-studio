document.addEventListener('DOMContentLoaded', async () => {
    const products = await fetchProducts();
    renderNewArrivals(products);
    renderCollection(products);
});

function renderNewArrivals(products){
    const container = document.getElementById('new-arrivals');
    const newItems = products.filter(p=>p.is_new).slice(0,2);
    container.innerHTML = newItems.map(p=>`
        <div class="p-card" onclick="showDetail('${p.code}')">
            <div class="p-img-box">
                <img class="p-img-main" src="${p.image_main}">
                ${p.image_extra.length ? `<img class="p-img-hover" src="${p.image_extra[0]}">` : ''}
            </div>
            <div class="p-info">
                <div class="p-name">${p.name}</div>
                <div class="p-price">NT$ ${p.price_min}${p.price_max>p.price_min?` - ${p.price_max}`:''}</div>
            </div>
        </div>
    `).join('');
}

function renderCollection(products){
    const container = document.getElementById('collection');
    const collectionItems = products.slice(2);
    container.innerHTML = collectionItems.map(p=>`
        <div class="p-card" onclick="showDetail('${p.code}')">
            <div class="p-img-box"><img src="${p.image_main}"></div>
            <div class="p-info">${p.name} / ${p.price_min}</div>
        </div>
    `).join('');
}

function showDetail(code){
    window.location.href = `detail.html?id=${code}`;
}

function openNav(id){
    document.getElementById(id).classList.add('active');
    document.getElementById('overlay').style.display='block';
}
function closeAll(){
    document.getElementById('left-menu').classList.remove('active');
    document.getElementById('right-cart').classList.remove('active');
    document.getElementById('overlay').style.display='none';
}
