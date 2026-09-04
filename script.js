/* ================================================================E
   OUR LITTLE UNIVERSE — script.js
   Organized in clearly commented modules. Search for "CUSTOMIZE"
   to find the spots you'll want to edit with your own content.
   ================================================================ */
'use strict';

/* ---------- CUSTOMIZE: key dates ---------- */
const UNLOCK_DATE = new Date('2025-11-05T00:00:00');
const RELATIONSHIP_START = new Date('2026-01-04T00:00:00');

document.addEventListener('DOMContentLoaded', () => {
  initBackgroundEffects();
  initLockSystem();
  initNavbar();
  initBackToTop();
  initSmoothScroll();
  buildReasonsGrid();
  buildGallery();
  buildMusicGrid();
  document.getElementById('footerYear').textContent = new Date().getFullYear();
});

/* ================================================================
   TOAST HELPER
   ================================================================ */
function showToast(message, icon = 'bi-heart-fill') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = 'toast align-items-center border-0';
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body"><i class="bi ${icon} me-2"></i>${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;
  container.appendChild(el);
  const toast = new bootstrap.Toast(el, { delay: 3200 });
  toast.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}
// small throttle so hover events don't spam toasts
let lastReasonToast = 0;
function throttledToast(message, icon) {
  const now = Date.now();
  if (now - lastReasonToast > 2500) {
    showToast(message, icon);
    lastReasonToast = now;
  }
}

/* ================================================================
   BACKGROUND: constellation stars + floating hearts + mouse glow
   ================================================================ */
function initBackgroundEffects() {
  // --- stars canvas ---
  const canvas = document.getElementById('starCanvas');
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const count = Math.floor((canvas.width * canvas.height) / 9000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.3 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.015 + 0.005
    }));
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      s.twinkle += s.speed;
      const alpha = 0.35 + Math.sin(s.twinkle) * 0.35;
      ctx.beginPath();
      ctx.fillStyle = `rgba(240, 221, 170, ${Math.max(alpha, 0.05)})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();

  // --- floating hearts ---
  const field = document.getElementById('heartField');
  const heartGlyphs = ['❤', '♥', '✦'];
  function spawnHeart() {
    const el = document.createElement('span');
    el.className = 'drift';
    el.textContent = heartGlyphs[Math.floor(Math.random() * heartGlyphs.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.setProperty('--drift-x', (Math.random() * 80 - 40) + 'px');
    el.style.fontSize = (0.8 + Math.random() * 1.4) + 'rem';
    const duration = 10 + Math.random() * 10;
    el.style.animationDuration = duration + 's';
    field.appendChild(el);
    setTimeout(() => el.remove(), duration * 1000 + 500);
  }
  for (let i = 0; i < 8; i++) setTimeout(spawnHeart, i * 800);
  setInterval(spawnHeart, 1600);

  // --- mouse glow + card tilt ---
  const glow = document.getElementById('mouseGlow');
  window.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });

  document.addEventListener('mousemove', e => {
    const card = e.target.closest('.reason-card, .music-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(700px) rotateX(${py * -6}deg) rotateY(${px * 6}deg) translateY(-4px)`;
  });
  document.addEventListener('mouseout', e => {
    const card = e.target.closest('.reason-card, .music-card');
    if (card) card.style.transform = '';
  });
}

/* ================================================================
   LOCK SYSTEM + COUNTDOWN
   ================================================================ */
function initLockSystem() {
  document.body.classList.add('locked');
  const lockScreen = document.getElementById('lockScreen');
  const lockCard = lockScreen.querySelector('.lock-card');
  const mainSite = document.getElementById('mainSite');
  const unlockForm = document.getElementById('unlockForm');
  const unlockInput = document.getElementById('unlockDate');
  const lockStatus = document.getElementById('lockStatus');
  const lockIcon = document.getElementById('lockIcon');

  const dEl = document.getElementById('cd-days');
  const hEl = document.getElementById('cd-hours');
  const mEl = document.getElementById('cd-mins');
  const sEl = document.getElementById('cd-secs');

  // The countdown below is purely informational — it shows how far away
  // our special day is, but it does NOT unlock the site automatically.
  // The site only unlocks when the correct date is typed into the form.
  // function tick() {
  //   const now = new Date();
  //   const diff = now + UNLOCK_DATE;
  //   const days = Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)), 0);
  //   const hours = Math.max(Math.floor((diff / (1000 * 60 * 60)) % 24), 0);
  //   const mins = Math.max(Math.floor((diff / (1000 * 60)) % 60), 0);
  //   const secs = Math.max(Math.floor((diff / 1000) % 60), 0);
  //   dEl.textContent = String(days).padStart(2, '0');
  //   hEl.textContent = String(hours).padStart(2, '0');
  //   mEl.textContent = String(mins).padStart(2, '0');
  //   sEl.textContent = String(secs).padStart(2, '0');
  // }
  // tick();
  // setInterval(tick, 1000);

  function unlockSite() {
    lockStatus.innerHTML = '<i class="bi bi-unlock-fill"></i> Unlocked';
    lockStatus.classList.add('status-unlocked');
    lockIcon.innerHTML = '<i class="bi bi-unlock-fill"></i>';
    lockIcon.classList.add('unlocked');
    playChime();
    showToast('Welcome Love ❤️', 'bi-unlock-fill');

    setTimeout(() => {
      lockScreen.classList.add('animate__animated', 'animate__fadeOutUp');
      setTimeout(() => {
        lockScreen.style.display = 'none';
        document.body.classList.remove('locked');
        mainSite.classList.add('revealed');
        AOS.init({ duration: 900, once: true, easing: 'ease-out-cubic' });
        initTypedLetter();
      }, 700);
    }, 900);
  }

  unlockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = unlockInput.value; // format: YYYY-MM-DD from <input type="date">
    if (!entered) {
      showToast('Please enter a date first ❤️', 'bi-calendar-heart');
      return;
    }

    // compare only year/month/day, ignoring time and timezone
    const [y, m, d] = entered.split('-').map(Number);
    const isCorrect = (y === UNLOCK_DATE.getFullYear()
      && m === UNLOCK_DATE.getMonth() + 1
      && d === UNLOCK_DATE.getDate());

    if (isCorrect) {
      unlockForm.querySelector('button').disabled = true;
      unlockSite();
    } else {
      showToast("That's not quite our special day ❤️", 'bi-lock-fill');
      lockCard.classList.remove('shake');
      void lockCard.offsetWidth; // restart animation
      lockCard.classList.add('shake');
    }
  });
}

function playChime() {
  try {
    const audio = new Audio('music/chime.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {/* file not provided yet — silently ignore */});
  } catch (e) { /* no-op */ }
}

/* ================================================================
   NAVBAR: glass-on-scroll + relationship timer + reveal-driven AOS
   ================================================================ */
function initNavbar() {
  const nav = document.getElementById('mainNav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
  // relationship live timer runs regardless of nav scroll
  startRelationshipTimer();
}

function startRelationshipTimer() {
  const dEl = document.getElementById('rt-days');
  const hEl = document.getElementById('rt-hours');
  const minEl = document.getElementById('rt-mins');
  const sEl = document.getElementById('rt-secs');

  function update() {
    const now = new Date();
    let diffMs = now - RELATIONSHIP_START;
    if (diffMs < 0) diffMs = 0;

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diffMs / (1000 * 60)) % 60);
    const secs = Math.floor((diffMs / 1000) % 60);

    dEl.textContent = days;
    hEl.textContent = hours;
    minEl.textContent = mins;
    sEl.textContent = secs;
  }
  update();
  setInterval(update, 1000);
}

/* ================================================================
   BACK TO TOP
   ================================================================ */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 600);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ================================================================
   SMOOTH SCROLL + MOBILE NAV COLLAPSE
   ================================================================ */
function initSmoothScroll() {
  document.querySelectorAll('.smooth-link').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      const navCollapse = document.getElementById('navMenu');
      if (navCollapse.classList.contains('show')) {
        bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
      }
    });
  });
}

/* ================================================================
   SECTION 3 — REASONS WHY I LOVE YOU  (CUSTOMIZE the list below)
   ================================================================ */
const REASONS = [
  { icon: 'bi-emoji-smile', title: 'Your Smile', text: 'It lights up every room, and every one of my days.' },
  { icon: 'bi-heart', title: 'Your Kindness', text: 'The gentle way you treat everyone around you.' },
  { icon: 'bi-hourglass-split', title: 'Your Patience', text: 'Even when I don\u2019t make it easy.' },
  { icon: 'bi-person-hearts', title: 'Your Hugs', text: 'The safest place I know.' },
  { icon: 'bi-emoji-laughing', title: 'Your Laugh', text: 'My favorite sound in the whole world.' },
  { icon: 'bi-eye-fill', title: 'Your Eyes', text: 'I could get lost in them, on purpose, every time.' },
  { icon: 'bi-shield-heart', title: 'Your Support', text: 'You believe in me even when I don\u2019t.' },
  { icon: 'bi-award', title: 'Your Loyalty', text: 'Steady, certain, and never in question.' },
  { icon: 'bi-stars', title: 'Your Personality', text: 'There\u2019s truly no one else like you.' },
  { icon: 'bi-infinity', title: 'Everything About You', text: 'Every little detail, all of it.' },
  { icon: 'bi-chat-heart', title: 'Our Conversations', text: 'Hours feel like minutes when we talk.' },
  { icon: 'bi-music-note-beamed', title: 'Your Playlist', text: 'You make even car rides feel cinematic.' },
  { icon: 'bi-brightness-high', title: 'Your Energy', text: 'You make ordinary days feel bright.' },
  { icon: 'bi-hand-thumbs-up', title: 'Your Encouragement', text: 'Always my loudest cheerleader.' },
  { icon: 'bi-cup-hot', title: 'Lazy Mornings', text: 'The quiet, unhurried moments with you.' },
  { icon: 'bi-umbrella', title: 'You, In Any Weather', text: 'Rain or shine, you\u2019re still my favorite forecast.' },
  { icon: 'bi-book-heart', title: 'Our Little Jokes', text: 'The ones only we understand.' },
  { icon: 'bi-heart-arrow', title: 'How You Love', text: 'Fully, gently, and without conditions.' }
];

function buildReasonsGrid() {
  const grid = document.getElementById('reasonsGrid');
  const toastLines = [
    'Another reason I fall in love with you ❤️',
    'And there are so many more…',
    'You, in every little detail ❤️'
  ];
  REASONS.forEach((r, i) => {
    const col = document.createElement('div');
    col.className = 'col-6 col-md-4 col-lg-3';
    col.setAttribute('data-aos', 'fade-up');
    col.setAttribute('data-aos-delay', String((i % 4) * 80));
    col.innerHTML = `
      <div class="reason-card glass-card">
        <i class="bi ${r.icon} reason-icon"></i>
        <h4>${r.title}</h4>
        <p>${r.text}</p>
        <span class="mini-heart"><i class="bi bi-heart-fill"></i></span>
      </div>`;
    const card = col.querySelector('.reason-card');
    card.addEventListener('mouseenter', () => {
      throttledToast(toastLines[Math.floor(Math.random() * toastLines.length)], 'bi-heart-fill');
    });
    grid.appendChild(col);
  });
}

/* ================================================================
   SECTION 4 — MEMORIES GALLERY (CUSTOMIZE months / captions / photos)
   ================================================================ */
const GALLERY = [
   { month: 'October 2025', items: [
    { caption: 'The day it became official', seed: 'oct1' },
    { caption: 'The day it became official', seed: 'oct2' },
    { caption: 'The day it became official', seed: 'oct3' },
    { caption: 'The day it became official', seed: 'oct4' },
  ]},
   { month: 'November 2025', items: [
    { caption: 'Samgy Date', seed: 'nov1' },
    { caption: 'First church date', seed: 'nov3' },
    { caption: 'First church date', seed: 'nov4' },
    { caption: 'Our first photo together', seed: 'nov2' }
  ]},
  { month: 'December 2025', items: [
    { caption: 'Christmas Party', seed: 'dec1' },
    { caption: 'Our first photo together', seed: 'dec2' },
    { caption: 'Our first photo together', seed: 'dec3' },
    { caption: 'Our first photo together', seed: 'dec4' }
  ]},
   { month: 'January 2026', items: [
    { caption: 'The day it became official', seed: 'jan1' },
    { caption: 'Our first photo together', seed: 'jan2' },
    { caption: 'Our first photo together', seed: 'jan3' },
    { caption: 'Our first photo together', seed: 'jan4' }
  ]},
  { month: 'February 2026', items: [
    { caption: 'A quiet, easy Sunday', seed: 'feb1' },
    { caption: 'That little café we loved', seed: 'feb21' },
    { caption: 'That little café we loved', seed: 'feb3' },
    { caption: 'That little café we loved', seed: 'feb4' }
  ]},
  { month: 'March 2026', items: [
    { caption: 'The trip we still talk about', seed: 'march1' },
    { caption: 'The trip we still talk about', seed: 'march2' },
    { caption: 'The trip we still talk about', seed: 'march3' },
    { caption: 'You, mid-laugh', seed: 'march4' }
  ]},
  { month: 'April 2026', items: [
    { caption: 'Rainy day, good company', seed: 'april1' },
    { caption: 'Rainy day, good company', seed: 'april2' },
    { caption: 'Rainy day, good company', seed: 'april3' },
    { caption: 'A silly selfie that became a favorite', seed: 'april4' }
  ]},
  { month: 'May 2026', items: [
    { caption: 'Celebrating something small together', seed: 'may1' },
    { caption: 'Golden hour, both of us', seed: 'may2' },
    { caption: 'Golden hour, both of us', seed: 'may3' },
    { caption: 'Golden hour, both of us', seed: 'may4' }
  ]},
  { month: 'June 2026', items: [
    { caption: 'My Favorite View ❤️', seed: 'june1' },
    { caption: 'Effortlessly Gorgeous 🌟', seed: 'june2' },
    { caption: 'Pretty in Every Way ✨', seed: 'june3' },
    { caption: 'Golden Girl 🌼', seed: 'june4' }
  ]},
   { month: 'July 2026', items: [
    { caption: 'My Favorite View ❤️', seed: 'july1' },
    { caption: 'Effortlessly Gorgeous 🌟', seed: 'july2' },
    { caption: 'Pretty in Every Way ✨', seed: 'july3' },
    { caption: 'Golden Girl 🌼', seed: 'july4' }
  ]},
   { month: 'August 2026', items: [
    { caption: 'My Favorite View ❤️', seed: 'Aug2' },
    { caption: 'Effortlessly Gorgeous 🌟', seed: 'Aug1' },
    { caption: 'Pretty in Every Way ✨', seed: 'Aug3' },
    { caption: 'Golden Girl 🌼', seed: 'Aug4' }
  ]}
];

function imgUrl(seed, w = 700, h = 500) {
 const extensions = {
    pahina: 'png',
    Julie: 'jpeg',
    'dec1': 'jpg',
    'dec2': 'JPG',
    'dec3': 'jfif',
    'dec4': 'jfif',
    'jan1': 'jfif',
    'jan2': 'jfif',
    'jan3': 'jfif',
    'jan4': 'jfif',
    'feb1': 'jfif',
    'feb21': 'jfif',
    'feb3': 'jfif',
    'feb4': 'jfif',
    'march1': 'jfif',
    'march2': 'jfif',
    'march3': 'jfif',
    'march4': 'jfif',
    'april1': 'jfif',
    'april2': 'jfif',
    'april3': 'jfif',
    'april4': 'jfif',
    'may1': 'jfif',
    'may2': 'jfif',
    'may3': 'jfif',
    'may4': 'jfif',
    'june1': 'JPG',
    'june2': 'JPG',
    'june3': 'JPG',
    'june4': 'JPG',
    'kanibalismo': 'png',
    'july1': 'jfif',
    'july2': 'jfif',
    'july3': 'jfif',
    'july4': 'jfif',
    'Aug1': 'jfif',
    'Aug2': 'jfif',
    'Aug': 'jfif',
    'Aug4': 'jfif',
    'oct1': 'jfif',
    'oct2': 'jfif',
    'oct3': 'jfif',
    'oct4': 'jfif',
    'nov1': 'jfif',
    'nov2': 'jfif',
    'nov3': 'jfif',
    'nov4': 'jfif'
  };

  return `banner/${seed}.${extensions[seed] || 'jpg'}`;
}

function buildGallery() {
  const wrap = document.getElementById('galleryByMonth');
  const slideInner = document.getElementById('slideshowInner');
  let slideIndex = 0;

  GALLERY.forEach(group => {
    const groupEl = document.createElement('div');
    groupEl.className = 'month-group';
    groupEl.setAttribute('data-aos', 'fade-up');
    groupEl.innerHTML = `<h3 class="month-heading">${group.month}</h3>`;

    const row = document.createElement('div');
    row.className = 'row g-4';

    group.items.forEach(item => {
      const col = document.createElement('div');
      col.className = 'col-6 col-md-4 col-lg-3';
      col.innerHTML = `
        <div class="memory-card glass-card" data-img="${imgUrl(item.seed, 1000, 700)}" data-caption="${item.caption}">
          <div class="img-wrap"><img src="${imgUrl(item.seed)}" alt="${item.caption}" loading="lazy"></div>
          <div class="caption">${item.caption}</div>
        </div>`;
      row.appendChild(col);

      // add to slideshow too
      const slide = document.createElement('div');
      slide.className = 'carousel-item' + (slideIndex === 0 ? ' active' : '');
      slide.innerHTML = `<img src="${imgUrl(item.seed, 1200, 700)}" class="d-block w-100" alt="${item.caption}" loading="lazy">`;
      slideInner.appendChild(slide);
      slideIndex++;
    });

    groupEl.appendChild(row);
    wrap.appendChild(groupEl);
  });

  // Now that real slides exist in the DOM, start the carousel manually.
  // (data-bs-ride would have auto-initialized it while it was still empty.)
  const carouselEl = document.getElementById('memorySlideshow');
  new bootstrap.Carousel(carouselEl, {
    interval: 3500,
    ride: 'carousel',
    pause: 'hover',
    wrap: true,
    touch: true
  });

  // fullscreen viewer on click (plain JS — no Bootstrap Modal dependency)
  const viewer = document.getElementById('galleryViewer');
  const modalImg = document.getElementById('galleryModalImg');
  const modalCaption = document.getElementById('galleryModalCaption');
  const closeBtn = document.getElementById('galleryCloseBtn');
  let hasShownGalleryToast = false;

  function openViewer(imgSrc, caption) {
    modalImg.src = imgSrc;
    modalCaption.textContent = caption;
    viewer.classList.add('active');
    viewer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('locked'); // reuse existing scroll-lock style
    if (!hasShownGalleryToast) {
      showToast('Reliving our memories ❤️', 'bi-images');
      hasShownGalleryToast = true;
    }
  }

  function closeViewer() {
    viewer.classList.remove('active');
    viewer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('locked');
  }

  wrap.addEventListener('click', e => {
    const card = e.target.closest('.memory-card');
    if (!card) return;
    openViewer(card.dataset.img, card.dataset.caption);
  });

  closeBtn.addEventListener('click', closeViewer);
  // clicking the dark backdrop (anywhere that isn't the image or the button) also closes it
  viewer.addEventListener('click', e => {
    if (e.target === viewer) closeViewer();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && viewer.classList.contains('active')) closeViewer();
  });
}

/* ================================================================
   SECTION 5 — MUSIC (CUSTOMIZE titles / artists / audio files)
   ================================================================ */
const SONGS = [
  { title: 'Multo (Stripped Down)', artist: 'Cup of Joe', seed: 'Multo', file: 'music/song1.mp3' },
  { title: 'Sandali', artist: 'Cup of Joe', seed: 'sandali', file: 'music/song2.mp3' },
  { title: 'Kanibalismo', artist: 'Fitterkarma', seed: 'kanibalismo', file: 'music/song4.mp3' },
  { title: 'Pahina', artist: 'Cup of Joe', seed: 'pahina', file: 'music/song3.mp3' },
  { title: 'Tahanan', artist: 'El Manu', seed: 'Tahanan', file: 'music/song5.mp3' },
  { title: 'Baby You Are', artist: 'Julie Anne San Jose', seed: 'Julie', file: 'music/song6.mp3' }
];

function buildMusicGrid() {
  const grid = document.getElementById('musicGrid');
  let currentAudio = null;
  let currentCard = null;

  SONGS.forEach((song, i) => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6';
    col.setAttribute('data-aos', 'fade-up');
    col.setAttribute('data-aos-delay', String(i * 90));
    col.innerHTML = `
      <div class="music-card glass-card" data-file="${song.file}" data-title="${song.title}">
        <img
  class="music-cover"
  src="music/${song.seed}.jpg"
  alt="${song.title} cover"
  onerror="
    if(this.src.endsWith('.jpg')){
      this.src='music/${song.seed}.jpeg';
    }else if(this.src.endsWith('.jpeg')){
      this.src='music/${song.seed}.png';
    }
  ">
        <div class="music-info">
          <p class="music-title">${song.title}</p>
          <p class="music-artist">${song.artist}</p>
          <div class="equalizer"><span></span><span></span><span></span><span></span></div>
        </div>
        <i class="bi bi-play-circle music-play-icon"></i>
      </div>`;
    grid.appendChild(col);
  });

  grid.querySelectorAll('.music-card').forEach(card => {
    const icon = card.querySelector('.music-play-icon');

    card.addEventListener('mouseenter', () => {
      if (currentAudio) { currentAudio.pause(); currentCard?.classList.remove('playing'); }
      const audio = new Audio(card.dataset.file);
      audio.volume = 0.6;
      audio.play().then(() => {
        showToast(`Now Playing: ${card.dataset.title} ❤️`, 'bi-music-note-beamed');
      }).catch(() => {
        // audio file not provided yet — still show the visual state so the UI reads correctly
        showToast(`Now Playing: ${card.dataset.title} ❤️`, 'bi-music-note-beamed');
      });
      icon.className = 'bi bi-pause-circle music-play-icon';
      card.classList.add('playing');
      currentAudio = audio;
      currentCard = card;
    });

    card.addEventListener('mouseleave', () => {
      if (currentAudio) currentAudio.pause();
      icon.className = 'bi bi-play-circle music-play-icon';
      card.classList.remove('playing');
    });
  });
}

/* ================================================================
   FINAL SECTION — TYPED LOVE LETTER  (CUSTOMIZE the text)
   ================================================================ */
const LOVE_LETTER = `My Dearest Maica,

Hindi ko alam kung paano sisimulan ang sulat na ito, pero alam kong bawat salita ay galing sa pusong siguradong sigurado sa’yo. Sa dami ng taong dumaan sa buhay ko, ikaw ang nanatili hindi dahil madali, kundi dahil pinili natin ang isa’t isa kahit mahirap. At doon ko mas lalong napatunayan na ikaw ang mahal ko

Ikaw ang pahinga ko sa magulong mundo. Kapag pagod ako, sapat na ang boses mo. Kapag naliligaw ako, sapat na ang presensya mo. Hindi mo man palaging alam, pero malaki ang naitulong mo sa kung sino ako ngayon. Mas matatag, mas mapagmahal, mas totoo.

Salamat sa pagmamahal mo, sa pasensya mo, at sa paniniwala mo sa atin. Ikaw ang mahal ko ngayon, bukas, at sa lahat ng darating pa.

MARK 11:24 - Whatever you ask for in prayer, believe that you have received it, and it will be yours.`;

function initTypedLetter() {
  const el = document.getElementById('typedLetter');
  if (!el || el.dataset.typed) return; // avoid re-typing
  el.dataset.typed = 'pending';

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && el.dataset.typed === 'pending') {
        el.dataset.typed = 'true';
        new Typed('#typedLetter', {
          strings: [LOVE_LETTER.replace(/\n/g, '<br>')],
          typeSpeed: 28,
          showCursor: true,
          cursorChar: '|',
          onComplete: () => showToast('Forever yours ❤️', 'bi-envelope-heart')
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.4 });

  observer.observe(el);
}
