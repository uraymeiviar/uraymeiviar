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
    initPrintCV();
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
  /* 3. Tags & Category Filter Bar                                              */
  /* -------------------------------------------------------------------------- */
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

    // All Categories button
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn cat-filter-btn active';
    allBtn.setAttribute('data-cat', 'all');
    allBtn.innerHTML = `All Domains <span style="opacity:0.6; font-size:0.75rem;">(${allProjects.length})</span>`;
    allBtn.addEventListener('click', () => {
      currentCategory = 'all';
      document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
      allBtn.classList.add('active');
      renderProjects();
    });
    catBar.appendChild(allBtn);

    sortedCats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn cat-filter-btn';
      btn.setAttribute('data-cat', cat);
      btn.innerHTML = `${cat} <span style="opacity:0.6; font-size:0.75rem;">(${catCounts[cat]})</span>`;
      btn.addEventListener('click', () => {
        currentCategory = cat;
        document.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProjects();
      });
      catBar.appendChild(btn);
    });
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
    
    // All Tags button
    const allBtn = document.createElement('button');
    allBtn.className = 'tag-btn active';
    allBtn.textContent = 'All Tags';
    allBtn.addEventListener('click', () => {
      currentTag = null;
      document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
      allBtn.classList.add('active');
      renderProjects();
    });
    tagBar.appendChild(allBtn);

    sortedTags.forEach(tag => {
      const btn = document.createElement('button');
      btn.className = 'tag-btn';
      btn.innerHTML = `${tag} <span style="opacity:0.6; font-size:0.65rem;">(${tagCounts[tag]})</span>`;
      btn.addEventListener('click', () => {
        if (currentTag === tag) {
          currentTag = null;
          btn.classList.remove('active');
          allBtn.classList.add('active');
        } else {
          currentTag = tag;
          document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          allBtn.classList.remove('active');
        }
        renderProjects();
      });
      tagBar.appendChild(btn);
    });
  }

  /* -------------------------------------------------------------------------- */
  /* 4. Render Project Cards                                                    */
  /* -------------------------------------------------------------------------- */
  let activeSlideCleanups = [];

  function renderProjects() {
    const grid = document.getElementById('project-grid');
    if (!grid) return;

    // Clean up any ongoing slide timers and listeners from previous render
    activeSlideCleanups.forEach(fn => fn());
    activeSlideCleanups = [];

    const filtered = allProjects.filter(p => {
      const matchCat = currentCategory === 'all' || p.category === currentCategory;
      const matchTag = !currentTag || (p.tags && p.tags.includes(currentTag));
      return matchCat && matchTag;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #64748b; font-family: monospace;">No projects found matching the active filter.</div>';
      return;
    }

    grid.innerHTML = '';
    filtered.forEach(p => {
      const card = document.createElement('article');
      card.className = `project-card ${p.featured ? 'featured' : ''}`;
      
      const hasImages = p.images && p.images.length > 0;
      const firstImage = hasImages ? p.images[0] : null;
      const imageCount = hasImages ? p.images.length : 0;

      let thumbHtml = '';
      if (hasImages && imageCount > 1) {
        const slidesHtml = p.images.map((img, idx) => `
          <div class="project-thumb-slide">
            <img src="${img}" alt="${p.title} - ${idx + 1}" loading="lazy">
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

      card.innerHTML = `
        ${thumbHtml}
        <div class="project-body">
          <h3 class="project-title">${p.title}</h3>
          <div class="project-role-line">${p.role || ''} ${(p.timeline || p.timespan || p.period) ? `· ${p.timeline || p.timespan || p.period}` : ''}</div>
          <p class="project-summary">${p.summary || ''}</p>
          <div class="project-tags">${tagsHtml}</div>
        </div>
        <div class="project-footer">
          <span>${p.category || 'Engineering'}</span>
        </div>
      `;

      let getCurrentSlideIndex = () => 0;

      if (hasImages && imageCount > 1) {
        const track = card.querySelector('.project-thumb-track');
        const countBadge = card.querySelector('.project-photo-count');
        let currentIndex = 0;
        let isTransitioning = false;
        let slideTimer = null;

        getCurrentSlideIndex = () => currentIndex % imageCount;

        const nextSlide = () => {
          if (document.hidden || isTransitioning) return;
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

      card.addEventListener('click', () => openModal(p, getCurrentSlideIndex()));
      grid.appendChild(card);
    });
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
