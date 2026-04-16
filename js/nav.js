/* ═══ NAV — Scroll effect & Hero parallax ═══ */
// Nav scroll effect
window.addEventListener('scroll', function() {
  const nav = document.getElementById('mainNav');
  const banner = document.getElementById('promoBanner');
  if(window.scrollY > 50) {
    nav.classList.add('scrolled');
    if(banner && !banner.classList.contains('hidden')) banner.style.top = '60px';
  } else {
    nav.classList.remove('scrolled');
    if(banner && !banner.classList.contains('hidden')) banner.style.top = '68px';
  }
});

// Hero parallax on load
window.addEventListener('DOMContentLoaded', function() {
  const heroBg = document.getElementById('heroBg');
  if(heroBg) {
    setTimeout(() => heroBg.classList.add('loaded'), 100);
  }
});