# TypeScript Errors - Complete List

Generated: 2025-11-05  
Command: `pnpm check`

## Server Errors (20 errors)

### server/routers.ts (11 errors)

1. **Line 277** - `attachments` does not exist in message type

   ```typescript
   attachments: input.attachments,  // ❌ Property doesn't exist
   ```

2. **Line 326** - `model` does not exist in message type

   ```typescript
   model: aiResponse.model,  // ❌ Property doesn't exist
   ```

3. **Line 556** - `model` does not exist in message type (duplicate)

   ```typescript
   model: aiResponse.model,  // ❌ Property doesn't exist
   ```

4. **Line 809** - Wrong argument type (number vs object)

   ```typescript
   someFunction(input.conversationId); // ❌ Expects Record<string, any>
   ```

5. **Line 1124** - `displayName` does not exist on label type

   ```typescript
   displayName: label.displayName || label.name,  // ❌ Use label.name only
   ```

6. **Line 1590** - `invoiceNo` does not exist on invoice type

   ```typescript
   invoiceNo: invoice.invoiceNo || undefined,  // ❌ Use invoiceNumber
   ```

7. **Line 1592** - `customerId` is possibly null

   ```typescript
   invoice.customerId.toString(); // ❌ Need null check
   ```

8. **Line 1594** - `entryDate` does not exist on invoice type

   ```typescript
   invoice.entryDate?.toISOString(); // ❌ Field doesn't exist in schema
   ```

9. **Line 1596** - `entryDate` does not exist (duplicate)

   ```typescript
   invoice.dueDate && invoice.entryDate; // ❌ Field doesn't exist
   ```

10. **Line 1598** - `dueDate` is string, not Date

    ```typescript
    invoice.dueDate.getTime(); // ❌ dueDate is string | null
    ```

11. **Line 1599** - `entryDate` does not exist (duplicate)

    ```typescript
    invoice.entryDate.getTime(); // ❌ Field doesn't exist
    ```

12. **Line 1784** - `name` can be undefined

    ```typescript
    name: input.name,  // ❌ Type 'string | undefined' not assignable to 'string'
    ```

13. **Line 1865** - Date object where string expected
    ```typescript
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,  // ❌ Should be string
    ```

### server/\_core/dataApi.ts (6 errors)

14-19. **Lines 20, 23, 28, 29, 30, 42** - Missing `forgeApiUrl` and `forgeApiKey`
`typescript
    config.forgeApiUrl  // ❌ Property doesn't exist on config type
    config.forgeApiKey  // ❌ Property doesn't exist on config type
    `

### server/\_core/imageGeneration.ts (3 errors)

20-22. **Lines 37, 40, 45** - Missing `forgeApiUrl` and `forgeApiKey`
`typescript
    config.forgeApiUrl  // ❌ Property doesn't exist on config type
    config.forgeApiKey  // ❌ Property doesn't exist on config type
    `

---

## Client Errors (12 errors)

### client/src/components/CustomerProfile.tsx (6 errors)

23. **Line 345** - `invoiceNo` does not exist

    ```typescript
    invoice.invoiceNo; // ❌ Use invoiceNumber
    ```

24. **Line 360** - `entryDate` does not exist

    ```typescript
    invoice.entryDate; // ❌ Field not in schema
    ```

25. **Line 361** - `entryDate` does not exist (duplicate)

    ```typescript
    invoice.entryDate; // ❌ Field not in schema
    ```

26. **Line 368** - Arithmetic on string type + possibly null

    ```typescript
    invoice.amount - ...  // ❌ amount is string | null
    ```

27. **Line 370** - `paidAmount` does not exist

    ```typescript
    invoice.paidAmount; // ❌ Field not in schema
    ```

28. **Line 372** - `paidAmount` does not exist (duplicate)

    ```typescript
    invoice.paidAmount; // ❌ Field not in schema
    ```

29. **Line 501** - Null passed to Date constructor
    ```typescript
    new Date(invoice.dueDate); // ❌ dueDate is string | null
    ```

### client/src/components/inbox/EmailTab.tsx (1 error)

30. **Line 700** - Ref type mismatch
    ```typescript
    ref: RefObject<HTMLInputElement | null>; // ❌ Expects RefObject<HTMLInputElement>
    ```

### client/src/components/inbox/LeadsTab.tsx (3 errors)

31. **Line 431** - Status type mismatch

    ```typescript
    status: string | null; // ❌ Expected string, got string | null
    ```

32. **Line 591** - Status can be null

    ```typescript
    value={lead.status}  // ❌ Type 'string | null' not assignable to 'string'
    ```

33. **Line 767** - Null passed to Date constructor
    ```typescript
    new Date(lead.createdAt); // ❌ createdAt is string | null
    ```

### client/src/components/SettingsDialog.tsx (2 errors)

34. **Line 44** - Deprecated `onSuccess` API

    ```typescript
    useQuery({
      onSuccess: (data) => { ... }  // ❌ Deprecated in React Query v5
    })
    ```

35. **Line 44** - Implicit any type
    ```typescript
    onSuccess: (data) => { ... }  // ❌ Parameter 'data' implicitly has 'any' type
    ```

---

## Fix Patterns

### Pattern 1: Null Handling

```typescript
// ❌ Bad
const date = new Date(invoice.dueDate);

// ✅ Good
const date = invoice.dueDate ? new Date(invoice.dueDate) : null;
```

### Pattern 2: Optional Fields

```typescript
// ❌ Bad
name: input.name,

// ✅ Good
name: input.name || '',
```

### Pattern 3: Schema Alignment

```typescript
// ❌ Bad (field doesn't exist)
invoice.invoiceNo;
invoice.entryDate;

// ✅ Good (use actual schema fields)
invoice.invoiceNumber;
// Remove entryDate references or add to schema
```

### Pattern 4: Type Conversion

```typescript
// ❌ Bad (Date where string expected)
dueDate: new Date(input.dueDate);

// ✅ Good (keep as string)
dueDate: input.dueDate;
```

### Pattern 5: React Query v5

```typescript
// ❌ Bad (deprecated)
useQuery({
  onSuccess: (data) => { ... }
})

// ✅ Good (v5 API)
const query = useQuery();
useEffect(() => {
  if (query.data) {
    // handle data
  }
}, [query.data]);
```

---

## Quick Wins

**Fix these first for maximum impact:**

1. **Add env config** (9 errors fixed)
   - Add `forgeApiUrl` and `forgeApiKey` to config

2. **Schema alignment** (10 errors fixed)
   - Replace `invoiceNo` with `invoiceNumber`
   - Remove `entryDate` and `paidAmount` references

3. **Add null checks** (8 errors fixed)
   - Wrap nullable values in conditionals

4. **Migrate React Query** (2 errors fixed)
   - Replace `onSuccess` with `useEffect`

---

## Verification

After fixes:

```bash
pnpm check  # Should return 0 errors
```
