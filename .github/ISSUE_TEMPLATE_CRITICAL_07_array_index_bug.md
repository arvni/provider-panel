---
title: "🔴 CRITICAL: Array Index Out of Bounds in File Uploader"
labels: bug, critical, frontend
assignees: ''
---

## Severity: CRITICAL (Data Corruption)

### Location
`resources/js/Components/Uploader.jsx` lines 59-62

### Issue
Array index calculation is incorrect, causing out-of-bounds writes that corrupt file upload data.

### Vulnerable Code
```javascript
newFiles[i + newFiles.length] = value; // Always wrong index!
```

### Problem Explanation
If `newFiles.length = 5` and `i = 0`, this writes to index `5`, which is correct for the first new file. But when `i = 1`, it writes to index `6`, then `7`, etc. This is incorrect - it should append sequentially starting from the current length.

### Impact
- Files get assigned to wrong array positions
- Data corruption in file uploads
- Files may be lost or associated with wrong records
- Unpredictable behavior during multi-file uploads

### Fix Required
Remove the incorrect calculation:

```javascript
// BEFORE (WRONG):
newFiles[i + newFiles.length] = value;

// AFTER (CORRECT):
newFiles.push(value);
// OR
newFiles[newFiles.length] = value;
```

### Test Case
```javascript
// Current broken behavior:
let files = [a, b, c]; // length = 3
// Adding two new files (d, e):
// i=0: files[0 + 3] = d  -> files[3] = d ✓
// i=1: files[1 + 3] = e  -> files[4] = e ✓
// BUT if adding one at a time:
// i=0: files[0 + 3] = d  -> files[3] = d
// Next iteration with files = [a,b,c,d], length = 4:
// i=0: files[0 + 4] = e  -> files[4] = e ✓
// But what about files[3]? Could be overwritten!
```

### Priority
**IMMEDIATE** - Causes data corruption.
