# Soft Delete Implementation

This document explains the soft delete functionality implemented in the BaseRepository and how it works with both User and PDF models.

## Overview

Soft delete means records are not physically removed from the database. Instead, a `deletedAt` timestamp is set when a record is "deleted". This allows for data recovery and maintains referential integrity.

**All timestamps are stored in UTC format using Moment.js for consistency across timezones.**

## How It Works

### Database Schema
Both `users` and `pdfs` tables have a `deletedAt` field:
- **Default value**: `NULL` (record is active)
- **When deleted**: Current UTC timestamp is set
- **When restored**: Set back to `NULL`

### Sequelize Configuration
Both models use `paranoid: true` which enables Sequelize's built-in soft delete functionality.

### UTC Timestamp Handling
All timestamps are handled using Moment.js in UTC format:
- **Storage**: All `deletedAt` timestamps are stored in UTC
- **Consistency**: Ensures consistent timestamps regardless of server timezone
- **Format**: ISO 8601 format in UTC timezone

## BaseRepository Methods

### Standard Methods (Auto-filter deleted records)
```javascript
// These methods automatically exclude deleted records
await repository.findAll()           // Only active records
await repository.findById(id)        // Only active records
await repository.findOne(where)      // Only active records
await repository.count(where)        // Only active records
```

### Soft Delete Methods
```javascript
// Soft delete a record (sets UTC timestamp)
await repository.delete(id)          // Sets deletedAt = current UTC timestamp

// Hard delete a record (permanent)
await repository.hardDelete(id)      // Permanently removes from database

// Restore a soft-deleted record
await repository.restore(id)         // Sets deletedAt = NULL
```

### Query Methods for Deleted Records
```javascript
// Find all records including deleted ones
await repository.findAllWithDeleted()

// Find by ID including deleted records
await repository.findByIdWithDeleted(id)

// Find only deleted records
await repository.findDeleted()

// Count deleted records
await repository.countDeleted()
```

### UTC Timestamp Utility Methods
```javascript
// Get current UTC timestamp
const utcNow = repository.getCurrentUTCTimestamp();

// Format UTC timestamp
const formatted = repository.formatUTCTimestamp(timestamp, 'YYYY-MM-DD HH:mm:ss UTC');

// Check if timestamp is valid UTC
const isValid = repository.isUTCTimestamp(timestamp);
```

## UserRepository Specific Methods

```javascript
const userRepo = new UserRepository();

// Soft delete user and all their PDFs
await userRepo.deleteUserAndPdfs(userId);

// Restore user and all their PDFs
await userRepo.restoreUserAndPdfs(userId);

// Find deleted users
await userRepo.findDeletedUsers();

// Find deleted user by username
await userRepo.findDeletedUserByUsername('john_doe');

// Count active/inactive/deleted users
await userRepo.countActiveUsers();
await userRepo.countInactiveUsers();
await userRepo.countDeletedUsers();

// UTC timestamp-based queries
await userRepo.findUsersDeletedAfter('2024-01-01T00:00:00Z');
await userRepo.findUsersDeletedBefore('2024-12-31T23:59:59Z');
await userRepo.findUsersDeletedBetween('2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z');

// Get deletion statistics
const stats = await userRepo.getUserDeletionStats();
// Returns: { totalDeleted, deletedToday, deletedThisWeek, deletedThisMonth }
```

## PdfRepository Specific Methods

```javascript
const pdfRepo = new PdfRepository();

// Soft delete all PDFs for a user
await pdfRepo.deletePdfByUserId(userId);

// Soft delete PDFs by status
await pdfRepo.deletePdfsByStatus('failed');

// Restore all PDFs for a user
await pdfRepo.restorePdfByUserId(userId);

// Find deleted PDFs by user
await pdfRepo.findDeletedPdfsByUserId(userId);

// Find deleted PDFs by status
await pdfRepo.findDeletedPdfsByStatus('failed');

// UTC timestamp-based queries
await pdfRepo.findPdfsDeletedAfter('2024-01-01T00:00:00Z');
await pdfRepo.findPdfsDeletedBefore('2024-12-31T23:59:59Z');
await pdfRepo.findPdfsDeletedBetween('2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z');

// Get deletion statistics
const stats = await pdfRepo.getDeletionStats();
// Returns: { totalDeleted, deletedToday, deletedThisWeek, deletedThisMonth }
```

## Usage Examples

### Basic Soft Delete
```javascript
const userRepo = new UserRepository();
const pdfRepo = new PdfRepository();

// Soft delete a user (sets UTC timestamp)
await userRepo.delete(userId);

// Soft delete a PDF (sets UTC timestamp)
await pdfRepo.delete(pdfId);

// Records are still in database but won't appear in normal queries
const users = await userRepo.findAll(); // Won't include deleted user
const pdfs = await pdfRepo.findAll();   // Won't include deleted PDF
```

### Working with UTC Timestamps
```javascript
// Get current UTC timestamp
const utcNow = userRepo.getCurrentUTCTimestamp();

// Format a timestamp
const formatted = userRepo.formatUTCTimestamp(deletedUser.deletedAt);

// Find records deleted in a specific time range
const recentlyDeleted = await userRepo.findUsersDeletedAfter('2024-01-01T00:00:00Z');
```

### Restoring Records
```javascript
// Restore a deleted user
await userRepo.restore(userId);

// Restore a deleted PDF
await pdfRepo.restore(pdfId);

// Records are now active again
const users = await userRepo.findAll(); // Will include restored user
```

### Working with Deleted Records
```javascript
// Find all deleted users
const deletedUsers = await userRepo.findDeleted();

// Find all records including deleted ones
const allUsers = await userRepo.findAllWithDeleted();

// Count deleted records
const deletedCount = await userRepo.countDeleted();

// Get deletion statistics
const stats = await userRepo.getUserDeletionStats();
console.log(`Deleted today: ${stats.deletedToday}`);
```

### Cascading Soft Delete
```javascript
// Delete user and all their PDFs
await userRepo.deleteUserAndPdfs(userId);

// Restore user and all their PDFs
await userRepo.restoreUserAndPdfs(userId);
```

## Benefits

1. **Data Recovery**: Deleted records can be restored
2. **Audit Trail**: Maintains history of deletions with UTC timestamps
3. **Referential Integrity**: Foreign key relationships are preserved
4. **Compliance**: Useful for data retention policies
5. **Testing**: Can restore test data easily
6. **Timezone Consistency**: All timestamps in UTC for global applications

## Important Notes

1. **Default Behavior**: All standard queries automatically exclude deleted records
2. **Performance**: Queries include `WHERE deletedAt IS NULL` by default
3. **Storage**: Deleted records still consume database space
4. **Cleanup**: Consider periodic cleanup of old deleted records if needed
5. **Indexes**: Ensure `deletedAt` column is indexed for performance
6. **UTC Timestamps**: All timestamps are stored in UTC format for consistency
7. **Moment.js**: Uses Moment.js for reliable UTC timestamp handling

## Testing

Run the test file to see soft delete in action:
```javascript
const { demonstrateSoftDelete } = require('./test-soft-delete');
await demonstrateSoftDelete();
```

## Migration Considerations

If you're adding soft delete to existing tables:
1. Add `deletedAt` column with `NULL` default
2. Update existing records to have `deletedAt = NULL`
3. Add index on `deletedAt` column
4. Update application code to use new repository methods
5. Ensure all timestamp operations use UTC format
