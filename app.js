 /**
 * Pinned horizontal section controllata dallo scroll verticale.
 * Logica:
 * - La sezione .hscroll deve avere altezza totale sufficiente a “consumare” lo scroll necessario
 *   per traslare orizzontalmente la rail fino in fondo.
 * - All’interno c’è un contenitore sticky che resta fermo mentre la rail viene traslata in X.
 */

const overlay = document.getElementById("overlay");
const menuBtn = document.getElementById("menuBtn");

/* ===== Horizontal Scroll Logic (Multi-instance) ===== */
const scrollers = [];

class HorizontalSection {
  constructor(element) {
    this.section = element;
    this.sticky = this.section.querySelector(".hscroll__sticky");
    this.rail = this.section.querySelector(".hscroll__rail");
    this.maxTranslateX = 0;
    this.sectionScrollLen = 0;
    
    // Bind methods
    this.compute = this.compute.bind(this);
    this.update = this.update.bind(this);
  }

  compute() {
    if (!this.rail || !this.sticky) return;
    
    const railWidth = this.rail.scrollWidth;
    const viewportW = window.innerWidth;
    
    this.maxTranslateX = Math.max(0, railWidth - viewportW);
    this.sectionScrollLen = this.maxTranslateX;
    
    const stickyH = this.sticky.getBoundingClientRect().height;
    this.section.style.height = `${stickyH + this.sectionScrollLen}px`;
    
    this.update();
  }

  update() {
    if (!this.rail) return;
    
    const sectionTop = this.section.offsetTop;
    const scrollY = window.scrollY;
    
    const raw = (scrollY - sectionTop) / (this.sectionScrollLen || 1);
    const progress = Math.max(0, Math.min(1, raw));
    
    const x = -Math.round(progress * this.maxTranslateX);
    this.rail.style.transform = `translate3d(${x}px,0,0)`;
  }
}

function initScrollers() {
  // Pulisci array se necessario (in caso di re-init dinamico, qui non serve)
  scrollers.length = 0;
  document.querySelectorAll(".hscroll").forEach(sec => {
    const instance = new HorizontalSection(sec);
    instance.compute();
    scrollers.push(instance);
  });
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    scrollers.forEach(s => s.update());
    ticking = false;
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => {
  scrollers.forEach(s => s.compute());
}, { passive: true });

// Init
initScrollers();

/* ===== Overlay About ===== */
function openOverlay() {
  overlay.hidden = false;
  // force reflow
  void overlay.offsetWidth;
  overlay.classList.add("open");
}
function closeOverlay() {
  overlay.classList.remove("open");
  // Attendi la fine della transition (0.4s) per rimettere hidden
  setTimeout(() => {
    if (!overlay.classList.contains("open")) {
      overlay.hidden = true;
    }
  }, 400);
}
if(menuBtn) menuBtn.addEventListener("click", openOverlay);
overlay.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) closeOverlay();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overlay.classList.contains("open")) closeOverlay();
});

/* ===== Scroll Reveal ===== */
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));
