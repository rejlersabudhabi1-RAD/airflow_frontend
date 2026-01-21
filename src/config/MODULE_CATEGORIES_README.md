# Module Categories Configuration Guide

## 📋 Overview

The `moduleCategories.config.js` provides a **centralized, dynamic categorization system** for all system modules. This allows you to easily organize and manage module assignments in the User Management interface without changing core application logic.

## 🎯 Current Categories

The system is configured with **7 main feature categories**:

1. **⚙️ Process Engineering** - PFD/PID analysis and flow diagrams
2. **📄 CRS Documents** - Correspondence and document management
3. **💰 Finance** - Financial management and invoicing
4. **📊 Project Control** - Project tracking and control systems
5. **🛒 Procurement** - Procurement and purchasing management
6. **🛡️ QHSE** - Quality, Health, Safety & Environment
7. **⚡ Administration** - System administration and user management
8. **📦 Other Features** - Catch-all for uncategorized modules

---

## 🔧 How It Works

### **Automatic Categorization**

Modules are automatically grouped into categories based on their **code patterns**:

```javascript
categoryMapping: {
  process_eng: ['pfd', 'pid', 'process_', 'flow_diagram', 'engineering_'],
  crs: ['crs', 'correspondence', 'document_', 'letter_', 'revision_'],
  finance: ['finance', 'invoice', 'billing', 'payment', 'accounting_'],
  project_control: ['project_control', 'milestone', 'tracking', 'schedule_'],
  procurement: ['procurement', 'purchase', 'supplier', 'vendor_', 'buying_'],
  qhse: ['qhse', 'safety', 'quality', 'audit', 'inspection', 'health_'],
  admin: ['admin', 'user_management', 'settings', 'system_', 'rbac_']
}
```

**Example:**
- Module code: `qhse_projects` → Category: **QHSE**
- Module code: `crs_documents` → Category: **CRS Documents**
- Module code: `finance_invoicing` → Category: **Finance**

---

## ➕ Adding New Categories (Future)

### **Step 1: Add Category Definition**

In `moduleCategories.config.js`, add a new category to the `categories` array:

```javascript
{
  id: 'sales',  // Unique identifier
  name: 'Sales & Marketing',
  icon: '📈',
  color: 'teal',
  description: 'Sales tracking and marketing automation',
  order: 8,  // Display order
  bgColor: 'bg-teal-50',
  borderColor: 'border-teal-200',
  textColor: 'text-teal-700',
  badgeColor: 'bg-teal-100'
}
```

### **Step 2: Add Mapping Patterns**

Add patterns to match your new module codes:

```javascript
categoryMapping: {
  // ...existing mappings...
  sales: ['sales', 'marketing', 'crm', 'lead_', 'customer_'],
}
```

### **Step 3: Create Modules**

When creating new modules in the admin panel, use matching codes:
- `sales_dashboard`
- `sales_reports`
- `marketing_campaigns`

**That's it!** The categorization happens automatically. ✅

---

## ⚙️ Configuration Options

### **Display Settings**

```javascript
display: {
  showIcons: true,                  // Show emoji icons for categories
  showDescriptions: true,           // Show category descriptions
  showModuleCount: true,            // Show "3/5 selected" counters
  expandAllByDefault: false,        // Collapse categories by default
  allowCategoryCollapse: true,      // Allow users to collapse
  sortModulesAlphabetically: true   // Sort modules A-Z within categories
}
```

### **Feature Flags**

Enable/disable specific features:

```javascript
features: {
  enableSearch: true,           // Search bar for modules
  enableQuickActions: true,     // "Select All" / "Clear All" buttons
  enableCategoryFilters: false, // Filter by category (future)
  showCategoryColors: true,     // Color-coded categories
  showModuleCodes: true,        // Display module codes (e.g., "qhse_projects")
  enableBulkSelection: true     // Bulk select modules
}
```

---

## 🎨 Customizing Colors

Each category has a color scheme. To change colors, update these properties:

```javascript
{
  bgColor: 'bg-purple-50',       // Background color
  borderColor: 'border-purple-200', // Border color
  textColor: 'text-purple-700',  // Text color
  badgeColor: 'bg-purple-100'    // Badge background
}
```

**Available Tailwind Colors:**
- `blue`, `purple`, `green`, `indigo`, `orange`, `red`, `gray`, `teal`, `pink`, `yellow`

---

## 📦 API Response Structure

The configuration works with modules fetched from the API:

```javascript
[
  {
    id: "uuid-here",
    name: "QHSE Projects",
    code: "qhse_projects",
    description: "Manage QHSE project tracking",
    is_active: true
  },
  // ...more modules
]
```

The `groupModulesByCategory()` function automatically organizes these into categories.

---

## 🔍 Helper Functions

### **`getCategoryForModule(moduleCode)`**
Returns the category ID for a given module code.

```javascript
getCategoryForModule('qhse_projects')  // Returns: 'qhse'
getCategoryForModule('finance_invoices')  // Returns: 'finance'
```

### **`groupModulesByCategory(modules)`**
Groups an array of modules by their categories.

```javascript
const grouped = groupModulesByCategory(modules);
// Returns:
{
  qhse: { config: {...}, modules: [...] },
  finance: { config: {...}, modules: [...] }
}
```

### **`getCategoriesWithCounts(modules)`**
Returns categories with their module counts.

```javascript
getCategoriesWithCounts(modules);
// Returns:
[
  { id: 'qhse', name: 'QHSE', count: 5, ... },
  { id: 'finance', name: 'Finance', count: 3, ... }
]
```

---

## 🚀 Usage in Components

Import and use in your React components:

```javascript
import { 
  groupModulesByCategory, 
  MODULE_CATEGORIES_CONFIG 
} from '@/config/moduleCategories.config';

// In your component:
const groupedModules = groupModulesByCategory(modules);

// Render categories
Object.entries(groupedModules).map(([categoryId, categoryData]) => {
  const { config, modules } = categoryData;
  
  return (
    <div key={categoryId}>
      <h3>{config.icon} {config.name}</h3>
      {/* Render modules */}
    </div>
  );
});
```

---

## ✅ Benefits

1. **🎯 Organized UI**: Modules are grouped logically by feature area
2. **🔍 Easy to Find**: Search across all categories
3. **📊 Visual Clarity**: Color-coded categories with icons
4. **⚡ Quick Actions**: Select all modules in one click
5. **🔧 Easy to Extend**: Add new categories without code changes
6. **📱 Responsive**: Works on mobile, tablet, and desktop
7. **♻️ Reusable**: Same config used across the entire application

---

## 📝 Example: Adding "Sales" Feature

Let's say you want to add a new "Sales" module category:

### 1. Add to configuration file:

```javascript
// In moduleCategories.config.js
categories: [
  // ...existing categories...
  {
    id: 'sales',
    name: 'Sales & Marketing',
    icon: '📈',
    color: 'cyan',
    description: 'Sales pipeline and marketing tools',
    order: 8,
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
    badgeColor: 'bg-cyan-100'
  }
]

categoryMapping: {
  // ...existing mappings...
  sales: ['sales', 'marketing', 'crm', 'pipeline', 'lead']
}
```

### 2. Create modules in Django admin:

- Code: `sales_dashboard` → Name: "Sales Dashboard"
- Code: `sales_reports` → Name: "Sales Reports"
- Code: `crm_contacts` → Name: "CRM Contacts"

### 3. Result:

Users will now see a **"📈 Sales & Marketing"** category with all sales-related modules automatically grouped together!

---

## 🛠️ Troubleshooting

### Module not appearing in correct category?

Check the module code and ensure it matches one of the patterns in `categoryMapping`.

**Example:**
- Module code: `my_qhse_module` ✅ (contains "qhse")
- Module code: `quality_system` ✅ (contains "quality")
- Module code: `random_feature` ❌ (no match → goes to "Other")

### Want to change the default category?

Modules that don't match any pattern go to the **"Other"** category. You can customize this category or add more patterns to match your module codes.

---

## 📞 Support

For questions or issues with module categorization, contact the development team or refer to the main project documentation.

---

**Version:** 1.0.0  
**Last Updated:** January 21, 2026  
**Maintained By:** RADAI System Team
