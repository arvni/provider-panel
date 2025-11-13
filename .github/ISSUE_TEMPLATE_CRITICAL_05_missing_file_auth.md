---
title: "🔴 CRITICAL: Missing File Ownership Verification"
labels: security, critical, authorization
assignees: ''
---

## Severity: CRITICAL (CVSS 7.1)

### Location
`app/Http/Controllers/GetFileController.php` line 41

### Issue
Users can download files belonging to other users. There's a TODO comment acknowledging this but it's not implemented.

### Code
```php
// TODO: Check if the user is allowed to access this file
// NOT IMPLEMENTED!
```

### Impact
- Unauthorized access to sensitive medical documents
- HIPAA/privacy violations
- Users can access other patients' medical records
- Complete breach of confidentiality

### Fix Required
Implement proper authorization before allowing file downloads:

```php
public function show(Request $request)
{
    $path = $request->input('path');

    // Sanitize path (also fixes path traversal)
    $path = basename($path);

    // Extract order/patient ID from path or database lookup
    $file = File::where('path', $path)->firstOrFail();

    // Authorization check
    $this->authorize('view', $file->order);

    if (Storage::disk('public')->exists($path)) {
        return Storage::disk('public')->download($path);
    }

    abort(404);
}
```

### Implementation Steps
1. Create a `File` model to track file ownership
2. Add authorization policy for file access
3. Verify user has access to the associated order/patient
4. Add audit logging for file access
5. Write tests for authorization

### Priority
**IMMEDIATE** - Medical data privacy is critical.

### Related Issues
- Combines with path traversal issue for double vulnerability
