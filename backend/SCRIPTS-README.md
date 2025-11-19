# Backend Scripts

## Utility Scripts

### Development

- **`start-dev.bat`** - Start backend development server with watch mode
  ```bash
  start-dev.bat
  ```

### Database

- **`scripts/run-stats-migration.ts`** - Run stats table migration and triggers
  ```bash
  bun run scripts/run-stats-migration.ts
  ```
  Use this to set up the stats caching system on a new database.

### Monitoring

- **`scripts/show-stats.ts`** - Display current cached statistics

  ```bash
  bun run scripts/show-stats.ts
  ```

  Useful for verifying stats table data and troubleshooting.

- **`test-connection.ts`** - Test database connection
  ```bash
  bun run test-connection.ts
  ```
  Useful for troubleshooting database connectivity issues.

## Scripts Folder

Additional scripts are located in the `scripts/` folder:

- `seed.ts` - Seed database with sample data
- `import-legacy-invoices.ts` - Import invoices from legacy system
- `start-with-migration.ts` - Start server with automatic migration

See individual script files for usage details.

## Removed Scripts

The following scripts were temporary and have been removed:

- `check-duplicates.ts` - Used for one-time duplicate detection
- `clean-duplicates.ts` - Used for one-time duplicate cleanup
- `clean-duplicates-by-number.ts` - Used for one-time cleanup by invoice number
- `remove-duplicates.ts` - Used for one-time duplicate removal
- `test-endpoint.ts` - Development testing script
- `test-stats.ts` - Development testing script
- `test-triggers.ts` - Development testing script

These were kept in git history if needed for reference.
