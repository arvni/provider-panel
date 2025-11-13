---
title: "🟠 HIGH: Overly Permissive CORS Configuration"
labels: security, high, configuration
assignees: ''
---

## Severity: HIGH (CVSS 7.4)

### Location
`config/cors.php`

### Issue
CORS is configured to allow all origins, all methods, and all headers, which exposes the application to CSRF and data disclosure attacks.

### Current Configuration
```php
'allowed_origins' => ['*'],  // Allows ANY domain!
'allowed_methods' => ['*'],  // Allows ALL HTTP methods
'allowed_headers' => ['*'],  // Allows ALL headers
```

### Impact
- Malicious websites can make authenticated requests
- CSRF token protection can be bypassed
- Data disclosure to unauthorized domains
- Session hijacking risks

### Attack Scenario
```javascript
// Evil website at evil.com can:
fetch('https://your-app.com/api/patients', {
  credentials: 'include',  // Includes cookies/auth
  headers: { 'Authorization': 'Bearer stolen-token' }
})
.then(data => sendToAttacker(data));
```

### Fix Required

**Restrict to your specific domains:**
```php
'paths' => ['api/*'],

'allowed_origins' => [
    env('FRONTEND_URL', 'https://your-domain.com'),
    'https://app.your-domain.com',
],

'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE'],

'allowed_headers' => [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
],

'supports_credentials' => true,
```

### Environment Setup
```env
# .env
FRONTEND_URL=https://your-domain.com
```

### Testing
1. Try accessing API from an unauthorized domain
2. Verify requests are blocked with CORS error
3. Verify legitimate domains can still access
4. Check browser console for CORS headers

### For Development
```php
'allowed_origins' => env('APP_ENV') === 'local'
    ? ['http://localhost:3000', 'http://localhost:5173']
    : [env('FRONTEND_URL')],
```

### References
- OWASP: CORS Misconfiguration
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
