---
title: "🔴 CRITICAL: Unprotected Webhook Endpoints Allow Unauthorized Access"
labels: security, critical, api
assignees: ''
---

## Severity: CRITICAL (CVSS 8.1)

### Location
`routes/api.php` lines 35-39

### Issue
Five webhook endpoints have no authentication middleware, allowing anyone on the internet to trigger them.

### Vulnerable Endpoints
```php
Route::post('/webhook/collect-request/update', ...); // No auth!
Route::post('/webhook/collect-request/sent', ...);
Route::post('/webhook/order-material/update', ...);
Route::post('/webhook/order-material/receive', ...);
Route::post('/webhook/order-material/send', ...);
```

### Impact
- Any attacker can manipulate order statuses
- Unauthorized data modification
- Potential data corruption
- Service disruption

### Fix Required
Add authentication middleware to all webhook routes:

```php
Route::middleware(['webhook.signature'])->group(function () {
    Route::post('/webhook/collect-request/update', ...);
    Route::post('/webhook/collect-request/sent', ...);
    Route::post('/webhook/order-material/update', ...);
    Route::post('/webhook/order-material/receive', ...);
    Route::post('/webhook/order-material/send', ...);
});
```

### Recommended Solution
1. Create a webhook signature verification middleware
2. Use HMAC-SHA256 to verify webhook authenticity
3. Store webhook secrets in environment variables
4. Add rate limiting to prevent abuse
5. Log all webhook attempts for auditing

### References
- [Securing Webhooks](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
- OWASP: Broken Authentication
