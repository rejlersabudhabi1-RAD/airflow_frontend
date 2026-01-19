# Page Controls - Universal Feature System

## 📖 Overview

A reusable, soft-coded system to add **Hide Sidebar**, **Auto-Refresh**, and **Fullscreen** controls to any page in the application without modifying core logic.

## ✨ Features

- **🔄 Auto-Refresh**: Automatically refresh data at configurable intervals
- **📱 Sidebar Toggle**: Show/hide navigation sidebar
- **🖥️ Fullscreen Mode**: Maximize screen real estate
- **💾 State Persistence**: Remember user preferences across sessions
- **🎨 Zero UI Changes**: Works with existing components
- **⚡ Performance**: Optimized with React hooks and memoization

## 🚀 Quick Start

### Method 1: Using HOC (Recommended - Zero Code Change)

```jsx
// Before
export default function MyPage() {
  return <div>My Content</div>;
}

// After - Just wrap your export
import { withPageControls } from '@/hoc/withPageControls';

function MyPage({ pageControls }) {
  return (
    <>
      <PageControlButtons controls={pageControls} />
      <div>My Content</div>
    </>
  );
}

export default withPageControls(MyPage);
```

### Method 2: Using Hook (More Control)

```jsx
import { usePageControls } from '@/hooks/usePageControls';
import { PageControlButtons } from '@/components/PageControlButtons';

function MyPage() {
  const { data, refetch } = useMyData();
  
  // Initialize page controls
  const pageControls = usePageControls({
    refreshCallback: refetch,
    autoRefreshInterval: 30000, // 30 seconds
    storageKey: 'myPage',
  });

  return (
    <>
      <style>{pageControls.styles}</style>
      
      <header>
        <h1>My Page</h1>
        <PageControlButtons controls={pageControls} />
      </header>
      
      <main>
        {/* Your content */}
      </main>
    </>
  );
}
```

## 📚 API Reference

### `usePageControls(options)`

#### Options

```typescript
{
  refreshCallback?: () => Promise<void> | void,  // Data refresh function
  autoRefreshInterval?: number,                  // Interval in ms (default: 30000)
  storageKey?: string,                          // localStorage key (default: 'pageControls')
  enableAutoRefresh?: boolean,                  // Enable auto-refresh (default: true)
  enableSidebarToggle?: boolean,                // Enable sidebar toggle (default: true)
  enableFullscreen?: boolean,                   // Enable fullscreen (default: true)
  enablePersistence?: boolean,                  // Save state to localStorage (default: true)
}
```

#### Returns

```typescript
{
  // State
  isFullscreen: boolean,
  autoRefreshEnabled: boolean,
  sidebarVisible: boolean,
  isRefreshing: boolean,
  
  // Actions
  toggleFullscreen: () => void,
  toggleSidebar: () => void,
  toggleAutoRefresh: () => void,
  manualRefresh: () => Promise<void>,
  
  // Helpers
  styles: string,  // CSS styles to inject
  
  // Feature flags
  features: {
    fullscreen: boolean,
    autoRefresh: boolean,
    sidebarToggle: boolean,
  },
}
```

### `PageControlButtons` Component

#### Props

```typescript
{
  controls: PageControlsObject,  // Required: from usePageControls
  className?: string,             // Additional CSS classes
  buttonProps?: object,           // Pass-through to IconButtons
  showLabels?: boolean,           // Show text labels (default: false)
}
```

### `withPageControls` HOC

#### Configuration

```typescript
{
  autoInjectStyles?: boolean,     // Auto-inject CSS (default: true)
  enableAutoRefresh?: boolean,    // Enable auto-refresh (default: true)
  enableSidebarToggle?: boolean,  // Enable sidebar toggle (default: true)
  enableFullscreen?: boolean,     // Enable fullscreen (default: true)
  autoRefreshInterval?: number,   // Refresh interval (default: 30000)
  storageKey?: string,            // localStorage key (default: component name)
  getRefreshCallback?: (props) => Function,  // Extract refresh from props
}
```

## 🎯 Usage Examples

### Example 1: Dashboard Page (All Features)

```jsx
import { withDashboardControls } from '@/hoc/withPageControls';
import { PageControlButtons } from '@/components/PageControlButtons';

function Dashboard({ pageControls }) {
  const { data, refetch } = useDashboardData();

  return (
    <div className="dashboard">
      <header className="flex justify-between items-center p-4">
        <h1>Dashboard</h1>
        <PageControlButtons controls={pageControls} />
      </header>
      
      <main>
        {/* Dashboard content */}
      </main>
    </div>
  );
}

// Automatically adds all controls with 30s refresh
export default withDashboardControls(Dashboard);
```

### Example 2: Report Page (No Auto-Refresh)

```jsx
import { withReportControls } from '@/hoc/withPageControls';
import { PageControlButtons } from '@/components/PageControlButtons';

function ReportPage({ pageControls }) {
  return (
    <>
      <header>
        <h1>Monthly Report</h1>
        <PageControlButtons controls={pageControls} />
      </header>
      
      <main>
        {/* Report content */}
      </main>
    </>
  );
}

// Only sidebar toggle and fullscreen (no auto-refresh)
export default withReportControls(ReportPage);
```

### Example 3: Custom Configuration

```jsx
import { withPageControls } from '@/hoc/withPageControls';
import { PageControlButtons } from '@/components/PageControlButtons';

function MonitoringPage({ pageControls, data, refetch }) {
  return (
    <>
      <header>
        <h1>Real-Time Monitoring</h1>
        <PageControlButtons controls={pageControls} showLabels={true} />
      </header>
      
      <main>
        {pageControls.isRefreshing && <LoadingOverlay />}
        {/* Monitoring content */}
      </main>
    </>
  );
}

// Custom: 10-second refresh for real-time monitoring
export default withPageControls(MonitoringPage, {
  autoRefreshInterval: 10000,  // 10 seconds
  storageKey: 'monitoring',
  getRefreshCallback: (props) => props.refetch,
});
```

### Example 4: Minimal Controls (Fullscreen Only)

```jsx
import { withMinimalControls } from '@/hoc/withPageControls';
import { PageControlButtons } from '@/components/PageControlButtons';

function PresentationMode({ pageControls }) {
  return (
    <>
      <header>
        <h1>Presentation</h1>
        <PageControlButtons controls={pageControls} />
      </header>
      
      <main>
        {/* Presentation content */}
      </main>
    </>
  );
}

// Only fullscreen button
export default withMinimalControls(PresentationMode);
```

## 🔧 Customization

### Custom Refresh Logic

```jsx
const pageControls = usePageControls({
  refreshCallback: async () => {
    console.log('Refreshing data...');
    await refetchProjects();
    await refetchUsers();
    await refetchStats();
    console.log('Refresh complete!');
  },
  autoRefreshInterval: 60000, // 1 minute
});
```

### Custom Storage Key

```jsx
// Different storage keys for different pages
const pageControls = usePageControls({
  storageKey: 'qhseGeneralPage',  // Unique per page
});
```

### Disable Specific Features

```jsx
const pageControls = usePageControls({
  enableAutoRefresh: false,      // No auto-refresh
  enableSidebarToggle: true,     // Keep sidebar toggle
  enableFullscreen: true,        // Keep fullscreen
});
```

### Custom Button Styling

```jsx
<PageControlButtons
  controls={pageControls}
  className="my-custom-class"
  buttonProps={{
    sx: {
      color: 'secondary.main',
      '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' }
    }
  }}
/>
```

## 📱 Responsive Design

The controls automatically adapt to screen sizes:

```jsx
// Compact for mobile
<PageControlButtonsCompact controls={pageControls} />

// With labels for desktop
<PageControlButtonsWithLabels controls={pageControls} />

// Conditional rendering
<div className="hidden lg:flex">
  <PageControlButtons controls={pageControls} showLabels={true} />
</div>
```

## 💾 State Persistence

User preferences are automatically saved to localStorage:

- `{storageKey}_fullscreen`: Fullscreen state
- `{storageKey}_autoRefresh`: Auto-refresh enabled state
- `{storageKey}_sidebar`: Sidebar visibility state

To disable persistence:

```jsx
const pageControls = usePageControls({
  enablePersistence: false,  // Don't save to localStorage
});
```

## 🎨 Styling

The system automatically injects CSS for:

1. **Sidebar hiding**: Hides aside/navigation elements
2. **Fullscreen mode**: Hides header/footer, adjusts padding
3. **Responsive layout**: Adjusts main content margins

Custom styles are applied via `<style>` tag and don't affect other pages.

## ⚡ Performance

- **Memoization**: All callbacks memoized with `useCallback`
- **Cleanup**: Intervals and listeners properly cleaned up
- **Minimal Re-renders**: State updates only when necessary
- **Lightweight**: ~5KB gzipped

## 🔍 Debugging

Enable debug logging:

```jsx
// Hook automatically logs actions
const pageControls = usePageControls({...});

// Console output:
// 🔄 [PageControls] Auto-refresh enabled (30000ms)
// ✅ [PageControls] Sidebar hidden
// ✅ [PageControls] Entered fullscreen mode
```

## 📦 File Structure

```
frontend/src/
├── hooks/
│   └── usePageControls.js          # Core hook logic
├── components/
│   └── PageControlButtons.jsx      # UI component
├── hoc/
│   └── withPageControls.jsx        # Higher-Order Component
└── docs/
    └── PAGE_CONTROLS_GUIDE.md      # This file
```

## 🚨 Migration Guide

### Migrating Existing Pages

1. **Find existing implementation**:
   ```jsx
   // Old code in GeneralQHSE.jsx
   const [isFullscreen, setIsFullscreen] = useState(false);
   const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
   const [sidebarVisible, setSidebarVisible] = useState(true);
   // ... lots of effect hooks and handlers
   ```

2. **Replace with hook** (one line):
   ```jsx
   const pageControls = usePageControls({ refreshCallback: refetch });
   ```

3. **Update UI**:
   ```jsx
   // Old
   <IconButton onClick={() => setSidebarVisible(!sidebarVisible)}>
     <Bars3Icon />
   </IconButton>
   // ... more buttons
   
   // New
   <PageControlButtons controls={pageControls} />
   ```

4. **Remove old state and effects** - everything is handled automatically!

## 🌐 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

Fullscreen API supported in all modern browsers.

## 📝 License

Part of AIFlow application - Internal use only.

---

**Need help?** Check existing implementations in:
- `frontend/src/pages/QHSE/GeneralQHSE.jsx` (original)
- Add your implementations here as examples
