# 🤖 AI Tech Pulse - Automated Tech News Website

A fully automated tech news website powered by AI agents that curate content, write articles, add monetization, and generate marketing material. Built with Claude AI and designed for passive income through affiliate marketing.

![AI Tech Pulse](https://via.placeholder.com/1200x400?text=AI+Tech+Pulse+Automated+News)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [The Four AI Agents](#the-four-ai-agents)
- [Running the Pipeline](#running-the-pipeline)
- [Monetization Guide](#monetization-guide)
- [Marketing Strategy](#marketing-strategy)
- [Automation Setup](#automation-setup)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

AI Tech Pulse is a production-ready, automated tech news website that:

1. **Finds trending stories** using AI-powered content curation
2. **Writes compelling articles** with SEO optimization
3. **Adds affiliate products** naturally into content
4. **Generates marketing content** for social media
5. **Runs automatically** on a schedule via GitHub Actions

**Goal:** Create a hands-off system that generates passive income through Amazon affiliate commissions while providing valuable tech news content.

## ✨ Features

### 🔄 Full Automation
- Daily content generation and publishing
- Automated article workflow from discovery to publication
- Scheduled runs via GitHub Actions
- Hands-off operation after initial setup

### 🤖 Four Specialized AI Agents
1. **Content Curator** - Discovers trending tech stories
2. **Writer/Editor** - Crafts engaging, SEO-optimized articles
3. **Monetization** - Inserts relevant affiliate products
4. **Marketing** - Creates social media promotional content

### 💰 Monetization
- Amazon affiliate product integration
- Contextually relevant product placement
- Multiple ad formats (cards, sidebars, inline links)
- Conversion tracking and optimization

### 📱 Modern Web Design
- Responsive, mobile-friendly layout
- TechCrunch/The Verge inspired design
- Fast loading with minimal dependencies
- SEO-optimized structure

### 📊 Analytics & Reporting
- Agent activity logging
- Marketing performance tracking
- Build reports and statistics
- Performance optimization insights

## 📁 Project Structure

```
ai-tech-pulse.com/
├── index.html                  # Homepage (auto-generated)
├── articles/                   # Published articles
│   └── sample-article.html
├── drafts/                     # Articles in progress
├── assets/                     # Static files
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── images/
├── agents/                     # AI agents
│   ├── content-curator.js
│   ├── writer-editor.js
│   ├── monetization.js
│   ├── marketing.js
│   └── templates/
│       ├── article-template.html
│       └── social-posts.json
├── analytics/                  # Logs and reports
│   ├── agent-logs.json
│   ├── marketing-log.json
│   └── marketing-report.md
├── social-posts/               # Generated social content
├── .github/workflows/          # GitHub Actions
│   └── daily-update.yml
├── config.json                 # Main configuration
├── affiliate-products.json     # Product database
├── build.js                    # Site builder
├── orchestrator.js             # Agent coordinator
├── package.json                # Dependencies
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- Anthropic API key (Claude)
- Amazon Affiliate ID (optional but recommended)
- Git and GitHub account (for automation)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-tech-pulse.git
   cd ai-tech-pulse.com
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   ```

   Or create a `.env` file:
   ```
   ANTHROPIC_API_KEY=your-api-key-here
   ```

4. **Configure the system**

   Edit `config.json`:
   - Set your site URL
   - Configure content topics
   - Set Amazon affiliate ID
   - Adjust automation settings

5. **Add products to affiliate database**

   Edit `affiliate-products.json` with your Amazon affiliate products

6. **Test the pipeline**
   ```bash
   npm run pipeline:dry-run
   ```

7. **Run your first pipeline**
   ```bash
   npm run pipeline
   ```

8. **Build the website**
   ```bash
   npm run build
   ```

9. **Preview locally**
   ```bash
   npm run dev
   # Visit http://localhost:8080
   ```

## ⚙️ Configuration

### Main Configuration (`config.json`)

```json
{
  "site": {
    "name": "AI Tech Pulse",
    "url": "https://ai-tech-pulse.com",
    "description": "Your description here"
  },
  "content": {
    "topics": ["AI", "machine learning", "gadgets"],
    "articlesPerDay": 3,
    "minWordCount": 600,
    "maxWordCount": 1200
  },
  "monetization": {
    "amazonAffiliateId": "YOUR-AFFILIATE-ID",
    "maxAdsPerArticle": 4
  },
  "automation": {
    "autoPublish": false,
    "requireManualReview": true
  }
}
```

### Key Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `articlesPerDay` | How many stories to curate daily | 3 |
| `autoPublish` | Automatically publish without review | false |
| `requireManualReview` | Require approval before publishing | true |
| `amazonAffiliateId` | Your Amazon affiliate ID | Required |

## 🤖 The Four AI Agents

### 1. Content Curator Agent

**Purpose:** Discovers trending tech stories and creates research drafts

**How it works:**
- Searches for trending tech/AI news from past 24 hours
- Identifies 3-5 top stories
- Gathers information from multiple sources
- Creates draft articles with research notes

**Run manually:**
```bash
npm run curator
# or
node agents/content-curator.js
```

**Output:** Draft articles in `drafts/` folder with status `pending-writer`

---

### 2. Writer/Editor Agent

**Purpose:** Transforms research into compelling, SEO-optimized articles

**How it works:**
- Scans drafts for articles needing writing
- Rewrites content in engaging, original voice
- Creates compelling headlines and intro hooks
- Structures content with clear sections
- Optimizes for SEO and readability
- Identifies product placement opportunities

**Run manually:**
```bash
npm run writer
# or
node agents/writer-editor.js
```

**Output:** Polished articles in `drafts/` with status `ready-for-monetization`

---

### 3. Monetization Agent

**Purpose:** Inserts relevant Amazon affiliate products into articles

**How it works:**
- Analyzes article content and topics
- Selects relevant products from affiliate database
- Places 2-4 product cards naturally in content
- Adds proper affiliate disclosures
- Moves completed articles to `articles/` folder (if auto-publish enabled)

**Run manually:**
```bash
npm run monetize
# or
node agents/monetization.js --auto-publish
```

**Output:** Monetized articles ready for publication

---

### 4. Marketing Agent

**Purpose:** Creates social media promotional content

**How it works:**
- Scans published articles
- Generates platform-specific posts:
  - **Twitter/X:** 3 tweet variations for A/B testing
  - **LinkedIn:** Professional post with business angle
  - **Reddit:** Subreddit-specific posts (manual review)
  - **Facebook:** Conversational post
- Creates posting schedule
- Saves all content for manual distribution

**Run manually:**
```bash
npm run marketing
# or
node agents/marketing.js
```

**Output:** Social posts in `social-posts/` folder and `analytics/marketing-report.md`

## 🔄 Running the Pipeline

### Full Automated Pipeline

Run all agents in sequence:

```bash
npm run pipeline
```

This executes:
1. Content Curator (finds stories)
2. Writer/Editor (crafts articles)
3. Monetization (adds products)
4. Build (updates website)
5. Marketing (generates social content)

### Pipeline with Auto-Publishing

```bash
npm run pipeline:auto
```

Automatically publishes articles without manual review.

### Dry Run (Preview Only)

```bash
npm run pipeline:dry-run
```

Shows what would happen without making changes.

### Individual Agents

Run agents separately for more control:

```bash
npm run curator   # Find and research stories
npm run writer    # Write articles
npm run monetize  # Add affiliate products
npm run marketing # Generate social posts
npm run build     # Update website
```

## 💰 Monetization Guide

### Setting Up Amazon Affiliate

1. **Sign up for Amazon Associates**
   - Visit [Amazon Associates](https://affiliate-program.amazon.com/)
   - Complete registration
   - Get your affiliate ID (format: `yourname-20`)

2. **Add affiliate ID to config**
   ```json
   {
     "monetization": {
       "amazonAffiliateId": "yourname-20"
     }
   }
   ```

3. **Populate product database**

   Edit `affiliate-products.json`:
   ```json
   {
     "products": [
       {
         "id": "prod-001",
         "name": "Product Name",
         "category": "laptops",
         "amazonLink": "https://amazon.com/dp/PRODUCT-ID",
         "price": "$999",
         "description": "Compelling description",
         "keywords": ["AI", "laptop", "development"]
       }
     ]
   }
   ```

4. **Best practices:**
   - Start with 20-30 popular tech products
   - Focus on evergreen products (not seasonal)
   - Include products at different price points
   - Update links regularly (they expire)
   - Track which products convert best

### Optimizing Affiliate Revenue

1. **Product Selection:**
   - Choose products closely related to article topics
   - Higher price items = higher commission
   - Popular products = more conversions
   - Mix of needs (laptops, accessories, software)

2. **Placement Strategy:**
   - After intro: Related to main topic
   - Mid-article: Supporting products
   - Before conclusion: Alternative options
   - Sidebar: Featured recommendation

3. **Content Strategy:**
   - Write reviews and comparisons
   - Create buyer's guides
   - Cover product launches
   - Tutorial articles naturally mention tools

4. **Performance Tracking:**
   - Monitor which articles drive sales
   - Track click-through rates
   - Test different product placements
   - A/B test product recommendations

## 📢 Marketing Strategy

### Manual Posting (Recommended for Beginners)

1. **Generate content:**
   ```bash
   npm run marketing
   ```

2. **Review posts:**
   - Check `social-posts/` folder
   - Read `analytics/marketing-report.md`
   - Review suggested posting schedule

3. **Post manually:**
   - Copy tweets and post at scheduled times
   - Adjust wording as needed
   - Engage with responses

4. **Track performance:**
   - Note which posts drive traffic
   - Adjust strategy based on results

### Platform-Specific Tips

**Twitter/X:**
- Post 3x daily: morning, lunch, evening
- Use 2-4 relevant hashtags
- Include compelling image or preview
- Engage with replies quickly
- Build relationships with tech influencers

**LinkedIn:**
- Post during business hours (Tue-Thu)
- Professional tone, business implications
- Ask questions to encourage engagement
- Tag relevant companies
- Share insights, not just links

**Reddit:**
- **IMPORTANT:** Follow subreddit rules strictly
- Provide value in comments
- Don't spam or self-promote excessively
- Build karma before sharing
- Engage authentically

**Facebook:**
- Evening posts perform best
- Conversational tone
- Ask engaging questions
- Use minimal hashtags
- Build community through groups

### Content Calendar

Create a posting schedule:

| Time | Monday | Tuesday | Wednesday | Thursday | Friday |
|------|--------|---------|-----------|----------|--------|
| 9 AM | Twitter | Twitter | Twitter | Twitter | Twitter |
| 1 PM | Twitter | LinkedIn | Twitter | LinkedIn | Twitter |
| 5 PM | Twitter | Twitter | Twitter | Twitter | Facebook |

### Growth Tips

1. **First Month:**
   - Post consistently
   - Engage with your audience
   - Learn what content resonates
   - Build relationships

2. **Months 2-3:**
   - Automate best-performing platforms
   - Increase posting frequency
   - Experiment with content types
   - Join relevant communities

3. **Months 4-6:**
   - Scale up content production
   - Consider paid promotion
   - Build email list
   - Collaborate with other creators

## 🤖 Automation Setup

### GitHub Actions (Recommended)

1. **Enable GitHub Actions**
   - Go to repository Settings > Actions
   - Enable workflows

2. **Add secrets**
   - Go to Settings > Secrets and variables > Actions
   - Add secret: `ANTHROPIC_API_KEY`

3. **Configure workflow**

   The workflow is already set up in `.github/workflows/daily-update.yml`

   Default schedule: Daily at 9 AM UTC

   To change schedule, edit the cron expression:
   ```yaml
   schedule:
     - cron: '0 9 * * *'  # 9 AM UTC daily
   ```

4. **Manual triggers**
   - Go to Actions tab
   - Select "Daily Content Pipeline"
   - Click "Run workflow"

5. **Monitor runs**
   - Check Actions tab for status
   - Review logs for each step
   - Download artifacts for review

### GitHub Pages Deployment

1. **Enable GitHub Pages**
   - Go to Settings > Pages
   - Source: GitHub Actions
   - Save

2. **Site will be published to:**
   ```
   https://yourusername.github.io/ai-tech-pulse/
   ```

3. **Custom domain (optional):**
   - Add CNAME file with your domain
   - Configure DNS settings
   - Enable HTTPS in Pages settings

## 🐛 Troubleshooting

### Common Issues

**Issue:** "ANTHROPIC_API_KEY not set"
```bash
# Solution: Export the environment variable
export ANTHROPIC_API_KEY="your-key-here"

# Or add to .env file
echo "ANTHROPIC_API_KEY=your-key-here" > .env
```

**Issue:** "No drafts found"
```bash
# Solution: Run content curator first
npm run curator
```

**Issue:** "Build script fails"
```bash
# Solution: Ensure there are articles in articles/ folder
# Check build.js output for specific error
node build.js
```

**Issue:** "Agent errors or timeouts"
```bash
# Solution: Check API key and rate limits
# Try running agents individually
# Check analytics/agent-logs.json for details
```

**Issue:** "Affiliate links not working"
```bash
# Solution: Verify amazonAffiliateId in config.json
# Ensure product links in affiliate-products.json are correct
# Amazon associate links must be properly formatted
```

### Debugging

1. **Check logs:**
   ```bash
   cat analytics/agent-logs.json | jq '.'
   ```

2. **Dry run to test:**
   ```bash
   npm run pipeline:dry-run
   ```

3. **Run agents individually:**
   ```bash
   node agents/content-curator.js
   # Check output before proceeding
   ```

4. **Verify configuration:**
   ```bash
   cat config.json | jq '.'
   ```

## 🔧 Advanced Usage

### Customizing Agents

Each agent can be customized by editing its JavaScript file:

```javascript
// agents/content-curator.js
const count = 5;  // Increase stories per run
const topics = ["AI", "blockchain", "IoT"];  // Add topics
```

### Custom Product Matching

Improve product relevance by adjusting the matching algorithm in `agents/monetization.js`.

### Writing Style Customization

Adjust tone and style in `config.json`:

```json
{
  "writing": {
    "tone": "professional-casual",
    "perspective": "tech-enthusiast",
    "includeHumor": true,
    "targetReadingLevel": "grade-10"
  }
}
```

### Adding New Social Platforms

1. Create platform-specific generator in `agents/marketing.js`
2. Add platform config to `config.json`
3. Update social templates in `agents/templates/social-posts.json`

### Custom Deployment

Deploy to any hosting provider:

```bash
# Build the site
npm run build

# Copy these files to your host:
# - index.html
# - articles/
# - assets/
# - sitemap.xml
# - feed.xml
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with [Claude AI](https://anthropic.com) by Anthropic
- Inspired by modern tech blogs like TechCrunch and The Verge
- Thanks to the open-source community

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/ai-tech-pulse/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/ai-tech-pulse/discussions)

---

**Built with ❤️ and AI • © 2024 AI Tech Pulse**
