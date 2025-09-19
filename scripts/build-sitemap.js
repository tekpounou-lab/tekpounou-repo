#!/usr/bin/env node

import { generateSitemapFiles } from '../src/lib/sitemapGenerator.js'

async function main() {
  try {
    console.log('🚀 Generating sitemap files...')
    await generateSitemapFiles()
    console.log('✅ Sitemap generation completed successfully!')
  } catch (error) {
    console.error('❌ Error generating sitemaps:', error)
    process.exit(1)
  }
}

main()
