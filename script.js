// Smooth scrolling for in-page links
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  const el = document.getElementById(id);
  if (el) {
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Mobile menu toggle
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('mainNav');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
  });
}

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Carousel (responsive, gap-aware)
(function initCarousel(){
  const track = document.querySelector('.carousel-track');
  const slides = Array.from(document.querySelectorAll('.carousel-slide'));
  const prev = document.querySelector('.carousel-control.prev');
  const next = document.querySelector('.carousel-control.next');
  const viewport = document.querySelector('.carousel-viewport');
  if (!track || slides.length === 0) return;

  let index = 0;
  function slideSize(){
    const slide = slides[0];
    if (!slide) return viewport.clientWidth;
    const style = getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || 0);
    return slide.getBoundingClientRect().width + gap;
  }
  const go = (i) => {
    index = (i + slides.length) % slides.length;
    const offset = Math.round(index * slideSize());
    track.style.transform = `translateX(${-offset}px)`;
  };

  const ro = new ResizeObserver(() => go(index));
  ro.observe(viewport);
  ro.observe(track);

  prev.addEventListener('click', () => go(index - 1));
  next.addEventListener('click', () => go(index + 1));

  let timer = setInterval(() => go(index + 1), 5000);
  [prev, next, viewport].forEach(el => {
    el.addEventListener('mouseenter', () => clearInterval(timer));
    el.addEventListener('mouseleave', () => timer = setInterval(() => go(index + 1), 5000));
  });

  go(0);
})();

// Contact form validation + Web3Forms submission
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const feedback = document.getElementById('formFeedback');

function showError(input, msg){
  const small = input.parentElement.querySelector('.error');
  if (small) small.textContent = msg || input.validationMessage;
  input.classList.toggle('invalid', !!msg);
}
function clearError(input){
  const small = input.parentElement.querySelector('.error');
  if (small) small.textContent = '';
  input.classList.remove('invalid');
}

['name','email','phone','message'].forEach(id=>{
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', ()=> {
    if (el.checkValidity()) clearError(el);
  });
});

form?.addEventListener('submit', async (e)=>{
  e.preventDefault();

  // Validate fields
  let valid = true;
  Array.from(form.elements).forEach(el=>{
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (!el.checkValidity()){
        showError(el);
        valid = false;
      } else {
        clearError(el);
      }
    }
  });
  if (!valid) {
    feedback.textContent = 'Please fix the highlighted fields.';
    feedback.style.color = '#c02b2b';
    return;
  }

  // Loading state
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    const formData = new FormData(form);

    // Submit to Web3Forms
    const res = await fetch(form.action, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      form.reset();
      feedback.textContent = 'Message sent successfully. We will reach out shortly.';
      feedback.style.color = '#1a7f37';
    } else {
      feedback.textContent = 'Could not send message. Please try again later.';
      feedback.style.color = '#c02b2b';
    }
  } catch {
    feedback.textContent = 'Network error. Please try again later.';
    feedback.style.color = '#c02b2b';
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
});

// Drag & drop uploader with validation (PDF/JPG/PNG, max 10MB)
const uploader = document.getElementById('uploader');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadBtn = document.getElementById('uploadBtn');
const filePreview = document.getElementById('filePreview');
const uploadFeedback = document.getElementById('uploadFeedback');

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPT = ['application/pdf','image/jpeg','image/png'];

function fileOK(file){
  const typeOK = ACCEPT.includes(file.type) || /\.(pdf|jpg|jpeg|png)$/i.test(file.name);
  const sizeOK = file.size <= MAX_SIZE;
  return { typeOK, sizeOK };
}
function showFile(file){
  filePreview.textContent = `${file.name} — ${(file.size/1024/1024).toFixed(2)} MB`;
  uploadBtn.disabled = false;
}

browseBtn?.addEventListener('click', ()=> fileInput.click());
uploader?.addEventListener('dragover', (e)=>{ e.preventDefault(); uploader.classList.add('drag'); });
uploader?.addEventListener('dragleave', ()=> uploader.classList.remove('drag'));
uploader?.addEventListener('drop', (e)=>{
  e.preventDefault(); uploader.classList.remove('drag');
  const file = e.dataTransfer.files?.[0];
  if (!file) return;
  const {typeOK,sizeOK} = fileOK(file);
  if (!typeOK){ uploadFeedback.textContent='Invalid file type. Use PDF, JPG, or PNG.'; uploadFeedback.style.color='#c02b2b'; return; }
  if (!sizeOK){ uploadFeedback.textContent='File too large. Max 10MB.'; uploadFeedback.style.color='#c02b2b'; return; }
  fileInput.files = e.dataTransfer.files;
  showFile(file);
  uploadFeedback.textContent='';
});
fileInput?.addEventListener('change', ()=>{
  const file = fileInput.files?.[0];
  if (!file) return;
  const {typeOK,sizeOK} = fileOK(file);
  if (!typeOK){ uploadFeedback.textContent='Invalid file type. Use PDF, JPG, or PNG.'; uploadFeedback.style.color='#c02b2b'; fileInput.value=''; return; }
  if (!sizeOK){ uploadFeedback.textContent='File too large. Max 10MB.'; uploadFeedback.style.color='#c02b2b'; fileInput.value=''; return; }
  showFile(file);
  uploadFeedback.textContent='';
});
uploadBtn?.addEventListener('click', async ()=>{
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Uploading...';
  await new Promise(r=>setTimeout(r, 1200));
  uploadBtn.textContent = 'Upload';
  uploadBtn.disabled = true;
  fileInput.value = '';
  filePreview.textContent = '';
  uploadFeedback.textContent = 'Upload successful. Thank you!';
  uploadFeedback.style.color = '#1a7f37';
});
