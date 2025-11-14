// AI Tech Pulse - Main JavaScript

// Reading Progress Bar
function updateReadingProgress() {
  const article = document.querySelector('.article-content');
  if (!article) return;

  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const articleTop = article.offsetTop;
  const articleHeight = article.offsetHeight;

  // Calculate progress based on article position
  const progress = Math.min(
    100,
    Math.max(0, ((scrollTop - articleTop) / (articleHeight - windowHeight)) * 100)
  );

  const progressBar = document.querySelector('.reading-progress-bar');
  if (progressBar) {
    progressBar.style.width = progress + '%';
  }
}

// Category Filter
function setupCategoryFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const articleCards = document.querySelectorAll('.article-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;

      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter articles
      articleCards.forEach(card => {
        const cardCategories = card.dataset.tags ? card.dataset.tags.split(',') : [];

        if (category === 'all' || cardCategories.includes(category)) {
          card.style.display = '';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.9)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

// Smooth Scroll for Anchor Links
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Social Share Buttons
function setupSocialSharing() {
  const shareButtons = document.querySelectorAll('.social-share-btn');

  shareButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = btn.href;
      const width = 600;
      const height = 400;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      window.open(
        url,
        'share',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    });
  });
}

// Lazy Load Images
function setupLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

// Format Dates
function formatDates() {
  const dateElements = document.querySelectorAll('[data-date]');

  dateElements.forEach(el => {
    const dateStr = el.dataset.date;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let formattedDate;
    if (diffDays === 0) {
      formattedDate = 'Today';
    } else if (diffDays === 1) {
      formattedDate = 'Yesterday';
    } else if (diffDays < 7) {
      formattedDate = `${diffDays} days ago`;
    } else {
      formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    el.textContent = formattedDate;
  });
}

// Calculate Reading Time
function calculateReadingTime() {
  const content = document.querySelector('.article-content');
  if (!content) return;

  const text = content.textContent;
  const wordCount = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

  const readingTimeEl = document.querySelector('[data-reading-time]');
  if (readingTimeEl) {
    readingTimeEl.textContent = `${readingTime} min read`;
  }
}

// Copy to Clipboard for Code Blocks
function setupCodeBlockCopy() {
  const codeBlocks = document.querySelectorAll('pre code');

  codeBlocks.forEach(block => {
    const pre = block.parentElement;
    const button = document.createElement('button');
    button.className = 'copy-code-btn';
    button.textContent = 'Copy';
    button.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.9);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 600;
    `;

    pre.style.position = 'relative';
    pre.appendChild(button);

    button.addEventListener('click', () => {
      const code = block.textContent;
      navigator.clipboard.writeText(code).then(() => {
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 2000);
      });
    });
  });
}

// Track Affiliate Link Clicks
function trackAffiliateClicks() {
  const affiliateLinks = document.querySelectorAll('a[data-affiliate]');

  affiliateLinks.forEach(link => {
    link.addEventListener('click', () => {
      const productId = link.dataset.affiliate;

      // Send analytics (if you implement analytics later)
      if (window.gtag) {
        gtag('event', 'affiliate_click', {
          product_id: productId,
          link_url: link.href
        });
      }

      // Log to console for now
      console.log('Affiliate click:', productId);
    });
  });
}

// Mobile Menu Toggle
function setupMobileMenu() {
  const menuButton = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.site-nav');

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      nav.classList.toggle('active');
      menuButton.classList.toggle('active');
    });
  }
}

// Load Articles Data (for homepage)
async function loadArticles() {
  try {
    const response = await fetch('/articles-data.json');
    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.error('Error loading articles:', error);
    return [];
  }
}

// Render Articles Grid
function renderArticles(articles) {
  const grid = document.querySelector('.articles-grid');
  if (!grid) return;

  grid.innerHTML = articles.map(article => `
    <article class="article-card" data-tags="${article.tags ? article.tags.join(',') : ''}">
      ${article.featuredImage ? `
        <img src="${article.featuredImage}" alt="${article.title}" class="article-card-image">
      ` : ''}
      <div class="article-card-content">
        <div class="article-card-meta">
          <span data-date="${article.date}">${formatDate(article.date)}</span>
          ${article.readingTime ? `<span>${article.readingTime} min read</span>` : ''}
        </div>
        <h3 class="article-card-title">
          <a href="${article.url}">${article.title}</a>
        </h3>
        <p class="article-card-excerpt">${article.excerpt}</p>
        ${article.tags ? `
          <div class="article-card-tags">
            ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    </article>
  `).join('');

  formatDates();
}

// Helper: Format Date
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Initialize Everything
function init() {
  // Reading progress for article pages
  if (document.querySelector('.article-content')) {
    updateReadingProgress();
    window.addEventListener('scroll', updateReadingProgress);
    calculateReadingTime();
  }

  // Setup various features
  setupCategoryFilters();
  setupSmoothScroll();
  setupSocialSharing();
  setupLazyLoading();
  setupCodeBlockCopy();
  trackAffiliateClicks();
  setupMobileMenu();
  formatDates();

  // Load articles on homepage
  if (document.querySelector('.articles-grid')) {
    loadArticles().then(renderArticles);
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export functions for use in other scripts
window.AiTechPulse = {
  loadArticles,
  renderArticles,
  formatDate
};
