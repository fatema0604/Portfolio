/* Mobile hamburger nav */
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('hamburger');
  const links = document.getElementById('navlinks');
  if(!btn || !links) return;

  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
  });

  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', false);
  }));
});
