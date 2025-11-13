# GitHub Issue Templates

This directory contains issue templates for all critical and high-severity issues found in the comprehensive code review.

## Critical Issues (Must Fix Immediately)

1. **CRITICAL_01_path_traversal.md** - Path traversal vulnerability in file downloads
2. **CRITICAL_02_password_bypass.md** - Disabled authorization allows password changes
3. **CRITICAL_03_unprotected_webhooks.md** - Webhook endpoints have no authentication
4. **CRITICAL_04_secret_exposure.md** - Webhook secrets exposed in error responses
5. **CRITICAL_05_missing_file_auth.md** - No file ownership verification
6. **CRITICAL_06_database_mismatch.md** - Database driver mismatch prevents startup
7. **CRITICAL_07_array_index_bug.md** - Array out of bounds in file uploader
8. **CRITICAL_08_missing_import.md** - Missing axios import breaks patient list

## High Severity Issues

1. **HIGH_01_xss_vulnerabilities.md** - XSS in React components using dangerouslySetInnerHTML
2. **HIGH_02_sql_injection.md** - SQL injection in patient search
3. **HIGH_03_cors_misconfiguration.md** - CORS allows all origins
4. **HIGH_04_debug_mode_enabled.md** - Debug mode exposes sensitive information
5. **HIGH_05_npm_vulnerabilities.md** - 10 npm package vulnerabilities

## How to Create Issues from Templates

### Option 1: Manual Creation (Recommended)
1. Go to GitHub Issues page
2. Click "New Issue"
3. Copy content from template file
4. Paste into issue description
5. Add appropriate labels
6. Submit

### Option 2: Using GitHub CLI (if installed locally)
```bash
# Example for path traversal issue:
gh issue create \
  --title "🔴 CRITICAL: Path Traversal Vulnerability in GetFileController" \
  --body-file .github/ISSUE_TEMPLATE_CRITICAL_01_path_traversal.md \
  --label "security,critical,bug"
```

### Option 3: Bulk Creation Script
```bash
#!/bin/bash
for file in .github/ISSUE_TEMPLATE_CRITICAL_*.md; do
  title=$(grep "^title:" "$file" | sed 's/title: "\(.*\)"/\1/')
  labels=$(grep "^labels:" "$file" | sed 's/labels: //')
  gh issue create --title "$title" --body-file "$file" --label "$labels"
done
```

## Priority Order

Fix issues in this order:

### Phase 1 (Day 1-2): Critical Security
- [ ] CRITICAL_02: Uncomment authorization (1 line fix)
- [ ] CRITICAL_08: Add axios import (1 line fix)
- [ ] CRITICAL_07: Fix array index bug
- [ ] CRITICAL_01: Fix path traversal
- [ ] CRITICAL_05: Add file authorization
- [ ] CRITICAL_03: Protect webhook endpoints
- [ ] CRITICAL_04: Remove secret from errors
- [ ] CRITICAL_06: Fix database driver

### Phase 2 (Week 1): High Security
- [ ] HIGH_05: Run npm audit fix
- [ ] HIGH_04: Disable debug mode
- [ ] HIGH_03: Configure CORS properly
- [ ] HIGH_01: Fix XSS vulnerabilities
- [ ] HIGH_02: Fix SQL injection

## Additional Information

For complete details on all issues, code quality problems, and bugs, see:
- `COMPREHENSIVE_CODE_REVIEW.md` - Executive summary
- `CODE_QUALITY_ANALYSIS.md` - Detailed code quality issues
- `BUG_REPORT.md` - Complete bug list
- `CONFIGURATION_AUDIT_REPORT.md` - Configuration problems

## Status Tracking

Update this checklist as issues are created:

- [ ] All 8 critical issues created
- [ ] All 5 high severity issues created
- [ ] Priorities assigned
- [ ] Team notified
- [ ] Fixes in progress
