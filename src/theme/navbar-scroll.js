// Client module: adds 'navbar--scrolled' class to navbar on scroll
if (typeof window !== 'undefined') {
  const onScroll = () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      if (window.scrollY > 20) {
        navbar.classList.add('navbar--scrolled');
      } else {
        navbar.classList.remove('navbar--scrolled');
      }
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  // Run once on load
  onScroll();
}

export default {};
