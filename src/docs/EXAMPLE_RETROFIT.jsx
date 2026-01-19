/**
 * ===================================================================
 * EXAMPLE: Adding Page Controls to AdminDashboard
 * ===================================================================
 * 
 * This example shows how to add Hide Sidebar, Auto-Refresh, and
 * Fullscreen controls to any existing page with minimal code changes.
 * 
 * BEFORE vs AFTER comparison included below.
 */

// ===================================================================
// BEFORE: Original AdminDashboard (without page controls)
// ===================================================================

// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchCurrentUser, fetchUserStats } from '../store/slices/rbacSlice';
// 
// function AdminDashboard() {
//   const dispatch = useDispatch();
//   const { stats, loading } = useSelector((state) => state.rbac);
// 
//   useEffect(() => {
//     dispatch(fetchCurrentUser());
//     dispatch(fetchUserStats());
//   }, [dispatch]);
// 
//   return (
//     <div className="admin-dashboard">
//       <header>
//         <h1>Admin Dashboard</h1>
//       </header>
//       
//       <main>
//         {/* Dashboard content */}
//         <div>Users: {stats?.totalUsers}</div>
//       </main>
//     </div>
//   );
// }
// 
// export default AdminDashboard;


// ===================================================================
// AFTER: AdminDashboard with Page Controls (3 simple changes)
// ===================================================================

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser, fetchUserStats } from '../store/slices/rbacSlice';

// CHANGE 1: Import the HOC and UI component
import { withDashboardControls } from '@/hoc/withPageControls';
import { PageControlButtons } from '@/components/PageControlButtons';

// CHANGE 2: Add pageControls to props
function AdminDashboard({ pageControls }) {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.rbac);

  const refreshData = () => {
    dispatch(fetchCurrentUser());
    dispatch(fetchUserStats());
  };

  useEffect(() => {
    refreshData();
  }, [dispatch]);

  return (
    <div className="admin-dashboard">
      <header className="flex justify-between items-center p-4">
        <h1>Admin Dashboard</h1>
        
        {/* CHANGE 3: Add control buttons */}
        <PageControlButtons controls={pageControls} />
      </header>
      
      <main>
        {/* Your existing content - NO CHANGES NEEDED */}
        <div>Users: {stats?.totalUsers}</div>
        
        {/* Optional: Show refreshing indicator */}
        {pageControls.isRefreshing && (
          <div className="refresh-indicator">Refreshing...</div>
        )}
      </main>
    </div>
  );
}

// CHANGE 4: Wrap export with HOC (replaces: export default AdminDashboard)
export default withDashboardControls(AdminDashboard);


// ===================================================================
// ALTERNATIVE: Using Hook Instead of HOC (more control)
// ===================================================================

// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchCurrentUser, fetchUserStats } from '../store/slices/rbacSlice';
// import { usePageControls } from '@/hooks/usePageControls';
// import { PageControlButtons } from '@/components/PageControlButtons';
// 
// function AdminDashboard() {
//   const dispatch = useDispatch();
//   const { stats, loading } = useSelector((state) => state.rbac);
// 
//   const refreshData = () => {
//     dispatch(fetchCurrentUser());
//     dispatch(fetchUserStats());
//   };
// 
//   // Initialize page controls with custom config
//   const pageControls = usePageControls({
//     refreshCallback: refreshData,
//     autoRefreshInterval: 30000,
//     storageKey: 'adminDashboard',
//     enableAutoRefresh: true,
//     enableSidebarToggle: true,
//     enableFullscreen: true,
//   });
// 
//   useEffect(() => {
//     refreshData();
//   }, []);
// 
//   return (
//     <>
//       {/* Inject styles */}
//       <style>{pageControls.styles}</style>
//       
//       <div className="admin-dashboard">
//         <header className="flex justify-between items-center p-4">
//           <h1>Admin Dashboard</h1>
//           <PageControlButtons controls={pageControls} />
//         </header>
//         
//         <main>
//           <div>Users: {stats?.totalUsers}</div>
//         </main>
//       </div>
//     </>
//   );
// }
// 
// export default AdminDashboard;


// ===================================================================
// SUMMARY OF CHANGES
// ===================================================================

/**
 * USING HOC (Recommended):
 * ✅ 4 simple changes
 * ✅ Automatic style injection
 * ✅ Zero configuration needed
 * ✅ Works with existing code
 * 
 * USING HOOK:
 * ✅ More control over configuration
 * ✅ Can customize refresh logic
 * ✅ Access to all control states
 * ✅ Better for complex scenarios
 * 
 * BOTH APPROACHES:
 * ✅ No breaking changes
 * ✅ Backward compatible
 * ✅ Optional features (can disable any)
 * ✅ State persistence (remembers user preferences)
 * ✅ Performance optimized
 */
