#!/usr/bin/env node

/**
 * Content Curator Agent
 *
 * This agent:
 * 1. Searches for latest tech/AI news from the past 24 hours
 * 2. Identifies 3-5 top trending stories
 * 3. Gathers information from multiple sources
 * 4. Creates draft articles in drafts/ folder
 * 5. Includes metadata, sources, and initial content structure
 *
 * Usage: node agents/content-curator.js [--count=3] [--topics=AI,Tech]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { Anthropic } = require('@anthropic-ai/sdk');

// Load configuration
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// Initialize Claude (use environment variable for API key)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key-here'
});

/**
 * Search for trending tech news
 * In a real implementation, this would use a news API or web scraping
 * For now, we'll use Claude to simulate news discovery
 */
async function searchTechNews(topics, count) {
  console.log(`🔍 Searching for ${count} trending stories about: ${topics.join(', ')}...`);

  const prompt = `You are a tech news curator for AI Tech Pulse, a technology news website.

Your task is to identify ${count} compelling, newsworthy tech stories from the past 24 hours that would interest our audience of tech enthusiasts, developers, and industry professionals.

Focus on these topics: ${topics.join(', ')}

For each story, provide:
1. A compelling headline (60 characters or less)
2. A brief summary (2-3 sentences)
3. Why it's newsworthy and relevant
4. Key facts and details
5. Suggested tags/categories
6. Potential sources (realistic tech news sites)

Return the stories in JSON format:
{
  "stories": [
    {
      "headline": "Story headline",
      "summary": "Brief summary",
      "newsworthy": "Why this matters",
      "keyFacts": ["fact 1", "fact 2", "fact 3"],
      "tags": ["AI", "Tech News"],
      "suggestedSources": ["TechCrunch", "The Verge"],
      "sourceUrl": "https://example.com/article"
    }
  ]
}

Make the stories realistic and timely. Focus on major announcements, product launches, research breakthroughs, industry news, or significant developments.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const data = JSON.parse(jsonMatch[0]);
    console.log(`✓ Found ${data.stories.length} trending stories`);

    return data.stories;
  } catch (error) {
    console.error('Error searching for news:', error.message);
    return [];
  }
}

/**
 * Research a story in more depth using Claude
 */
async function researchStory(story) {
  console.log(`📖 Researching: "${story.headline}"...`);

  const prompt = `You are researching a tech news story for an article. Here's what we know:

Headline: ${story.headline}
Summary: ${story.summary}
Key Facts: ${story.keyFacts.join(', ')}

Your task is to expand on this story with:
1. More detailed background information
2. Technical details (if applicable)
3. Industry context and implications
4. Expert perspectives or quotes (realistic, attributed)
5. Related developments or trends
6. Future outlook or predictions

Write a comprehensive research brief (300-500 words) that will be used by our writer to create the final article. Be informative, accurate, and engaging.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const research = message.content[0].text;
    console.log(`✓ Completed research for "${story.headline}"`);

    return research;
  } catch (error) {
    console.error('Error researching story:', error.message);
    return story.summary;
  }
}

/**
 * Create a draft article from story data
 */
function createDraftArticle(story, research) {
  const timestamp = Date.now();
  const slug = story.headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const filename = `draft-${slug}-${timestamp}.html`;
  const draftPath = path.join(__dirname, '../drafts', filename);

  // Load article template
  const templatePath = path.join(__dirname, 'templates/article-template.html');
  let template = fs.readFileSync(templatePath, 'utf8');

  // Prepare content
  const content = `
<!-- RAW RESEARCH DATA - TO BE REWRITTEN BY WRITER AGENT -->
<div class="draft-notes" style="background: #fff3cd; padding: 1rem; margin-bottom: 2rem; border-left: 4px solid #ffc107;">
  <h4>Story Summary</h4>
  <p>${story.summary}</p>

  <h4>Key Facts</h4>
  <ul>
    ${story.keyFacts.map(fact => `<li>${fact}</li>`).join('\n    ')}
  </ul>

  <h4>Why This Matters</h4>
  <p>${story.newsworthy}</p>
</div>

<div class="draft-research">
  <h2>Background & Context</h2>
  ${research.split('\n').map(para => para.trim() ? `<p>${para}</p>` : '').join('\n  ')}
</div>

<!-- WRITER AGENT: Transform the above research into a compelling, original article -->
`;

  // Replace template placeholders
  template = template.replace('{{TITLE}}', story.headline);
  template = template.replace(/{{TITLE}}/g, story.headline);
  template = template.replace('{{SUBTITLE}}', story.summary);
  template = template.replace('{{DESCRIPTION}}', story.summary);
  template = template.replace('{{DATE}}', new Date().toISOString());
  template = template.replace('{{FORMATTED_DATE}}', new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
  template = template.replace('{{AUTHOR}}', config.site.author);
  template = template.replace(/{{AUTHOR}}/g, config.site.author);
  template = template.replace('{{TAGS}}', story.tags.join(', '));
  template = template.replace('{{KEYWORDS}}', story.tags.join(', '));
  template = template.replace('{{SOURCE_URL}}', story.sourceUrl);
  template = template.replace(/{{SOURCE_URL}}/g, story.sourceUrl);
  template = template.replace('{{SOURCE_NAME}}', story.suggestedSources[0] || 'Multiple Sources');
  template = template.replace('{{READING_TIME}}', '5');
  template = template.replace('{{FEATURED_IMAGE}}', 'https://via.placeholder.com/1200x630?text=' + encodeURIComponent(story.headline));
  template = template.replace(/{{FEATURED_IMAGE}}/g, 'https://via.placeholder.com/1200x630?text=' + encodeURIComponent(story.headline));
  template = template.replace('{{ARTICLE_URL}}', `${config.site.url}/articles/${filename}`);
  template = template.replace(/{{ARTICLE_URL}}/g, `${config.site.url}/articles/${filename}`);
  template = template.replace('{{ENCODED_TITLE}}', encodeURIComponent(story.headline));
  template = template.replace(/{{ENCODED_TITLE}}/g, encodeURIComponent(story.headline));
  template = template.replace('{{ENCODED_URL}}', encodeURIComponent(`${config.site.url}/articles/${filename}`));
  template = template.replace(/{{ENCODED_URL}}/g, encodeURIComponent(`${config.site.url}/articles/${filename}`));
  template = template.replace('{{CONTENT}}', content);

  // Add draft metadata
  const draftMetadata = `
<!-- DRAFT METADATA -->
<!--
  Status: pending-writer
  Created: ${new Date().toISOString()}
  Curator: content-curator-agent
  Story Tags: ${story.tags.join(', ')}
  Suggested Sources: ${story.suggestedSources.join(', ')}
-->

`;

  template = draftMetadata + template;

  // Write draft file
  fs.writeFileSync(draftPath, template, 'utf8');
  console.log(`✓ Created draft: ${filename}`);

  return {
    filename,
    path: draftPath,
    story
  };
}

/**
 * Log agent activity
 */
function logActivity(action, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    agent: 'content-curator',
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
  console.log('🤖 Content Curator Agent Starting...\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  let count = config.content.articlesPerDay || 3;
  let topics = config.content.topics || ['AI', 'technology'];

  args.forEach(arg => {
    if (arg.startsWith('--count=')) {
      count = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--topics=')) {
      topics = arg.split('=')[1].split(',').map(t => t.trim());
    }
  });

  try {
    // Ensure drafts directory exists
    const draftsDir = path.join(__dirname, '../drafts');
    if (!fs.existsSync(draftsDir)) {
      fs.mkdirSync(draftsDir, { recursive: true });
    }

    // Ensure analytics directory exists
    const analyticsDir = path.join(__dirname, '../analytics');
    if (!fs.existsSync(analyticsDir)) {
      fs.mkdirSync(analyticsDir, { recursive: true });
    }

    // Search for stories
    const stories = await searchTechNews(topics, count);

    if (stories.length === 0) {
      console.log('⚠️  No stories found. Try again later.');
      return;
    }

    // Research and create drafts for each story
    const drafts = [];
    for (const story of stories) {
      const research = await researchStory(story);
      const draft = createDraftArticle(story, research);
      drafts.push(draft);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Log activity
    logActivity('drafts-created', {
      count: drafts.length,
      topics,
      drafts: drafts.map(d => d.filename)
    });

    console.log(`\n✨ Content Curation Complete!`);
    console.log(`   Created ${drafts.length} draft articles`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Review drafts in: drafts/`);
    console.log(`   2. Run writer-editor agent: node agents/writer-editor.js`);
    console.log(`   3. Run monetization agent: node agents/monetization.js`);

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

module.exports = { searchTechNews, researchStory, createDraftArticle };
