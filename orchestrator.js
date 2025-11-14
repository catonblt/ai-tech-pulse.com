#!/usr/bin/env node

/**
 * Agent Orchestrator
 *
 * This script coordinates all agents in the publishing pipeline:
 * 1. Content Curator → finds and researches stories
 * 2. Writer/Editor → transforms research into articles
 * 3. Monetization → adds affiliate products
 * 4. Build → updates website
 * 5. Marketing → promotes articles
 *
 * Usage:
 *   node orchestrator.js                  # Run full pipeline
 *   node orchestrator.js --dry-run        # Preview without executing
 *   node orchestrator.js --skip-curator   # Skip content curation
 *   node orchestrator.js --auto-publish   # Auto-publish articles
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load configuration
const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const skipCurator = args.includes('--skip-curator');
const autoPublish = args.includes('--auto-publish') || config.automation.autoPublish;

/**
 * Execute a command with error handling
 */
function runCommand(command, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ${description}`);
  console.log(`${'='.repeat(60)}\n`);

  if (dryRun) {
    console.log(`[DRY RUN] Would execute: ${command}\n`);
    return { success: true, dryRun: true };
  }

  try {
    const output = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8'
    });
    console.log(`\n✅ ${description} - Complete\n`);
    return { success: true, output };
  } catch (error) {
    console.error(`\n❌ ${description} - Failed`);
    console.error(`Error: ${error.message}\n`);
    return { success: false, error };
  }
}

/**
 * Wait for a specified duration
 */
async function wait(seconds) {
  if (dryRun) {
    console.log(`[DRY RUN] Would wait ${seconds} seconds\n`);
    return;
  }
  console.log(`⏳ Waiting ${seconds} seconds...\n`);
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * Check if agents are properly configured
 */
function checkConfiguration() {
  console.log('🔍 Checking configuration...\n');

  const issues = [];

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    issues.push('⚠️  ANTHROPIC_API_KEY environment variable not set');
    console.log('   Set it with: export ANTHROPIC_API_KEY=your-key-here');
  }

  // Check for affiliate ID
  if (config.monetization.amazonAffiliateId === 'YOUR-AFFILIATE-ID') {
    issues.push('⚠️  Amazon Affiliate ID not configured in config.json');
  }

  // Check required directories
  const requiredDirs = ['articles', 'drafts', 'agents', 'analytics', 'social-posts'];
  requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      issues.push(`⚠️  Missing directory: ${dir}`);
    }
  });

  // Check agent files
  const agentFiles = [
    'agents/content-curator.js',
    'agents/writer-editor.js',
    'agents/monetization.js',
    'agents/marketing.js'
  ];

  agentFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      issues.push(`❌ Missing agent: ${file}`);
    }
  });

  if (issues.length > 0) {
    console.log('Configuration issues found:\n');
    issues.forEach(issue => console.log(issue));
    console.log('');

    if (issues.some(i => i.startsWith('❌'))) {
      console.error('Cannot proceed with missing agent files.');
      return false;
    }

    console.log('These issues may affect functionality but are not critical.\n');
  } else {
    console.log('✅ Configuration looks good!\n');
  }

  return true;
}

/**
 * Generate pipeline status report
 */
function generateStatusReport() {
  const report = {
    timestamp: new Date().toISOString(),
    drafts: 0,
    readyForWriting: 0,
    readyForMonetization: 0,
    publishedArticles: 0,
    unpromotedArticles: 0
  };

  // Count drafts
  if (fs.existsSync('./drafts')) {
    const drafts = fs.readdirSync('./drafts').filter(f => f.endsWith('.html'));
    report.drafts = drafts.length;

    drafts.forEach(file => {
      const content = fs.readFileSync(`./drafts/${file}`, 'utf8');
      if (content.includes('pending-writer')) {
        report.readyForWriting++;
      } else if (content.includes('ready-for-monetization')) {
        report.readyForMonetization++;
      }
    });
  }

  // Count published articles
  if (fs.existsSync('./articles')) {
    report.publishedArticles = fs.readdirSync('./articles')
      .filter(f => f.endsWith('.html')).length;
  }

  // Count unpromoted articles
  if (fs.existsSync('./analytics/marketing-log.json')) {
    const log = JSON.parse(fs.readFileSync('./analytics/marketing-log.json', 'utf8'));
    const promoted = log.promoted || [];
    const published = fs.existsSync('./articles')
      ? fs.readdirSync('./articles').filter(f => f.endsWith('.html'))
      : [];
    report.unpromotedArticles = published.filter(f => !promoted.includes(f)).length;
  } else {
    report.unpromotedArticles = report.publishedArticles;
  }

  return report;
}

/**
 * Display pipeline status
 */
function displayStatus(status) {
  console.log('\n📊 Pipeline Status:');
  console.log(`   - Total Drafts: ${status.drafts}`);
  console.log(`   - Ready for Writing: ${status.readyForWriting}`);
  console.log(`   - Ready for Monetization: ${status.readyForMonetization}`);
  console.log(`   - Published Articles: ${status.publishedArticles}`);
  console.log(`   - Unpromoted Articles: ${status.unpromotedArticles}`);
  console.log('');
}

/**
 * Main pipeline execution
 */
async function runPipeline() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        AI TECH PULSE - AUTOMATED PUBLISHING PIPELINE     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

  if (dryRun) {
    console.log('🏃 DRY RUN MODE - No changes will be made\n');
  }

  // Check configuration
  if (!checkConfiguration()) {
    process.exit(1);
  }

  // Display initial status
  const initialStatus = generateStatusReport();
  console.log('📊 Initial Status:');
  displayStatus(initialStatus);

  const results = [];

  // Step 1: Content Curator (unless skipped)
  if (!skipCurator) {
    const result = runCommand(
      'node agents/content-curator.js',
      'Step 1: Content Curator - Finding trending stories'
    );
    results.push({ step: 'Content Curator', ...result });

    if (!result.success && !dryRun) {
      console.error('Pipeline failed at Content Curator. Check logs above.');
      process.exit(1);
    }

    await wait(5);
  } else {
    console.log('⏭️  Skipping Content Curator (--skip-curator flag)\n');
  }

  // Step 2: Writer/Editor
  const writerResult = runCommand(
    'node agents/writer-editor.js',
    'Step 2: Writer/Editor - Crafting articles'
  );
  results.push({ step: 'Writer/Editor', ...writerResult });

  if (!writerResult.success && !dryRun) {
    console.error('Pipeline failed at Writer/Editor. Check logs above.');
    process.exit(1);
  }

  await wait(5);

  // Step 3: Monetization
  const monetizationCmd = autoPublish
    ? 'node agents/monetization.js --auto-publish'
    : 'node agents/monetization.js';

  const monetizationResult = runCommand(
    monetizationCmd,
    'Step 3: Monetization - Adding affiliate products'
  );
  results.push({ step: 'Monetization', ...monetizationResult });

  if (!monetizationResult.success && !dryRun) {
    console.error('Pipeline failed at Monetization. Check logs above.');
    process.exit(1);
  }

  await wait(3);

  // Step 4: Build Site
  const buildResult = runCommand(
    'node build.js',
    'Step 4: Build - Updating website'
  );
  results.push({ step: 'Build', ...buildResult });

  if (!buildResult.success && !dryRun) {
    console.error('Pipeline failed at Build. Check logs above.');
    process.exit(1);
  }

  await wait(3);

  // Step 5: Marketing
  const marketingResult = runCommand(
    'node agents/marketing.js',
    'Step 5: Marketing - Generating social media content'
  );
  results.push({ step: 'Marketing', ...marketingResult });

  if (!marketingResult.success && !dryRun) {
    console.error('Pipeline failed at Marketing. Check logs above.');
    process.exit(1);
  }

  // Display final status
  const finalStatus = generateStatusReport();
  console.log('\n📊 Final Status:');
  displayStatus(finalStatus);

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('✨ PIPELINE COMPLETE!');
  console.log(`${'='.repeat(60)}\n`);

  console.log('📋 Summary:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const mode = result.dryRun ? ' [DRY RUN]' : '';
    console.log(`   ${status} ${result.step}${mode}`);
  });

  console.log('\n📝 What happened:');
  if (!skipCurator) {
    console.log(`   - Created ${finalStatus.drafts - initialStatus.drafts} new drafts`);
  }
  console.log(`   - Published ${finalStatus.publishedArticles - initialStatus.publishedArticles} articles`);
  console.log(`   - Generated marketing content for articles`);

  console.log('\n🎯 Next steps:');
  if (!autoPublish && finalStatus.readyForMonetization > 0) {
    console.log(`   1. Review ${finalStatus.readyForMonetization} articles in drafts/`);
    console.log('   2. Move approved articles to articles/');
    console.log('   3. Run: node build.js');
  }

  if (finalStatus.unpromotedArticles > 0) {
    console.log(`   1. Check social-posts/ folder for marketing content`);
    console.log('   2. Review analytics/marketing-report.md');
    console.log('   3. Post content to social media platforms');
  } else {
    console.log('   ✅ All articles have been promoted!');
  }

  console.log('\n💡 To run pipeline again:');
  console.log('   node orchestrator.js\n');
}

// Run pipeline
runPipeline().catch(error => {
  console.error('\n❌ Pipeline error:', error);
  process.exit(1);
});
