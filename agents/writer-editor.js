#!/usr/bin/env node

/**
 * Writer/Editor Agent
 *
 * This agent:
 * 1. Scans drafts/ folder for articles pending writing
 * 2. Transforms raw research into compelling, original articles
 * 3. Creates engaging headlines and intro hooks
 * 4. Structures content with clear sections
 * 5. Optimizes for SEO and readability
 * 6. Identifies product placement opportunities
 * 7. Marks articles as "ready for monetization"
 *
 * Usage: node agents/writer-editor.js [--draft=filename]
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { Anthropic } = require('@anthropic-ai/sdk');

// Load configuration
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// Initialize Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key-here'
});

/**
 * Find drafts that need writing
 */
function findPendingDrafts() {
  const draftsDir = path.join(__dirname, '../drafts');

  if (!fs.existsSync(draftsDir)) {
    console.log('No drafts directory found');
    return [];
  }

  const files = fs.readdirSync(draftsDir)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(draftsDir, file));

  return files.filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Check if it's pending writer (not already processed)
    return content.includes('pending-writer') && !content.includes('ready-for-monetization');
  });
}

/**
 * Extract research data from draft
 */
function extractResearchData(draftPath) {
  const html = fs.readFileSync(draftPath, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Extract metadata
  const getMetaContent = (name) => {
    const meta = doc.querySelector(`meta[name="${name}"]`);
    return meta ? meta.getAttribute('content') : '';
  };

  const title = getMetaContent('article:title');
  const description = getMetaContent('article:description');
  const tags = getMetaContent('article:tags');
  const source = getMetaContent('article:source');

  // Extract research notes
  const draftNotes = doc.querySelector('.draft-notes');
  const draftResearch = doc.querySelector('.draft-research');

  const summary = draftNotes?.querySelector('p')?.textContent || '';
  const keyFacts = Array.from(draftNotes?.querySelectorAll('li') || [])
    .map(li => li.textContent);
  const newsworthy = draftNotes?.querySelectorAll('p')[1]?.textContent || '';
  const research = draftResearch?.textContent || '';

  return {
    title,
    description,
    tags,
    source,
    summary,
    keyFacts,
    newsworthy,
    research
  };
}

/**
 * Write a compelling article using Claude
 */
async function writeArticle(researchData) {
  console.log(`✍️  Writing article: "${researchData.title}"...`);

  const prompt = `You are a professional tech writer for AI Tech Pulse, a technology news website.

Your task is to transform raw research into a compelling, original, SEO-optimized article.

STORY INFORMATION:
Headline: ${researchData.title}
Summary: ${researchData.summary}
Tags: ${researchData.tags}

KEY FACTS:
${researchData.keyFacts.map((fact, i) => `${i + 1}. ${fact}`).join('\n')}

WHY IT MATTERS:
${researchData.newsworthy}

RESEARCH:
${researchData.research}

WRITING GUIDELINES:
- Tone: ${config.writing.tone} - Professional but accessible, enthusiastic about tech
- Voice: ${config.writing.voice} - Authoritative yet conversational
- Length: ${config.content.minWordCount}-${config.content.maxWordCount} words
- Structure: Inverted pyramid (key info first)
- SEO: Include relevant keywords naturally
- Readability: Grade 10 reading level, clear and engaging

ARTICLE STRUCTURE:
1. **Compelling Introduction** (2-3 sentences)
   - Hook the reader immediately
   - Summarize the key news in the first sentence
   - Why should readers care?

2. **Main Story** (3-5 paragraphs)
   - Present the key facts and details
   - Provide context and background
   - Include relevant quotes or data points
   - Explain technical concepts clearly

3. **Analysis & Implications** (2-3 paragraphs)
   - What does this mean for the industry?
   - How does this affect users/developers?
   - Future outlook or predictions

4. **Conclusion** (1-2 paragraphs)
   - Key takeaway for readers
   - Call to action or thought-provoking question

IMPORTANT:
- Write original content (don't copy from sources)
- Avoid passive voice and jargon without explanation
- Use concrete examples and specific details
- Make it engaging and informative
- Include natural keyword integration
- Write in HTML format with proper tags (<h2>, <h3>, <p>, <ul>, <li>, etc.)

OUTPUT FORMAT:
Return ONLY the article content in HTML format, ready to insert into the article template. Do not include any meta-commentary or explanations outside the article itself.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const articleContent = message.content[0].text;
    console.log(`✓ Article written (${articleContent.split(/\s+/).length} words)`);

    return articleContent;
  } catch (error) {
    console.error('Error writing article:', error.message);
    throw error;
  }
}

/**
 * Optimize headline for SEO and engagement
 */
async function optimizeHeadline(originalHeadline, articleContent) {
  const prompt = `You are an SEO and engagement expert for a tech news website.

Original headline: "${originalHeadline}"

Article content preview:
${articleContent.substring(0, 500)}...

Create 3 alternative headlines that are:
- Clear and specific (not clickbait)
- SEO-friendly (includes key keywords)
- 60 characters or less
- Engaging and compelling
- Accurately reflects the article content

Return as JSON:
{
  "headlines": [
    "Headline option 1",
    "Headline option 2",
    "Headline option 3"
  ],
  "recommended": 0
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return data.headlines[data.recommended];
    }
  } catch (error) {
    console.log('Could not optimize headline, using original');
  }

  return originalHeadline;
}

/**
 * Generate meta description
 */
function generateMetaDescription(articleContent) {
  const text = articleContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const firstSentences = text.split('. ').slice(0, 2).join('. ');
  return firstSentences.substring(0, 157) + '...';
}

/**
 * Calculate reading time
 */
function calculateReadingTime(content) {
  const text = content.replace(/<[^>]*>/g, ' ');
  const wordCount = text.trim().split(/\s+/).length;
  return Math.ceil(wordCount / 200); // 200 words per minute
}

/**
 * Identify product placement opportunities
 */
async function identifyProductOpportunities(articleContent, tags) {
  console.log('🔍 Identifying product placement opportunities...');

  const prompt = `You are analyzing a tech article to identify natural opportunities for relevant product recommendations.

Article content:
${articleContent.substring(0, 1500)}...

Article tags: ${tags}

Task: Identify 2-4 locations in the article where relevant tech products could be naturally mentioned or recommended. For each opportunity, specify:
1. What type of product would fit (laptop, phone, accessory, software, etc.)
2. Where in the article it should be placed (after intro, mid-article, before conclusion)
3. Why it's relevant to the content

Return as JSON:
{
  "opportunities": [
    {
      "productType": "laptop",
      "placement": "mid-article",
      "relevance": "Article discusses AI development, so high-performance laptop recommendation fits naturally"
    }
  ]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      console.log(`✓ Found ${data.opportunities.length} product opportunities`);
      return data.opportunities;
    }
  } catch (error) {
    console.log('Could not identify product opportunities');
  }

  return [];
}

/**
 * Update draft with polished content
 */
function updateDraft(draftPath, articleContent, optimizedHeadline, metaDescription, readingTime, productOpportunities) {
  let html = fs.readFileSync(draftPath, 'utf8');

  // Update status metadata
  html = html.replace('Status: pending-writer', 'Status: ready-for-monetization');
  html = html.replace('pending-writer', 'ready-for-monetization');

  // Add writer metadata
  const writerMetadata = `
  Writer: writer-editor-agent
  Processed: ${new Date().toISOString()}
  Word Count: ${articleContent.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length}
  Reading Time: ${readingTime} minutes
  Product Opportunities: ${productOpportunities.length}
-->
<!--
  Product Placement Opportunities:
${productOpportunities.map((op, i) => `  ${i + 1}. ${op.productType} - ${op.placement} - ${op.relevance}`).join('\n')}
`;

  html = html.replace('-->', writerMetadata);

  // Update headline if optimized
  if (optimizedHeadline) {
    html = html.replace(/<meta name="article:title" content="[^"]*"/, `<meta name="article:title" content="${optimizedHeadline}"`);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${optimizedHeadline} - AI Tech Pulse</title>`);
    html = html.replace(/<h1 class="article-title">[^<]*<\/h1>/, `<h1 class="article-title">${optimizedHeadline}</h1>`);
  }

  // Update meta description
  html = html.replace(/<meta name="article:description" content="[^"]*"/, `<meta name="article:description" content="${metaDescription}"`);
  html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${metaDescription}"`);
  html = html.replace(/<p class="article-subtitle">[^<]*<\/p>/, `<p class="article-subtitle">${metaDescription}</p>`);

  // Update reading time
  html = html.replace(/{{READING_TIME}}/g, readingTime);

  // Replace draft content with polished article
  html = html.replace(/<div class="draft-notes"[\s\S]*?<\/div>/, '');
  html = html.replace(/<div class="draft-research">[\s\S]*?<\/div>/, '');
  html = html.replace(/<!-- WRITER AGENT:[\s\S]*?-->/, '');
  html = html.replace('{{CONTENT}}', articleContent);

  fs.writeFileSync(draftPath, html, 'utf8');
  console.log(`✓ Updated draft with polished content`);
}

/**
 * Log agent activity
 */
function logActivity(action, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    agent: 'writer-editor',
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
  console.log('🤖 Writer/Editor Agent Starting...\n');

  try {
    // Find pending drafts
    const pendingDrafts = findPendingDrafts();

    if (pendingDrafts.length === 0) {
      console.log('✓ No drafts pending writing');
      console.log('  Run content-curator agent to create new drafts');
      return;
    }

    console.log(`Found ${pendingDrafts.length} drafts to write\n`);

    // Process each draft
    const processed = [];
    for (const draftPath of pendingDrafts) {
      const filename = path.basename(draftPath);
      console.log(`\n📄 Processing: ${filename}`);

      // Extract research data
      const researchData = extractResearchData(draftPath);

      // Write article
      const articleContent = await writeArticle(researchData);

      // Optimize headline
      const optimizedHeadline = await optimizeHeadline(researchData.title, articleContent);

      // Generate meta description
      const metaDescription = generateMetaDescription(articleContent);

      // Calculate reading time
      const readingTime = calculateReadingTime(articleContent);

      // Identify product opportunities
      const productOpportunities = await identifyProductOpportunities(articleContent, researchData.tags);

      // Update draft
      updateDraft(draftPath, articleContent, optimizedHeadline, metaDescription, readingTime, productOpportunities);

      processed.push({
        filename,
        headline: optimizedHeadline || researchData.title,
        wordCount: articleContent.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length,
        readingTime,
        productOpportunities: productOpportunities.length
      });

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Log activity
    logActivity('articles-written', {
      count: processed.length,
      articles: processed
    });

    console.log(`\n✨ Writing Complete!`);
    console.log(`   Processed ${processed.length} articles`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Review articles in: drafts/`);
    console.log(`   2. Run monetization agent: node agents/monetization.js`);
    console.log(`   3. Manually move approved articles to articles/ folder`);

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

module.exports = { findPendingDrafts, writeArticle, optimizeHeadline };
