---
title: "🔴 CRITICAL: Database Driver Mismatch Causes Application Failure"
labels: configuration, critical, bug
assignees: ''
---

## Severity: CRITICAL (Application Won't Start)

### Location
- `config/database.php`
- `Dockerfile`

### Issue
The application is configured to use PostgreSQL (`pgsql`) but the Docker container only installs the MySQL PDO driver (`pdo_mysql`).

### Configuration
**config/database.php:**
```php
'default' => env('DB_CONNECTION', 'pgsql'),
```

**Dockerfile (line with pdo_mysql):**
```dockerfile
pdo_mysql \
```

### Impact
- Application will crash on startup when trying to connect to database
- Fatal error: "could not find driver"
- Complete application failure
- No database operations possible

### Fix Required
Add PostgreSQL PDO extension to Dockerfile:

```dockerfile
# Add pdo_pgsql to the extension list
RUN docker-php-ext-install \
    gd \
    zip \
    pdo_mysql \
    pdo_pgsql \
    # ... other extensions
```

**OR** if you're using MySQL, update the configuration:

```env
# In .env file
DB_CONNECTION=mysql
```

### Verification Steps
1. Build the Docker container with the fix
2. Attempt to connect to the database
3. Verify `php -m | grep pdo_pgsql` shows the extension
4. Test a simple database query

### Priority
**IMMEDIATE** - Application cannot function without this fix.
