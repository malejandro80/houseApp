---
name: Supabase Interaction
description: Standards and patterns for interacting with Supabase in Next.js (App Router)
---

# Supabase Interaction Skill

This skill defines how to correctly interact with Supabase across the application, ensuring type safety, security, and performance.

## 1. Client Initialization

We use `@supabase/ssr` for all Supabase client creation. The clients are defined in `src/lib/supabase`.

### A. Client Components (`use client`)
Use `createClient` from `@/lib/supabase/client`. This initializes a browser-side client with the anonymous key.

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    const supabase = createClient()
    
    async function fetchData() {
      const { data, error } = await supabase.from('my_table').select('*')
      if (data) setData(data)
    }
    
    fetchData()
  }, [])
  
  // ...
}
```

### B. Server Components & Server Actions (`use server`)
Use `createClient` from `@/lib/supabase/server`. This initializes a server-side client that can handle cookies for authentication.

**IMPORTANT:** `createClient` in `@/lib/supabase/server` is an `async` function because it awaits `cookies()`.

```typescript
// src/app/actions/example.ts
'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitData(formData: FormData) {
  const supabase = await createClient()
  
  // Verify user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Perform operation
  const { error } = await supabase
    .from('my_table')
    .insert({ user_id: user.id, ... })
    
  if (error) {
     return { error: error.message }
  }
  
  return { success: true }
}
```

### C. Middleware
Middleware has its own specific client initialization in `@/lib/supabase/middleware.ts` to handle session refreshing. Do NOT import this manually; it is used by `src/middleware.ts`.

## 2. Type Safety

Always use the generated types. The `createClient` functions are already typed with `Database` from `src/types/database.types.ts` (or equivalent).

- **Never** use `any` for Supabase responses.
- If types are missing, run the type generation command:
  `npx supabase gen types typescript --local > src/types/database.types.ts`

## 3. Row Level Security (RLS)

- **Assume RLS is Active:** All tables have RLS enabled.
- **Service Role Forbidden:** Do not use `service_role` keys in application code. All data access must be scoped to the authenticated user via RLS policies.
- **Policy Testing:** verification of policies should be done by attempting actions as different users.

## 4. Error Handling

- Always check for `error` in Supabase responses.
- Standardize error returns in Server Actions (e.g., `{ data: T | null, error: string | null }`).

## 5. Performance

- **Select Specific Columns:** Avoid `select('*')` in production if you only need a few columns.
- **Chain Filters:** Use `.eq()`, `.in()`, etc., to filter specific data.
- **Pagination:** Use `.range(start, end)` for large lists.
