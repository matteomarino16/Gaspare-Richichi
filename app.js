 /**
 * Pinned horizontal section controllata dallo scroll verticale.
 * Logica:
 * - La sezione .hscroll deve avere altezza totale sufficiente a “consumare” lo scroll necessario
 *   per traslare orizzontalmente la rail fino in fondo.
 * - All’interno c’è un contenitore sticky che resta fermo mentre la rail viene traslata in X.
 */

const hscroll = document.querySelector(".hscroll");
const sticky = document.querySelector(".hscroll__sticky");
const rail = document.getElementById("rail");

const overlay = document.getElementById("overlay");
const aboutBtn = document.getElementById("aboutBtn");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let maxTranslateX = 0;   // quanto dobbiamo traslare a sinistra (valore positivo)
let sectionScrollLen = 0; // lunghezza di scroll verticale dedicata alla corsa orizzontale
let ticking = false;

function compute() {
  // Larghezza totale della rail (tutti i card) + padding incluso (scrollWidth)
  const railWidth = rail.scrollWidth;

  // Larghezza visibile (viewport)
  const viewportW = window.innerWidth;

  // Quanto serve scorrere orizzontalmente in totale:
  // se railWidth <= viewportW => nessuna corsa
  maxTranslateX = Math.max(0, railWidth - viewportW);

  // La lunghezza di scroll verticale che useremo per completare la corsa orizzontale
  // (1px scroll verticale = 1px movimento orizzontale, semplice e lineare)
  sectionScrollLen = maxTranslateX;

  // Altezza totale della sezione:
  // sticky occupa (viewport - topbar) ma serve “spazio extra” per scrollare e guidare l’orizzontale
  const stickyH = sticky.getBoundingClientRect().height;

  // Altezza totale = stickyH + sectionScrollLen
  hscroll.style.height = `${stickyH + sectionScrollLen}px`;

  // Applica posizione coerente dopo resize
  update();
}

function update() {
  // posizione della sezione rispetto al documento
  const sectionTop = hscroll.offsetTop;
  const scrollY = window.scrollY;

  // Inizio della fase “pinned”: quando la sezione arriva sotto la topbar
  const start = sectionTop;
  const end = sectionTop + sectionScrollLen;

  // progress 0..1 nella finestra dedicata
  const raw = (scrollY - start) / (sectionScrollLen || 1);
  const progress = Math.max(0, Math.min(1, raw));

  // Traslazione X (0 -> -maxTranslateX)
  const x = -Math.round(progress * maxTranslateX);

  // Applica transform
  // (use translate3d per performance)
  rail.style.transform = `translate3d(${x}px,0,0)`;
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    update();
    ticking = false;
  });
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", () => {
  // ricalcola quando cambia layout
  compute();
}, { passive: true });

// Init
compute();

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
aboutBtn.addEventListener("click", openOverlay);
overlay.addEventListener("click", (e) => {
  if (e.target.matches("[data-close]")) closeOverlay();
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
