# Page Controls - Quick Reference Card

## 🎯 Add to ANY Page in 4 Steps

```jsx
// 1. Import
import { withPageControls } from '@/hoc/withPageControls';
import { PageControlButtons } from '@/components/PageControlButtons';

// 2. Add pageControls prop
function MyPage({ pageControls }) {
  
  // 3. Add buttons to header
  return (
    <header>
      <h1>My Page</h1>
      <PageControlButtons controls={pageControls} />
    </header>
  );
}

// 4. Wrap export
export default withPageControls(MyPage);
```

## 📋 Common Patterns

### Dashboard (All Features, 30s Refresh)
```jsx
export default withDashboardControls(Dashboard);
```

### Report (No Auto-Refresh)
```jsx
export default withReportControls(ReportPage);
```

### Monitoring (Fast 10s Refresh)
```jsx
export default withMonitoringControls(MonitoringPage);
```

### Presentation (Fullscreen Only)
```jsx
export default withMinimalControls(PresentationPage);
```

### Custom Configuration
```jsx
export default withPageControls(MyPage, {
  autoRefreshInterval: 60000,  // 1 minute
  enableSidebarToggle: false,   // Disable sidebar toggle
  storageKey: 'myCustomPage',   // Unique storage key
});
```

## 🔧 Manual Control (Hook)

```jsx
import { usePageControls } from '@/hooks/usePageControls';

function MyPage() {
  const { data, refetch } = useMyData();
  
  const pageControls = usePageControls({
    refreshCallback: refetch,
    autoRefreshInterval: 30000,
  });

  return (
    <>
      <style>{pageControls.styles}</style>
      <PageControlButtons controls={pageControls} />
    </>
  );
}
```

## 🎨 Button Variants

```jsx
// Standard
<PageControlButtons controls={pageControls} />

// Compact (mobile)
<PageControlButtonsCompact controls={pageControls} />

// With labels (desktop)
<PageControlButtonsWithLabels controls={pageControls} />

// Custom styling
<PageControlButtons 
  controls={pageControls}
  className="my-class"
  buttonProps={{ size: 'large' }}
/>
```

## 💡 Pro Tips

1. **Custom Refresh Logic**
```jsx
const pageControls = usePageControls({
  refreshCallback: async () => {
    await refetchProjects();
    await refetchUsers();
  },
});
```

2. **Access Control States**
```jsx
{pageControls.isRefreshing && <LoadingSpinner />}
{pageControls.isFullscreen && <FullscreenIndicator />}
{!pageControls.sidebarVisible && <ShowSidebarButton />}
```

3. **Conditional Features**
```jsx
const pageControls = usePageControls({
  enableAutoRefresh: user.role === 'admin',
  enableFullscreen: isMobile,
});
```

## 🚫 Common Mistakes

❌ **DON'T**: Forget to inject styles
```jsx
// Missing styles!
<PageControlButtons controls={pageControls} />
```

✅ **DO**: Use HOC or inject manually
```jsx
// HOC auto-injects styles
export default withPageControls(MyPage);

// Or inject manually
<style>{pageControls.styles}</style>
```

❌ **DON'T**: Modify existing logic
```jsx
// Don't add complex state management
const [sidebar, setSidebar] = useState(true);
```

✅ **DO**: Use the hook
```jsx
// Hook handles everything
const pageControls = usePageControls();
```

## 📞 Need Help?

- 📖 Full Docs: `frontend/src/docs/PAGE_CONTROLS_GUIDE.md`
- 💻 Example: `frontend/src/docs/EXAMPLE_RETROFIT.jsx`
- 🔍 Original: `frontend/src/pages/QHSE/GeneralQHSE.jsx`

---

**Version**: 1.0.0  
**Last Updated**: January 19, 2026
