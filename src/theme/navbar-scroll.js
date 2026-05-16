// Client module: adds scroll + page-type classes to navbar
if (typeof window !== 'undefined') {
  const update = () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // Scroll state
    if (window.scrollY > 20) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }

    // Doc pages have a sidebar — navbar should be opaque there
    const isDocPage = !!document.querySelector('.theme-doc-sidebar-container');
    if (isDocPage) {
      navbar.classList.add('navbar--doc-page');
    } else {
      navbar.classList.remove('navbar--doc-page');
    }
  };

  window.addEventListener('scroll', update, { passive: true });

  // Run on navigation (Docusaurus SPA)
  const observer = new MutationObserver(update);
  const startObserving = () => {
    const root = document.getElementById('__docusaurus');
    if (root) observer.observe(root, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { startObserving(); update(); });
  } else {
    startObserving();
    update();
  }
}

export default {};
