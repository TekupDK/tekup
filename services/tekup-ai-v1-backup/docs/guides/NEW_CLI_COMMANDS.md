## 📅 Calendar Management

### Calendar Synchronization

Sync calendar with Google Calendar:

```powershell
# Full bidirectional sync
npm run calendar:sync sync

# Check sync status
npm run calendar:status

# Sync from Google to database only
npm run calendar:google-to-db

# Sync from database to Google only
npm run calendar:db-to-google
```

### Calendar Status

View calendar synchronization status:

```powershell
npm run calendar:status
```

**Output example**:

```
📊 Calendar Synchronization Status

📅 Last Sync: 2025-10-03 14:30:00
📈 Statistics:
   Google Calendar events: 45
   Database bookings: 42
   Sync errors: 0
✅ Calendar is up to date
```

---

## 👥 Customer Import

### Import Customers

Import customers from JSON or CSV:

```powershell
# Import from JSON file
npm run customer:import import customers.json

# Import from CSV file
npm run customer:import-csv import-csv customers.csv --create-bookings

# Export customers to CSV
npm run customer:export export customers_export.csv

# View import statistics
npm run customer:import-stats statistics

# Validate customer data
npm run customer:validate validate customers.json
```

### Import Options

```powershell
# Import with bookings creation
npm run customer:import import customers.json --create-bookings

# Import with email confirmations
npm run customer:import import customers.json --send-confirmations

# Dry run (test without importing)
npm run customer:import import customers.json --dry-run

# Custom batch size
npm run customer:import import customers.json --batch-size=25
```

**Output example**:

```
📥 Importing customers from: customers.json

✅ Customer import completed successfully!

📊 Results:
   Customers processed: 25
   Customers created: 20
   Customers updated: 5
   Bookings created: 15
   Errors: 0
   Warnings: 2
   Processing time: 1250ms
```
