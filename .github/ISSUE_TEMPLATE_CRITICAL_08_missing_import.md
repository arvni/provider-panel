---
title: "🔴 CRITICAL: Missing axios Import Causes Runtime Error"
labels: bug, critical, frontend
assignees: ''
---

## Severity: CRITICAL (Feature Broken)

### Location
`resources/js/Pages/Order/PatientList.jsx` line 65

### Issue
The code calls `axios.get()` but axios is never imported, causing a ReferenceError at runtime.

### Code
```javascript
// Line 65:
const response = await axios.get(...); // ReferenceError: axios is not defined!
```

### Impact
- Patient list feature completely broken
- JavaScript error prevents page from loading
- Users cannot access patient data
- Console shows "ReferenceError: axios is not defined"

### Fix Required
Add the missing import at the top of the file:

```javascript
import axios from 'axios';
```

### Why This Wasn't Caught
- ESLint or TypeScript not configured to catch undefined variables
- May work in development if axios is globally available
- Will definitely fail in production build

### Related Check
Search for other files that might have the same issue:
```bash
grep -r "axios\." resources/js --include="*.jsx" --include="*.js"
```

Then verify each file has `import axios` at the top.

### Priority
**IMMEDIATE** - Feature is completely non-functional.
