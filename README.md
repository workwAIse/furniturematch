# Collaborative furniture app

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/alexbuechls-projects/v0-collaborative-furniture-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/qAUAabR92uy)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Features

### 🪑 Collaborative Furniture Matching
- **Swipe Interface**: Tinder-like interface for reviewing furniture items
- **Product Management**: Add furniture items via URL with automatic information extraction
- **Matching System**: Track swipes and celebrate when both users like the same item
- **Automatic Creator Approval**: When a user adds a product, they automatically "like" it
- **Review Workflow**: Partner must review and swipe on items to create matches
- **Iframe Browsing**: Browse product pages directly within the app using iframe modals

### 🔗 Iframe Product Browsing
- **Modal Interface**: Browse product URLs in a responsive modal overlay
- **Click to Open**: Click on any furniture item image to open the product page in a modal
- **Fallback Support**: Automatic fallback to new tab if iframe embedding is blocked
- **Mobile Optimized**: Full-screen experience on mobile devices
- **Navigation Controls**: Back button, close button, and "Open in New Tab" option
- **Future Ready**: Placeholder for "Add to Collection" functionality

### 💬 Product Comments
- **Collaborative Discussion**: Add comments to any product in the matches view
- **Real-time Updates**: Comments are saved and synced across all users
- **Edit & Delete**: Users can edit or delete their own comments
- **User Identification**: Comments show user avatars and names
- **Time Stamps**: Comments display relative time (e.g., "2h ago")
- **Collapsible Interface**: Comments section can be expanded/collapsed to save space

### 🏷️ Product Type Categories
- **Automatic Categorization**: Products are automatically categorized into furniture types (sofa, table, chair, lamp, etc.)
- **Smart Detection**: Uses keyword matching to detect product types from URLs, titles, and descriptions
- **Multi-language Support**: Supports both English and German keywords for international retailers
- **Visual Badges**: Product type badges are displayed on all product cards
- **Manual Editing**: Click on the product type text to edit it directly
- **One-time Migration**: Existing products are automatically categorized when the feature is first loaded

### 🔍 Unified Filtering & Insights
- **Chip-based Interface**: Modern chip-based filtering system for better UX
- **Owner Filtering**: Filter by "Me", "Partner", or "All" to see who added each item
- **Type Filtering**: Filter by product type using clickable chips
- **Matching Insights**: Interactive chips show which furniture types you both like
- **Statistics Display**: See counts of matched products by type
- **Active Filter Display**: Clear visual indication of currently applied filters
- **One-click Removal**: Remove filters with X buttons on active filter chips
- **Interactive Insights**: Click on insight chips to apply them as filters

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

## Testing Features

### Testing the Modal Feature

You can test the modal functionality by:

1. **Clicking on Images**: Click on any furniture item image in the swipe view or matches view to open the product page in a modal
2. **Test Page**: Visit `/test-iframe` in your browser for additional iframe testing
3. **Automated Tests**: Run `npm test` to execute the automated test suite

The test suite verifies:
- Modal opening when clicking on images
- Correct URL and title display in modal
- Modal closing functionality
- Proper CSS classes for clickability and hover effects
- Product type detection accuracy
- UI component rendering and interactions
- Filtering functionality
- Matching insights display

### Testing the Iframe Feature

You can test the iframe functionality by visiting `/test-iframe` in your browser. This page provides test URLs to verify:

- Modal opening and closing
- Responsive design (desktop vs mobile)
- Fallback behavior for blocked sites
- Navigation controls
- Keyboard accessibility

### Testing the Comments Feature

You can test the comments functionality by visiting `/test-comments` in your browser. This page allows you to:

- Select different products to test comments on
- Add, edit, and delete comments
- Verify real-time updates across users
- Test the collapsible interface

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository