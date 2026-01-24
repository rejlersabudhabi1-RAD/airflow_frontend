# Navigation Labels Configuration

## Overview

This configuration file (`navigationLabels.config.js`) provides a centralized, soft-coded approach to managing all navigation menu labels in the RADAI platform. This allows for easy customization of menu items without modifying core component logic.

## Purpose

- **Centralized Control**: All navigation labels are defined in one place
- **Easy Maintenance**: Update labels without touching component code
- **Consistency**: Ensures consistent naming across the application
- **Flexibility**: Supports both short and full names for sections

## Configuration Structure

Each section can have:
- `main`: Short name displayed in navigation (e.g., "Engineering")
- `fullName`: Full descriptive name (e.g., "Process Engineering")
- `number`: Section number prefix (e.g., "1")

### Example:
```javascript
processEngineering: {
  main: 'Engineering',
  fullName: 'Process Engineering', 
  number: '1'
}
```

## Current Sections

| Number | ID | Main Title | Full Title |
|--------|----|-----------|-----------| 
| 1 | `processEngineering` | Engineering | Engineering |
| 2 | `crs` | CRS | Correspondence & Records System |
| 3 | `finance` | Finance | Finance & Accounting |
| 4 | `projectControl` | Project Control | Project Control & Management |
| 5 | `procurement` | Procurement | Procurement & Supply Chain |
| 6 | `hse` | HSE | Health, Safety & Environment |

## Usage

### Basic Usage
```javascript
import { getSectionTitle } from '../../config/navigationLabels.config'

// Get formatted title with number: "1. Engineering"
const title = getSectionTitle('processEngineering')

// Get title without number: "Engineering"
const titleNoNumber = getSectionTitle('processEngineering', false)

// Get full name with number: "1. Process Engineering"
const fullTitle = getSectionTitle('processEngineering', true, true)
```

### Helper Functions

#### `getSectionTitle(section, includeNumber, useFullName)`
Returns the formatted section title
- `section`: Section key (e.g., 'processEngineering')
- `includeNumber`: Include section number (default: true)
- `useFullName`: Use full name instead of main (default: false)

#### `getSectionNumber(section)`
Returns only the section number

#### `getSectionName(section, useFullName)`
Returns only the section name (without number)

## How to Modify Labels

### To Change "Engineering" to Another Name:

1. Open `frontend/src/config/navigationLabels.config.js`
2. Find the `processEngineering` section
3. Update the `main` property:

```javascript
processEngineering: {
  main: 'Engineering',  // ← Change this
  fullName: 'Engineering',
  number: '1'
}
```

### To Change Section Numbers:

Simply update the `number` property:

```javascript
processEngineering: {
  main: 'Engineering',
  fullName: 'Engineering',
  number: '1'  // ← Change this
}
```

### To Add a New Section:

1. Add the section to the config:
```javascript
newSection: {
  main: 'New Section',
  fullName: 'New Section Full Name',
  number: '7'
}
```

2. Use it in components:
```javascript
title: getSectionTitle('newSection')
```

## Implementation Details

### Sidebar Component
The sidebar automatically uses these labels via the `getSectionTitle()` helper:

```javascript
{
  id: 'processEngineering',
  title: getSectionTitle('processEngineering'), // Returns "1. Engineering"
  icon: BeakerIcon,
  type: 'section',
  // ...
}
```

### No Core Logic Changes
All component logic remains unchanged. Only the display labels are soft-coded.

## Benefits

1. **Quick Rebranding**: Change all navigation labels from one file
2. **A/B Testing**: Easy to test different naming conventions
3. **Localization Ready**: Can extend to support multiple languages
4. **Version Control**: Track label changes separately from code
5. **No Component Rebuilds**: Update labels without touching JSX

## Best Practices

1. Keep `main` names short (1-3 words) for better UI display
2. Use descriptive `fullName` for documentation and tooltips
3. Maintain sequential numbering for sections
4. Update this README when adding new sections
5. Test label changes in development before production

## Future Enhancements

Potential extensions:
- Multi-language support (i18n integration)
- Dynamic label loading from database
- User-specific label customization
- Icon configuration alongside labels
- Accessibility text for screen readers

## Files Affected

When updating labels, these files are automatically affected:
- `src/components/Layout/Sidebar.jsx` - Main navigation
- Any component importing `getSectionTitle()` or related helpers

## Migration Notes

**Before** (Hardcoded):
```javascript
title: '1. Process Eng.'
```

**After** (Soft-coded):
```javascript
import { getSectionTitle } from '../../config/navigationLabels.config'
title: getSectionTitle('processEngineering')
```

This approach maintains all existing functionality while providing centralized label management.
