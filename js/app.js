/**
 * Pure Vanilla JavaScript Application for Uray Meiviar Portfolio
 * Zero external libraries, robust dynamic JSON loading, tag filtering & gallery modal
 */

(function() {
  'use strict';

  let allProjects = [];
  let currentCategory = 'all';
  let currentTag = null;
  let activeModalProject = null;
  let activeModalImageIndex = 0;

  document.addEventListener('DOMContentLoaded', () => {
    initProfile();
    initProjects();
    initModalHandlers();
    initMessageModalHandlers();
    initPrintCV();
    initFilterToggle();
  });

  /* -------------------------------------------------------------------------- */
  /* 1. Global Profile & Photo Switcher                                         */
  /* -------------------------------------------------------------------------- */
  let currentPhotoIndex = 0;
  let profilePhotos = [];

  async function initProfile() {
    try {
      const res = await fetch('data/profile/profile.json');
      if (!res.ok) return;
      const data = await res.json();
      profilePhotos = data.photos || [];
      
      const avatarImg = document.getElementById('avatar-img');
      const prevBtn = document.getElementById('avatar-prev');
      const nextBtn = document.getElementById('avatar-next');
      
      if (!avatarImg || profilePhotos.length === 0) return;

      // Find default photo index
      const defaultIndex = profilePhotos.findIndex(p => p.file === data.default);
      currentPhotoIndex = defaultIndex !== -1 ? defaultIndex : 0;
      setAvatar(profilePhotos[currentPhotoIndex]);

      prevBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentPhotoIndex = (currentPhotoIndex - 1 + profilePhotos.length) % profilePhotos.length;
        setAvatar(profilePhotos[currentPhotoIndex]);
      });

      nextBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentPhotoIndex = (currentPhotoIndex + 1) % profilePhotos.length;
        setAvatar(profilePhotos[currentPhotoIndex]);
      });

      function setAvatar(photo) {
        avatarImg.style.opacity = '0';
        setTimeout(() => {
          avatarImg.src = photo.file;
          avatarImg.alt = photo.caption || 'Uray Meiviar';
          avatarImg.style.opacity = '1';
        }, 120);
      }
    } catch (e) {
      console.warn('Profile JSON load failed, using default', e);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* 2. Load Projects & Dynamic Tags                                            */
  /* -------------------------------------------------------------------------- */
  async function initProjects() {
    const grid = document.getElementById('project-grid');
    if (!grid) return;

    // 1. Attempt SSG Hydration from embedded #projects-data
    const prebakedScript = document.getElementById('projects-data');
    if (prebakedScript) {
      try {
        allProjects = JSON.parse(prebakedScript.textContent || '[]');
      } catch (err) {
        console.warn('Failed parsing embedded projects-data', err);
      }
    }

    const preRenderedCards = grid.querySelectorAll('.project-card');
    if (allProjects.length > 0 && preRenderedCards.length > 0) {
      initCategoryFilterListeners();
      initTagFilterListeners();
      hydrateProjectCards();
      return;
    }

    // 2. Dynamic Fallback: fetch manifests and render on client
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #64748b; font-family: monospace;">Loading engineering catalog...</div>';

    try {
      let manifestRes = await fetch('data/sitemap.json');
      if (!manifestRes.ok) {
        manifestRes = await fetch('data/projects.json');
      }
      if (!manifestRes.ok) throw new Error('Manifest not found');
      const folders = await manifestRes.json();

      // Fetch each project.json in parallel
      const fetchPromises = folders.map(async folder => {
        try {
          const res = await fetch(`${folder}/project.json`);
          if (!res.ok) return null;
          const proj = await res.json();
          proj._folder = folder;

          // Automatically resolve relative image paths to the project's folder
          if (proj.images && proj.images.length > 0) {
            proj.images = proj.images.map(img => {
              if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data/')) {
                return img;
              }
              return `${folder}/${img}`.replace(/\/+/g, '/');
            });
          }

          return proj;
        } catch (err) {
          console.warn(`Failed loading ${folder}/project.json`, err);
          return null;
        }
      });

      const results = await Promise.all(fetchPromises);
      allProjects = results.filter(p => p !== null);

      // Sort projects by most recent first
      allProjects.sort((a, b) => {
        const endA = getProjectEndYear(a);
        const endB = getProjectEndYear(b);
        if (endB !== endA) return endB - endA;

        const startA = getProjectStartYear(a);
        const startB = getProjectStartYear(b);
        if (startB !== startA) return startB - startA;

        return (a.title || '').localeCompare(b.title || '');
      });

      renderTags();
      renderCategoryFilters();
      renderProjects();
    } catch (e) {
      console.error('Failed to load project manifest', e);
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #ef4444;">Failed to load projects.</div>';
    }
  }

  /* -------------------------------------------------------------------------- */
  /* 3. Filter Listeners & Dynamic Filter Bar Generators                        */
  /* -------------------------------------------------------------------------- */
  function initCategoryFilterListeners() {
    const catBar = document.getElementById('cat-bar');
    if (!catBar) return;
    const buttons = catBar.querySelectorAll('.cat-filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.getAttribute('data-cat') || 'all';
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterProjects();
      });
    });
  }

  function initTagFilterListeners() {
    const tagBar = document.getElementById('tag-bar');
    if (!tagBar) return;
    const buttons = tagBar.querySelectorAll('.tag-btn');
    const allBtn = tagBar.querySelector('.tag-btn[data-tag="all"]') || buttons[0];

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.getAttribute('data-tag');
        if (!tag || tag === 'all') {
          currentTag = null;
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        } else {
          if (currentTag === tag) {
            currentTag = null;
            btn.classList.remove('active');
            if (allBtn) allBtn.classList.add('active');
          } else {
            currentTag = tag;
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (allBtn) allBtn.classList.remove('active');
          }
        }
        filterProjects();
      });
    });
  }

  function renderCategoryFilters() {
    const catBar = document.getElementById('cat-bar');
    if (!catBar) return;

    const catCounts = {};
    allProjects.forEach(p => {
      const cat = p.category || 'Other';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    const sortedCats = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a]);

    catBar.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn cat-filter-btn active';
    allBtn.setAttribute('data-cat', 'all');
    allBtn.innerHTML = `All Domains <span style="opacity:0.6; font-size:0.75rem;">(${allProjects.length})</span>`;
    catBar.appendChild(allBtn);

    sortedCats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn cat-filter-btn';
      btn.setAttribute('data-cat', cat);
      btn.innerHTML = `${cat} <span style="opacity:0.6; font-size:0.75rem;">(${catCounts[cat]})</span>`;
      catBar.appendChild(btn);
    });

    initCategoryFilterListeners();
    updateFilterSummary();
  }

  function renderTags() {
    const tagBar = document.getElementById('tag-bar');
    if (!tagBar) return;

    const tagCounts = {};
    allProjects.forEach(p => {
      (p.tags || []).forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });

    const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

    tagBar.innerHTML = '';
    
    const allBtn = document.createElement('button');
    allBtn.className = 'tag-btn active';
    allBtn.setAttribute('data-tag', 'all');
    allBtn.textContent = 'All Tags';
    tagBar.appendChild(allBtn);

    sortedTags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'tag-btn';
      btn.setAttribute('data-tag', tag);
      btn.innerHTML = `${tag} <span style="opacity:0.6; font-size:0.65rem;">(${tagCounts[tag]})</span>`;
      tagBar.appendChild(btn);
    });

    initTagFilterListeners();
    updateFilterSummary();
  }

  function updateFilterSummary() {
    const badge = document.getElementById('filter-summary-badge');
    const clearBtn = document.getElementById('filter-clear-btn');
    if (!badge) return;

    const isFiltered = currentCategory !== 'all' || currentTag !== null;

    if (!isFiltered) {
      badge.textContent = `All Domains (${allProjects.length})`;
      badge.classList.remove('has-filter');
      if (clearBtn) clearBtn.style.display = 'none';
    } else {
      const parts = [];
      if (currentCategory !== 'all') {
        parts.push(currentCategory);
      }
      if (currentTag) {
        parts.push(`Tag: ${currentTag}`);
      }
      badge.textContent = parts.join(' · ');
      badge.classList.add('has-filter');
      if (clearBtn) clearBtn.style.display = 'inline-flex';
    }
  }

  function resetFilters() {
    currentCategory = 'all';
    currentTag = null;

    document.querySelectorAll('.cat-filter-btn').forEach(b => {
      if (b.getAttribute('data-cat') === 'all') {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    document.querySelectorAll('.tag-btn').forEach((b, idx) => {
      const tagAttr = b.getAttribute('data-tag');
      if (tagAttr === 'all' || (!tagAttr && idx === 0)) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    filterProjects();
  }

  function initFilterToggle() {
    const wrapper = document.getElementById('filter-wrapper');
    const toggleHeader = document.getElementById('filter-toggle-header');
    const toggleHint = document.getElementById('filter-toggle-hint');
    const clearBtn = document.getElementById('filter-clear-btn');

    if (!wrapper || !toggleHeader) return;

    const toggle = () => {
      const isOpen = wrapper.classList.toggle('is-open');
      toggleHeader.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (toggleHint) {
        toggleHint.textContent = isOpen ? 'Hide Filters' : 'Show Filters';
      }
    };

    toggleHeader.addEventListener('click', (e) => {
      if (clearBtn && (e.target === clearBtn || clearBtn.contains(e.target))) {
        return;
      }
      toggle();
    });

    toggleHeader.addEventListener('keydown', (e) => {
      if (clearBtn && (e.target === clearBtn || clearBtn.contains(e.target))) {
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });

    clearBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      resetFilters();
    });
  }

  /* -------------------------------------------------------------------------- */
  /* 4. Project Cards Hydration, Sliding Carousels & In-Place Filtering        */
  /* -------------------------------------------------------------------------- */
  let activeSlideCleanups = [];

  function filterProjects() {
    const grid = document.getElementById('project-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.project-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const idx = parseInt(card.getAttribute('data-index'), 10);
      const proj = !isNaN(idx) && allProjects[idx] ? allProjects[idx] : null;

      let matchCat = false;
      let matchTag = false;

      if (proj) {
        matchCat = currentCategory === 'all' || proj.category === currentCategory;
        matchTag = !currentTag || (proj.tags && proj.tags.includes(currentTag));
      } else {
        const cardCat = card.getAttribute('data-cat') || '';
        const cardTags = (card.getAttribute('data-tags') || '').split(',').map(s => s.trim());
        matchCat = currentCategory === 'all' || cardCat === currentCategory;
        matchTag = !currentTag || cardTags.includes(currentTag);
      }

      if (matchCat && matchTag) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    let noProjectsMsg = document.getElementById('no-projects-msg');
    if (visibleCount === 0) {
      if (!noProjectsMsg) {
        noProjectsMsg = document.createElement('div');
        noProjectsMsg.id = 'no-projects-msg';
        noProjectsMsg.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 4rem; color: #64748b; font-family: monospace;';
        noProjectsMsg.textContent = 'No projects found matching the active filter.';
        grid.appendChild(noProjectsMsg);
      } else {
        noProjectsMsg.style.display = '';
      }
    } else if (noProjectsMsg) {
      noProjectsMsg.style.display = 'none';
    }

    updateFilterSummary();
  }

  function setupCard(card, p) {
    const hasImages = p.images && p.images.length > 0;
    const imageCount = hasImages ? p.images.length : 0;
    let getCurrentSlideIndex = () => 0;

    if (hasImages && imageCount > 1) {
      const track = card.querySelector('.project-thumb-track');
      const countBadge = card.querySelector('.project-photo-count');

      if (track) {
        let currentIndex = 0;
        let isTransitioning = false;
        let slideTimer = null;

        getCurrentSlideIndex = () => currentIndex % imageCount;

        const nextSlide = () => {
          if (document.hidden || isTransitioning) return;
          if (card.offsetParent === null) return;
          const modal = document.getElementById('project-modal');
          if (modal && modal.classList.contains('open')) return;

          isTransitioning = true;
          currentIndex++;
          track.style.transition = 'transform 0.6s ease';
          track.style.transform = `translateX(-${currentIndex * 100}%)`;

          const displayNum = (currentIndex % imageCount) + 1;
          if (countBadge) {
            countBadge.textContent = `📷 ${displayNum} / ${imageCount}`;
          }
        };

        const onTransitionEnd = (e) => {
          if (e.target !== track || e.propertyName !== 'transform') return;
          isTransitioning = false;
          if (currentIndex >= imageCount) {
            track.style.transition = 'none';
            currentIndex = 0;
            track.style.transform = 'translateX(0%)';
            void track.offsetWidth; // Force reflow
          }
        };

        track.addEventListener('transitionend', onTransitionEnd);

        const startTimer = () => {
          stopTimer();
          slideTimer = setInterval(nextSlide, 3000);
        };

        const stopTimer = () => {
          if (slideTimer) {
            clearInterval(slideTimer);
            slideTimer = null;
          }
        };

        card.addEventListener('mouseenter', stopTimer);
        card.addEventListener('mouseleave', startTimer);

        startTimer();

        activeSlideCleanups.push(() => {
          stopTimer();
          track.removeEventListener('transitionend', onTransitionEnd);
          card.removeEventListener('mouseenter', stopTimer);
          card.removeEventListener('mouseleave', startTimer);
        });
      }
    }

    card.addEventListener('click', () => openModal(p, getCurrentSlideIndex()));
  }

  function hydrateProjectCards() {
    const grid = document.getElementById('project-grid');
    if (!grid) return;

    activeSlideCleanups.forEach(fn => fn());
    activeSlideCleanups = [];

    const cards = grid.querySelectorAll('.project-card');
    cards.forEach((card, idx) => {
      const dataIdx = card.getAttribute('data-index');
      const projectIndex = dataIdx !== null ? parseInt(dataIdx, 10) : idx;
      const project = allProjects[projectIndex];
      if (project) {
        setupCard(card, project);
      }
    });
  }

  function renderProjects() {
    const grid = document.getElementById('project-grid');
    if (!grid) return;

    activeSlideCleanups.forEach(fn => fn());
    activeSlideCleanups = [];

    grid.innerHTML = '';
    allProjects.forEach((p, idx) => {
      const card = document.createElement('article');
      card.className = `project-card ${p.featured ? 'featured' : ''}`;
      card.setAttribute('data-index', idx);
      card.setAttribute('data-cat', p.category || 'Other');
      card.setAttribute('data-tags', (p.tags || []).join(','));

      const hasImages = p.images && p.images.length > 0;
      const firstImage = hasImages ? p.images[0] : null;
      const imageCount = hasImages ? p.images.length : 0;

      let thumbHtml = '';
      if (hasImages && imageCount > 1) {
        const slidesHtml = p.images.map((img, i) => `
          <div class="project-thumb-slide">
            <img src="${img}" alt="${p.title} - ${i + 1}" loading="lazy">
          </div>
        `).join('') + `
          <div class="project-thumb-slide">
            <img src="${p.images[0]}" alt="${p.title} - 1" loading="lazy">
          </div>
        `;

        thumbHtml = `
          <div class="project-thumb">
            <div class="project-thumb-track">
              ${slidesHtml}
            </div>
            <span class="project-photo-count">📷 1 / ${imageCount}</span>
          </div>
        `;
      } else if (hasImages) {
        thumbHtml = `
          <div class="project-thumb">
            <img src="${firstImage}" alt="${p.title}" loading="lazy">
          </div>
        `;
      } else {
        thumbHtml = `
          <div class="project-thumb">
            <div class="project-thumb-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span>${p.featured ? '★ FLAGSHIP SYSTEMS' : 'PROJECT SHOWCASE'}</span>
            </div>
          </div>
        `;
      }

      const tagsHtml = (p.tags || []).slice(0, 5).map(t => 
        `<span class="card-tag">${t}</span>`
      ).join('');

      const timeDisplay = p.timeline || p.timespan || p.period || '';

      card.innerHTML = `
        ${thumbHtml}
        <div class="project-body">
          <h3 class="project-title">${p.title}</h3>
          <div class="project-role-line">${p.role || ''} ${timeDisplay ? `· ${timeDisplay}` : ''}</div>
          <p class="project-summary">${p.summary || ''}</p>
          <div class="project-tags">${tagsHtml}</div>
        </div>
        <div class="project-footer">
          <span>${p.category || 'Engineering'}</span>
        </div>
      `;

      setupCard(card, p);
      grid.appendChild(card);
    });

    filterProjects();
  }

  /* -------------------------------------------------------------------------- */
  /* 5. Project Detail Modal & Gallery                                          */
  /* -------------------------------------------------------------------------- */
  function initModalHandlers() {
    const modal = document.getElementById('project-modal');
    const closeBtn = document.getElementById('modal-close-btn');
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');

    if (!modal) return;

    closeBtn?.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateGallery(-1);
    });

    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateGallery(1);
    });

    window.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') navigateGallery(-1);
      if (e.key === 'ArrowRight') navigateGallery(1);
    });
  }

  function openModal(project, initialImageIndex = 0) {
    activeModalProject = project;
    activeModalImageIndex = initialImageIndex || 0;

    const modal = document.getElementById('project-modal');
    const title = document.getElementById('modal-title');
    const subtitle = document.getElementById('modal-subtitle');
    const summary = document.getElementById('modal-summary');
    const highlights = document.getElementById('modal-highlights');
    const tags = document.getElementById('modal-tags');
    const links = document.getElementById('modal-links');

    if (!modal) return;

    title.textContent = project.title;
    const projectTime = project.timeline || project.timespan || project.period;
    subtitle.textContent = `${project.role || ''} ${project.company ? `| ${project.company}` : ''} ${projectTime ? `(${projectTime})` : ''}`;
    summary.textContent = project.summary || '';

    if (project.highlights && project.highlights.length > 0) {
      highlights.innerHTML = project.highlights.map(h => `<li>${h}</li>`).join('');
      document.getElementById('modal-highlights-container').style.display = 'block';
    } else {
      document.getElementById('modal-highlights-container').style.display = 'none';
    }

    if (project.tags && project.tags.length > 0) {
      tags.innerHTML = project.tags.map(t => `<span class="card-tag" style="font-size:0.75rem; padding:0.25rem 0.6rem;">${t}</span>`).join('');
    } else {
      tags.innerHTML = '';
    }

    // Links and Technical Documentation (DESC.md via story reader)
    const descLink = `${project._folder}/DESC.md`;
    let linksHtml = `<a href="story.html?file=${encodeURIComponent(descLink)}" target="_blank" class="btn btn-outline" style="font-size:0.8rem; padding:0.4rem 0.8rem; border-color: rgba(0,212,255,0.3); color: var(--accent-cyan);" title="Read formatted technical documentation and architecture spec">📖 Technical Spec & Architecture ↗</a>`;
    if (project.links && project.links.length > 0) {
      linksHtml += project.links.map(l => 
        `<a href="${l.url}" target="_blank" rel="noopener" class="btn btn-outline" style="font-size:0.8rem; padding:0.4rem 0.8rem;">${l.label} ↗</a>`
      ).join('');
    }
    links.innerHTML = linksHtml;
    links.style.display = 'flex';

    updateModalGallery();

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      activeModalProject = null;
    }
  }

  function updateModalGallery() {
    const gallery = document.getElementById('modal-gallery');
    const imgEl = document.getElementById('gallery-img');
    const counter = document.getElementById('gallery-counter');
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');

    if (!gallery || !imgEl) return;

    const images = (activeModalProject && activeModalProject.images) || [];
    if (images.length === 0) {
      gallery.style.display = 'none';
      return;
    }

    gallery.style.display = 'flex';
    imgEl.src = images[activeModalImageIndex];
    imgEl.alt = `${activeModalProject.title} media ${activeModalImageIndex + 1}`;

    if (images.length > 1) {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
      counter.style.display = 'block';
      counter.textContent = `${activeModalImageIndex + 1} / ${images.length}`;
    } else {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
      counter.style.display = 'none';
    }
  }

  function navigateGallery(direction) {
    if (!activeModalProject || !activeModalProject.images || activeModalProject.images.length <= 1) return;
    const len = activeModalProject.images.length;
    activeModalImageIndex = (activeModalImageIndex + direction + len) % len;
    updateModalGallery();
  }

  /* -------------------------------------------------------------------------- */
  /* 6. Print CV                                                                */
  /* -------------------------------------------------------------------------- */
  function initPrintCV() {
    const printBtns = document.querySelectorAll('.print-cv-btn');
    printBtns.forEach(b => {
      b.addEventListener('click', async (e) => {
        e.preventDefault();
        const span = b.querySelector('span');
        const origText = span ? span.textContent : b.textContent;
        if (span) span.textContent = 'Preparing PDF...';
        
        await preloadAllImages();
        
        if (span) span.textContent = origText;
        window.print();
      });
    });

    window.addEventListener('beforeprint', () => {
      document.querySelectorAll('img').forEach(img => {
        img.loading = 'eager';
      });
    });
  }

  async function preloadAllImages() {
    const imgs = Array.from(document.querySelectorAll('img'));
    if (imgs.length === 0) return;
    const promises = imgs.map(img => {
      img.loading = 'eager';
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      if ('decode' in img) {
        return img.decode().catch(() => {});
      }
      return new Promise(resolve => {
        img.onload = img.onerror = resolve;
      });
    });
    await Promise.all(promises);
    await new Promise(r => setTimeout(r, 200));
  }

  /* -------------------------------------------------------------------------- */
  /* 8. Message Me Modal & Google Sheets Webhook Dispatch                       */
  /* -------------------------------------------------------------------------- */
  // Paste your Google Apps Script Web App URL below:
  const GOOGLE_SHEET_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbylz-3qLb8Mf-TGOjj0mogyAzAdLpQye_UwSSGlkUbI0fnH9t0NIa69zEAfwf1rIHdZyw/exec';

  function initMessageModalHandlers() {
    const modal = document.getElementById('message-modal');
    const openBtns = document.querySelectorAll('.message-me-btn, #open-message-btn, #footer-open-message-link');
    const closeBtn = document.getElementById('message-modal-close-btn');
    const successCloseBtn = document.getElementById('contact-success-close-btn');
    const form = document.getElementById('contact-form');
    const successView = document.getElementById('contact-success');
    const feedback = document.getElementById('form-feedback');
    let modalOpenedAt = 0;

    function openMessageModal() {
      if (!modal) return;
      modalOpenedAt = Date.now();
      if (form) form.style.display = 'flex';
      if (successView) successView.style.display = 'none';
      if (feedback) feedback.style.display = 'none';
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      const firstInput = document.getElementById('contact-name');
      setTimeout(() => firstInput?.focus(), 100);
    }

    function closeMessageModal() {
      if (!modal) return;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openMessageModal();
      });
    });

    closeBtn?.addEventListener('click', closeMessageModal);
    successCloseBtn?.addEventListener('click', closeMessageModal);

    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeMessageModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal?.classList.contains('open')) {
        closeMessageModal();
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('contact-submit-btn');
      const honeypot = (document.getElementById('contact-hp-field')?.value || '').trim();
      const name = document.getElementById('contact-name')?.value.trim() || '';
      const contact = document.getElementById('contact-info')?.value.trim() || '';
      const subject = document.getElementById('contact-subject')?.value.trim() || '';
      const message = document.getElementById('contact-message')?.value.trim() || '';

      // 1. Honeypot check: If the hidden bot field is filled, silently discard
      if (honeypot !== '') {
        console.warn('Bot detected via honeypot trap.');
        if (form) {
          form.reset();
          form.style.display = 'none';
        }
        if (successView) successView.style.display = 'block';
        return;
      }

      // 2. Submission velocity check (less than 1.8s is inhumanly fast for filling a form)
      const elapsed = Date.now() - modalOpenedAt;
      if (modalOpenedAt > 0 && elapsed < 1800) {
        if (feedback) {
          feedback.textContent = 'Submission was too fast. Please take a moment and try again.';
          feedback.className = 'form-feedback error';
          feedback.style.display = 'block';
        }
        return;
      }

      // 3. Client cooldown / rate limit (45s cooldown)
      const lastSent = parseInt(localStorage.getItem('uray_msg_cooldown') || '0', 10);
      const now = Date.now();
      if (now - lastSent < 45000) {
        const waitSec = Math.ceil((45000 - (now - lastSent)) / 1000);
        if (feedback) {
          feedback.textContent = `Please wait ${waitSec}s before sending another inquiry.`;
          feedback.className = 'form-feedback error';
          feedback.style.display = 'block';
        }
        return;
      }

      if (!name || !contact || !message) {
        if (feedback) {
          feedback.textContent = 'Please fill in all required fields (Name, Contact, and Message).';
          feedback.className = 'form-feedback error';
          feedback.style.display = 'block';
        }
        return;
      }

      if (feedback) feedback.style.display = 'none';
      const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-spinner"></span> <span>Sending...</span>';
      }

      const payload = {
        timestamp: new Date().toISOString(),
        _hp_website: honeypot,
        name,
        contact,
        subject,
        message,
        userAgent: navigator.userAgent
      };

      // Always save locally to localStorage as persistent fallback
      try {
        const saved = JSON.parse(localStorage.getItem('uray_dev_inquiries') || '[]');
        saved.push(payload);
        localStorage.setItem('uray_dev_inquiries', JSON.stringify(saved));
        localStorage.setItem('uray_msg_cooldown', now.toString());
      } catch (err) {}

      // If Google Sheet Webhook URL is configured, send via POST
      if (GOOGLE_SHEET_WEBHOOK_URL && GOOGLE_SHEET_WEBHOOK_URL.trim() !== '') {
        try {
          const body = new URLSearchParams(payload);
          await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
          });
        } catch (err) {
          console.warn('Google Sheets webhook dispatch encountered an error:', err);
        }
      } else {
        console.info('Message stored locally in localStorage. To forward directly to Google Sheets, configure GOOGLE_SHEET_WEBHOOK_URL in js/app.js.');
      }

      await new Promise(r => setTimeout(r, 600));

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origBtnHtml;
      }

      if (form) {
        form.reset();
        form.style.display = 'none';
      }
      if (successView) {
        successView.style.display = 'block';
      }
    });
  }

  function getProjectEndYear(p) {
    const timeStr = p.timeline || p.timespan || p.period || '';
    if (/present/i.test(timeStr)) return 9999;
    const matches = timeStr.match(/\b(19\d\d|20\d\d)\b/g);
    if (matches && matches.length > 0) {
      return Math.max(...matches.map(Number));
    }
    return 0;
  }

  function getProjectStartYear(p) {
    const timeStr = p.timeline || p.timespan || p.period || '';
    const matches = timeStr.match(/\b(19\d\d|20\d\d)\b/g);
    if (matches && matches.length > 0) {
      return Math.min(...matches.map(Number));
    }
    return 0;
  }

})();
