#!/usr/bin/env node

/**
 * Monetization Agent
 *
 * This agent:
 * 1. Scans drafts/ for articles marked "ready-for-monetization"
 * 2. Analyzes article content and topics
 * 3. Selects relevant products from affiliate database
 * 4. Inserts 2-4 affiliate product cards naturally
 * 5. Adds proper disclosure
 * 6. Moves completed articles to articles/ folder
 *
 * Usage: node agents/monetization.js [--auto-publish]
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { Anthropic } = require('@anthropic-ai/sdk');

// Load configuration
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const affiliateProducts = JSON.parse(fs.readFileSync('./affiliate-products.json', 'utf8'));

// Initialize Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key-here'
});

/**
 * Find articles ready for monetization
 */
function findReadyArticles() {
  const draftsDir = path.join(__dirname, '../drafts');

  if (!fs.existsSync(draftsDir)) {
    return [];
  }

  const files = fs.readdirSync(draftsDir)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(draftsDir, file));

  return files.filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('ready-for-monetization') && !content.includes('monetized');
  });
}

/**
 * Extract article data
 */
function extractArticleData(articlePath) {
  const html = fs.readFileSync(articlePath, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const getMetaContent = (name) => {
    const meta = doc.querySelector(`meta[name="${name}"]`);
    return meta ? meta.getAttribute('content') : '';
  };

  const title = getMetaContent('article:title');
  const tags = getMetaContent('article:tags').split(',').map(t => t.trim());
  const articleContent = doc.querySelector('.article-content')?.innerHTML || '';

  // Extract product opportunities from comments
  const commentMatch = html.match(/Product Placement Opportunities:([\s\S]*?)-->/);
  const opportunities = [];
  if (commentMatch) {
    const lines = commentMatch[1].split('\n').filter(l => l.trim());
    lines.forEach(line => {
      const match = line.match(/\d+\.\s*(\w+)\s*-\s*(\S+)\s*-\s*(.*)/);
      if (match) {
        opportunities.push({
          productType: match[1],
          placement: match[2],
          relevance: match[3]
        });
      }
    });
  }

  return {
    title,
    tags,
    articleContent,
    opportunities,
    html,
    dom,
    doc
  };
}

/**
 * Select relevant products using Claude
 */
async function selectRelevantProducts(articleData) {
  console.log('🎯 Selecting relevant affiliate products...');

  const prompt = `You are selecting relevant tech products to recommend in an article.

ARTICLE INFO:
Title: ${articleData.title}
Tags: ${articleData.tags.join(', ')}

Article content preview:
${articleData.articleContent.replace(/<[^>]*>/g, ' ').substring(0, 1000)}...

PRODUCT OPPORTUNITIES:
${articleData.opportunities.map((op, i) => `${i + 1}. ${op.productType} at ${op.placement} - ${op.relevance}`).join('\n')}

AVAILABLE PRODUCTS:
${affiliateProducts.products.slice(0, 20).map((p, i) => `${i + 1}. ${p.name} (${p.category}) - ${p.description}\n   Keywords: ${p.keywords.join(', ')}`).join('\n\n')}

Task: Select 2-4 products that are most relevant to this article. For each product:
1. Choose products that naturally fit the article content
2. Ensure contextual relevance (score 8-10/10)
3. Specify where to place each product (after-intro, mid-article, before-conclusion, sidebar)
4. Explain why it's relevant

Return as JSON:
{
  "selectedProducts": [
    {
      "productId": "prod-001",
      "placement": "mid-article",
      "relevanceScore": 9,
      "reason": "Article discusses AI development, making this laptop highly relevant"
    }
  ]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      console.log(`✓ Selected ${data.selectedProducts.length} relevant products`);
      return data.selectedProducts;
    }
  } catch (error) {
    console.error('Error selecting products:', error.message);
  }

  return [];
}

/**
 * Generate product card HTML
 */
function generateProductCard(product, affiliateId) {
  const amazonLink = product.amazonLink.replace('YOUR-AFFILIATE-LINK', affiliateId);

  return `
<div class="affiliate-product">
  <img src="${product.imageUrl}" alt="${product.name}" class="affiliate-product-image">
  <div class="affiliate-product-info">
    <h4 class="affiliate-product-name">${product.name}</h4>
    <div class="affiliate-product-price">${product.price}</div>
    <p class="affiliate-product-description">${product.description}</p>
    <a href="${amazonLink}" class="affiliate-cta" target="_blank" rel="noopener nofollow sponsored" data-affiliate="${product.id}">
      View on Amazon →
    </a>
  </div>
</div>
`;
}

/**
 * Generate sidebar product recommendation
 */
function generateSidebarProduct(product, affiliateId) {
  const amazonLink = product.amazonLink.replace('YOUR-AFFILIATE-LINK', affiliateId);

  return `
<div class="sidebar-section">
  <h3 class="sidebar-title">Recommended</h3>
  <div style="text-align: center;">
    <img src="${product.imageUrl}" alt="${product.name}" style="width: 100%; border-radius: 8px; margin-bottom: 1rem;">
    <h4 style="font-size: 1rem; margin-bottom: 0.5rem;">${product.name}</h4>
    <div style="font-size: 1.25rem; font-weight: bold; color: var(--accent-orange); margin-bottom: 0.5rem;">${product.price}</div>
    <a href="${amazonLink}" class="affiliate-cta" target="_blank" rel="noopener nofollow sponsored" data-affiliate="${product.id}" style="display: inline-block; width: 100%;">
      View on Amazon →
    </a>
  </div>
</div>
`;
}

/**
 * Insert products into article
 */
function insertProducts(articleData, selections) {
  let html = articleData.html;
  const affiliateId = config.monetization.amazonAffiliateId;

  // Group products by placement
  const placements = {
    'after-intro': [],
    'mid-article': [],
    'before-conclusion': [],
    'sidebar': []
  };

  selections.forEach(selection => {
    const product = affiliateProducts.products.find(p => p.id === selection.productId);
    if (product) {
      placements[selection.placement].push({
        product,
        selection
      });
    }
  });

  // Insert products at appropriate locations
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const articleContent = doc.querySelector('.article-content');

  if (articleContent) {
    const paragraphs = articleContent.querySelectorAll('p');

    // After intro (after first 2 paragraphs)
    if (placements['after-intro'].length > 0 && paragraphs.length > 2) {
      const productHtml = placements['after-intro']
        .map(({ product }) => generateProductCard(product, affiliateId))
        .join('\n');
      const div = doc.createElement('div');
      div.innerHTML = productHtml;
      paragraphs[1].after(div);
    }

    // Mid-article (around middle)
    if (placements['mid-article'].length > 0 && paragraphs.length > 5) {
      const midPoint = Math.floor(paragraphs.length / 2);
      const productHtml = placements['mid-article']
        .map(({ product }) => generateProductCard(product, affiliateId))
        .join('\n');
      const div = doc.createElement('div');
      div.innerHTML = productHtml;
      paragraphs[midPoint].after(div);
    }

    // Before conclusion (near end)
    if (placements['before-conclusion'].length > 0 && paragraphs.length > 3) {
      const productHtml = placements['before-conclusion']
        .map(({ product }) => generateProductCard(product, affiliateId))
        .join('\n');
      const div = doc.createElement('div');
      div.innerHTML = productHtml;
      paragraphs[paragraphs.length - 2].after(div);
    }
  }

  // Sidebar products
  if (placements['sidebar'].length > 0) {
    const sidebarProduct = doc.querySelector('#sidebar-product');
    if (sidebarProduct) {
      const productHtml = generateSidebarProduct(placements['sidebar'][0].product, affiliateId);
      sidebarProduct.innerHTML = productHtml;
    }
  }

  html = dom.serialize();

  // Update metadata
  html = html.replace('Status: ready-for-monetization', 'Status: monetized');
  html = html.replace('ready-for-monetization', 'monetized');

  const monetizationMetadata = `
  Monetization: monetization-agent
  Monetized: ${new Date().toISOString()}
  Products Inserted: ${selections.length}
  Product IDs: ${selections.map(s => s.productId).join(', ')}
`;

  html = html.replace('-->', monetizationMetadata + '-->');

  console.log(`✓ Inserted ${selections.length} affiliate products`);

  return html;
}

/**
 * Move article from drafts to articles
 */
function publishArticle(draftPath, autoPublish) {
  const filename = path.basename(draftPath);
  const cleanFilename = filename.replace('draft-', '');
  const articlesDir = path.join(__dirname, '../articles');

  // Create articles directory if it doesn't exist
  if (!fs.existsSync(articlesDir)) {
    fs.mkdirSync(articlesDir, { recursive: true });
  }

  const articlePath = path.join(articlesDir, cleanFilename);

  if (autoPublish) {
    fs.renameSync(draftPath, articlePath);
    console.log(`✓ Published: ${cleanFilename}`);
    return true;
  } else {
    console.log(`⏸️  Article ready but not auto-published: ${filename}`);
    console.log(`   To publish, move to: articles/${cleanFilename}`);
    return false;
  }
}

/**
 * Log agent activity
 */
function logActivity(action, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    agent: 'monetization',
    action,
    data
  };

  const logPath = path.join(__dirname, '../analytics/agent-logs.json');
  let logs = [];

  if (fs.existsSync(logPath)) {
    logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
  }

  logs.push(logEntry);

  // Keep only last 1000 entries
  if (logs.length > 1000) {
    logs = logs.slice(-1000);
  }

  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
}

/**
 * Main execution
 */
async function main() {
  console.log('🤖 Monetization Agent Starting...\n');

  const args = process.argv.slice(2);
  const autoPublish = args.includes('--auto-publish') || config.automation.autoPublish;

  try {
    // Find articles ready for monetization
    const readyArticles = findReadyArticles();

    if (readyArticles.length === 0) {
      console.log('✓ No articles ready for monetization');
      console.log('  Run writer-editor agent to prepare articles');
      return;
    }

    console.log(`Found ${readyArticles.length} articles ready for monetization\n`);

    // Process each article
    const processed = [];
    for (const articlePath of readyArticles) {
      const filename = path.basename(articlePath);
      console.log(`\n💰 Monetizing: ${filename}`);

      // Extract article data
      const articleData = extractArticleData(articlePath);

      // Select relevant products
      const selections = await selectRelevantProducts(articleData);

      if (selections.length === 0) {
        console.log('⚠️  No relevant products found, skipping monetization');
        continue;
      }

      // Insert products
      const monetizedHtml = insertProducts(articleData, selections);

      // Save monetized article
      fs.writeFileSync(articlePath, monetizedHtml, 'utf8');

      // Publish if auto-publish is enabled
      const published = publishArticle(articlePath, autoPublish);

      processed.push({
        filename,
        productsInserted: selections.length,
        published
      });

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Log activity
    logActivity('articles-monetized', {
      count: processed.length,
      autoPublish,
      articles: processed
    });

    console.log(`\n✨ Monetization Complete!`);
    console.log(`   Processed ${processed.length} articles`);

    if (autoPublish) {
      const publishedCount = processed.filter(p => p.published).length;
      console.log(`   Published ${publishedCount} to articles/ folder`);
      console.log(`\n📝 Next steps:`);
      console.log(`   1. Run build script: npm run build`);
      console.log(`   2. Run marketing agent: node agents/marketing.js`);
    } else {
      console.log(`\n📝 Next steps:`);
      console.log(`   1. Review monetized articles in: drafts/`);
      console.log(`   2. Manually move approved articles to: articles/`);
      console.log(`   3. Run build script: npm run build`);
      console.log(`   4. Run marketing agent: node agents/marketing.js`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    logActivity('error', { message: error.message });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { findReadyArticles, selectRelevantProducts, insertProducts };
