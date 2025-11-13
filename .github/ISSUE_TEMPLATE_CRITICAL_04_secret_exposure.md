---
title: "🔴 CRITICAL: Webhook Secret Exposed in Error Responses"
labels: security, critical, bug
assignees: ''
---

## Severity: CRITICAL (CVSS 7.5)

### Location
`app/Http/Controllers/Webhook/OrderMaterialUpdateWebhookController.php` line 36

### Issue
The webhook secret is included in error messages and logs, exposing it to attackers.

### Vulnerable Code
```php
Log::error($e->getMessage() . $secret); // Secret in logs!
return response()->json(['message' => $e->getMessage() . $secret], 500);
```

### Impact
- Webhook authentication can be completely bypassed
- Attackers can forge valid webhook requests
- Once secret is known, all webhook security is compromised

### Fix Required
Remove the secret from all error messages and logs:

```php
Log::error('Webhook processing failed: ' . $e->getMessage(), [
    'controller' => 'OrderMaterialUpdateWebhook',
    'error' => $e->getMessage()
]);
return response()->json(['message' => 'Webhook processing failed'], 500);
```

### Additional Actions
1. Rotate the webhook secret immediately
2. Review all logs for potential exposure
3. Audit all webhook controllers for similar issues
4. Never include sensitive data in error responses

### Related Files to Check
- `CollectRequestSentWebhookController.php`
- `CollectRequestUpdateWebhookController.php`
- `OrderMaterialReceiveWebhookController.php`
- `OrderMaterialSendWebhookController.php`
