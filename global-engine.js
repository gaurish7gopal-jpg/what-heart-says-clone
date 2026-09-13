// Global Currency & Social Proof Engine for What Heart Says Ultra
(function () {
  const CURRENCIES = {
    INR: { symbol: '₹', base: 199, orig: 499, code: 'INR', discount: '60% OFF' },
    USD: { symbol: '$', base: 4.99, orig: 11.99, code: 'USD', discount: '58% OFF' },
    EUR: { symbol: '€', base: 4.49, orig: 10.99, code: 'EUR', discount: '59% OFF' },
    GBP: { symbol: '£', base: 3.99, orig: 9.99, code: 'GBP', discount: '60% OFF' },
    AED: { symbol: 'AED ', base: 19, orig: 45, code: 'AED', discount: '58% OFF' }
  };

  let currentCurrency = localStorage.getItem('whs_currency') || 'INR';

  function formatPrice(amount, currCode) {
    const info = CURRENCIES[currCode] || CURRENCIES.INR;
    return typeof amount === 'number' && amount % 1 !== 0 
      ? `${info.symbol}${amount.toFixed(2)}` 
      : `${info.symbol}${amount}`;
  }

  function updatePagePrices() {
    const info = CURRENCIES[currentCurrency] || CURRENCIES.INR;
    
    // Update all elements with data-price-base
    document.querySelectorAll('[data-price-base]').forEach(el => {
      el.textContent = formatPrice(info.base, currentCurrency);
    });

    // Update all elements with data-price-orig
    document.querySelectorAll('[data-price-orig]').forEach(el => {
      el.textContent = formatPrice(info.orig, currentCurrency);
    });

    // Update discount badges
    document.querySelectorAll('[data-price-discount]').forEach(el => {
      el.textContent = info.discount;
    });

    // Update CTA button labels
    const getCardBtn = document.getElementById('getCardBtn');
    if (getCardBtn) {
      getCardBtn.textContent = `Get this at ${formatPrice(info.base, currentCurrency)}`;
    }
    
    const demoCtaBtn = document.getElementById('demoCtaBtn');
    if (demoCtaBtn && demoCtaBtn.dataset.flowText) {
      demoCtaBtn.textContent = `${demoCtaBtn.dataset.flowText} (${formatPrice(info.base, currentCurrency)}) →`;
    }
  }

  function setCurrency(code) {
    if (CURRENCIES[code]) {
      currentCurrency = code;
      localStorage.setItem('whs_currency', code);
      updatePagePrices();
      document.querySelectorAll('.currency-selector select').forEach(sel => {
        sel.value = code;
      });
    }
  }

  // Live Social Proof Notification Engine (Simulates real-time global virality)
  const SOCIAL_EVENTS = [
    { name: 'Kavya from Bengaluru', action: 'just sent an Anniversary Card 💞', time: '12s ago' },
    { name: 'Liam from New York', action: 'opened his Proposal Card 💍 (She said YES!)', time: '34s ago' },
    { name: 'Rohan from Mumbai', action: 'created a Virtual Birthday Bash 🎂', time: '1m ago' },
    { name: 'Zara from Dubai', action: 'unlocked a Heartfelt Sorry Card 🙏', time: '2m ago' },
    { name: 'Elena from Berlin', action: 'scheduled a midnight surprise card ✨', time: '3m ago' },
    { name: 'Aditi from Delhi', action: 'sent love to her best friend 💌', time: '4m ago' }
  ];

  function initSocialProof() {
    const toast = document.createElement('div');
    toast.className = 'whs-social-toast';
    toast.id = 'whsSocialToast';
    toast.innerHTML = `
      <div class="toast-avatar">💌</div>
      <div class="toast-content">
        <div class="toast-title" id="toastTitle">Someone in London</div>
        <div class="toast-desc" id="toastDesc">just personalized a Birthday Card</div>
      </div>
      <span class="toast-time" id="toastTime">Just now</span>
    `;
    document.body.appendChild(toast);

    let eventIdx = 0;
    function showNextToast() {
      const ev = SOCIAL_EVENTS[eventIdx % SOCIAL_EVENTS.length];
      eventIdx++;
      
      const titleEl = document.getElementById('toastTitle');
      const descEl = document.getElementById('toastDesc');
      const timeEl = document.getElementById('toastTime');
      
      if (titleEl && descEl && timeEl) {
        titleEl.textContent = ev.name;
        descEl.textContent = ev.action;
        timeEl.textContent = ev.time;
        toast.classList.add('visible');

        setTimeout(() => {
          toast.classList.remove('visible');
        }, 4500);
      }
    }

    // First trigger after 4s, then every 14s
    setTimeout(() => {
      showNextToast();
      setInterval(showNextToast, 14000);
    }, 4000);
  }

  window.WHS_Global = {
    setCurrency,
    formatPrice,
    getCurrentCurrency: () => currentCurrency,
    getCurrencies: () => CURRENCIES
  };

  document.addEventListener('DOMContentLoaded', () => {
    updatePagePrices();
    initSocialProof();
  });
})();
