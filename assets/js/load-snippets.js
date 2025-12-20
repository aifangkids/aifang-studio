async function loadSnippet(id,url){
  const html=await fetch(url).then(r=>r.text());
  document.getElementById(id).innerHTML=html;
}
loadSnippet('header-placeholder','assets/snippets/header.html');
loadSnippet('footer-placeholder','assets/snippets/footer.html');

window.addEventListener('scroll',()=>{
  const btn=document.getElementById('backToTop');
  btn.style.display = (window.scrollY>200)?'flex':'none';
});
document.getElementById('backToTop').addEventListener('click',()=>{
  window.scrollTo({top:0, behavior:'smooth'});
});
