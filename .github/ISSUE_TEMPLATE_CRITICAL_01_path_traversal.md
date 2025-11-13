---
title: "🔴 CRITICAL: Path Traversal Vulnerability in GetFileController"
labels: security, critical, bug
assignees: ''
---

## Severity: CRITICAL (CVSS 7.5)

### Location
`app/Http/Controllers/GetFileController.php` lines 44-56

### Issue
The file download endpoint does not sanitize the `path` parameter, allowing attackers to read arbitrary files using path traversal sequences (`../`).

### Vulnerable Code
```php
$path = $request->input('path'); // No sanitization!
if (Storage::disk('public')->exists($path)) {
    return Storage::disk('public')->download($path);
}
```

### Impact
- Attackers can read sensitive files like `.env`, configuration files
- Access to other users' medical documents
- Potential data breach of all stored files

### Fix Required
1. Validate and sanitize the path parameter
2. Implement a whitelist of allowed directories
3. Check file ownership before allowing download
4. Use `basename()` to prevent directory traversal

### Example Fix
```php
$path = $request->input('path');
$path = basename($path); // Remove directory components
$allowedPath = 'uploads/orders/'; // Define allowed directory
$fullPath = $allowedPath . $path;

// Verify user has access to this file
$this->authorize('view', $file);

if (Storage::disk('public')->exists($fullPath)) {
    return Storage::disk('public')->download($fullPath);
}
```

### References
- CWE-22: Improper Limitation of a Pathname to a Restricted Directory
- OWASP: Path Traversal
