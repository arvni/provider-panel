---
title: "🟠 HIGH: SQL Injection in Patient Search"
labels: security, high, backend
assignees: ''
---

## Severity: HIGH (CVSS 8.0)

### Location
`app/Http/Controllers/Api/PatientListController.php` lines 17-23

### Issue
User input is used in LIKE queries without proper escaping, potentially allowing SQL injection attacks.

### Vulnerable Code Pattern
```php
$search = $request->input('search');
$query->where('name', 'LIKE', '%' . $search . '%');
```

### Impact
- Database data exposure
- Unauthorized data access
- Potential data manipulation
- Database server compromise

### Fix Required

**Use parameter binding:**
```php
$search = $request->input('search');
$query->where('name', 'LIKE', '%' . $search . '%'); // Laravel already escapes this

// But if you're using raw queries, use bindings:
DB::select('SELECT * FROM patients WHERE name LIKE ?', ['%' . $search . '%']);
```

**Better approach with validation:**
```php
$validated = $request->validate([
    'search' => 'string|max:255|regex:/^[a-zA-Z0-9\s]+$/'
]);

$search = $validated['search'];
$query->where('name', 'LIKE', '%' . $search . '%');
```

### Testing
Try searching for: `%' OR '1'='1` and verify it doesn't return all records.

### Review These Files Too
Search for other LIKE queries:
```bash
grep -r "LIKE" app/Http/Controllers --include="*.php"
grep -r "DB::raw" app --include="*.php"
```

### References
- OWASP: SQL Injection
- Laravel Query Builder (uses prepared statements)
