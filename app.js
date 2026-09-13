// Main script for What Heart Says Clone
document.addEventListener('DOMContentLoaded', () => {
  // Mobile navigation menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('open');
      const isExpanded = navMenu.classList.contains('open');
      menuToggle.setAttribute('aria-expanded', isExpanded);
    });

    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        navMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        navMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Demo tab configurations
  const demos = {
    bday: {
      url: 'card-interactive.html?type=bday&autoplay=1&preview=1',
      caption: 'A real sample card, playing live.',
      ctaText: 'Create a Birthday Card →',
      ctaUrl: 'create.html?flow=bday'
    },
    prop: {
      url: 'card-interactive.html?type=prop&autoplay=1&preview=1',
      caption: 'Live demo — go on, try tapping “No”.',
      ctaText: 'Create a Proposal →',
      ctaUrl: 'create.html?flow=prop'
    },
    sorry: {
      url: 'card-interactive.html?type=sorry&autoplay=1&preview=1',
      caption: 'A real sample card, playing live.',
      ctaText: 'Create a Sorry Card →',
      ctaUrl: 'create.html?flow=sorry'
    },
    anniv: {
      url: 'card-interactive.html?type=anniv&autoplay=1&preview=1',
      caption: 'A real sample card, playing live.',
      ctaText: 'Create an Anniversary Card →',
      ctaUrl: 'create.html?flow=anniv'
    }
  };

  const tabs = document.querySelectorAll('.demo-tab');
  const cardPlayerIframe = document.getElementById('cardPlayerIframe');
  const demoCaption = document.getElementById('demoCaption');
  const demoCtaBtn = document.getElementById('demoCtaBtn');

  function switchDemo(flow) {
    const config = demos[flow];
    if (!config) return;

    tabs.forEach(tab => {
      if (tab.dataset.demo === flow) {
        tab.classList.add('on');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('on');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    if (cardPlayerIframe) {
      cardPlayerIframe.src = config.url;
    }
    if (demoCaption) {
      demoCaption.textContent = config.caption;
    }
    if (demoCtaBtn) {
      demoCtaBtn.textContent = config.ctaText;
      demoCtaBtn.href = config.ctaUrl;
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const flow = tab.dataset.demo;
      switchDemo(flow);
    });
  });

  // Hero pill buttons trigger demo switch & scroll
  const heroPills = document.querySelectorAll('.mhc-hero-pill');
  heroPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const flow = pill.dataset.flow;
      if (flow) {
        switchDemo(flow);
        const demoSection = document.getElementById('demo');
        if (demoSection) {
          demoSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Menu links with data-flow
  const menuFlowLinks = document.querySelectorAll('#navMenu [data-flow]');
  menuFlowLinks.forEach(link => {
    link.addEventListener('click', () => {
      const flow = link.dataset.flow;
      if (flow) {
        switchDemo(flow);
        if (navMenu) navMenu.classList.remove('open');
      }
    });
  });

  // Anniversary Countdown animation ticker
  const dEl = document.getElementById('counterDays');
  const hEl = document.getElementById('counterHrs');
  const mEl = document.getElementById('counterMin');
  const sEl = document.getElementById('counterSec');

  if (dEl && hEl && mEl && sEl) {
    let targetTime = new Date().getTime() + (14 * 86400000) + (8 * 3600000) + (42 * 60000) + (19 * 1000);

    setInterval(() => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetTime - now);
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      dEl.textContent = String(days).padStart(2, '0');
      hEl.textContent = String(hours).padStart(2, '0');
      mEl.textContent = String(mins).padStart(2, '0');
      sEl.textContent = String(secs).padStart(2, '0');
    }, 1000);
  }
});
