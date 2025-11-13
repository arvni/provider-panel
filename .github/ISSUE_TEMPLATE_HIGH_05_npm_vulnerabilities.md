---
title: "🟠 HIGH: 10 npm Package Vulnerabilities Detected"
labels: security, high, dependencies
assignees: ''
---

## Severity: HIGH (Multiple CVEs)

### Issue
`npm audit` reports 10 vulnerabilities in project dependencies, including critical issues in axios and form-data.

### Critical Vulnerabilities

**1. axios 1.6.7 - 3 vulnerabilities**
- SSRF vulnerability
- Credential leakage
- DoS attacks
- **Fix:** Upgrade to axios@1.7.4 or later

**2. form-data 4.0.0 - Critical**
- CVE-GHSA-fjxv-7rqg-78g4
- Unsafe random function for form boundary generation
- **Fix:** Upgrade to form-data@4.0.1 or later

**3. rollup 4.9.6 - High**
- DOM Clobbering XSS gadget in bundled scripts
- **Fix:** Upgrade to rollup@4.24.0 or later

### Moderate Vulnerabilities

4. **@babel/helpers & @babel/runtime** - ReDoS in generated code
5. **esbuild** - CORS misconfiguration in dev server
6. **follow-redirects** - Proxy-Authorization header leak
7. **nanoid** - Predictable randomness
8. **validator** - URL validation bypass
9. **vite** - Depends on vulnerable esbuild

### Impact
- Potential remote code execution
- Data disclosure
- Service disruption
- Credential theft
- XSS attacks

### Fix Required

**Run npm audit fix:**
```bash
npm audit fix
```

**For packages that can't auto-fix:**
```bash
npm audit fix --force
```

**Manual updates needed:**
```bash
npm install axios@latest
npm install form-data@latest
npm install rollup@latest
npm install esbuild@latest
```

### Verification
```bash
npm audit
# Should show 0 vulnerabilities
```

### Package.json Updates
Update these minimum versions in `package.json`:
```json
{
  "dependencies": {
    "axios": "^1.7.4",
    "form-data": "^4.0.1"
  },
  "devDependencies": {
    "rollup": "^4.24.0",
    "esbuild": "^0.24.0",
    "vite": "^5.4.0"
  }
}
```

### Testing After Update
1. Run full test suite
2. Test file uploads (form-data)
3. Test API calls (axios)
4. Build production bundle (rollup, vite)
5. Verify no breaking changes

### Automation
Add to CI/CD pipeline:
```yaml
- name: Check for vulnerabilities
  run: npm audit --audit-level=moderate
```

### Regular Maintenance
- Run `npm audit` weekly
- Review security advisories from GitHub
- Keep dependencies up to date
- Use Dependabot for automated updates

### References
- [npm audit documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)
