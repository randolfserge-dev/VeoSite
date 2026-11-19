'use strict';

const SITE_CONFIG = Object.freeze({
  whatsappNumber: '593980017979'
});

const menuDialog = document.getElementById('mobileMenu');
const menuToggle = document.getElementById('menuToggle');
const videoDialog = document.getElementById('videoDialog');
const testimonialPlayer = document.getElementById('testimonialPlayer');
const privacyDialog = document.getElementById('privacyDialog');

function syncDialogState() {
  document.body.classList.toggle('dialog-open', Boolean(document.querySelector('dialog[open]')));
  menuToggle.setAttribute('aria-expanded', String(menuDialog.open));
}

function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
  syncDialogState();
}

// Native dialogs keep focus inside and restore it to the opener on close.
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelectorAll('[data-close-dialog]').forEach(button => {
    button.addEventListener('click', () => dialog.close());
  });
  // A backdrop click has the dialog as target but lies outside its actual box.
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) dialog.close();
  });
  dialog.addEventListener('close', syncDialogState);
});

menuToggle.addEventListener('click', () => openDialog(menuDialog));
menuDialog.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', () => {
    menuDialog.close();
    // Continue keyboard navigation at the chosen section, after native focus restoration.
    const target = document.querySelector(link.hash);
    if (target) {
      target.setAttribute('tabindex', '-1');
      requestAnimationFrame(() => target.focus({ preventScroll: true }));
    }
  });
});
window.matchMedia('(min-width: 961px)').addEventListener('change', event => {
  if (event.matches && menuDialog.open) menuDialog.close();
});
document.querySelectorAll('[data-open-privacy]').forEach(button => {
  button.addEventListener('click', () => openDialog(privacyDialog));
});

// Only the selected testimonial is fetched; nothing autoplays on page load.
const videoError = document.getElementById('videoError');
document.querySelectorAll('[data-video]').forEach(button => {
  button.addEventListener('click', () => {
    const source = button.dataset.video;
    document.getElementById('videoDialogTitle').textContent = button.dataset.title;
    document.getElementById('videoDirectLink').href = source;
    videoError.hidden = true;
    testimonialPlayer.src = source;
    openDialog(videoDialog);
    document.getElementById('presentationVideo').pause();
    testimonialPlayer.play().catch(() => {
      // Native controls remain available if the browser asks for another gesture.
    });
  });
});
testimonialPlayer.addEventListener('error', () => {
  videoError.hidden = false;
});
videoDialog.addEventListener('close', () => {
  testimonialPlayer.pause();
  testimonialPlayer.removeAttribute('src');
  testimonialPlayer.load();
  videoError.hidden = true;
});

// The presentation works without JavaScript. Show a direct link if playback fails.
const presentationVideo = document.getElementById('presentationVideo');
const presentationPlay = document.getElementById('presentationPlay');
presentationPlay.hidden = false;
presentationPlay.addEventListener('click', () => {
  presentationVideo.play().catch(() => {
    // Native controls remain available if playback needs another gesture.
  });
});
presentationVideo.addEventListener('play', () => {
  presentationPlay.hidden = true;
});
presentationVideo.addEventListener('pause', () => {
  presentationPlay.hidden = Boolean(presentationVideo.error);
});
presentationVideo.addEventListener('ended', () => {
  presentationPlay.hidden = false;
});
presentationVideo.addEventListener('error', () => {
  presentationVideo.pause();
  presentationVideo.hidden = true;
  presentationPlay.hidden = true;
  document.getElementById('presentationError').hidden = false;
});

// The native form opens WhatsApp with the selected evaluation message, even without JS.
// The visitor reviews and sends the message in WhatsApp.
const bookingForm = document.getElementById('bookingForm');
bookingForm.addEventListener('submit', () => {
  bookingForm.action = `https://wa.me/${SITE_CONFIG.whatsappNumber}`;
  const fallbackUrl = new URL(bookingForm.action);
  fallbackUrl.searchParams.set('text', new FormData(bookingForm).get('text'));
  document.getElementById('bookingFallback').href = fallbackUrl.href;
  document.getElementById('bookingFeedback').hidden = false;
});

const header = document.getElementById('header');
let scrollScheduled = false;
window.addEventListener('scroll', () => {
  if (scrollScheduled) return;
  scrollScheduled = true;
  requestAnimationFrame(() => {
    header.classList.toggle('is-scrolled', window.scrollY > 35);
    scrollScheduled = false;
  });
}, { passive: true });


// Keep the opening composition inside the viewport, including the actual header.
const announcement = document.querySelector('.announcement');
function syncHeroViewport() {
  const headerHeight = header.getBoundingClientRect().height;
  const chromeHeight = headerHeight + announcement.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--header-block-height', `${headerHeight}px`);
  document.documentElement.style.setProperty('--top-chrome-height', `${chromeHeight}px`);
}
const heroHeaderObserver = new ResizeObserver(syncHeroViewport);
heroHeaderObserver.observe(header);
heroHeaderObserver.observe(announcement);
syncHeroViewport();
