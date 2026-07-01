const pageLoader = document.getElementById('page-loader');
const navToggle = document.querySelector('.nav-toggle');
const navbar = document.querySelector('.navbar');
const backToTop = document.getElementById('back-to-top');
const filterButtons = document.querySelectorAll('.filter-btn');
const projectItems = document.querySelectorAll('.project-item');
const galleryCards = document.querySelectorAll('.gallery-card');
const lightbox = document.getElementById('lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxTitle = lightbox.querySelector('.lightbox-info h3');
const lightboxDescription = lightbox.querySelector('.lightbox-info p');
const lightboxClose = document.querySelector('.lightbox-close');
const commentForm = document.getElementById('comment-form');
const commentsList = document.getElementById('comments-list');
const communityStatus = document.getElementById('community-status');
const revealElements = document.querySelectorAll('[data-reveal]');
const statCards = document.querySelectorAll('.stat-card');

const STORAGE_KEY = 'aljarafi-comments';

function getStoredItems(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveItems(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

function normalizeText(value) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[<>]/g, '');
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function renderComments() {
  const comments = getStoredItems(STORAGE_KEY);
  commentsList.innerHTML = '';

  if (!comments.length) {
    const emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'لا توجد رسائل بعد. كن أول من يشارك استفساره.';
    commentsList.appendChild(emptyMessage);
    return;
  }

  // Build tree by parentId
  const map = new Map();
  comments.forEach((c) => { map.set(c.id, Object.assign({}, c, { children: [] })); });
  const roots = [];
  comments.forEach((c) => {
    const node = map.get(c.id);
    if (c.parentId) {
      const parent = map.get(c.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else roots.push(node);
  });

  // Render recursively (most recent first)
  roots.slice().reverse().forEach((node) => renderCommentNode(node, commentsList));
}

function renderCommentNode(node, container, level = 0) {
  const item = document.createElement('div');
  item.className = 'comment-item';
  item.style.marginLeft = `${level * 14}px`;

  const header = document.createElement('div');
  header.className = 'comment-header';
  const nameElement = document.createElement('strong');
  nameElement.textContent = node.name;
  const timeElement = document.createElement('small');
  timeElement.textContent = node.time;
  header.appendChild(nameElement);
  header.appendChild(timeElement);

  const messageElement = document.createElement('p');
  messageElement.textContent = node.message;

  const actions = document.createElement('div');
  actions.className = 'comment-actions';
  const replyBtn = document.createElement('button');
  replyBtn.type = 'button';
  replyBtn.className = 'reply-btn';
  replyBtn.textContent = 'رد';
  replyBtn.addEventListener('click', () => toggleReplyForm(node.id, item));
  actions.appendChild(replyBtn);

  item.appendChild(header);
  item.appendChild(messageElement);
  item.appendChild(actions);

  // container for replies
  const repliesContainer = document.createElement('div');
  repliesContainer.className = 'replies-container';
  item.appendChild(repliesContainer);

  container.appendChild(item);

  if (node.children && node.children.length) {
    node.children.slice().reverse().forEach((child) => renderCommentNode(child, repliesContainer, level + 1));
  }
}

function toggleReplyForm(parentId, parentElement) {
  // remove existing reply forms
  const existing = parentElement.querySelector('.reply-form');
  if (existing) {
    existing.remove();
    return;
  }
  // create form
  const form = document.createElement('form');
  form.className = 'reply-form';
  form.innerHTML = `
    <input name="reply-name" type="text" placeholder="اسمك" required />
    <input name="reply-email" type="email" placeholder="بريدك" required />
    <textarea name="reply-message" rows="3" placeholder="اكتب ردك هنا" required></textarea>
    <div class="reply-actions"><button type="submit" class="btn">إرسال</button> <button type="button" class="btn btn-secondary cancel-reply">إلغاء</button></div>
  `;
  form.addEventListener('submit', (e) => handleReplySubmit(e, parentId));
  form.querySelector('.cancel-reply').addEventListener('click', () => form.remove());
  parentElement.appendChild(form);
  form.querySelector('input[name="reply-name"]').focus();
}

function handleReplySubmit(event, parentId) {
  event.preventDefault();
  const form = event.currentTarget;
  const name = normalizeText(form.querySelector('input[name="reply-name"]').value);
  const email = normalizeText(form.querySelector('input[name="reply-email"]').value);
  const message = normalizeText(form.querySelector('textarea[name="reply-message"]').value);
  if (!name || !email || !message) return;
  const comments = getStoredItems(STORAGE_KEY);
  const id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
  comments.push({ id, parentId, name, email, message, time: formatTimestamp(new Date()) });
  saveItems(STORAGE_KEY, comments);
  // remove any open reply forms and re-render
  renderComments();
  updateCommunityStatus();
}

function updateCommunityStatus() {
  const comments = getStoredItems(STORAGE_KEY);
  communityStatus.textContent = `إجمالي الرسائل: ${comments.length}`;
}

function toggleNavbar() {
  const isOpen = navbar.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
}

function closeNavbar() {
  navbar.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}

function handleScroll() {
  if (window.scrollY > 400) {
    backToTop.classList.add('show');
  } else {
    backToTop.classList.remove('show');
  }
}

function smoothScrollTo(event) {
  const anchor = event.currentTarget;
  const targetId = anchor.getAttribute('href');
  if (!targetId || !targetId.startsWith('#')) return;
  event.preventDefault();
  const target = document.querySelector(targetId);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    closeNavbar();
  }
}

function animateCounters(entries) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const card = entry.target;
    const target = Number(card.dataset.count);
    const number = card.querySelector('.stat-number');
    let current = 0;
    const increment = Math.max(1, Math.floor(target / 60));
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        number.textContent = `${target}${card.textContent.includes('دعم') ? '/7' : '+'}`;
        clearInterval(interval);
        return;
      }
      number.textContent = `${current}+`;
    }, 20);
    observerCounters.unobserve(card);
  });
}

function revealOnScroll(entries, observer) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      observer.unobserve(entry.target);
    }
  });
}

function filterProjects(category) {
  projectItems.forEach((item) => {
    const itemCategory = item.dataset.category;
    item.style.display = category === 'all' || itemCategory === category ? 'block' : 'none';
  });
}

function activateFilter(event) {
  const button = event.currentTarget;
  filterButtons.forEach((btn) => btn.classList.remove('active'));
  button.classList.add('active');
  filterProjects(button.dataset.filter);
}

function openLightbox(imageSrc, title, description) {
  lightboxImage.src = imageSrc;
  lightboxImage.alt = title;
  lightboxTitle.textContent = title;
  lightboxDescription.textContent = description || '';
  lightbox.classList.add('active');
  lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  lightbox.classList.remove('active');
  lightbox.setAttribute('aria-hidden', 'true');
}

function handleDocumentKeydown(event) {
  if (event.key === 'Escape') {
    closeLightbox();
  }
}

async function handleCommentSubmit(event) {
  event.preventDefault();
  const nameInput = document.getElementById('comment-name');
  const emailInput = document.getElementById('comment-email');
  const textInput = document.getElementById('comment-text');
  const name = normalizeText(nameInput.value);
  const email = normalizeText(emailInput.value);
  const message = normalizeText(textInput.value);

  if (!name || !email || !message) {
    communityStatus.textContent = 'يرجى ملء جميع الحقول قبل الإرسال.';
    return;
  }

  const comments = getStoredItems(STORAGE_KEY);
  comments.push({
    name,
    email,
    message,
    time: formatTimestamp(new Date())
  });

  saveItems(STORAGE_KEY, comments);

  const formData = new FormData(commentForm);
  formData.append('form-name', 'contact');

  try {
    await fetch('/', {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    console.warn('Netlify form submit failed:', error);
  }

  commentForm.reset();
  renderComments();
  updateCommunityStatus();
  communityStatus.textContent = `تم إرسال رسالتك. حفظت محلياً وسيتم استقبالها أيضاً عند نشر الموقع على Netlify.`;
}

navToggle.addEventListener('click', toggleNavbar);

document.querySelectorAll('.navbar a').forEach((link) => {
  link.addEventListener('click', smoothScrollTo);
});

document.querySelectorAll('.scroll-down').forEach((link) => {
  link.addEventListener('click', smoothScrollTo);
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

filterButtons.forEach((button) => button.addEventListener('click', activateFilter));

projectItems.forEach((item) => {
  const button = item.querySelector('.project-link');
  button.addEventListener('click', () => {
    openLightbox(button.dataset.image, button.dataset.title, button.dataset.description);
  });
});

galleryCards.forEach((card) => {
  card.addEventListener('click', () => {
    openLightbox(card.dataset.image, card.dataset.title, 'صورة من معارض المشاريع والتجهيزات.');
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', handleDocumentKeydown);

commentForm.addEventListener('submit', handleCommentSubmit);

const observerReveal = new IntersectionObserver(revealOnScroll, {
  threshold: 0.16
});

const observerCounters = new IntersectionObserver(animateCounters, {
  threshold: 0.5
});

revealElements.forEach((element) => observerReveal.observe(element));
statCards.forEach((card) => observerCounters.observe(card));

window.addEventListener('scroll', handleScroll);

window.addEventListener('load', () => {
  if (pageLoader) {
    pageLoader.style.opacity = '0';
    setTimeout(() => {
      pageLoader.style.display = 'none';
    }, 420);
  }
});

renderComments();
updateCommunityStatus();

// Close mobile menu when outside click
window.addEventListener('click', (event) => {
  if (!navbar.contains(event.target) && !navToggle.contains(event.target)) {
    closeNavbar();
  }
});

// Add loading="lazy" to images that don't already specify it (improves initial load on mobile)
document.querySelectorAll('img').forEach((img) => {
  try {
    if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
  } catch (e) {
    // ignore any read-only images or SVGs
  }
});

/* --- UI Zoom control (font-size based zoom) --- */
const ZOOM_KEY = 'aljarafi-ui-zoom';
const zoomOutBtn = document.getElementById('zoom-out');
const zoomInBtn = document.getElementById('zoom-in');
const zoomResetBtn = document.getElementById('zoom-reset');
const zoomValueEl = document.getElementById('zoom-value');

function getStoredZoom() {
  const v = localStorage.getItem(ZOOM_KEY);
  return v ? Number(v) : 100;
}

function applyZoom(value) {
  const clamped = Math.min(140, Math.max(80, value));
  document.documentElement.style.fontSize = clamped + '%';
  if (zoomValueEl) zoomValueEl.textContent = clamped + '%';
  try { localStorage.setItem(ZOOM_KEY, String(clamped)); } catch {}
}

function changeZoom(delta) {
  const current = getStoredZoom();
  applyZoom(current + delta);
}

function resetZoom() { applyZoom(100); }

// Initialize zoom on load
try {
  applyZoom(getStoredZoom());
} catch (e) {
  // ignore
}

if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => changeZoom(-10));
if (zoomInBtn) zoomInBtn.addEventListener('click', () => changeZoom(10));
if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);
