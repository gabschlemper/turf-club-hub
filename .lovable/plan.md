

# Fix: RLS Policy Email Case Sensitivity

## Root Cause

The RLS policy "Athletes manage own confirmations" joins `profiles.email` with `athletes.email` using **case-sensitive comparison** (`a.email = p.email`). There is at least one user where the profile email is lowercase (`ianndonis@gmail.com`) but the athlete email has uppercase (`Ianndonis@gmail.com`). This causes the RLS check to fail, blocking the insert.

The same issue affects the "Athletes view own debts" policy on the `debts` table.

Additionally, the frontend `currentAthlete` lookup in `useAthletes.ts` uses strict equality (`===`), which is also case-sensitive and could fail for the same reason.

## Fix

### 1. Database Migration
Update two RLS policies to use case-insensitive email comparison:

- **`training_confirmations`**: Drop and recreate "Athletes manage own confirmations" with `LOWER(a.email) = LOWER(p.email)`
- **`debts`**: Drop and recreate "Athletes view own debts" with `LOWER(a.email) = LOWER(p.email)`

### 2. Frontend Fix
In `src/hooks/useAthletes.ts`, change the `currentAthlete` lookup to use case-insensitive comparison:
```typescript
const currentAthlete = athletesQuery.data?.find(
  athlete => athlete.email.toLowerCase() === user?.email?.toLowerCase()
);
```

### 3. Optional Data Normalization
Normalize the athlete email that has the mismatch (`Ianndonis@gmail.com` → `ianndonis@gmail.com`) to prevent future issues.

