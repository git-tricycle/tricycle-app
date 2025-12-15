# PWA Download Button - Fix Summary

## Issues Fixed

### 1. **Missing Global Event Listener**

- **Problem**: The `beforeinstallprompt` event was only being listened for inside the React hook, which could fire after the event had already occurred.
- **Solution**: Added global event listeners at module load time in `usePWA.ts` to capture the event immediately.

### 2. **Service Worker Registration Timing**

- **Problem**: Service worker was registered immediately, which can interfere with the PWA install prompt.
- **Solution**: Added a 100ms delay before registering the service worker to allow the `beforeinstallprompt` event to fire first.

### 3. **Missing Manifest Link in HTML**

- **Problem**: Expo-generated HTML might not include the `<link rel="manifest" href="/manifest.json">` tag.
- **Solution**: Created `src/lib/pwa-init.ts` that runs on app startup and ensures the manifest link is added to the document head if it doesn't exist.

### 4. **Public Files Not Copied to Build Output**

- **Problem**: When building for web with `expo export -p web`, the `manifest.json` and `sw.js` files weren't being copied to the dist folder.
- **Solution**: Created `scripts/copy-public.js` and updated the build script to copy all PWA files after export.

### 5. **Cache Headers Not Configured**

- **Problem**: `manifest.json` was being cached too aggressively, preventing updates.
- **Solution**: Updated `vercel.json` to serve `manifest.json` with `Cache-Control: public, max-age=0, must-revalidate`.

### 6. **Poor Component UX**

- **Problem**: Install button wasn't visually distinct.
- **Solution**: Changed button color to blue for better visibility and added console logging for debugging.

## Files Modified

1. **src/hooks/usePWA.ts** - Global event listener initialization and service worker registration delay
2. **src/lib/pwa-init.ts** - NEW: Ensures manifest link is in HTML
3. **src/components/PWAPrompt.tsx** - Enhanced logging and improved button styling
4. **app/\_layout.tsx** - Initialize PWA on app load
5. **scripts/copy-public.js** - NEW: Copies public files to dist
6. **package.json** - Added copy:public script to build process
7. **public/sw.js** - Added detailed logging
8. **vercel.json** - Fixed manifest.json caching headers

## How to Test

1. **Build the web app**:

   ```bash
   npm run build
   ```

2. **Check console logs** (DevTools -> Console):
   - Look for: `📋 Adding manifest.json link to head`
   - Look for: `🎯 beforeinstallprompt event detected!`
   - Look for: `✅ ServiceWorker registration successful`

3. **Check the install button**:
   - Should appear as a card at the bottom of the screen
   - Install button should be blue
   - Close (X) button should dismiss the prompt

4. **Install the app**:
   - Click the blue "Install" button
   - Browser will show native PWA install dialog
   - Confirm to install

## Browser Requirements

The `beforeinstallprompt` event only fires in:

- ✅ Chrome/Edge (desktop & Android)
- ✅ Samsung Internet
- ❌ Firefox (supports installation but via different method)
- ❌ Safari (uses `apple-mobile-web-app-capable` instead)

## Debugging

Enable console logging with these Chrome DevTools commands:

```javascript
// In Console
localStorage.debug = "*";
window.dispatchEvent(new Event("beforeinstallprompt"));
```

Check manifest validity:

- Right-click → Inspect → Application → Manifest
- Should show all required fields
- Check for errors in the manifest

Check service worker:

- DevTools → Application → Service Workers
- Should show registered SW with "activated and running" status
