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
  if (!overlay.classList.contains("open")) return;
  overlay.classList.remove("open");
  // Attendi la fine della transition (0.4s) per rimettere hidden
  setTimeout(() => {
    if (!overlay.classList.contains("open")) {
      overlay.hidden = true;
    }
  }, 400);
}
if(menuBtn) menuBtn.addEventListener("click", openOverlay);

// Close on click outside panel or on close buttons
overlay.addEventListener("click", (e) => {
  const isClickInsidePanel = e.target.closest(".overlay__panel");
  const isCloseBtn = e.target.closest("[data-close]");
  
  // Chiudi se:
  // 1. Clicco su un pulsante di chiusura (o link)
  // 2. Clicco fuori dal pannello (sul backdrop o overlay wrapper)
  if (isCloseBtn || !isClickInsidePanel) {
    closeOverlay();
  }
});

// Close on Scroll
window.addEventListener("scroll", () => {
  if (overlay.classList.contains("open")) {
    closeOverlay();
  }
}, { passive: true });

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

/* ===== Language Switcher Logic ===== */
const translations = {
  it: {
    // Menu
    menu_home: "Home",
    menu_about: "Chi sono",
    menu_services: "Servizi",
    menu_projects: "Progetti",
    menu_shop: "Shop",
    menu_contacts: "Contatti",
    
    // Hero
    hero_title: "Product, Interior<br>and Graphic designer",
    
    // About
    about_title: "Chi sono",
    about_text: "Sono Gaspare Richichi, un designer con formazione magistrale specializzato in Product, Interior e Graphic Design.<br>Aiuto brand, aziende e privati a trasformare le loro idee in qualcosa di concreto.<br>Ogni progetto nasce dall’ascolto, dalla ricerca e dall’attenzione al dettaglio, per arrivare a soluzioni su misura capaci di raccontare una storia e generare valore reale.",
    
    // Services
    services_title: "Servizi",
    services_subtitle: "Soluzioni su misura per ogni esigenza.",
    book_now: "Prenota ora",
    ideal_for: "Ideale per:",
    
    // Service: Consulenza
    service_consultation_title: "Consulenza Gratuita",
    service_consultation_desc: "Una call conoscitiva per analizzare le tue esigenze e capire come possiamo collaborare.",
    
    // Service: Brand
    service_brand_title: "Brand Identity & Comunicazione",
    service_brand_li1: "Progettazione logo",
    service_brand_li2: "Sistema di identità visiva",
    service_brand_li3: "Materiali cartacei, packaging, social",
    service_brand_li4: "Palette colori e tipografia",
    service_brand_li5: "Brand book e linee guida",
    service_brand_ideal: "startup, negozi, ristoranti, professionisti, piccoli brand.",
    
    // Service: Web
    service_web_title: "Progettazione Sito Web",
    service_web_li1: "Design UI/UX personalizzato",
    service_web_li2: "Sviluppo Responsive (Mobile/Desktop)",
    service_web_li3: "Ottimizzazione performance e SEO base",
    service_web_li4: "Gestione contenuti (CMS)",
    service_web_li5: "Supporto al lancio",
    service_web_ideal: "professionisti e aziende che vogliono distinguersi online.",
    
    // Service: Product
    service_product_title: "Progettazione Prodotto",
    service_product_li1: "Analisi richieste e ricerca",
    service_product_li2: "Ideazione Concept",
    service_product_li3: "Sketching e modellazione 3D",
    service_product_li4: "Render fotorealistici",
    service_product_li5: "Disegni tecnici e supporto produzione",
    service_product_ideal: "artigiani, privati, aziende, brand di arredo.",
    
    // Service: Interior
    service_interior_title: "Interni Residenziali e Commerciali",
    service_interior_li1: "Rilievo e sviluppo planimetria",
    service_interior_li2: "Layout e ridistribuzione spazi",
    service_interior_li3: "Concept d’interni",
    service_interior_li4: "Scelta arredi e materiali",
    service_interior_li5: "Render fotorealistici ambienti",
    service_interior_li6: "Proposta finale e supporto",
    service_interior_ideal: "clienti privati, imprenditori, locali commerciali, agenzie immobiliari.",
    
    // Projects
    projects_title: "Progetti",
    projects_subtitle: "Continua a scorrere verso il basso: qui i contenuti si muovono lateralmente.",
    open_project: "Apri",
    project_desc_placeholder: "Descrizione breve. Sostituisci con contenuti reali.",
    
    // CV
    cv_download_text: "Scarica ora i miei progetti",
    
    // Contacts
    contacts_title: "Contatti",
    contacts_intro: "Hai un progetto in mente? Scrivimi o vieni a trovarmi.",
    label_name: "Nome e Cognome",
    label_email: "Email",
    label_phone: "Numero di telefono",
    label_message: "Messaggio",
    btn_send: "Invia richiesta",
    
    // Footer
    footer_rights: "Tutti i diritti riservati",
    
    // Shop
    shop_title: "Shop",
    product_status: "su richiesta",
    product_lamp_title: "LAMPADA DESIGN",
    product_material: "100% MADE IN ITALY",
    dm_order: "DM FOR ORDER"
  },
  en: {
    // Menu
    menu_home: "Home",
    menu_about: "About",
    menu_services: "Services",
    menu_projects: "Projects",
    menu_shop: "Shop",
    menu_contacts: "Contact",
    
    // Hero
    hero_title: "Product, Interior<br>and Graphic Designer",
    
    // About
    about_title: "About me",
    about_text: "I am Gaspare Richichi, a designer with a master's degree specializing in Product, Interior, and Graphic Design.<br>I help brands, companies, and individuals transform their ideas into something concrete.<br>Every project is born from listening, research, and attention to detail, arriving at tailored solutions capable of telling a story and generating real value.",
    
    // Services
    services_title: "Services",
    services_subtitle: "Tailored solutions for every need.",
    book_now: "Book now",
    ideal_for: "Ideal for:",
    
    // Service: Consultation
    service_consultation_title: "Free Consultation",
    service_consultation_desc: "A discovery call to analyze your needs and understand how we can collaborate.",
    
    // Service: Brand
    service_brand_title: "Brand Identity & Communication",
    service_brand_li1: "Logo design",
    service_brand_li2: "Visual identity system",
    service_brand_li3: "Print materials, packaging, social",
    service_brand_li4: "Color palette and typography",
    service_brand_li5: "Brand book and guidelines",
    service_brand_ideal: "startups, shops, restaurants, professionals, small brands.",
    
    // Service: Web
    service_web_title: "Web Design",
    service_web_li1: "Custom UI/UX Design",
    service_web_li2: "Responsive Development (Mobile/Desktop)",
    service_web_li3: "Performance optimization and basic SEO",
    service_web_li4: "Content management (CMS)",
    service_web_li5: "Launch support",
    service_web_ideal: "professionals and companies wanting to stand out online.",
    
    // Service: Product
    service_product_title: "Product Design",
    service_product_li1: "Request analysis and research",
    service_product_li2: "Concept Ideation",
    service_product_li3: "Sketching and 3D modeling",
    service_product_li4: "Photorealistic renders",
    service_product_li5: "Technical drawings and production support",
    service_product_ideal: "artisans, private individuals, companies, furniture brands.",
    
    // Service: Interior
    service_interior_title: "Residential & Commercial Interiors",
    service_interior_li1: "Survey and floor plan development",
    service_interior_li2: "Layout and space redistribution",
    service_interior_li3: "Interior Concept",
    service_interior_li4: "Furniture and material selection",
    service_interior_li5: "Photorealistic environment renders",
    service_interior_li6: "Final proposal and support",
    service_interior_ideal: "private clients, entrepreneurs, commercial premises, real estate agencies.",
    
    // Projects
    projects_title: "Projects",
    open_project: "Open",
    project_desc_placeholder: "Short description. Replace with real content.",
    
    // CV
    cv_download_text: "Download my projects now",
    
    // Contacts
    contacts_title: "Contact",
    contacts_intro: "Have a project in mind? Write to me or come visit.",
    label_name: "Name and Surname",
    label_email: "Email",
    label_phone: "Phone number",
    label_message: "Message",
    btn_send: "Send request",
    
    // Footer
    footer_rights: "All rights reserved",
    
    // Shop
    shop_title: "Shop",
    product_status: "on request",
    product_lamp_title: "DESIGN LAMP",
    product_material: "100% MADE IN ITALY",
    dm_order: "DM FOR ORDER"
  }
};

function setLanguage(lang) {
  // Validazione lingua supportata
  if (!translations[lang]) return;

  // Salva preferenza
  localStorage.setItem('preferred_lang', lang);
  document.documentElement.lang = lang;

  // Aggiorna stato pulsanti
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Aggiorna testi
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[lang][key]) {
      // Use innerHTML to preserve tags like <br>
      el.innerHTML = translations[lang][key];
    }
  });
}

// Inizializzazione Lingua
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('preferred_lang') || 'it';
  setLanguage(savedLang);

  // Event Listeners per i pulsanti
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Evita chiusura menu se cliccato
      setLanguage(btn.dataset.lang);
    });
  });
});
