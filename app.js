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
let lastWinWidth = window.innerWidth;

class HorizontalSection {
  constructor(element) {
    this.section = element;
    this.sticky = this.section.querySelector(".hscroll__sticky");
    this.rail = this.section.querySelector(".hscroll__rail");
    this.maxTranslateX = 0;
    this.sectionScrollLen = 0;
    this.sectionTop = 0; // Cache offsetTop
    
    // Bind methods
    this.compute = this.compute.bind(this);
    this.update = this.update.bind(this);
  }

  compute() {
    if (!this.rail || !this.sticky) return;
    
    // Cache section top position to avoid layout thrashing in update loop
    // Note: scrollY is added because getBoundingClientRect is relative to viewport, 
    // but we need absolute document position or just use offsetTop if parent is relative/body
    // Using offsetTop is safer if no transforms on parents
    this.sectionTop = this.section.offsetTop;

    const railWidth = this.rail.scrollWidth;
    const viewportW = window.innerWidth;
    
    this.maxTranslateX = Math.max(0, railWidth - viewportW);
    this.sectionScrollLen = this.maxTranslateX;
    
    // Ensure sticky container has stable height for calculations
    const stickyH = this.sticky.getBoundingClientRect().height;
    this.section.style.height = `${stickyH + this.sectionScrollLen}px`;
    
    this.update();
  }

  update(customScrollY) {
    if (!this.rail) return;
    
    const scrollY = customScrollY !== undefined ? customScrollY : window.scrollY;
    
    // Use cached sectionTop
    const raw = (scrollY - this.sectionTop) / (this.sectionScrollLen || 1);
    const progress = Math.max(0, Math.min(1, raw));
    
    // Use floating point for smoother sub-pixel rendering
    const x = -(progress * this.maxTranslateX);
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

/* ===== Lenis Smooth Scroll ===== */
// Check if device is mobile
const isMobile = window.innerWidth < 768;

let lenis;

if (!isMobile) {
  lenis = new Lenis({
    lerp: 0.1,
    smoothWheel: true,
    touchMultiplier: 1.5 
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  lenis.on('scroll', (e) => {
    // Update horizontal sections
    scrollers.forEach(s => s.update(e.scroll));
    
    // Close overlay if open
    if (overlay && overlay.classList.contains("open")) {
      closeOverlay();
    }
  });
} else {
  // Native scroll for mobile with RAF throttling
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        scrollers.forEach(s => s.update(scrollY));
        
        // Close overlay if open
        if (overlay && overlay.classList.contains("open")) {
          closeOverlay();
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// Optimize resize: only re-compute if width changes (ignores mobile URL bar toggle)
window.addEventListener("resize", () => {
  if (window.innerWidth !== lastWinWidth) {
    lastWinWidth = window.innerWidth;
    scrollers.forEach(s => s.compute());
  }
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

// Scroll listener removed (handled by Lenis)

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

/* ===== Project Data ===== */
const projectData = {
  nicare: {
    year: "2022",
    category: "Interior / Branding",
    title: "Nicarè city apartments",
    images: ["progetti/nicare.png"]
  },
  bambu: {
    year: "2025",
    category: "Product",
    title: "Bambù",
    images: ["progetti/BAMBU.png"]
  },
  discovolante: {
    year: "2025",
    category: "Product",
    title: "Disco Volante",
    images: ["progetti/DISCO VOLANTE.png"]
  },
  pescheria: {
    year: "2024",
    category: "Branding",
    title: "Pescheria La Fontanella",
    images: []
  },
  petitcadeau: {
    year: "2026",
    category: "Product",
    title: "Petit Cadeau",
    images: [
      "progetti/Petit cadeau.png",
      "progetti/Petit cadeau 2.png",
      "progetti/Petit cadeau 3.png"
    ]
  }
};

/* ===== Project Page Logic ===== */
function initProjectPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');
  
  if (!projectId || !projectData[projectId]) return;
  
  const data = projectData[projectId];
  
  // Update Meta
  const yearEl = document.getElementById('project-year');
  const catEl = document.getElementById('project-category');
  const titleEl = document.getElementById('project-title');
  const descEl = document.getElementById('project-description');
  const galleryEl = document.getElementById('project-gallery');
  
  if(yearEl) yearEl.textContent = data.year;
  if(catEl) catEl.textContent = data.category;
  if(titleEl) titleEl.textContent = data.title;
  
  // Update Description (Language dependent - handled by language switcher but we set initial here)
  // actually language switcher handles translations based on data-i18n. 
  // We need to inject the specific translation key for the description.
  // But wait, the description is long text. The language switcher usually looks for elements with data-i18n.
  // We can set the data-i18n attribute dynamically.
  
  if(descEl) {
    descEl.setAttribute('data-i18n', `project_${projectId}_desc`);
    // Also set initial text based on current lang (default 'it')
    const currentLang = localStorage.getItem('lang') || 'it';
    if(translations[currentLang] && translations[currentLang][`project_${projectId}_desc`]) {
       descEl.innerHTML = translations[currentLang][`project_${projectId}_desc`];
    }
  }

  // Render Gallery
  if(galleryEl && data.images && data.images.length > 0) {
    // Add specific class for project and category
    galleryEl.classList.add(`project-${projectId}`);
    if (data.category.toLowerCase().includes('product')) {
      galleryEl.classList.add('gallery-product');
    }
    
    galleryEl.innerHTML = data.images.map(src => 
      `<div class="gallery-item">
        <img src="${src}" alt="${data.title}" loading="lazy" onclick="openLightbox('${src}')">
       </div>`
    ).join('');

    // Generate Dots
    const dotsEl = document.getElementById('project-dots');
    if (dotsEl && data.images.length > 1) {
        // Add project specific class to dots container for styling
        dotsEl.classList.add(`project-${projectId}`);
        
        dotsEl.innerHTML = data.images.map((_, i) => 
            `<span class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
        ).join('');

        // Add Click to Scroll logic
        const dots = dotsEl.querySelectorAll('.dot');
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const index = parseInt(dot.getAttribute('data-index'));
                const images = galleryEl.querySelectorAll('img');
                if (images[index]) {
                    images[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                }
            });
        });

        // Add Scroll Spy logic
        const updateDots = () => {
            const scrollLeft = galleryEl.scrollLeft;
            const width = galleryEl.clientWidth; // or img width
            // Find which image is most visible
            const index = Math.round(scrollLeft / width);
            
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        };

        galleryEl.addEventListener('scroll', () => {
            // Simple debounce or throttle could be added here if needed
            window.requestAnimationFrame(updateDots);
        });

        // NEW: Align dots to the first image (center relative to image width)
        const firstImg = galleryEl.querySelector('img');
        if (firstImg) {
            const alignDots = () => {
                const w = firstImg.offsetWidth;
                if (w > 0) {
                    dotsEl.style.width = `${w}px`;
                    dotsEl.style.justifyContent = 'center';
                }
            };
            
            if (firstImg.complete) {
                alignDots();
            } else {
                firstImg.addEventListener('load', alignDots);
            }
            window.addEventListener('resize', alignDots);
        }
    } else if (dotsEl) {
        dotsEl.style.display = 'none';
    }
  }
}

/* ===== Lightbox Logic ===== */
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox ? lightbox.querySelector('img') : null;
const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;

function openLightbox(src) {
  if(!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if(!lightbox) return;
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  setTimeout(() => {
    if(lightboxImg) lightboxImg.src = '';
  }, 300);
}

if(lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
if(lightbox) {
  lightbox.addEventListener('click', (e) => {
    if(e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
  });
}

// Run if we are on project page
if (window.location.pathname.includes('project.html')) {
    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProjectPage);
    } else {
        initProjectPage();
    }
}

/* ===== Image Slider Logic ===== */
function initSliders() {
  document.querySelectorAll('.product-slider').forEach(slider => {
    const track = slider.querySelector('.product-slider-track');
    const prevBtn = slider.querySelector('.slider-btn.prev');
    const nextBtn = slider.querySelector('.slider-btn.next');
    const card = slider.closest('.product-card');
    const dots = card ? card.querySelectorAll('.dot') : [];
    
    if (!track) return;

    // Optional: Hide buttons if only 1 image (though CSS grid/flex handles it)
    const images = track.querySelectorAll('.product-image');
    if (images.length <= 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      return;
    }

    // Scroll amount = 1 image width
    const scrollAmount = () => track.clientWidth;

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
      });
    }
    
    // Update dots on scroll
    if (dots.length > 0) {
      track.addEventListener('scroll', () => {
        const scrollPos = track.scrollLeft;
        const width = track.clientWidth;
        const index = Math.round(scrollPos / width);
        
        dots.forEach((dot, i) => {
          if (i === index) dot.classList.add('active');
          else dot.classList.remove('active');
        });
      }, { passive: true });
    }
  });
}

// Init sliders if present
if (document.querySelector('.product-slider')) {
  initSliders();
}

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
    about_text: "<span class='about-line'>Sono Gaspare Richichi, un designer con formazione magistrale specializzato in Product, Interior e Graphic Design.</span><span class='about-line'>Aiuto brand, aziende e privati a trasformare le loro idee in qualcosa di concreto.</span><span class='about-line'>Ogni progetto nasce dall’ascolto, dalla ricerca e dall’attenzione al dettaglio, per arrivare a soluzioni su misura capaci di raccontare una storia e generare valore reale.</span>",
    
    // Services
    services_title: "Servizi",
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
    
    // Projects (Full Description)
    projects_title: "Progetti",
    open_project: "Apri",
    project_nicare_desc: "Nicarè city apartments è una struttura ricettiva per la quale ho curato completamente il progetto, dal design degli interni alla brand identity in un’unica visione coerente e distintiva.<br><br>L’intervento è partito dalla riconfigurazione degli spazi, studiati per offrire funzionalità, comfort e un’esperienza immersiva agli ospiti, valorizzando la luce naturale e i flussi interni.<br><br>La scelta dei materiali e degli arredi è stata guidata da un equilibrio tra estetica e durabilità, con finiture selezionate per trasmettere carattere, calore e personalità. Parallelamente, ho sviluppato l’identità visiva del brand: logo, naming, palette cromatica, tipografia e mood hanno contribuito a raccontare l’anima della struttura e a renderla riconoscibile sul mercato.<br><br>Un progetto pensato come un racconto unico, in cui spazio e immagine dialogano per creare un’esperienza memorabile e autentica per chi vi soggiorna.",
    project_bambu_desc: "Bambù è una lampada da terra a luce diretta che trasforma la verticalità in gesto luminoso. Tre sottili tubolari in metallo si innalzano con ritmo essenziale da un solido cilindro di base, componendo una struttura minimale.<br><br>La sorgente luminosa, integrata nei profili tubolari, non si rivela direttamente ma viene proiettata sulla parete, creando una scia morbida e diffusa che disegna lo spazio e ne amplifica le superfici. La luce scorre lungo l’architettura dell’ambiente, generando un’atmosfera intima e sofisticata, ideale per definire angoli e profondità senza invadere.<br><br>Ispirata a un equilibrio tra precisione tecnica e suggestione naturale, Bambù interpreta l’illuminazione come elemento architettonico: un segno verticale capace di dialogare con lo spazio e di trasformarlo attraverso riflessi calibrati e controllati.",
    project_discovolante_desc: "Disco Volante è una lampada da tavolo a luce indiretta che nasce dall’incontro tra struttura e riflesso.<br><br>Una composizione essenziale di tubolari in metallo contiene la sorgente luminosa, nascosta allo sguardo, che proietta il suo bagliore su un disco a specchio sospeso, vero fulcro del progetto.<br><br>La superficie riflettente cattura la luce e la restituisce sul lato opposto, creando un’illuminazione morbida e avvolgente che dialoga con lo spazio circostante e ne modifica la percezione. Il gioco di rimbalzi luminosi genera profondità e movimento, trasformando l’oggetto in una presenza scenografica ma discreta.<br><br>Pensata come elemento funzionale e scultoreo allo stesso tempo, Disco Volante interpreta la luce come materia progettuale, capace di definire l’atmosfera e dare carattere all’ambiente con un gesto semplice e iconico.",
    project_pescheria_desc: "Per il progetto di re-branding della Pescheria La Fontanella di Palermo ho costruito una nuova identità visiva capace di coniugare memoria e contemporaneità, rispettando la forza del luogo e rinnovandone il linguaggio. L’intervento ha interessato ogni livello del brand, a partire dal disegno del logo, pensato come segno essenziale ma fortemente riconoscibile.<br><br>La palette cromatica è stata selezionata per richiamare il mare, la freschezza del prodotto e la luce mediterranea, mentre la scelta tipografica ha definito un carattere solido, elegante ed autentico, capace di dialogare con la tradizione artigianale della bottega ed i nuovi supporti.<br><br>Il progetto si è esteso alle applicazioni fisiche del brand: divise, shopping bag e biglietti da visita sono stati concepiti come elementi narrativi, coerenti e funzionali, in grado di trasformare l’esperienza d’acquisto in un gesto identitario.<br><br>Un lavoro di sintesi tra storia e innovazione, in cui grafica e spazio commerciale si incontrano per restituire alla pescheria un’immagine rinnovata, contemporanea e profondamente radicata nel territorio.",
    project_petitcadeau_desc: "Petit Cadeau è una bomboniera contemporanea che unisce materia e tecnologia in un oggetto dal valore simbolico e duraturo. Al suo interno è integrato un chip NFC che, una volta avvicinato allo smartphone, permette di accedere ad una pagina dedicata contenente il biglietto di laurea e la tesi del festeggiato, trasformando il ricordo in un’esperienza digitale da conservare nel tempo e condividere con i propri cari.<br><br>Il progetto nasce dall’idea di superare il concetto tradizionale di bomboniera, rendendolo interattivo e su misura. Ogni elemento è completamente personalizzabile: dalle forme ai materiali, fino ai contenuti digitali, costruiti per raccontare in modo unico il traguardo celebrato.<br><br>Petit Cadeau diventa così un ponte tra fisico e virtuale, tra gesto celebrativo e archivio di memoria, capace di racchiudere in un piccolo oggetto un racconto più ampio, intimo e significativo.",
    
    // Projects (Short Description)
    project_nicare_short: "Nicarè city apartments è una struttura ricettiva per la quale ho curato completamente il progetto, dal design degli interni alla brand identity.",
    project_bambu_short: "Bambù è una lampada da terra a luce diretta che trasforma la verticalità in gesto luminoso.",
    project_discovolante_short: "Disco Volante è una lampada da tavolo a luce indiretta che nasce dall’incontro tra struttura e riflesso.",
    project_pescheria_short: "Per il progetto di re-branding della Pescheria La Fontanella ho costruito una nuova identità visiva capace di coniugare memoria e contemporaneità.",
    project_petitcadeau_short: "Petit Cadeau è una bomboniera contemporanea che unisce materia e tecnologia in un oggetto dal valore simbolico e duraturo.",
    
    // Project Page
    back_home: "Torna alla Home",
    images_coming_soon: "Immagini in arrivo...",
    nav_about: "Chi sono",
    nav_services: "Servizi",
    nav_projects: "Progetti",
    nav_contacts: "Contatti",

    // CV
    download_title: "Scarica Portfolio",
    cv_download_text: "Scarica ora",
    
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
    product_lamp_title: "Bambù",
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
    about_text: "<span class='about-line'>I am Gaspare Richichi, a designer with a master's degree specializing in Product, Interior, and Graphic Design.</span><span class='about-line'>I help brands, companies, and individuals transform their ideas into something concrete.</span><span class='about-line'>Every project is born from listening, research, and attention to detail, arriving at tailored solutions capable of telling a story and generating real value.</span>",
    
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
    
    // Projects (Full Description)
    projects_title: "Projects",
    open_project: "Open",
    project_nicare_desc: "Nicarè city apartments is an accommodation facility for which I completely curated the project, from interior design to brand identity in a single coherent and distinctive vision.<br><br>The intervention started from the reconfiguration of spaces, designed to offer functionality, comfort, and an immersive experience for guests, enhancing natural light and internal flows.<br><br>The choice of materials and furnishings was guided by a balance between aesthetics and durability, with finishes selected to convey character, warmth, and personality. At the same time, I developed the brand's visual identity: logo, naming, color palette, typography, and mood contributed to telling the soul of the structure and making it recognizable on the market.<br><br>A project conceived as a unique story, in which space and image dialogue to create a memorable and authentic experience for those who stay there.",
    project_bambu_desc: "Bambù is a direct light floor lamp that transforms verticality into a luminous gesture. Three thin metal tubes rise with essential rhythm from a solid base cylinder, composing a minimal structure.<br><br>The light source, integrated into the tubular profiles, is not revealed directly but is projected onto the wall, creating a soft and diffused trail that draws the space and amplifies its surfaces. The light flows along the architecture of the environment, generating an intimate and sophisticated atmosphere, ideal for defining corners and depths without invading.<br><br>Inspired by a balance between technical precision and natural suggestion, Bambù interprets lighting as an architectural element: a vertical sign capable of dialoguing with space and transforming it through calibrated and controlled reflections.",
    project_discovolante_desc: "Disco Volante is an indirect light table lamp born from the encounter between structure and reflection.<br><br>An essential composition of metal tubes contains the light source, hidden from view, which projects its glow onto a suspended mirror disc, the true fulcrum of the project.<br><br>The reflecting surface captures the light and returns it to the opposite side, creating soft and enveloping lighting that dialogues with the surrounding space and modifies its perception. The play of light bounces generates depth and movement, transforming the object into a scenographic but discreet presence.<br><br>Conceived as a functional and sculptural element at the same time, Disco Volante interprets light as design material, capable of defining the atmosphere and giving character to the environment with a simple and iconic gesture.",
    project_pescheria_desc: "For the re-branding project of Pescheria La Fontanella in Palermo, I built a new visual identity capable of combining memory and contemporaneity, respecting the strength of the place and renewing its language. The intervention involved every level of the brand, starting from the logo design, conceived as an essential but highly recognizable sign.<br><br>The color palette was selected to recall the sea, the freshness of the product, and the Mediterranean light, while the typographic choice defined a solid, elegant, and authentic character, capable of dialoguing with the artisan tradition of the shop and the new supports.<br><br>The project extended to the physical applications of the brand: uniforms, shopping bags, and business cards were conceived as narrative elements, coherent and functional, able to transform the purchasing experience into an identifying gesture.<br><br>A work of synthesis between history and innovation, in which graphics and commercial space meet to restore to the fishmonger a renewed, contemporary image deeply rooted in the territory.",
    project_petitcadeau_desc: "Petit Cadeau is a contemporary favor that combines material and technology in an object of symbolic and lasting value. Integrated inside is an NFC chip that, once approached to the smartphone, allows access to a dedicated page containing the graduation card and the thesis of the celebrated person, transforming the memory into a digital experience to keep over time and share with loved ones.<br><br>The project stems from the idea of overcoming the traditional concept of favor, making it interactive and made-to-measure. Every element is completely customizable: from shapes to materials, up to digital contents, built to tell the celebrated milestone in a unique way.<br><br>Petit Cadeau thus becomes a bridge between physical and virtual, between celebratory gesture and memory archive, capable of enclosing a wider, intimate, and significant story in a small object.",
    
    // Projects (Short Description)
    project_nicare_short: "Nicarè city apartments is an accommodation facility for which I completely curated the project, from interior design to brand identity.",
    project_bambu_short: "Bambù is a direct light floor lamp that transforms verticality into a luminous gesture.",
    project_discovolante_short: "Disco Volante is an indirect light table lamp born from the encounter between structure and reflection.",
    project_pescheria_short: "For the re-branding project of Pescheria La Fontanella, I built a new visual identity capable of combining memory and contemporaneity.",
    project_petitcadeau_short: "Petit Cadeau is a contemporary favor that combines material and technology in an object of symbolic and lasting value.",
    
    // Project Page
    back_home: "Back to Home",
    images_coming_soon: "Images coming soon...",
    nav_about: "About",
    nav_services: "Services",
    nav_projects: "Projects",
    nav_contacts: "Contact",

    // CV
    download_title: "Download Portfolio",
    cv_download_text: "Download now",
    
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
    product_lamp_title: "Bambù",
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

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('preferred_lang') || 'it';
  
  // Project Page Logic
  if (window.location.pathname.includes("project.html")) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const data = projectData[id];
    
    if (data) {
      document.getElementById("project-year").textContent = data.year;
      document.getElementById("project-category").textContent = data.category;
      document.getElementById("project-title").textContent = data.title;
      document.getElementById("project-description").setAttribute("data-i18n", `project_${id}_desc`);
    }
  }

  // Set Language (triggers text update)
  setLanguage(savedLang);

  // Event Listeners per i pulsanti lingua
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Evita chiusura menu se cliccato
      setLanguage(btn.dataset.lang);
    });
  });

  // Mobile Toolkit Click Logic removed

  // Mobile Project Hover Effect (IntersectionObserver)
  if (window.innerWidth < 768) {
    const projectCards = document.querySelectorAll('.card--project');
    
    if (projectCards.length > 0) {
      const observerOptions = {
        root: null, // viewport
        rootMargin: '0px -15% 0px -15%', // Activate when centered (narrower trigger zone)
        threshold: 0.6 // 60% visibility required
      };

      const projectObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('hover-active');
          } else {
            entry.target.classList.remove('hover-active');
          }
        });
      }, observerOptions);

      projectCards.forEach(card => projectObserver.observe(card));
    }

    // CV Button Animation (Removed)
    /*
    const cvBtn = document.querySelector('.cv-btn');
    if (cvBtn) {
      const cvObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          } else {
            entry.target.classList.remove('active');
          }
        });
      }, { threshold: 0.5 });
      cvObserver.observe(cvBtn);
    }
    */
  }
});

/* ===== Download Button Logic ===== */
document.addEventListener('DOMContentLoaded', () => {
  const dlInput = document.querySelector('.dl-input');
  const dlLabel = document.querySelector('.dl-label');

  if (dlInput && dlLabel) {
    dlInput.addEventListener('change', () => {
      if (dlInput.checked) {
        // Trigger Download
        const link = document.createElement('a');
        link.href = 'portfolio-GR.pdf';
        link.download = 'Portfolio_Gaspare_Richichi.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
    
    dlLabel.addEventListener('click', (e) => {
      if (dlInput.checked) {
        e.preventDefault(); // Prevent unchecking
        window.open('portfolio-GR.pdf', '_blank');
      }
    });
  }
});
