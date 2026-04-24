/* ============================================
   NEXTRIP HOLIDAYS — script.js
   All working functions
   ============================================ */

function injectFloatingButtons() {
  if (document.querySelector('.floating-contact-wrap')) return;
  const buttonsHtml = `
    <div class="floating-contact-wrap">
      <a href="https://instagram.com/nextrip_holidays_" class="floating-contact-btn instagram" target="_blank" aria-label="Follow us on Instagram">
        <i class="fab fa-instagram"></i>
        <span class="floating-btn-label">Follow Us</span>
      </a>
      <a href="https://wa.me/919500123844" class="floating-contact-btn whatsapp" target="_blank" aria-label="Chat with us on WhatsApp">
        <i class="fab fa-whatsapp"></i>
        <span class="floating-btn-label">Chat with Us</span>
      </a>
    </div>
  `;
  const container = document.body || document.documentElement;
  if (container) {
    container.insertAdjacentHTML('beforeend', buttonsHtml);
    console.log('✅ Floating buttons injected');
  }
}

// Immediate check
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  injectFloatingButtons();
} else {
  document.addEventListener('DOMContentLoaded', injectFloatingButtons);
}

// ===== GLOBAL BOOKING FUNCTIONS (Defined early for availability) =====
window.openBookingModal = function () {
  console.log('✈️ Opening Unified Booking Modal...');

  // 1. Close other potential modals first
  if (typeof closeItinerary === 'function') closeItinerary();
  if (typeof closePackageModal === 'function') closePackageModal();
  if (typeof closeLightbox === 'function') closeLightbox();
  if (typeof closeProgram === 'function') closeProgram(); // For South India style

  // 2. Handle localized itinerary modals (specific IDs across different page versions)
  const itinModals = ['itineraryModal', 'siModal', 'packageModal', 'galleryLightbox', 'bookingFormModal'];
  itinModals.forEach(id => {
    const m = document.getElementById(id);
    if (m) {
      if (id === 'siModal' || id === 'itineraryModal' || id === 'bookingFormModal') {
        m.style.display = 'none';
      }
      m.classList.remove('active');
    }
  });

  // 3. Ensure Booking Modal exists and open it
  if (typeof injectBookingModal === 'function') {
    injectBookingModal();
  } else {
    // Fallback if injectBookingModal hasn't been defined yet
    console.warn('injectBookingModal not found, trying again...');
  }

  const modal = document.getElementById('bookingModal');
  if (modal) {
    // 4. Pre-fill destination from any open modal title
    const modalTitle = document.getElementById('modalTitle') || document.getElementById('siTitle');
    const destInput = document.querySelector('#quickBookingForm input[name="destination"]');
    if (destInput && modalTitle) {
      destInput.value = modalTitle.textContent.replace('Tour Itinerary', '').trim();
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

// Aliases for all possible legacy function names used in subpages
window.openModal = window.openBookingModal;
window.openBookingForm = window.openBookingModal;
window.openBooking = window.openBookingModal;

window.closeBookingModal = function () {
  const modal = document.getElementById('bookingModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

async function handleModalSubmit(e) {
  e.preventDefault();
  console.log('📝 Handling Modal Submission...');
  const form = e.target;
  const btn = form.querySelector('.modal-submit-btn');
  const originalText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = 'Processing... <i class="fa fa-spinner fa-spin"></i>';

  const formData = {
    id: 'book_' + Date.now(),
    name: form.name?.value || '',
    email: form.email?.value || '',
    phone: form.phone?.value || '',
    destination: form.destination?.value || '',
    message: form.message?.value || '',
    timestamp: new Date().toISOString()
  };

  console.log('📦 Form Data Collected:', formData);

  // 1. Save to LocalStorage (Immediate demo)
  try {
    let localBookings = JSON.parse(localStorage.getItem('nexttrip_bookings')) || [];
    localBookings.push(formData);
    localStorage.setItem('nexttrip_bookings', JSON.stringify(localBookings));
    console.log('✅ Saved to LocalStorage');
  } catch (err) {
    console.error('❌ LocalStorage Error:', err);
  }

  // 2. Save to Firebase (if configured and online)
  let cloudSaved = false;
  try {
    if (typeof db !== 'undefined' && typeof firebase !== 'undefined') {
      // Use a timeout for Firebase to prevent 'Processing...' hang
      const firebasePromise = db.collection('bookings').add({
        ...formData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase Timeout')), 5000));

      await Promise.race([firebasePromise, timeoutPromise]);
      cloudSaved = true;
      console.log('✅ Saved to Firebase');
    }
  } catch (error) {
    console.warn("⚠️ Firebase skipped/timed out (but saved locally):", error.message);
  }

  // Show personalized success message
  btn.innerHTML = 'Process Completed! <i class="fa fa-check"></i>';
  btn.style.background = '#22c55e';
  btn.style.fontSize = '14px'; // Better fit for this text

  // Clear the form
  if (typeof form.reset === 'function') form.reset();

  setTimeout(() => {
    if (typeof window.closeBookingModal === 'function') {
      window.closeBookingModal();
    }
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = originalText;
      btn.style.background = '';
      btn.style.fontSize = '';
    }, 1000);
  }, 2500);
}

function injectBookingModal() {
  if (document.getElementById('bookingModal')) return;

  const modalHtml = `
  <div class="booking-modal-overlay" id="bookingModal" style="z-index: 20000;">
    <div class="booking-modal-box">
      <button class="close-modal-btn" onclick="closeBookingModal()"><i class="fa fa-times"></i></button>
      <div class="modal-header-premium">
        <h3>Quick <span>Booking</span></h3>
        <p>Fill in the details below and we'll get back to you shortly.</p>
      </div>
      <form class="modal-booking-form" id="quickBookingForm">
        <div class="modal-form-grid">
          <div class="modal-group">
            <label>Name</label>
            <input type="text" name="name" placeholder="Your Name" required>
          </div>
          <div class="modal-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="Your Email" required>
          </div>
          <div class="modal-group">
            <label>Phone</label>
            <input type="tel" name="phone" placeholder="Your Phone" required>
          </div>
          <div class="modal-group">
            <label>Destination</label>
            <input type="text" name="destination" placeholder="Where to go?" required>
          </div>
          <div class="modal-group full">
            <label>Special Instructions</label>
            <textarea name="message" rows="3" placeholder="Tell us more..."></textarea>
          </div>
        </div>
        <button type="submit" class="modal-submit-btn">Reserve Now <i class="fa fa-paper-plane"></i></button>
      </form>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Re-attach form listener
  const form = document.getElementById('quickBookingForm');
  if (form) {
    form.removeEventListener('submit', handleModalSubmit); // Avoid duplicates
    form.addEventListener('submit', handleModalSubmit);
  }
}

function injectEntrancePopup() {
  if (document.getElementById('entrancePopup')) return;
  if (localStorage.getItem('nexttrip_popup_closed')) return;

  const popupHtml = `
    <div class="booking-modal-overlay" id="entrancePopup" style="z-index: 20001; display: flex; align-items: center; justify-content: center; opacity: 0; visibility: hidden; transition: 0.5s;">
        <div class="booking-modal-box" style="max-width: 500px; transform: scale(0.8); transition: 0.5s;">
            <button class="close-modal-btn" onclick="closeEntrancePopup()"><i class="fa fa-times"></i></button>
            <div class="modal-header-premium">
                <span class="badge" style="background: var(--primary); color: white; margin-bottom: 10px; display: inline-block;">Limited Offer!</span>
                <h3>Get <span>Best Travel</span> Offers</h3>
                <p>Subscribe to our newsletter and get exclusive deals delivered to your inbox!</p>
            </div>
            <form id="entranceForm" class="modal-booking-form">
                <div class="modal-group" style="margin-bottom: 15px;">
                    <label>Full Name</label>
                    <input type="text" name="name" placeholder="Enter your name" required class="review-input">
                </div>
                <div class="modal-group" style="margin-bottom: 15px;">
                    <label>Phone Number</label>
                    <input type="tel" name="phone" placeholder="Enter phone number" required class="review-input">
                </div>
                <div class="modal-group" style="margin-bottom: 20px;">
                    <label>Email Address</label>
                    <input type="email" name="email" placeholder="Enter your email" required class="review-input">
                </div>
                <button type="submit" class="modal-submit-btn">Join Now <i class="fa fa-sparkles"></i></button>
            </form>
        </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', popupHtml);

  const popup = document.getElementById('entrancePopup');
  const box = popup.querySelector('.booking-modal-box');

  setTimeout(() => {
    popup.style.opacity = '1';
    popup.style.visibility = 'visible';
    box.style.transform = 'scale(1)';
  }, 100);

  document.getElementById('entranceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Joining...';

    const formData = {
      id: 'inq_popup_' + Date.now(),
      name: form.name.value,
      phone: form.phone.value,
      email: form.email.value,
      destination: 'Popup Lead',
      message: 'Inquired from Entrance Popup',
      timestamp: new Date().toISOString()
    };

    // 1. Local Storage
    let local = JSON.parse(localStorage.getItem('nexttrip_inquiries')) || [];
    local.push(formData);
    localStorage.setItem('nexttrip_inquiries', JSON.stringify(local));

    // 2. Firebase
    try {
      if (typeof db !== 'undefined' && firebase.apps.length > 0) {
        await db.collection('inquiries').add({
          ...formData,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (err) { console.warn(err); }

    btn.innerHTML = 'Success!';
    setTimeout(() => {
      closeEntrancePopup();
      localStorage.setItem('nexttrip_popup_closed', 'true');
    }, 1500);
  });
}

window.closeEntrancePopup = function () {
  const popup = document.getElementById('entrancePopup');
  if (popup) {
    popup.style.opacity = '0';
    popup.style.visibility = 'hidden';
    setTimeout(() => popup.remove(), 500);
  }
};

// Auto-trigger entrance popup
setTimeout(injectEntrancePopup, 5000);

(function () {

  // --- Construction Notice Logic ---
  window.showConstructionNotice = function () {
    let notice = document.querySelector('.construction-notice');
    if (!notice) {
      notice = document.createElement('div');
      notice.className = 'construction-notice';
      notice.innerHTML = `<i class="fa fa-person-digging"></i> <span>Tour Packages under construction. Coming Soon!</span>`;
      document.body.appendChild(notice);
    }

    notice.classList.add('active');
    setTimeout(() => {
      notice.classList.remove('active');
    }, 4000);
  };



  // ===== 1. NAVBAR SCROLL =====
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (!navbar) return;
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // ===== 2. MOBILE HAMBURGER MENU =====
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      const spans = hamburger.querySelectorAll('span');
      if (mobileMenu.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });

    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
        const spans = hamburger.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  }

  // ===== 3. BOOKING TABS =====
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById('tab-' + target);
      if (targetEl) targetEl.classList.add('active');
    });
  });

  // ===== 4. FLIGHT SWAP BUTTON =====
  const swapBtn = document.getElementById('swapBtn');
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      const fromInput = document.querySelector('#tab-flight .form-item:first-child input');
      const toInput = document.querySelector('#tab-flight .swap-item input');
      if (fromInput && toInput) {
        const temp = fromInput.value;
        fromInput.value = toInput.value;
        toInput.value = temp;
      }
    });
  }

  // ===== 5. SCROLL ANIMATIONS =====
  const animEls = document.querySelectorAll(
    '.why-card, .tour-card, .testi-card, .pkg-card, .acc-item'
  );

  animEls.forEach((el, i) => {
    el.classList.add('animate-on-scroll');
    el.style.transitionDelay = (i % 4) * 0.1 + 's';
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    },
    { threshold: 0.12 }
  );

  animEls.forEach(el => observer.observe(el));

  // ===== 6. FAQ ACCORDION =====
  function toggleAcc(btn) {
    const item = btn.closest('.acc-item');
    const body = item.querySelector('.acc-body');
    const isOpen = btn.classList.contains('active');

    // Close all
    document.querySelectorAll('.acc-trigger').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.acc-body').forEach(b => b.classList.remove('open'));

    // Open clicked (if it was closed)
    if (!isOpen) {
      btn.classList.add('active');
      body.classList.add('open');
    }
  }
  window.toggleAcc = toggleAcc;

  // ===== 7. STAR RATING =====
  let currentRating = 0;
  const starInputs = document.querySelectorAll('.stars-input .star');

  starInputs.forEach(star => {
    // Hover
    star.addEventListener('mouseover', () => {
      const val = parseInt(star.dataset.val);
      highlightStars(val);
    });
    star.addEventListener('mouseleave', () => {
      highlightStars(currentRating);
    });
    // Click
    star.addEventListener('click', () => {
      currentRating = parseInt(star.dataset.val);
      highlightStars(currentRating);
    });
  });

  function highlightStars(n) {
    starInputs.forEach(s => {
      const v = parseInt(s.dataset.val);
      s.classList.toggle('active', v <= n);
    });
  }

  // ===== 8. SUBMIT REVIEW =====
  function previewReviewImage(input) {
    const preview = document.getElementById('photoPreviewArea');
    preview.innerHTML = '';
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.marginTop = '10px';
        preview.appendChild(img);
      }
      reader.readAsDataURL(input.files[0]);
    }
  }

  async function submitReview() {
    const name = document.getElementById('reviewName').value.trim();
    const text = document.getElementById('reviewText').value.trim();
    const fileInput = document.getElementById('reviewPhoto');
    const list = document.getElementById('reviewList');

    if (!name) { shakeInput('reviewName'); return; }
    if (!text) { shakeInput('reviewText'); return; }
    if (!currentRating) {
      const wrap = document.querySelector('.star-rating-wrap');
      if (wrap) { wrap.style.color = 'var(--primary)'; setTimeout(() => wrap.style.color = '', 1000); }
      alert('Please select a star rating!');
      return;
    }

    const saveToStorage = async (imgSrc = '') => {
      const btn = document.querySelector('.submit-review-btn');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Submitting... <i class="fa fa-spinner fa-spin"></i>';

      const reviewData = {
        id: 'rev_' + Date.now(),
        name: name,
        text: text,
        rating: currentRating,
        photo: imgSrc, // base64
        timestamp: new Date().toISOString()
      };

      // 1. Local Storage
      try {
        let localReviews = JSON.parse(localStorage.getItem('nexttrip_reviews')) || [];
        localReviews.push(reviewData);
        localStorage.setItem('nexttrip_reviews', JSON.stringify(localReviews));
      } catch (err) { console.warn("Local storage error:", err); }

      // 2. Firebase (with Timeout)
      try {
        if (typeof db !== 'undefined' && firebase.apps.length > 0) {
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
          const firebaseTask = db.collection('reviews').add({
            ...reviewData,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          await Promise.race([firebaseTask, timeout]);
        }
      } catch (e) {
        console.warn("Cloud save skipped or timed out:", e.message);
      }

      // Update UI locally for immediate feedback
      const stars = '★'.repeat(currentRating) + '☆'.repeat(5 - currentRating);
      const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

      const item = document.createElement('div');
      item.className = 'review-item';
      item.innerHTML = `
        <div class="review-item-header">
          <div class="review-item-avatar">${initials}</div>
          <div>
            <div class="review-item-name">${escapeHtml(name)}</div>
            <div class="review-item-stars">${stars}</div>
          </div>
        </div>
        <div class="review-item-text">${escapeHtml(text)}</div>
        ${imgSrc ? `<div class="review-item-img"><img src="${imgSrc}" style="width: 100%; border-radius: 12px; margin-top: 15px; border: 1px solid #eee;"></div>` : ''}
      `;

      list.insertBefore(item, list.firstChild);

      // Reset form & Show Success feedback
      document.getElementById('reviewName').value = '';
      document.getElementById('reviewText').value = '';
      document.getElementById('reviewPhoto').value = '';
      document.getElementById('photoPreviewArea').innerHTML = '';
      currentRating = 0;
      highlightStars(0);

      btn.innerHTML = 'Review Submitted! <i class="fa fa-check"></i>';
      btn.style.background = '#22c55e';

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.style.background = '';
      }, 4000);
    };

    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => saveToStorage(e.target.result);
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      saveToStorage();
    }
  }

  window.previewReviewImage = previewReviewImage;
  window.submitReview = submitReview;

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function shakeInput(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = 'var(--primary)';
    el.style.animation = 'shake 0.3s ease';
    el.focus();
    setTimeout(() => {
      el.style.animation = '';
      el.style.borderColor = '';
    }, 600);
  }

  // Shake animation
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }
`;
  document.head.appendChild(shakeStyle);

  // ===== 9. FAVOURITE BUTTON TOGGLE =====
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      this.classList.toggle('liked');
      const icon = this.querySelector('i');
      if (this.classList.contains('liked')) {
        icon.style.color = 'var(--primary)';
      } else {
        icon.style.color = '';
      }
    });
  });

  // ===== GALLERY SLIDER LOGIC =====
  const gallerySlider = document.getElementById('gallerySlider');
  const galleryNext = document.getElementById('galleryNext');
  const galleryPrev = document.getElementById('galleryPrev');
  const galleryProgress = document.getElementById('galleryProgress');

  if (gallerySlider) {
    let isDown = false;
    let startX;
    let scrollLeft;

    // Check Button Visibility
    const checkButtons = () => {
      galleryPrev.style.display = gallerySlider.scrollLeft <= 5 ? 'none' : 'flex';
      galleryNext.style.display = (gallerySlider.scrollLeft + gallerySlider.clientWidth >= gallerySlider.scrollWidth - 5) ? 'none' : 'flex';
    };

    // Scroll Progress & Button Check
    const updateProgress = () => {
      const scrollPercentage = (gallerySlider.scrollLeft / (gallerySlider.scrollWidth - gallerySlider.clientWidth)) * 100;
      if (galleryProgress) galleryProgress.style.width = (scrollPercentage || 0) + '%';
      checkButtons();
    };

    gallerySlider.addEventListener('scroll', updateProgress);
    window.addEventListener('resize', updateProgress);
    setTimeout(updateProgress, 500); // Initial check

    // Nav Buttons
    if (galleryNext) {
      galleryNext.addEventListener('click', () => {
        gallerySlider.scrollBy({ left: 380, behavior: 'smooth' });
      });
    }
    if (galleryPrev) {
      galleryPrev.addEventListener('click', () => {
        gallerySlider.scrollBy({ left: -380, behavior: 'smooth' });
      });
    }

    // Mouse Drag
    gallerySlider.addEventListener('mousedown', (e) => {
      isDown = true;
      gallerySlider.classList.add('active');
      startX = e.pageX - gallerySlider.offsetLeft;
      scrollLeft = gallerySlider.scrollLeft;
    });
    gallerySlider.addEventListener('mouseleave', () => {
      isDown = false;
      gallerySlider.classList.remove('active');
    });
    gallerySlider.addEventListener('mouseup', () => {
      isDown = false;
      gallerySlider.classList.remove('active');
    });
    gallerySlider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - gallerySlider.offsetLeft;
      const walk = (x - startX) * 2;
      gallerySlider.scrollLeft = scrollLeft - walk;
    });
  }

  // ===== 11. GALLERY FILTER (Enhanced for Slider) =====
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.dataset.filter;

      // Filter gallery items
      galleryItems.forEach(item => {
        const itemCategory = item.dataset.category;

        if (filterValue === 'all' || itemCategory === filterValue) {
          item.style.display = 'block';
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          }, 0);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.8)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 300);
        }
      });

      // Update slider state after filtering
      setTimeout(() => {
        if (typeof updateProgress === 'function') updateProgress();
        if (gallerySlider) gallerySlider.scrollTo({ left: 0, behavior: 'smooth' });
      }, 350);
    });
  });

  // Add transition to gallery items
  galleryItems.forEach(item => {
    item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    item.style.opacity = '1';
    item.style.transform = 'scale(1)';
  });

  // ===== GALLERY LIGHTBOX =====
  let lightboxItems = [];
  let lightboxCurrentIndex = 0;

  function buildLightboxItems() {
    lightboxItems = Array.from(document.querySelectorAll('.gallery-item'));
  }

  function openLightbox(el) {
    buildLightboxItems();
    lightboxCurrentIndex = lightboxItems.indexOf(el);
    showLightboxItem(lightboxCurrentIndex);
    document.getElementById('galleryLightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function showLightboxItem(index) {
    const item = lightboxItems[index];
    if (!item) return;
    const img = item.querySelector('img');
    const title = item.dataset.title || img.alt;
    const place = item.dataset.place || '';

    const lightboxImg = document.getElementById('lightboxImg');
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = img.src.replace(/w=\d+/, 'w=1200');
      lightboxImg.alt = title;
      lightboxImg.onload = () => { lightboxImg.style.opacity = '1'; };
    }, 150);

    document.getElementById('lightboxTitle').textContent = title;
    document.getElementById('lightboxPlace').querySelector('span').textContent = place;
  }

  function closeLightbox() {
    const lb = document.getElementById('galleryLightbox');
    if (lb) {
      lb.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => {
        const img = document.getElementById('lightboxImg');
        if (img) img.src = '';
      }, 400);
    }
  }

  function closeLightboxOnBg(e) {
    if (e.target === document.getElementById('galleryLightbox')) {
      closeLightbox();
    }
  }

  function lightboxNav(dir) {
    const visibleItems = lightboxItems.filter(item => item.style.display !== 'none');
    const currentVisible = visibleItems.indexOf(lightboxItems[lightboxCurrentIndex]);
    let nextVisible = currentVisible + dir;
    if (nextVisible < 0) nextVisible = visibleItems.length - 1;
    if (nextVisible >= visibleItems.length) nextVisible = 0;
    lightboxCurrentIndex = lightboxItems.indexOf(visibleItems[nextVisible]);
    showLightboxItem(lightboxCurrentIndex);
  }

  window.openLightbox = openLightbox;
  window.closeLightbox = closeLightbox;
  window.lightboxNav = lightboxNav;
  window.closeLightboxOnBg = closeLightboxOnBg;

  // ===== 12. DYNAMIC TOUR PACKAGES LOGIC =====
  const defaultTourData = [
    {
      id: 'south_india',
      title: 'South India Tours',
      image: 'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800',
      subPackages: [
        {
          id: 'tamilnadu',
          title: 'Tamil Nadu',
          image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600',
          description: 'Land of temples and hill stations.',
          tours: [
            {
              id: 'ooty_5d',
              title: 'Ooty Misty Hills',
              duration: '4 Days / 3 Nights',
              price: '₹12,499',
              isTrending: true,
              image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776755874/ChatGPT_Image_Apr_21_2026_12_47_19_PM_aawmvu.png',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Ooty, transfer to hotel. Evening boat ride at Ooty Lake.' },
                { day: 'Day 2', activity: 'Full day sightseeing: Botanical Garden, Rose Garden, and Doddabetta Peak.' },
                { day: 'Day 3', activity: 'Pykara Lake and Waterfalls excursion. Visit Shooting Spot.' },
                { day: 'Day 4', activity: 'Coonoor day trip via Toy Train. Transfer to Coimbatore for departure.' }
              ]
            },
            {
              id: 'kodai_4d',
              title: 'Kodaikanal Dreams',
              duration: '4 Days / 3 Nights',
              price: '₹11,999',
              image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1770711122/sample.jpg',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Kodaikanal, Leisure walk by Kodai Lake.' },
                { day: 'Day 2', activity: 'Coakers Walk, Bryant Park, and Silver Cascade Falls.' },
                { day: 'Day 3', activity: 'Pillar Rocks, Guna Caves (Devil’s Kitchen), and Pine Forest.' },
                { day: 'Day 4', activity: 'Kurinji Andavar Temple and departure.' }
              ]
            },
            {
              id: 'kanya_4d',
              title: 'Kanyakumari Spiritual',
              duration: '4 Days / 3 Nights',
              price: '₹13,500',
              image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=500',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Kanyakumari. Evening visit to the Sunset Point.' },
                { day: 'Day 2', activity: 'Vivekananda Rock Memorial and Thiruvalluvar Statue via ferry.' },
                { day: 'Day 3', activity: 'Kumari Amman Temple and Suchindram Temple visit.' },
                { day: 'Day 4', activity: 'Sunrise view and departure.' }
              ]
            },
            {
              id: 'dhanush_4d',
              title: 'Dhanushkodi Heritage',
              duration: '4 Days / 3 Nights',
              price: '₹14,200',
              image: 'https://www.solitarytraveller.com/wp-content/uploads/2021/08/10_abandoned_places_of_india_Dhanushkodi.jpg',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Rameshwaram. Visit Ramanathaswamy Temple.' },
                { day: 'Day 2', activity: 'Trip to Dhanushkodi Ghost Town and Arichal Munai (Ram Setu point).' },
                { day: 'Day 3', activity: 'Pamban Bridge view and local island tour.' },
                { day: 'Day 4', activity: 'Conclusion of tour and departure.' }
              ]
            }
          ]
        },
        {
          id: 'kerala',
          title: 'Kerala',
          image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776756222/ChatGPT_Image_Apr_21_2026_12_53_08_PM_jktxte.png',
          description: 'God’s Own Country.',
          tours: [
            {
              id: 'kerala_5d',
              title: 'Kerala Backwaters & Hills',
              duration: '5 Days / 4 Nights',
              price: '₹16,800',
              image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776756222/ChatGPT_Image_Apr_21_2026_12_53_08_PM_jktxte.png',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Cochin, drive to Munnar. Stay in resort.' },
                { day: 'Day 2', activity: 'Munnar Tea Garden tour and Eravikulam National Park.' },
                { day: 'Day 3', activity: 'Drive to Alleppey. Houseboat check-in and backwater cruise.' },
                { day: 'Day 4', activity: 'Varkala Beach excursion and leisure.' },
                { day: 'Day 5', activity: 'Departure from Cochin.' }
              ]
            }
          ]
        },
        {
          id: 'andra',
          title: 'Andhra Pradesh',
          image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776887171/ChatGPT_Image_Apr_23_2026_01_15_23_AM_kq9zzk.png',
          description: 'The City of Destiny and Spiritual Abodes.',
          tours: [
            {
              id: 'andra_4d',
              title: 'Andhra Coastal Gems',
              duration: '4 Days / 3 Nights',
              price: '₹15,500',
              image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776887171/ChatGPT_Image_Apr_23_2026_01_15_23_AM_kq9zzk.png',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Vizag. evening at RK Beach.' },
                { day: 'Day 2', activity: 'Submarine Museum and Kailasagiri Hill Park.' },
                { day: 'Day 3', activity: 'Araku Valley excursion and Borra Caves.' },
                { day: 'Day 4', activity: 'Simhachalam Temple and departure.' }
              ]
            }
          ]
        },
        {
          id: 'karnataka',
          title: 'Karnataka',
          image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776887269/ChatGPT_Image_Apr_23_2026_01_17_02_AM_tco2rq.png',
          description: 'One State, Many Worlds.',
          tours: [
            {
              id: 'karnataka_5d',
              title: 'Karnataka Heritage',
              duration: '5 Days / 4 Nights',
              price: '₹17,200',
              image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776887269/ChatGPT_Image_Apr_23_2026_01_17_02_AM_tco2rq.png',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Bangalore. Mysore Palace visit in the evening.' },
                { day: 'Day 2', activity: 'Mysore Brindavan Gardens and Chamundi Hills.' },
                { day: 'Day 3', activity: 'Drive to Coorg. Abbey Falls and Madikeri Fort.' },
                { day: 'Day 4', activity: 'Dubare Elephant Camp and Golden Temple (Bylakuppe).' },
                { day: 'Day 5', activity: 'Return to Bangalore for departure.' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'international',
      title: 'International Packages',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      subPackages: [
        {
          id: 'thailand',
          title: 'Thailand',
          image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600',
          description: 'Experience the vibrant culture and beaches of Thailand.',
          tours: [
            {
              id: 'thai_explorer',
              title: 'Thailand Explorer',
              duration: '5 Days / 4 Nights',
              price: '₹32,500',
              image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
              isTrending: true,
              itinerary: [
                { day: 'Day 1', activity: 'Bangkok City Tour & Temple Visits.' },
                { day: 'Day 2', activity: 'Floating Market and Safari World adventure.' },
                { day: 'Day 3', activity: 'Pattaya Coral Island tour with water sports.' },
                { day: 'Day 4', activity: 'Alcazar Show and Pattaya exploration.' },
                { day: 'Day 5', activity: 'Shopping at MBK Center and departure.' }
              ]
            }
          ]
        },
        {
          id: 'europe',
          title: 'Europe',
          image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600',
          description: 'Experience the magic of Europe with visits to 3 iconic cities.',
          tours: [
            {
              id: 'europe_classic',
              title: 'Classic Europe',
              duration: '4 Days / 3 Nights',
              price: '₹85,000',
              image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Paris, Eiffel Tower visit and Seine River Cruise.' },
                { day: 'Day 2', activity: 'Travel to Switzerland, exploration of the Swiss Alps and Lucerne.' },
                { day: 'Day 3', activity: 'Visit to Rome, Colosseum tour and city exploration.' },
                { day: 'Day 4', activity: 'Breakfast and departure from Rome.' }
              ]
            }
          ]
        },
        {
          id: 'australia',
          title: 'Australia',
          image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600',
          description: 'Explore the land down under with visits to Sydney, Melbourne, and Gold Coast.',
          tours: [
            {
              id: 'australia_highlights',
              title: 'Australia Highlights',
              duration: '4 Days / 3 Nights',
              price: '₹95,000',
              image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=600',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Sydney, Sydney Opera House tour and Bondi Beach.' },
                { day: 'Day 2', activity: 'Melbourne city tour and Great Ocean Road excursion.' },
                { day: 'Day 3', activity: 'Gold Coast exploration and Surfers Paradise beach.' },
                { day: 'Day 4', activity: 'Leisure time and departure from Brisbane/Gold Coast.' }
              ]
            }
          ]
        },
        {
          id: 'germany',
          title: 'Germany',
          image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776660767/Gemini_Generated_Image_lkbq8olkbq8olkbq_ilvgxt.png',
          description: 'Discover Germany’s rich history and modern charm in Berlin, Munich, and Hamburg.',
          tours: [
            {
              id: 'germany_explore',
              title: 'Germany Explorer',
              duration: '4 Days / 3 Nights',
              price: '₹75,000',
              image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776660767/Gemini_Generated_Image_lkbq8olkbq8olkbq_ilvgxt.png',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Berlin, Brandenburg Gate and Berlin Wall tour.' },
                { day: 'Day 2', activity: 'Munich city tour and visit to Neuschwanstein Castle.' },
                { day: 'Day 3', activity: 'Hamburg exploration and harbor cruise.' },
                { day: 'Day 4', activity: 'Breakfast and departure from Hamburg.' }
              ]
            }
          ]
        },
        {
          id: 'malaysia',
          title: 'Malaysia',
          image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776660769/Gemini_Generated_Image_kp70jvkp70jvkp70_xwve8f.png',
          description: 'A vibrant mix of modern skyline and natural wonders in Malaysia.',
          tours: [
            {
              id: 'malaysia_highland',
              title: 'Malaysia Highland & City',
              duration: '4 Days / 3 Nights',
              price: '₹26,500',
              image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776660769/Gemini_Generated_Image_kp70jvkp70jvkp70_xwve8f.png',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in KLIA, transfer to Kuala Lumpur. Embark on a half-day city tour featuring historical monuments, heritage areas, and cultural zones. Hotel check-in and leisure.' },
                { day: 'Day 2', activity: 'Full-day Cameron Highlands tour. Explore tea plantations (BOH/Cameron Valley), fruit orchards, and strawberry farms in the cool highland environment.' },
                { day: 'Day 3', activity: 'Transfer to Genting Highlands via Batu Caves. Enjoy the cable car ride and a full day at the Indoor Theme Park and First World Plaza.' },
                { day: 'Day 4', activity: 'Breakfast, hotel check-out, and transfer to KLIA for your onward journey.' }
              ]
            },
            {
              id: 'malaysia_sunway',
              title: 'Malaysia Sunway & City',
              duration: '4 Days / 3 Nights',
              price: '₹28,200',
              image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776660769/Gemini_Generated_Image_kp70jvkp70jvkp70_xwve8f.png',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in KLIA and transfer to your Kuala Lumpur hotel. Relax and enjoy a free evening exploring the local metropolitan culture.' },
                { day: 'Day 2', activity: 'Full-day Sunway Lagoon day tour. Explore all 6 parks including the Water Park, Amusement Park, Wildlife Park, and more.' },
                { day: 'Day 3', activity: 'Half-day Kuala Lumpur city tour visiting the Petronas Twin Towers, King\'s Palace, and historical heritage sites.' },
                { day: 'Day 4', activity: 'Breakfast and leisure time until your transfer to KLIA for departure.' }
              ]
            }
          ]
        },
        {
          id: 'singapore',
          title: 'Singapore',
          image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776667411/Gemini_Generated_Image_i4lo2i4lo2i4lo2i_hewfcq.png',
          description: 'The Lion City offers a futuristic experience with nature integrated beautifully.',
          tours: [
            {
              id: 'singapore_voyage',
              title: 'Singapore Voyage',
              duration: '4 Days / 3 Nights',
              price: '₹35,000',
              image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776667411/Gemini_Generated_Image_i4lo2i4lo2i4lo2i_hewfcq.png',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival at Changi Airport and transfer to hotel. Enjoy a half-day city tour featuring Merlion Park, Suntec City, and the bustling Civic District.' },
                { day: 'Day 2', activity: 'Experience the magic of Sentosa Island and Universal Studios Singapore. Enjoy a world of movie-themed rides and attractions across 7 immersive zones.' },
                { day: 'Day 3', activity: 'Visit the futuristic Gardens by the Bay (Flower Dome & Cloud Forest) and witness the spectacular night show at Marina Bay Sands.' },
                { day: 'Day 4', activity: 'Leisurely breakfast and shopping at Orchard Road before your transfer to the airport for departure.' }
              ]
            }
          ]
        },
        {
          id: 'andaman',
          title: 'Andaman Islands',
          image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776754462/ChatGPT_Image_Apr_21_2026_12_22_50_PM_a8ue7e.png',
          description: 'Pristine beaches and turquoise waters await you in the Andaman & Nicobar Islands.',
          tours: [
            {
              id: 'andaman_escape',
              title: 'Andaman Escape',
              duration: '6 Days / 5 Nights',
              price: '₹38,000',
              image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776754462/ChatGPT_Image_Apr_21_2026_12_22_50_PM_a8ue7e.png',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Port Blair, Cellular Jail visit and Light & Sound show.' },
                { day: 'Day 2', activity: 'Ferry to Havelock Island, visit Radhanagar Beach.' },
                { day: 'Day 3', activity: 'Elephant Beach excursion and water sports (snorkeling).' },
                { day: 'Day 4', activity: 'Travel to Neil Island, visit Bharatpur and Laxmanpur Beaches.' },
                { day: 'Day 5', activity: 'Return to Port Blair, shopping and city exploration.' },
                { day: 'Day 6', activity: 'Breakfast and departure from Port Blair.' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'boathouse',
      title: 'Boat House Tours',
      image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800',
      subPackages: [
        {
          id: 'kerala_backwaters',
          title: 'Kerala Backwaters',
          image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600',
          description: 'Experience the soul of Kerala through its serene backwaters.',
          tours: [
            {
              id: 'alleppey_5d',
              title: 'Alleppey Houseboat',
              duration: '5 Days / 4 Nights',
              price: '₹18,500',
              image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=500',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Alleppey, Check-in at Houseboat. Enjoy sunset cruise and dinner.' },
                { day: 'Day 2', activity: 'Backwater cruise through Vembanad Lake. Visit R-Block and C-Block paddy fields.' },
                { day: 'Day 3', activity: 'Village walk and local coir making units. Authentic Kerala lunch served on board.' },
                { day: 'Day 4', activity: 'Cruise towards Pathiramanal Island. Bird watching and evening relaxation on deck.' },
                { day: 'Day 5', activity: 'Breakfast on boat, check-out and transfer for your onward journey.' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'exotic',
      title: 'Exotic Tours',
      image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
      subPackages: [
        {
          id: 'exotic_tn',
          title: 'Tamil Nadu',
          image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776755895/ChatGPT_Image_Apr_21_2026_12_47_57_PM_xbn8lt.png',
          description: 'Experience the misty charm of Ooty, the Queen of Hill Stations.',
          tours: [
            {
              id: 'exotic_ooty_5d',
              title: 'Ooty Misty Retreat',
              duration: '5 Days / 4 Nights',
              price: '₹14,999',
              image: 'https://res.cloudinary.com/drkgkgiat/image/upload/v1776755874/ChatGPT_Image_Apr_21_2026_12_47_19_PM_aawmvu.png',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Ooty, transfer to hotel. Evening boat ride at Ooty Lake.' },
                { day: 'Day 2', activity: 'Full day sightseeing: Botanical Garden, Rose Garden and Doddabetta Peak.' },
                { day: 'Day 3', activity: 'Tea Factory & Museum visit, and evening at the local market.' },
                { day: 'Day 4', activity: 'Pykara Lake, Waterfalls excursion and Shooting Spot visit.' },
                { day: 'Day 5', activity: 'Coonoor sightseeing (Sims Park, Lambs Rock) and departure from Coimbatore.' }
              ]
            }
          ]
        },
        {
          id: 'exotic_kerala',
          title: 'Kerala',
          image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=600',
          description: 'A perfect blend of Munnar\'s greenery and Palakkad\'s heritage.',
          tours: [
            {
              id: 'munnar_palakkad_5d',
              title: 'Munnar & Palakkad Escape',
              duration: '5 Days / 4 Nights',
              price: '₹16,500',
              image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=500',
              itinerary: [
                { day: 'Day 1', activity: 'Arrival in Palakkad, visit the historic Palakkad Fort.' },
                { day: 'Day 2', activity: 'Malampuzha Dam Garden and Rock Garden exploration.' },
                { day: 'Day 3', activity: 'Drive to Munnar. Visit Echo Point and Mattupetty Dam.' },
                { day: 'Day 4', activity: 'Eravikulam National Park and Tea Museum tour.' },
                { day: 'Day 5', activity: 'Morning tea garden walk and departure from Cochin/Palakkad.' }
              ]
            }
          ]
        },
        {
          id: 'maldives',
          title: 'Maldives',
          image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600',
          description: 'Pristine white beaches, crystal clear waters and overwater bungalows.',
          tours: [
            {
              id: 'maldives_paradise',
              title: 'Maldives Paradise',
              duration: '5 Days / 4 Nights',
              price: '₹65,000',
              image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=500',
              isTrending: true,
              itinerary: [
                { day: 'Day 1', activity: 'Arrive Malé, speedboat transfer to resort.' },
                { day: 'Day 2', activity: 'Snorkelling, water sports.' },
                { day: 'Day 3', activity: 'Dolphin cruise, island hopping.' },
                { day: 'Day 4', activity: 'Relaxation and beach activities.' },
                { day: 'Day 5', activity: 'Departure.' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'properties',
      title: 'Premium Properties',
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      comingSoon: true,
      subPackages: []
    }
  ];

  // Initialize or get data - reset if count < 5 or new content missing
  let tourPackages = JSON.parse(localStorage.getItem('nexttrip_tour_packages'));
  const hasFlattenedSouth = tourPackages && JSON.stringify(tourPackages).includes('south_india') && !JSON.stringify(tourPackages).includes('india');
  const hasExoticUpdate = tourPackages && JSON.stringify(tourPackages).includes('Munnar & Palakkad');
  const hasBoatHouseUpdate = tourPackages && JSON.stringify(tourPackages).includes('Kerala Backwaters');
  const hasMalaysiaUpdate = tourPackages && JSON.stringify(tourPackages).includes('Cameron Highlands');

  if (!tourPackages || tourPackages.length < 5 || !hasFlattenedSouth || !hasExoticUpdate || !hasBoatHouseUpdate || !hasMalaysiaUpdate) {
    tourPackages = defaultTourData;
    localStorage.setItem('nexttrip_tour_packages', JSON.stringify(tourPackages));
  }

  function renderMainPackages() {
    const grid = document.getElementById('mainPackagesGrid');
    if (!grid) return;

    // Always re-read from localStorage so admin changes reflect live
    tourPackages = JSON.parse(localStorage.getItem('nexttrip_tour_packages')) || tourPackages;

    grid.innerHTML = tourPackages.map((pkg, idx) => {
      let className = '';
      if (idx === 0) className = 'pkg-large';
      else if (idx === 1) className = 'pkg-medium';
      // idx 2,3,4 use CSS nth-child rules

      const isComingSoon = pkg.comingSoon || pkg.title.toLowerCase().includes('premium properties');
      const clickHandler = isComingSoon ? `showConstructionNotice()` : `showSubPackagesGrid('${pkg.id}')`;
      const extraClass = isComingSoon ? 'coming-soon' : '';
      const subCount = pkg.subPackages ? pkg.subPackages.length : 0;
      const btnLabel = isComingSoon ? 'Coming Soon' : (subCount > 0 ? subCount + ' Regions' : 'Explore');

      return `
        <div class="pkg-card ${className} ${extraClass}" onclick="${clickHandler}">
          <img src="${pkg.image}" alt="${pkg.title}">
          <div class="pkg-overlay">
            <h3>${pkg.title}</h3>
            <a href="#" class="pkg-btn" onclick="event.stopPropagation(); ${clickHandler}">${btnLabel}</a>
          </div>
        </div>
      `;
    }).join('');
  }


  function renderTrendingTours() {
    const container = document.getElementById('trending-tours-container');
    if (!container) return;

    // Collate all trending tours
    let trending = [];
    tourPackages.forEach(pkg => {
      if (pkg.subPackages) {
        pkg.subPackages.forEach(sub => {
          if (sub.tours) {
            sub.tours.forEach(tour => {
              if (tour.isTrending) {
                trending.push({ pkgId: pkg.id, subTitle: sub.title, ...tour });
              }
            });
          }
        });
      }
    });

    if (trending.length === 0) {
      container.parentElement.style.display = 'none'; // Hide section if no trending
      return;
    }

    container.innerHTML = trending.map(tour => `
      <div class="tour-card" onclick="openTourDetail('${tour.pkgId}', '${tour.subTitle}', '${tour.id}')" style="cursor: pointer;">
        <div class="tour-img">
          <img src="${tour.image}" alt="${tour.title}">
          <span class="tour-badge">Trending</span>
          <button class="fav-btn" onclick="event.stopPropagation()"><i class="fa fa-heart"></i></button>
        </div>
        <div class="tour-body">
          <h4>${tour.title}</h4>
          <p class="tour-loc"><i class="fa fa-location-dot"></i> ${tour.subTitle}</p>
          <div class="tour-meta">
            <span><i class="fa fa-calendar"></i> ${tour.duration || 'Flexible'}</span>
          </div>
          <div class="tour-footer">
            <div class="tour-price">
              <small>per Person</small>
              <strong>${tour.price}</strong>
            </div>
            <button class="tour-btn">View Details</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // --- Sub-Package Grid Interface ---
  function showSubPackagesGrid(pkgId) {
    const pkg = tourPackages.find(p => p.id === pkgId);
    if (!pkg) return;

    const modal = document.getElementById('subPkgModal');
    const heroEl = document.getElementById('subPkgHero');
    const titleEl = document.getElementById('subPkgMainTitle');
    const subtitleEl = document.getElementById('subPkgSubtitle');
    const splitEl = document.getElementById('subDetailSplit');
    const gridEl = document.getElementById('subPackagesGrid');
    const gridTitle = document.getElementById('gridSectionTitle');

    if (!modal || !titleEl || !gridEl) return;

    // Reset view to Grid of Sub-packages
    splitEl.style.display = 'none';
    gridTitle.innerHTML = 'Explore our <span>Regions</span>';
    if (heroEl) heroEl.style.backgroundImage = `url('${pkg.image}')`;
    titleEl.innerHTML = `${pkg.title.split(' ')[0]} <span>${pkg.title.split(' ').slice(1).join(' ')}</span>`;
    subtitleEl.textContent = 'Select a region to view specific tour plans';

    gridEl.innerHTML = pkg.subPackages.map(sub => `
      <div class="sub-card" onclick="showSubPackageDetail('${pkg.id}', '${sub.title}')">
        <img src="${sub.image}" alt="${sub.title}">
        <div class="sub-card-overlay">
          <span>View Tours</span>
          <h4>${sub.title}</h4>
        </div>
      </div>
    `).join('');

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // ── Water Ripple Effect on Hero ──
    setTimeout(() => {
      const $hero = $('#subPkgHero');
      try { $hero.ripples('destroy'); } catch (e) { }
      try {
        $hero.ripples({
          resolution: 768,
          dropRadius: 22,
          perturbance: 0.05,
          interactive: true,
          crossOrigin: ''
        });
      } catch (e) {
        console.warn('Ripple effect unavailable:', e);
      }
    }, 200);
  }

  // --- Sub-Package Detail (GT Style) ---
  function showSubPackageDetail(pkgId, subTitle) {
    const pkg = tourPackages.find(p => p.id === pkgId);
    const sub = pkg?.subPackages.find(s => s.title === subTitle);
    if (!sub) return;

    const splitEl = document.getElementById('subDetailSplit');
    const gridEl = document.getElementById('subPackagesGrid');
    const gridTitle = document.getElementById('gridSectionTitle');
    const detailTitleEl = document.getElementById('subDetailTitle');
    const detailDescEl = document.getElementById('subDetailDesc');
    const detailMiniImg = document.getElementById('subDetailMiniImg');

    // Update Split view
    splitEl.style.display = 'flex';
    detailTitleEl.textContent = sub.title;
    detailDescEl.textContent = sub.description || 'Welcome to ' + sub.title + '. Explore the beauty and culture of this amazing region.';
    detailMiniImg.src = sub.image;

    // Update Grid with Tours/Places
    gridTitle.innerHTML = `Tours in <span>${sub.title}</span>`;

    if (!sub.tours || sub.tours.length === 0) {
      gridEl.innerHTML = '<p style="padding: 20px; color: var(--text-mid);">No specific tours added for this region yet.</p>';
    } else {
      gridEl.innerHTML = sub.tours.map(tour => `
        <div class="sub-card" onclick="openTourDetail('${pkg.id}', '${sub.title}', '${tour.id}')">
          <img src="${tour.image}" alt="${tour.title}">
          <div class="sub-card-overlay">
            <span>From ${tour.price || 'Contact Us'}</span>
            <h4>${tour.title}</h4>
          </div>
        </div>
      `).join('');
    }

    // Scroll container to top
    document.getElementById('subPkgModal').scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Tour Itinerary Full Page ---
  function openTourDetail(pkgId, subTitle, tourId) {
    const pkg = tourPackages.find(p => p.id === pkgId);
    const sub = pkg?.subPackages.find(s => s.title === subTitle);
    const tour = sub?.tours.find(t => t.id === tourId);
    if (!tour) return;

    const overlay = document.getElementById('tourDetailOverlay');
    const hero = document.getElementById('tourHero');
    const mainTitle = document.getElementById('tourMainTitle');
    const mainPrice = document.getElementById('tourMainPrice');
    const fullDesc = document.getElementById('tourFullDesc');
    const sidebarImg = document.getElementById('tourSideImg');
    const itinList = document.getElementById('itineraryProgram');

    if (hero) hero.style.backgroundImage = `url('${tour.image || sub.image}')`;
    mainTitle.innerHTML = `${tour.title.split(' ')[0]} <span>${tour.title.split(' ').slice(1).join(' ')}</span>`;
    mainPrice.innerHTML = `<span><i class="fa fa-calendar"></i> ${tour.duration || ''}</span> &nbsp; | &nbsp; <span><i class="fa fa-tags"></i> ${tour.price}</span>`;
    fullDesc.textContent = tour.description || 'Experience the magic of ' + tour.title + ' with our specially curated tour plan.';
    sidebarImg.src = tour.image || sub.image;

    // Build Itinerary
    if (tour.itinerary && tour.itinerary.length > 0) {
      itinList.innerHTML = tour.itinerary.map(day => `
        <div class="day-item">
          <h5>${day.day}</h5>
          <p>${day.activity}</p>
        </div>
      `).join('');
    } else {
      itinList.innerHTML = '<p>Itinerary details coming soon...</p>';
    }

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // ── Water Ripple Effect on Tour Hero ──
    setTimeout(() => {
      const $tourHero = $('#tourHero');
      try { $tourHero.ripples('destroy'); } catch (e) { }
      try {
        $tourHero.ripples({
          resolution: 768,
          dropRadius: 22,
          perturbance: 0.05,
          interactive: true,
          crossOrigin: ''
        });
      } catch (e) {
        console.warn('Ripple effect unavailable:', e);
      }
    }, 200);
  }

  function closeTourDetail() {
    const overlay = document.getElementById('tourDetailOverlay');
    if (overlay) overlay.classList.remove('active');
    try { $('#tourHero').ripples('destroy'); } catch (e) { }
    // Keep modal overflow if still in sub-package view
  }

  window.showSubPackagesGrid = showSubPackagesGrid;
  window.showSubPackageDetail = showSubPackageDetail;
  window.openTourDetail = openTourDetail;
  window.closeTourDetail = closeTourDetail;
  window.closeSubPackagesGrid = function () {
    const modal = document.getElementById('subPkgModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      try { $('#subPkgHero').ripples('destroy'); } catch (e) { }
    }
  };

  window.bookThisTour = function () {
    const tourTitle = document.getElementById('tourMainTitle').textContent;
    const destInput = document.querySelector('#quickBookingForm input[name="destination"]');
    if (destInput) destInput.value = tourTitle;

    if (typeof openBookingModal === 'function') openBookingModal();
  };

  // Render on load
  renderMainPackages();
  renderTrendingTours();

  // Legacy data for other modals
  const packageData = {
    boathouses: {
      title: 'Boat Houses',
      description: 'Experience luxurious houseboat stays in Kerala backwaters...',
      duration: '3-5 Days',
      tours: '17 Tours',
      price: 'From ₹ 15,000',
      season: 'Sep - May',
      images: [
        'https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=600',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600'
      ],
      highlights: ['Luxury Houseboat', 'Backwater Cruise', 'Sunset Views', 'Local Food']
    },
    properties: {
      title: 'Properties',
      description: 'Book premium vacation villas, beach resorts, and luxury properties at stunning destinations. Perfect for family holidays and group getaways.',
      duration: '7 Days +',
      tours: '144 Tours',
      price: 'From ₹ 30,000',
      season: 'Year Round',
      images: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600',
        'https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=600',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
        'https://images.unsplash.com/photo-1566643537521-14f1dc19b9db?w=600'
      ],
      highlights: ['Luxury Villas', 'Beach Access', 'Private Pools', 'Premium Amenities']
    }
  };

  function openPackageModal(type) {
    const data = packageData[type];
    if (!data) return;

    const modal = document.getElementById('packageModal');
    if (!modal) return;

    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.textContent = data.title;

    const descEl = document.getElementById('modalDescription');
    if (descEl) descEl.textContent = data.description;

    const durEl = document.getElementById('duration');
    if (durEl) durEl.textContent = data.duration;

    const toursEl = document.getElementById('toursAvailable');
    if (toursEl) toursEl.textContent = data.tours;

    const priceEl = document.getElementById('price');
    if (priceEl) priceEl.textContent = data.price;

    const seasonEl = document.getElementById('season');
    if (seasonEl) seasonEl.textContent = data.season;

    // Update images
    const mainImg = document.getElementById('mainImage');
    if (mainImg) mainImg.src = data.images[0];

    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach((thumb, idx) => {
      thumb.src = data.images[idx] || '';
      thumb.classList.toggle('active', idx === 0);
    });

    // Update highlights
    const highlights = document.getElementById('packageHighlights');
    if (highlights) {
      highlights.innerHTML = data.highlights.map(h => `<li>${h}</li>`).join('');
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closePackageModal() {
    const modal = document.getElementById('packageModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function changeMainImage(thumbnail) {
    const mainImg = document.getElementById('mainImage');
    mainImg.src = thumbnail.src;

    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbnail.classList.add('active');
  }

  window.bookPackage = function () {
    const titleEl = document.getElementById('modalTitle');
    const title = titleEl ? titleEl.textContent : '';

    // Pre-fill destination if field exists in the modal
    const destInput = document.querySelector('#quickBookingForm input[name="destination"]');
    if (destInput) destInput.value = title;

    openBookingModal();
  }

  // Close modals on escape key / lightbox arrow navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closePackageModal();
      closeLightbox();
    }
    if (document.getElementById('galleryLightbox')?.classList.contains('active')) {
      if (e.key === 'ArrowLeft') lightboxNav(-1);
      if (e.key === 'ArrowRight') lightboxNav(1);
    }
  });

  // ===== 13. NEWSLETTER SUBMIT ===== 
  document.querySelectorAll('.nl-input-wrap button').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input && input.value.includes('@')) {
        btn.textContent = '✓ Subscribed!';
        btn.style.background = '#22c55e';
        input.value = '';
        setTimeout(() => {
          btn.textContent = 'Subscribe';
          btn.style.background = '';
        }, 3000);
      } else if (input) {
        input.style.borderColor = 'var(--primary)';
        input.placeholder = 'Enter a valid email!';
        setTimeout(() => {
          input.style.borderColor = '';
          input.placeholder = 'Enter your email address';
        }, 2000);
      }
    });
  });

  // ===== 13. ACTIVE NAV LINK on SCROLL =====
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 100) current = s.id;
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  });

  // ===== 14. HERO SLIDER =====
  const heroSlider = document.getElementById('heroSlider');
  if (heroSlider) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.slider-dot');
    const nextBtn = document.getElementById('sliderNext');
    const prevBtn = document.getElementById('sliderPrev');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
      if (!slides.length) return;
      slides.forEach(s => s.classList.remove('active'));
      dots.forEach(d => d.classList.remove('active'));

      currentSlide = (index + slides.length) % slides.length;
      if (slides[currentSlide]) slides[currentSlide].classList.add('active');
      if (dots && dots[currentSlide]) {
        dots[currentSlide].classList.add('active');
      }
    }

    function nextSlide() {
      showSlide(currentSlide + 1);
    }

    function startSlideShow() {
      clearInterval(slideInterval);
      slideInterval = setInterval(nextSlide, 5000);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        startSlideShow();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        showSlide(currentSlide - 1);
        startSlideShow();
      });
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        showSlide(parseInt(dot.dataset.index));
        startSlideShow();
      });
    });

    // Initial start
    startSlideShow();
  }



  // ===== 15. TOUR PAGE RIPPLE EFFECT =====
  $(document).ready(function () {
    const rippleTargets = '.dt-image-area, .package-hero, .dt-main-img';
    if ($(rippleTargets).length) {
      try {
        $(rippleTargets).ripples({
          resolution: 512,
          dropRadius: 20,
          perturbance: 0.04,
          interactive: true
        });
      } catch (e) {
        console.error('Ripple effect failed to load:', e);
      }
    }
  });

  // ===== 15. QUICK BOOKING MODAL LOGIC =====
  // Global Close function
  window.closeBookingModal = function () {
    const modal = document.getElementById('bookingModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // Attach listener to static form if it exists
  function attachBookingListener() {
    const form = document.getElementById('quickBookingForm');
    if (form) {
      console.log('✅ Found quickBookingForm, attaching listener...');
      form.removeEventListener('submit', handleModalSubmit);
      form.addEventListener('submit', handleModalSubmit);
    }
  }

  // Run on load
  document.addEventListener('DOMContentLoaded', attachBookingListener);

  // Global Modal Event Listeners
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('bookingModal');
    if (e.target === modal) closeBookingModal();
  });

  // ===== 16. GLOBAL BOOK NOW TRIGGER =====
  // This will catch ALL buttons with 'Book Now', 'Book This Tour' text or relevant classes
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, a');
    if (!target) return;

    const text = target.textContent.trim().toLowerCase().replace(/\s+/g, ' ');

    // Check if it's a book button
    const isBookBtn = target.classList.contains('tour-btn') ||
      target.classList.contains('pkg-btn') ||
      target.classList.contains('btn-primary') ||
      text === 'book now' ||
      text === 'book this tour' ||
      text.includes('book now') ||
      text.includes('book this tour');

    if (isBookBtn) {
      // Basic validation to avoid false positives on navigation links that might happen to have these words
      // but usually in this site they are meant to be booking buttons.
      e.preventDefault();
      openBookingModal();
    }
  });

  // (Contact Form submission is handled in index.html script block)

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', () => {
    // Trigger first FAQ open
    const firstTrigger = document.querySelector('.acc-trigger.active');
    if (firstTrigger) {
      const body = firstTrigger.closest('.acc-item').querySelector('.acc-body');
      if (body) body.classList.add('open');
    }

    // Mobile Nav Link Auto Close
    document.querySelectorAll('.mobile-menu a').forEach(link => {
      link.addEventListener('click', () => {
        document.getElementById('mobileMenu').classList.remove('open');
        const spans = document.querySelectorAll('.hamburger span');
        if (spans.length > 0) {
          spans[0].style.transform = '';
          spans[1].style.opacity = '';
          spans[2].style.transform = '';
        }
      });
    });

    console.log('✈️ NextTrip Holidays — Script Loaded');
    if (typeof injectFloatingButtons === 'function') {
      injectFloatingButtons();
    }
  });

  // ===== 18. AUTO MODAL POPUP (4 seconds) =====
  window.addEventListener('load', () => {
    setTimeout(() => {
      // Check if various modal types are already open
      const itinModal = document.getElementById('itineraryModal');
      const packModal = document.getElementById('packageModal');
      const lbModal = document.getElementById('galleryLightbox');
      const bookingModal = document.getElementById('bookingModal');

      const anyModalOpen = (itinModal && itinModal.style.display === 'flex') ||
        (packModal && packModal.classList.contains('active')) ||
        (lbModal && lbModal.classList.contains('active')) ||
        (bookingModal && bookingModal.classList.contains('active'));

      if (!anyModalOpen) {
        console.log('Triggering auto-popup after 4s...');
        if (typeof openBookingModal === 'function') {
          openBookingModal();
        }
      }
    }, 4000);
  });

  // ===== 19. FLOATING CONTACT BUTTONS INJECTION =====
  function injectFloatingButtons() {
    if (document.querySelector('.floating-contact-wrap')) return;

    const buttonsHtml = `
    <div class="floating-contact-wrap">
      <a href="https://instagram.com/nextrip_holidays_" class="floating-contact-btn instagram" target="_blank" aria-label="Follow us on Instagram">
        <i class="fab fa-instagram"></i>
        <span class="floating-btn-label">Follow Us</span>
      </a>
      <a href="https://wa.me/919500123844" class="floating-contact-btn whatsapp" target="_blank" aria-label="Chat with us on WhatsApp">
        <i class="fab fa-whatsapp"></i>
        <span class="floating-btn-label">Chat with Us</span>
      </a>
    </div>
  `;
    const container = document.body || document.documentElement;
    container.insertAdjacentHTML('beforeend', buttonsHtml);
  }

})();
