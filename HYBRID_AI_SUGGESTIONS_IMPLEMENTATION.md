# Hybrid AI Suggestions Implementation Plan

## Overview
This document outlines the implementation of a hybrid approach for AI furniture suggestions that combines:
- **AI (Perplexity)**: Suggests product names and retailers based on user preferences
- **Search API**: Finds real, working URLs for suggested products
- **Firecrawl**: Scrapes product details from validated URLs

## Architecture

```
User Request → AI Suggests Products → Search API Finds URLs → Firecrawl Scrapes → Return Results
```

## Search API Recommendations

### Option 1: SerpAPI (Recommended)
- **Free Tier**: 100 searches/month
- **Setup**: Very easy, good documentation
- **Features**: Google search results, structured data
- **Cost**: $50/month for 5,000 searches after free tier
- **URL**: https://serpapi.com/

### Option 2: Google Custom Search API
- **Free Tier**: 100 searches/day
- **Setup**: Moderate, requires Google Cloud account
- **Features**: Google search results
- **Cost**: $5 per 1,000 searches after free tier
- **URL**: https://developers.google.com/custom-search

### Option 3: Bing Search API
- **Free Tier**: 1,000 searches/month
- **Setup**: Easy, Microsoft account required
- **Features**: Bing search results
- **Cost**: $3 per 1,000 searches after free tier
- **URL**: https://www.microsoft.com/en-us/bing/apis/bing-web-search-api

## Implementation Tasks

### Phase 1: Search API Integration

#### Task 1.1: Choose and Setup Search API
- [x] Research and select final search API (recommend SerpAPI)
- [x] Create account and get API key
- [x] Test API with sample furniture searches
- [x] Add API key to environment variables

#### Task 1.2: Create Search Service
- [x] Create `lib/search-service.ts`
- [x] Implement `findProductURL(productName: string, retailer: string): Promise<string | null>`
- [x] Add error handling and rate limiting
- [x] Add logging for debugging

#### Task 1.3: Update AI Suggestion Service
- [x] Modify `AISuggestionService` to return product names instead of full URLs
- [x] Update prompt to focus on product knowledge
- [x] Change return interface to `{ name, retailer, category, reasoning, confidence }`

### Phase 2: URL Discovery and Validation

#### Task 2.1: Implement URL Discovery
- [x] Create search query builder (e.g., "IKEA KIVIK sofa site:ikea.de")
- [x] Implement fallback search strategies
- [x] Add URL validation (check if URL exists and is a product page)

#### Task 2.2: Add Caching Layer
- [ ] Create cache for successful searches (DECIDED: Not for now)
- [ ] Implement cache invalidation strategy (DECIDED: Not for now)
- [ ] Add cache hit/miss logging (DECIDED: Not for now)

### Phase 3: Product Scraping Integration

#### Task 3.1: Enhance Firecrawl Integration
- [x] Create `lib/scraping-service.ts`
- [x] Implement `scrapeProduct(url: string): Promise<ProductData>`
- [x] Add retry logic for failed scrapes
- [x] Extract product details (title, price, image, description)

#### Task 3.2: Data Validation
- [x] Validate scraped data quality
- [x] Implement fallback for missing data
- [x] Add data quality scoring

### Phase 4: API Integration

#### Task 4.1: Update API Route
- [x] Modify `/api/ai-suggestions` to use hybrid approach
- [x] Implement sequential processing for fewer API calls
- [x] Add progress tracking for long-running requests
- [x] Update error handling

#### Task 4.2: Add New Endpoints
- [ ] Create `/api/search-product` for manual product searches
- [ ] Create `/api/validate-url` for URL validation
- [ ] Add rate limiting and caching headers

### Phase 5: Frontend Updates

#### Task 5.1: Update UI Components
- [ ] Modify `ai-suggestions-tab.tsx` to handle new data structure
- [ ] Add loading states for multi-step process
- [ ] Implement progress indicators
- [ ] Add error handling for failed searches/scrapes

#### Task 5.2: Add Debug Features
- [ ] Create debug panel for search results
- [ ] Add URL validation status indicators
- [ ] Implement retry mechanisms for failed suggestions

## Database Schema Updates

### New Tables Needed

```sql
-- Cache for successful searches
CREATE TABLE search_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  search_query TEXT NOT NULL,
  product_url TEXT NOT NULL,
  retailer TEXT NOT NULL,
  product_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Search API usage tracking
CREATE TABLE search_api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_name TEXT NOT NULL,
  search_query TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Environment Variables

```env
# Search API
SERPAPI_API_KEY=your_serpapi_key
# or
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_engine_id
# or
BING_SEARCH_API_KEY=your_bing_key

# Firecrawl (existing)
FIRECRAWL_API_KEY=your_firecrawl_key
```

## Implementation Decisions

### Decided:

1. **Search API**: SerpAPI (API key added to Vercel env as `SEARCHAPI_API_KEY`)
2. **Caching**: Not implemented for now
3. **Fallback Strategy**: Discard failed results (don't show partial results)
4. **Rate Limiting**: Sequential processing to minimize API calls
5. **Error Handling**: Fail completely if any step fails
6. **Performance**: Sequential processing (fewer API calls)
7. **Cost Management**: Not implemented for now
8. **URL Validation**: Basic URL format validation only

### Logging Strategy:
- Comprehensive logging at each step: AI → Search → Crawl
- Trace IDs for request tracking
- Performance metrics for each step
- Error details with context

## Cost Estimation

### Monthly Costs (estimated):
- **SerpAPI**: $50/month (5,000 searches)
- **Firecrawl**: $50/month (1,000 scrapes)
- **Total**: ~$100/month for 1,000 user requests

### Cost Optimization Strategies:
- Implement aggressive caching
- Use multiple search APIs with fallbacks
- Batch similar searches
- Implement usage quotas per user

## Success Metrics

- **URL Success Rate**: >90% of AI suggestions should find valid URLs
- **Response Time**: <10 seconds for complete suggestion generation
- **Cost per Request**: <$0.10 per user request
- **User Satisfaction**: Reduced complaints about broken links

## Next Steps

1. **Immediate**: Choose search API and get API key
2. **Week 1**: Implement search service and update AI service
3. **Week 2**: Add URL discovery and validation
4. **Week 3**: Integrate Firecrawl scraping
5. **Week 4**: Update frontend and add caching
6. **Week 5**: Testing and optimization

## Testing Strategy

- **Unit Tests**: Test each service independently
- **Integration Tests**: Test full flow from AI to scraping
- **Load Tests**: Test with multiple concurrent requests
- **Cost Tests**: Monitor API usage and costs
- **User Tests**: Test with real users and gather feedback 