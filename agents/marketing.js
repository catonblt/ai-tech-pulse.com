#!/usr/bin/env node

/**
 * Marketing Agent
 *
 * This agent:
 * 1. Scans articles/ for newly published content
 * 2. Creates platform-specific social media posts
 * 3. Generates posts for Twitter/X, LinkedIn, Reddit, Facebook
 * 4. Saves posts for manual or automated distribution
 * 5. Tracks which articles have been promoted
 *
 * Usage: node agents/marketing.js [--platform=twitter] [--auto-post]
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
 * Find articles that need marketing
 */
function findUnpromotedArticles() {
  const articlesDir = path.join(__dirname, '../articles');
  const marketingLogPath = path.join(__dirname, '../analytics/marketing-log.json');

  if (!fs.existsSync(articlesDir)) {
    return [];
  }

  // Load marketing log to track what's been promoted
  let promotedArticles = [];
  if (fs.existsSync(marketingLogPath)) {
    const log = JSON.parse(fs.readFileSync(marketingLogPath, 'utf8'));
    promotedArticles = log.promoted || [];
  }

  const articles = fs.readdirSync(articlesDir)
    .filter(file => file.endsWith('.html'))
    .map(file => path.join(articlesDir, file));

  // Find articles not yet promoted
  return articles.filter(articlePath => {
    const filename = path.basename(articlePath);
    return !promotedArticles.includes(filename);
  });
}

/**
 * Extract article data for marketing
 */
function extractArticleData(articlePath) {
  const html = fs.readFileSync(articlePath, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const getMetaContent = (name) => {
    const meta = doc.querySelector(`meta[name="${name}"]`) ||
                  doc.querySelector(`meta[property="${name}"]`);
    return meta ? meta.getAttribute('content') : '';
  };

  const title = getMetaContent('article:title') || doc.querySelector('h1')?.textContent || '';
  const description = getMetaContent('article:description') || getMetaContent('description') || '';
  const tags = getMetaContent('article:tags')?.split(',').map(t => t.trim()) || [];
  const url = `${config.site.url}/articles/${path.basename(articlePath)}`;
  const image = getMetaContent('og:image') || '';

  // Extract first paragraph for excerpt
  const articleContent = doc.querySelector('.article-content');
  const firstPara = articleContent?.querySelector('p')?.textContent || '';
  const excerpt = firstPara.substring(0, 150);

  return {
    title,
    description,
    excerpt,
    tags,
    url,
    image,
    filename: path.basename(articlePath)
  };
}

/**
 * Generate Twitter/X posts
 */
async function generateTwitterPosts(article) {
  console.log('🐦 Generating Twitter/X posts...');

  const maxHashtags = config.marketing.socialMedia.twitter.maxHashtags || 3;

  const prompt = `You are a social media expert creating Twitter/X posts for a tech news website.

Article Information:
Title: ${article.title}
Description: ${article.description}
Tags: ${article.tags.join(', ')}
URL: ${article.url}

Create 3 different tweet variations for A/B testing:
1. News-focused (straight facts)
2. Question/engagement-focused (encourages discussion)
3. Hot-take/opinion-focused (strong angle)

Each tweet should:
- Be 200-280 characters (leaving room for the URL)
- Be engaging and click-worthy (but not clickbait)
- Include ${maxHashtags} relevant hashtags
- Use emoji sparingly (1-2 max)
- End with a clear value proposition

Return as JSON:
{
  "tweets": [
    {
      "text": "Tweet text here",
      "hashtags": ["AI", "TechNews"],
      "type": "news-focused"
    }
  ]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      console.log(`✓ Generated ${data.tweets.length} tweet variations`);
      return data.tweets;
    }
  } catch (error) {
    console.error('Error generating tweets:', error.message);
  }

  return [];
}

/**
 * Generate LinkedIn post
 */
async function generateLinkedInPost(article) {
  console.log('💼 Generating LinkedIn post...');

  const prompt = `You are creating a LinkedIn post for a professional tech news article.

Article Information:
Title: ${article.title}
Description: ${article.description}
Tags: ${article.tags.join(', ')}

Create a LinkedIn post that:
- Is professional yet engaging (300-500 characters)
- Emphasizes business/career implications
- Uses LinkedIn-friendly formatting (line breaks, bullet points)
- Ends with a thought-provoking question to encourage engagement
- Avoids excessive hashtags (2-3 max)

Return as JSON:
{
  "post": "LinkedIn post text here",
  "hashtags": ["AI", "TechNews"]
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
      console.log('✓ Generated LinkedIn post');
      return data;
    }
  } catch (error) {
    console.error('Error generating LinkedIn post:', error.message);
  }

  return null;
}

/**
 * Generate Reddit post suggestions
 */
async function generateRedditPosts(article) {
  console.log('📱 Generating Reddit post suggestions...');

  const subreddits = config.marketing.socialMedia.reddit.subreddits || [];

  const prompt = `You are suggesting Reddit posts for a tech article.

Article Information:
Title: ${article.title}
Description: ${article.description}
Tags: ${article.tags.join(', ')}

Potential subreddits: ${subreddits.join(', ')}

For each relevant subreddit, create a post that:
- Follows that subreddit's culture and rules
- Provides value first (not just self-promotion)
- Uses an engaging title that fits the subreddit style
- Includes a comment draft to post with the link

Return as JSON:
{
  "posts": [
    {
      "subreddit": "r/technology",
      "title": "Post title here",
      "comment": "Contextual comment to add with the link",
      "reasoning": "Why this subreddit is relevant"
    }
  ]
}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      console.log(`✓ Generated ${data.posts.length} Reddit post suggestions`);
      return data.posts;
    }
  } catch (error) {
    console.error('Error generating Reddit posts:', error.message);
  }

  return [];
}

/**
 * Generate Facebook post
 */
async function generateFacebookPost(article) {
  console.log('📘 Generating Facebook post...');

  const prompt = `You are creating a Facebook post for a tech article.

Article Information:
Title: ${article.title}
Description: ${article.description}

Create a Facebook post that:
- Is conversational and friendly (400-600 characters)
- Emphasizes human interest or practical implications
- Uses emojis naturally (3-4)
- Asks an engaging question at the end
- Minimal hashtags (Facebook doesn't prioritize them)

Return as JSON:
{
  "post": "Facebook post text here"
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
      console.log('✓ Generated Facebook post');
      return data;
    }
  } catch (error) {
    console.error('Error generating Facebook post:', error.message);
  }

  return null;
}

/**
 * Save social posts to file
 */
function saveSocialPosts(article, posts) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `social-posts-${article.filename.replace('.html', '')}-${timestamp}.json`;
  const filepath = path.join(__dirname, '../social-posts', filename);

  // Ensure directory exists
  const socialPostsDir = path.join(__dirname, '../social-posts');
  if (!fs.existsSync(socialPostsDir)) {
    fs.mkdirSync(socialPostsDir, { recursive: true });
  }

  const data = {
    article: {
      title: article.title,
      url: article.url,
      filename: article.filename
    },
    generatedAt: new Date().toISOString(),
    posts,
    status: 'pending'
  };

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✓ Saved social posts to: ${filename}`);

  return filepath;
}

/**
 * Generate posting schedule
 */
function generateSchedule(article, posts) {
  const now = new Date();
  const schedule = [];

  // Twitter - immediate
  if (posts.twitter && posts.twitter.length > 0) {
    const times = config.marketing.socialMedia.twitter.optimalPostingTimes || ['09:00', '13:00', '17:00'];
    posts.twitter.forEach((tweet, index) => {
      const [hour, minute] = times[index % times.length].split(':');
      const postTime = new Date(now);
      postTime.setHours(parseInt(hour), parseInt(minute), 0, 0);

      // If time has passed today, schedule for tomorrow
      if (postTime < now) {
        postTime.setDate(postTime.getDate() + 1);
      }

      schedule.push({
        platform: 'Twitter/X',
        content: tweet.text,
        hashtags: tweet.hashtags,
        scheduledTime: postTime.toISOString(),
        type: tweet.type
      });
    });
  }

  // LinkedIn - 2 hours after first Twitter post
  if (posts.linkedin) {
    const linkedInTime = new Date(schedule[0].scheduledTime);
    linkedInTime.setHours(linkedInTime.getHours() + 2);

    schedule.push({
      platform: 'LinkedIn',
      content: posts.linkedin.post,
      hashtags: posts.linkedin.hashtags,
      scheduledTime: linkedInTime.toISOString()
    });
  }

  // Reddit - manual review required
  if (posts.reddit && posts.reddit.length > 0) {
    posts.reddit.forEach(redditPost => {
      schedule.push({
        platform: 'Reddit',
        subreddit: redditPost.subreddit,
        title: redditPost.title,
        comment: redditPost.comment,
        scheduledTime: 'MANUAL_REVIEW_REQUIRED',
        reasoning: redditPost.reasoning
      });
    });
  }

  // Facebook - if enabled
  if (posts.facebook) {
    const facebookTime = new Date(schedule[0].scheduledTime);
    facebookTime.setHours(facebookTime.getHours() + 4);

    schedule.push({
      platform: 'Facebook',
      content: posts.facebook.post,
      scheduledTime: facebookTime.toISOString()
    });
  }

  return schedule;
}

/**
 * Update marketing log
 */
function updateMarketingLog(article, postsFile) {
  const logPath = path.join(__dirname, '../analytics/marketing-log.json');
  let log = { promoted: [], history: [] };

  if (fs.existsSync(logPath)) {
    log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
  }

  // Add to promoted list
  if (!log.promoted.includes(article.filename)) {
    log.promoted.push(article.filename);
  }

  // Add to history
  log.history.push({
    timestamp: new Date().toISOString(),
    article: article.filename,
    title: article.title,
    url: article.url,
    postsFile: path.basename(postsFile)
  });

  // Keep last 1000 entries
  if (log.history.length > 1000) {
    log.history = log.history.slice(-1000);
  }

  fs.writeFileSync(logPath, JSON.stringify(log, null, 2), 'utf8');
}

/**
 * Generate marketing report
 */
function generateReport(processed) {
  const reportPath = path.join(__dirname, '../analytics/marketing-report.md');

  let report = `# Marketing Report\n\n`;
  report += `Generated: ${new Date().toLocaleString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- Articles Promoted: ${processed.length}\n\n`;
  report += `## Articles\n\n`;

  processed.forEach((item, index) => {
    report += `### ${index + 1}. ${item.article.title}\n\n`;
    report += `- URL: ${item.article.url}\n`;
    report += `- Twitter Posts: ${item.postCounts.twitter}\n`;
    report += `- LinkedIn: ${item.postCounts.linkedin ? 'Yes' : 'No'}\n`;
    report += `- Reddit Suggestions: ${item.postCounts.reddit}\n`;
    report += `- Facebook: ${item.postCounts.facebook ? 'Yes' : 'No'}\n`;
    report += `- Posts File: \`social-posts/${path.basename(item.postsFile)}\`\n\n`;
  });

  report += `## Next Steps\n\n`;
  report += `1. Review generated posts in \`social-posts/\` folder\n`;
  report += `2. Copy and paste posts to respective platforms\n`;
  report += `3. Follow suggested posting schedule for optimal engagement\n`;
  report += `4. For Reddit posts, ensure they follow subreddit rules before posting\n`;

  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`\n✓ Generated marketing report: analytics/marketing-report.md`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🤖 Marketing Agent Starting...\n');

  try {
    // Find unpromoted articles
    const unpromotedArticles = findUnpromotedArticles();

    if (unpromotedArticles.length === 0) {
      console.log('✓ All articles have been promoted');
      console.log('  Publish new articles to generate marketing content');
      return;
    }

    console.log(`Found ${unpromotedArticles.length} articles to promote\n`);

    const processed = [];

    for (const articlePath of unpromotedArticles) {
      const article = extractArticleData(articlePath);
      console.log(`\n📢 Creating marketing content for: "${article.title}"\n`);

      const posts = {};
      const postCounts = {};

      // Generate posts for enabled platforms
      if (config.marketing.socialMedia.twitter.enabled) {
        posts.twitter = await generateTwitterPosts(article);
        postCounts.twitter = posts.twitter.length;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (config.marketing.socialMedia.linkedin.enabled) {
        posts.linkedin = await generateLinkedInPost(article);
        postCounts.linkedin = posts.linkedin ? 1 : 0;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (config.marketing.socialMedia.reddit.enabled) {
        posts.reddit = await generateRedditPosts(article);
        postCounts.reddit = posts.reddit.length;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (config.marketing.socialMedia.facebook.enabled) {
        posts.facebook = await generateFacebookPost(article);
        postCounts.facebook = posts.facebook ? 1 : 0;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Generate schedule
      posts.schedule = generateSchedule(article, posts);

      // Save posts
      const postsFile = saveSocialPosts(article, posts);

      // Update log
      updateMarketingLog(article, postsFile);

      processed.push({
        article,
        postCounts,
        postsFile
      });
    }

    // Generate report
    generateReport(processed);

    console.log(`\n✨ Marketing Content Generation Complete!`);
    console.log(`   Generated content for ${processed.length} articles`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Review posts in: social-posts/`);
    console.log(`   2. Read marketing report: analytics/marketing-report.md`);
    console.log(`   3. Copy posts to social media platforms`);
    console.log(`   4. Follow suggested posting schedule`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateTwitterPosts, generateLinkedInPost, generateRedditPosts };
