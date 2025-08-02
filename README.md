# Collaborative furniture app

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/alexbuechls-projects/v0-collaborative-furniture-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/qAUAabR92uy)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Environment Setup

To enable product scraping functionality, you need to set up the following environment variables:

### Required Environment Variables

Create a `.env.local` file in the root directory with:

```bash
# Firecrawl API Key for product scraping
# Get your API key from https://firecrawl.dev/
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Optional: Next.js configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Getting a Firecrawl API Key

1. Visit [https://firecrawl.dev/](https://firecrawl.dev/)
2. Sign up for an account
3. Get your API key from the dashboard
4. Add it to your `.env.local` file

### Troubleshooting Scraping Issues

If you see "Automatic extraction failed" messages:

1. **Check API Key**: Ensure `FIRECRAWL_API_KEY` is set in your environment
2. **Check Console Logs**: Open browser developer tools and look for logs starting with `[EXTRACT_PRODUCT]`, `[FIRECRAWL]`, or `[API:]`
3. **Test URLs**: Try the debug scraper at `/debug-scraper` to test specific URLs
4. **Network Issues**: Some websites may block automated scraping

## Deployment

Your project is live at:

**[https://vercel.com/alexbuechls-projects/v0-collaborative-furniture-app](https://vercel.com/alexbuechls-projects/v0-collaborative-furniture-app)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/qAUAabR92uy](https://v0.dev/chat/projects/qAUAabR92uy)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository