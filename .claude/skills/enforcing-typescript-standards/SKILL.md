---
name: enforcing-typescript-standards
description: Enforces the project's core TypeScript standards including explicit typing, import organization, class member ordering, and code safety rules. ALWAYS apply when creating, modifying, or reviewing any TypeScript (.ts/.tsx) file.
---

# Enforcing TypeScript Standards

Enforces the project's core TypeScript standards including explicit typing, import organization, class member ordering, and code safety rules.

## Triggers

Activate this skill when the user says or implies any of these:

- "write", "create", "implement", "add", "build" (new TypeScript code)
- "fix", "update", "change", "modify", "refactor" (existing TypeScript code)
- "review", "check", "improve", "clean up" (code quality)
- Any request involving `.ts` or `.tsx` files

Specific triggers:

- Creating a new `.ts` or `.tsx` file
- Modifying existing TypeScript code
- Reviewing TypeScript code for compliance

## Core Standards

### Type Safety

- **Explicit return types**: Prefer explicit return types when practical; omit when inference is obvious and adds no clarity
- **Explicit member accessibility**: Class members require `public`, `private`, or `protected`
- **Type-only imports**: Use `import type` for types: `import type { Foo } from './foo.js'`
- **Sorted type constituents**: Union/intersection types must be alphabetically sorted
- **Only throw Error objects**: Never throw strings or other primitives
- **Avoid `any` and type assertions**: Prefer proper typing over `any` or `as` casts; use them only when truly necessary
- **Type JSON fields explicitly**: Use `Record<string, unknown>` or specific interfaces for JSON data, never `any`
- **Use Number() for conversion**: Prefer `Number(value)` over `parseInt(value, 10)` or `parseFloat(value)`
- **Reuse existing types**: Before defining a new interface, search for existing types that can be reused directly, extended, or derived using `Pick`, `Omit`, `Partial`, or other utility types

#### Alternatives to Type Assertions

Before using `as`, try these approaches in order:

1. Proper typing at the source
2. Type guards (`typeof`, `instanceof`)
3. Type narrowing through control flow
4. Custom type predicate functions
5. Discriminated unions

```ts
// Bad
const user = data as User;

// Good
function isUser(data: unknown): data is User {
  return typeof data === 'object' && data !== null && 'id' in data;
}
if (isUser(data)) {
  // data is now typed as User
}
```

### Import Organization

- **Import order**: builtin → external → internal → parent → sibling → index (alphabetized within groups)
- **No duplicate imports**: Consolidate imports from the same module
- **Newline after imports**: Blank line required after import block

### Class Member Ordering

1. Signatures (call/construct)
2. Fields: private → public → protected
3. Constructors: public → protected → private
4. Methods: public → protected → private

### Code Style

- **Simplicity over cleverness**: Straightforward, readable code is better than clever one-liners
- **Early returns**: Use guard clauses to reduce nesting; return early for edge cases
- **Nullish coalescing**: Prefer `??` over `||` for defaults (avoids false positives on `0` or `''`)
- **Optional chaining**: Use `?.` for safe property access
- **Match existing patterns**: Follow conventions already established in the codebase
- **Meaningful identifiers**: Names must be descriptive (exceptions: `_`, `i`, `j`, `k`, `e`, `x`, `y`)
- **Function declarations**: Use `function foo()` not `const foo = function()`
- **Prefer const**: Use `const` unless reassignment is needed
- **No var**: Always use `const` or `let`
- **Object shorthand**: Use `{ foo }` not `{ foo: foo }`
- **Template literals**: Use `` `Hello ${name}` `` not `'Hello ' + name`
- **Strict equality**: Use `===` except for null comparisons
- **One class per file**: Maximum one class definition per file
- **Avoid `reduce`**: Prefer `for...of` loops or other array methods for clarity
- **Functions over classes**: Prefer exported functions over classes with static methods (unless state is needed)
- **No nested functions**: Define helper functions at module level, not inside other functions
- **Immutability**: Create new objects/arrays instead of mutating existing ones

### Naming Conventions

- **Enum members**: Use `PascalCase` (e.g., `MyValue`)
- **No trailing underscores**: Identifiers cannot end with `_`

### Comments

- **No redundant comments**: Never comment what the code already expresses clearly
- **No duplicate comments**: Don't repeat information from function names, types, or nearby comments
- **Meaningful only**: Only add comments to explain _why_, not _what_ — the code shows what it does

### Boolean Expressions

- **Prefer truthiness checks**: Use implicit truthy/falsy checks over explicit comparisons
- **Exception**: Use explicit checks when distinguishing `0`/`''` (valid values) from `null`/`undefined` is semantically important

### Testing

- **Minimize mocking**: Avoid mocking everything; use real implementations and data generators when available
- **Test real behavior**: Testing mocks provides little value — test actual code paths
- **Don't be lazy**: Write thorough tests that cover edge cases, not just happy paths

### Error Handling

- **Specific error types**: Prefer specific error types over generic `Error` when meaningful
- **Avoid silent failures**: Don't swallow errors with empty catch blocks
- **Handle rejections**: Always handle promise rejections
- **Let errors propagate**: Don't catch errors just to re-throw or log — let them bubble up to error handlers

## Negative Knowledge

Avoid these anti-patterns:

- `console.log()` statements in production code
- `eval()` or `Function()` constructor
- Nested ternary operators
- `await` inside loops when `Promise.all` would be simpler (sequential awaits are fine when order matters or parallelism adds complexity)
- Empty interfaces
- Variable shadowing
- Functions defined inside loops
- `@ts-ignore` without explanation (use `@ts-expect-error` with 10+ char description)
- Comments that restate the code: `// increment counter` above `counter++`
- Comments that duplicate type information: `// returns a string` when return type is `: string`
- Commented-out code (delete it; use version control)
- Verbose boolean comparisons: `arr.length > 0`, `str !== ''`, `obj !== null && obj !== undefined`
- Disabling lint rules via comments (fix the code instead)
- Overuse of `any` type or `as` type assertions
- Over-mocking in tests instead of using real implementations or data generators
- Empty catch blocks that silently swallow errors
- Using `||` for defaults when `??` is more appropriate
- Deep nesting when early returns would simplify
- Catching errors just to re-throw or log them
- Nested function definitions inside other functions
- Mutating objects/arrays instead of creating new ones
- TOCTOU: Checking file/resource existence before operating (try and handle errors instead)
- Classes with only static methods (use plain functions instead)
- Duplicating existing interfaces instead of reusing or deriving with `Pick`/`Omit`/`Partial`

## Verification Workflow

1. **Analyze**: Compare the code change against these TypeScript standards
2. **Generate/Refactor**: Write or modify code to comply with all rules above
3. **Simplify**: Review for opportunities to simplify — prefer clear, straightforward code over clever solutions
4. **Review naming**: Verify variable and function names still make sense in context after changes
5. **Build**: Verify types compile without errors (e.g., `npm run build` or `npx tsc --noEmit`)
6. **Lint**: Run `npm run lint` to confirm compliance before completing the task

## Examples

### Comments Examples

```ts
// Standard
// Retry with exponential backoff to handle transient network failures
async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url);
    } catch {
      await sleep(2 ** i * 100);
    }
  }
  throw new Error(`Failed after ${attempts} attempts`);
}

// Non-Standard
/**
 * Fetches data from a URL with retry logic
 * @param url - The URL to fetch from
 * @param attempts - Number of attempts (default 3)
 * @returns A Promise that resolves to a Response
 */
async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  // Loop through attempts
  for (let i = 0; i < attempts; i++) {
    try {
      // Try to fetch the URL
      return await fetch(url);
    } catch {
      // Wait before retrying
      await sleep(2 ** i * 100);
    }
  }
  // Throw error if all attempts fail
  throw new Error(`Failed after ${attempts} attempts`);
}
```

### Boolean Expressions Examples

```ts
// Standard
if (myArray.length) {
}
if (myString) {
}
if (myObject) {
}
if (!value) {
}

// Non-Standard
if (myArray.length !== 0) {
}
if (myArray.length > 0) {
}
if (myString !== '') {
}
if (myObject !== null && myObject !== undefined) {
}
if (value === null || value === undefined) {
}
```

### Early Return Examples

```ts
// Standard
function processUser(user: User | null): Result {
  if (!user) {
    return { error: 'No user provided' };
  }
  if (!user.isActive) {
    return { error: 'User is inactive' };
  }
  return { data: transform(user) };
}

// Non-Standard
function processUser(user: User | null): Result {
  if (user) {
    if (user.isActive) {
      return { data: transform(user) };
    } else {
      return { error: 'User is inactive' };
    }
  } else {
    return { error: 'No user provided' };
  }
}
```

### Functions Over Classes Examples

```ts
// Standard
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// Non-Standard
export class Calculator {
  static calculateTotal(items: Item[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
  }

  static formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }
}
```

### No Nested Functions Examples

```ts
// Standard
function transformItem(item: Item): TransformedItem {
  return { id: item.id, name: item.name.toUpperCase() };
}

async function processItems(items: Item[]): Promise<TransformedItem[]> {
  return items.map(transformItem);
}

// Non-Standard
async function processItems(items: Item[]): Promise<TransformedItem[]> {
  function transformItem(item: Item): TransformedItem {
    return { id: item.id, name: item.name.toUpperCase() };
  }
  return items.map(transformItem);
}
```

### Immutability Examples

```ts
// Standard
function addItem(items: Item[], newItem: Item): Item[] {
  return [...items, newItem];
}

function removeItem(items: Item[], id: string): Item[] {
  return items.filter((item) => item.id !== id);
}

function updateItem(items: Item[], id: string, updates: Partial<Item>): Item[] {
  return items.map((item) => (item.id === id ? { ...item, ...updates } : item));
}

// Non-Standard
function addItem(items: Item[], newItem: Item): Item[] {
  items.push(newItem);
  return items;
}

function removeItem(items: Item[], id: string): Item[] {
  const index = items.findIndex((item) => item.id === id);
  items.splice(index, 1);
  return items;
}
```

### Error Propagation Examples

```ts
// Standard
async function getUser(id: string): Promise<User> {
  return userService.findById(id);
}

// Non-Standard
async function getUser(id: string): Promise<User> {
  try {
    return await userService.findById(id);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

### TOCTOU Examples

```ts
// Standard
async function readConfig(path: string): Promise<Config> {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (isNotFoundError(error)) {
      return defaultConfig;
    }
    throw error;
  }
}

// Non-Standard
async function readConfig(path: string): Promise<Config> {
  if (await fileExists(path)) {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  }
  return defaultConfig;
}
```

### Type Reuse Examples

```ts
// Given an existing type
interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

// Standard - derive from existing type
type PublicUser = Omit<User, 'passwordHash'>;
type UserSummary = Pick<User, 'id' | 'name'>;
type UserUpdate = Partial<Pick<User, 'email' | 'name'>>;

// Non-Standard - duplicating fields that already exist
interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserSummary {
  id: string;
  name: string;
}

interface UserUpdate {
  email?: string;
  name?: string;
}
```
