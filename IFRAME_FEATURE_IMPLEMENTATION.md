# Iframe Feature Implementation Plan

## Overview
Add an iframe modal/overlay feature to allow users to browse product URLs directly within the FurnitureMatch app, following modern UX/UI best practices and handling edge cases gracefully.

## Feature Requirements

### 1. Modal/Overlay Design
- **Desktop**: Centered modal with rounded corners, shadow, and backdrop blur
- **Mobile**: Full-screen overlay with safe area considerations
- **Responsive**: Smooth transitions between desktop and mobile layouts
- **Accessibility**: Proper ARIA labels, keyboard navigation, and focus management

### 2. Navigation Controls
- **Back Button**: Return to FurnitureMatch main interface
- **Close Button**: Close iframe and return to previous state
- **Future Add Button**: Placeholder for "Add to Collection" functionality
- **Loading State**: Show loading indicator while iframe loads

### 3. UX/UI Best Practices
- **Progressive Enhancement**: Fallback to new tab if iframe is blocked
- **Performance**: Lazy load iframe content, optimize for mobile
- **State Preservation**: Maintain app state when returning from iframe
- **Error Handling**: Graceful degradation for blocked sites

## Technical Implementation

### 1. Component Structure

```
components/
├── iframe-modal/
│   ├── iframe-modal.tsx          # Main iframe modal component
│   ├── iframe-header.tsx         # Header with navigation controls
│   ├── iframe-content.tsx        # Iframe wrapper with error handling
│   └── iframe-fallback.tsx       # Fallback component for blocked sites
```

### 2. State Management

```typescript
interface IframeModalState {
  isOpen: boolean
  url: string | null
  isLoading: boolean
  isBlocked: boolean
  error: string | null
}
```

### 3. Key Features

#### A. Iframe Modal Component
- **Responsive Design**: 
  - Desktop: 90% width/height with max-width/height
  - Mobile: Full-screen with safe area padding
- **Backdrop**: Blurred overlay with click-to-close
- **Animations**: Smooth enter/exit transitions
- **Focus Management**: Trap focus within modal, restore on close

#### B. Header Navigation
- **Back Button**: Returns to previous app state
- **Close Button**: Closes modal completely
- **Title**: Shows product name or URL
- **Future Add Button**: Placeholder for "Add to Collection"

#### C. Iframe Content
- **Lazy Loading**: Only load iframe when modal opens
- **Error Detection**: Monitor for X-Frame-Options blocking
- **Fallback**: Automatic redirect to new tab if blocked
- **Loading States**: Skeleton loader while iframe loads

#### D. Mobile Optimizations
- **Full-Screen**: Utilize entire viewport
- **Touch Gestures**: Swipe down to close (optional)
- **Safe Areas**: Respect device notches and home indicators
- **Performance**: Optimize for mobile data usage

## Implementation Steps

### Phase 1: Core Iframe Modal
1. **Create Base Components**
   - `IframeModal` component with responsive design
   - `IframeHeader` with navigation controls
   - `IframeContent` with iframe wrapper

2. **State Management**
   - Add iframe state to main app context
   - Implement open/close handlers
   - Add URL management

3. **Responsive Design**
   - Desktop modal with backdrop
   - Mobile full-screen overlay
   - Smooth transitions

### Phase 2: Error Handling & Fallbacks
1. **Iframe Blocking Detection**
   - Monitor for X-Frame-Options headers
   - Detect blocked content
   - Implement fallback to new tab

2. **Loading States**
   - Skeleton loader for iframe
   - Progress indicators
   - Error states with retry options

3. **Performance Optimization**
   - Lazy loading implementation
   - Mobile data optimization
   - Memory management

### Phase 3: UX Enhancements
1. **Accessibility**
   - ARIA labels and roles
   - Keyboard navigation
   - Screen reader support

2. **Touch Interactions**
   - Swipe gestures (optional)
   - Touch-friendly buttons
   - Haptic feedback

3. **State Preservation**
   - Maintain app state
   - Smooth transitions
   - Context awareness

## Code Implementation

### 1. Iframe Modal Component

```typescript
// components/iframe-modal/iframe-modal.tsx
interface IframeModalProps {
  isOpen: boolean
  url: string | null
  onClose: () => void
  onBack: () => void
  productTitle?: string
}

export function IframeModal({ isOpen, url, onClose, onBack, productTitle }: IframeModalProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isBlocked, setIsBlocked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Implementation details...
}
```

### 2. Integration with Main App

```typescript
// app/page.tsx modifications
const [iframeState, setIframeState] = useState<IframeModalState>({
  isOpen: false,
  url: null,
  isLoading: false,
  isBlocked: false,
  error: null
})

const openIframe = (url: string, productTitle?: string) => {
  setIframeState({
    isOpen: true,
    url,
    isLoading: true,
    isBlocked: false,
    error: null
  })
}

// Replace window.open() calls with openIframe()
```

### 3. Error Handling

```typescript
// components/iframe-modal/iframe-content.tsx
const handleIframeError = (error: any) => {
  if (error.message.includes('X-Frame-Options') || 
      error.message.includes('blocked')) {
    setIsBlocked(true)
    // Fallback to new tab
    window.open(url, '_blank')
  } else {
    setError(error.message)
  }
}
```

## UX/UI Best Practices

### 1. Modern Modal Design
- **Backdrop Blur**: Subtle blur effect for depth
- **Rounded Corners**: Modern, friendly appearance
- **Shadow**: Proper elevation and depth
- **Smooth Animations**: 300ms ease-out transitions

### 2. Mobile-First Approach
- **Full-Screen**: Utilize entire viewport on mobile
- **Safe Areas**: Respect device-specific areas
- **Touch Targets**: Minimum 44px touch targets
- **Gesture Support**: Swipe to close (optional)

### 3. Loading States
- **Skeleton Loaders**: Show content structure
- **Progress Indicators**: Loading progress when possible
- **Error States**: Clear error messages with actions

### 4. Accessibility
- **Focus Management**: Trap focus in modal
- **Keyboard Navigation**: Escape to close, Tab navigation
- **Screen Readers**: Proper ARIA labels and announcements
- **High Contrast**: Support for accessibility preferences

## Future Enhancements

### 1. Add to Collection Feature
- **Add Button**: In iframe header for quick adding
- **Product Detection**: Auto-detect product info from iframe
- **Quick Actions**: Swipe gestures for adding

### 2. Enhanced Navigation
- **Breadcrumbs**: Show navigation path
- **History**: Back/forward within iframe
- **Bookmarks**: Save frequently visited products

### 3. Performance Optimizations
- **Preloading**: Preload common retailer sites
- **Caching**: Cache iframe content
- **Compression**: Optimize for slow connections

## Testing Strategy

### 1. Cross-Browser Testing
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- Different screen sizes and orientations

### 2. Iframe Blocking Testing
- Test with sites that block iframe embedding
- Verify fallback behavior
- Test error handling

### 3. Performance Testing
- Load time measurements
- Memory usage monitoring
- Mobile performance testing

### 4. Accessibility Testing
- Screen reader compatibility
- Keyboard navigation
- High contrast mode support

## Security Considerations

### 1. Content Security Policy
- Configure CSP headers appropriately
- Allow iframe embedding for trusted domains
- Monitor for security violations

### 2. Sandbox Attributes
- Use appropriate sandbox attributes
- Limit iframe capabilities as needed
- Prevent malicious content execution

### 3. Privacy Protection
- Respect user privacy preferences
- Handle cookies and tracking appropriately
- Provide clear privacy information

## Success Metrics

### 1. User Engagement
- Time spent in iframe vs new tab
- Return rate to iframe feature
- User satisfaction scores

### 2. Technical Performance
- Iframe load times
- Error rates and fallback usage
- Mobile vs desktop usage patterns

### 3. Business Impact
- Increased product exploration
- Higher engagement with furniture items
- Improved user retention

## Implementation Timeline

### Week 1: Core Components
- Create iframe modal components
- Implement responsive design
- Add basic state management

### Week 2: Error Handling
- Implement iframe blocking detection
- Add fallback mechanisms
- Create loading states

### Week 3: UX Polish
- Add animations and transitions
- Implement accessibility features
- Mobile optimization

### Week 4: Testing & Refinement
- Cross-browser testing
- Performance optimization
- User feedback integration

## Conclusion

This iframe feature will significantly enhance the user experience by allowing seamless product exploration within the FurnitureMatch app. The implementation follows modern UX/UI best practices and provides robust error handling for a smooth user experience across all devices and browsers.

The feature is designed to be extensible, allowing for future enhancements like the "Add to Collection" functionality and improved navigation features. 