#!/usr/bin/env node

/**
 * Build Script for AI Tech Pulse
 *
 * This script:
 * 1. Scans the articles/ folder for HTML files
 * 2. Extracts metadata from each article
 * 3. Generates the homepage with article listings
 * 4. Creates sitemap.xml for SEO
 * 5. Generates RSS feed
 * 6. Creates articles-data.json for frontend
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Load configuration
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

/**
 * Extract metadata from an HTML article
 */
function extractArticleMetadata(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Extract metadata from meta tags
  const getMetaContent = (name) => {
    const meta = doc.querySelector(`meta[name="${name}"]`);
    return meta ? meta.getAttribute('content') : '';
  };

  const title = getMetaContent('article:title') || doc.querySelector('h1')?.textContent || '';
  const description = getMetaContent('article:description') || getMetaContent('description') || '';
  const date = getMetaContent('article:published_time') || new Date().toISOString();
  const author = getMetaContent('article:author') || config.site.author;
  const tags = getMetaContent('article:tags')?.split(',').map(t => t.trim()) || [];
  const source = getMetaContent('article:source') || '';
  const readingTime = getMetaContent('article:reading-time') || '5';
  const featuredImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';

  // Extract excerpt from article content
  const articleContent = doc.querySelector('.article-content');
  let excerpt = '';
  if (articleContent) {
    const firstParagraph = articleContent.querySelector('p');
    excerpt = firstParagraph?.textContent.substring(0, 200) + '...' || '';
  }

  const filename = path.basename(htmlPath);
  const url = `/articles/${filename}`;

  return {
    title,
    description,
    excerpt,
    date,
    author,
    tags,
    source,
    readingTime: parseInt(readingTime) || 5,
    featuredImage,
    url,
    filename
  };
}

/**
 * Scan articles directory and extract all metadata
 */
function scanArticles() {
  const articlesDir = path.join(__dirname, 'articles');

  // Create articles directory if it doesn't exist
  if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir, { recursive: true });
    console.log('Created articles/ directory');
    return [];
  }

  const files = fs.readdirSync(articlesDir)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(articlesDir, file));

  const articles = files.map(file => {
    try {
      return extractArticleMetadata(file);
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
      return null;
    }
  }).filter(Boolean);

  // Sort by date (newest first)
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));

  return articles;
}

/**
 * Generate article cards HTML
 */
function generateArticleCard(article) {
  const tagsHtml = article.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
  const imageHtml = article.featuredImage
    ? `<img src="${article.featuredImage}" alt="${article.title}" class="article-card-image">`
    : '';

  return `
    <article class="article-card" data-tags="${article.tags.join(',')}">
      ${imageHtml}
      <div class="article-card-content">
        <div class="article-card-meta">
          <span data-date="${article.date}">${formatDate(article.date)}</span>
          <span>${article.readingTime} min read</span>
        </div>
        <h3 class="article-card-title">
          <a href="${article.url}">${article.title}</a>
        </h3>
        <p class="article-card-excerpt">${article.excerpt}</p>
        <div class="article-card-tags">
          ${tagsHtml}
        </div>
      </div>
    </article>
  `;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Update homepage with article listings
 */
function updateHomepage(articles) {
  const indexPath = path.join(__dirname, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');

  // Generate article cards
  const articlesHtml = articles.map(article => generateArticleCard(article)).join('\n');

  // Update last updated time
  const lastUpdated = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  });

  // Replace articles grid content
  html = html.replace(
    /<div class="articles-grid">[\s\S]*?<\/div>/,
    `<div class="articles-grid">\n${articlesHtml}\n      </div>`
  );

  // Update last updated time
  html = html.replace(
    /<span id="last-update-time">.*?<\/span>/,
    `<span id="last-update-time">${lastUpdated}</span>`
  );

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log(`✓ Updated homepage with ${articles.length} articles`);
}

/**
 * Generate sitemap.xml
 */
function generateSitemap(articles) {
  const baseUrl = config.site.url;
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

  articles.forEach(article => {
    const date = new Date(article.date).toISOString().split('T')[0];
    xml += `  <url>
    <loc>${baseUrl}${article.url}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
  });

  xml += '</urlset>';

  fs.writeFileSync('./sitemap.xml', xml, 'utf8');
  console.log('✓ Generated sitemap.xml');
}

/**
 * Generate RSS feed
 */
function generateRSSFeed(articles) {
  const { name, url, description } = config.site;
  const buildDate = new Date().toUTCString();

  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${name}</title>
    <link>${url}</link>
    <description>${description}</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${url}/feed.xml" rel="self" type="application/rss+xml" />
`;

  // Include latest 20 articles in RSS
  articles.slice(0, 20).forEach(article => {
    const pubDate = new Date(article.date).toUTCString();
    rss += `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}${article.url}</link>
      <description>${escapeXml(article.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid>${url}${article.url}</guid>
      ${article.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
    </item>
`;
  });

  rss += `  </channel>
</rss>`;

  fs.writeFileSync('./feed.xml', rss, 'utf8');
  console.log('✓ Generated RSS feed');
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate articles data JSON for frontend
 */
function generateArticlesData(articles) {
  const data = {
    lastUpdated: new Date().toISOString(),
    totalArticles: articles.length,
    articles: articles.map(article => ({
      title: article.title,
      description: article.description,
      excerpt: article.excerpt,
      url: article.url,
      date: article.date,
      author: article.author,
      tags: article.tags,
      readingTime: article.readingTime,
      featuredImage: article.featuredImage
    }))
  };

  fs.writeFileSync('./articles-data.json', JSON.stringify(data, null, 2), 'utf8');
  console.log('✓ Generated articles-data.json');
}

/**
 * Generate build report
 */
function generateBuildReport(articles) {
  const report = {
    buildTime: new Date().toISOString(),
    totalArticles: articles.length,
    recentArticles: articles.slice(0, 5).map(a => ({
      title: a.title,
      date: a.date,
      tags: a.tags
    })),
    categories: {},
    stats: {
      averageReadingTime: Math.round(
        articles.reduce((sum, a) => sum + a.readingTime, 0) / articles.length
      ) || 0
    }
  };

  // Count articles by category
  articles.forEach(article => {
    article.tags.forEach(tag => {
      report.categories[tag] = (report.categories[tag] || 0) + 1;
    });
  });

  fs.writeFileSync('./build-report.json', JSON.stringify(report, null, 2), 'utf8');
  console.log('✓ Generated build report');

  return report;
}

/**
 * Main build function
 */
function build() {
  console.log('🏗️  Building AI Tech Pulse...\n');

  try {
    // Scan articles
    console.log('Scanning articles...');
    const articles = scanArticles();

    if (articles.length === 0) {
      console.log('⚠️  No articles found in articles/ directory');
      console.log('   Add some articles and run the build script again.');
      return;
    }

    console.log(`Found ${articles.length} articles\n`);

    // Update homepage
    updateHomepage(articles);

    // Generate sitemap
    generateSitemap(articles);

    // Generate RSS feed
    generateRSSFeed(articles);

    // Generate articles data
    generateArticlesData(articles);

    // Generate build report
    const report = generateBuildReport(articles);

    console.log('\n✨ Build complete!\n');
    console.log('Summary:');
    console.log(`  - ${report.totalArticles} total articles`);
    console.log(`  - ${Object.keys(report.categories).length} categories`);
    console.log(`  - ${report.stats.averageReadingTime} min average reading time`);
    console.log('\nTop categories:');
    Object.entries(report.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([cat, count]) => {
        console.log(`  - ${cat}: ${count} articles`);
      });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run build if called directly
if (require.main === module) {
  build();
}

module.exports = { build, scanArticles, extractArticleMetadata };
