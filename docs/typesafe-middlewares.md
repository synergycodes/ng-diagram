# Type-Safe Middleware Metadata System

This guide explains how to use AngularFlow's type-safe middleware metadata system to configure middlewares with full compile-time type checking.

## Quick Start

### Basic Usage

```typescript
// Define middleware metadata interface
interface MyMiddlewareMetadata {
  enabled: boolean;
  threshold: number;
}

// Create middleware with proper typing
export const myMiddleware: Middleware<'my-middleware', MyMiddlewareMetadata> = {
  name: 'my-middleware',
  defaultMetadata: {
    enabled: true,
    threshold: 100,
  },
  execute: (context, next) => {
    const { enabled, threshold } = context.middlewareMetadata;
    // Your middleware logic here
    next();
  },
};

// Use in your app
const customMiddlewares = [myMiddleware] as const;
const model = new SignalModelAdapter<typeof customMiddlewares>();

model.setMiddlewareMetadata('node-rotation-snap', {
  enabled: true,
  snap: 15,
});
```

### Type Safety Features

✅ **Compile-time error checking:**

- Invalid middleware names
- Wrong property types (string vs boolean/number)
- Missing required properties
- Extra invalid properties

✅ **Full IntelliSense support:**

- Autocomplete for middleware names
- Autocomplete for middleware properties
- Type hints for all values

### Type Definitions

#### `CombinedMiddlewaresConfig<TCustomMiddlewares>`

The type for middleware metadata that includes both default and custom middlewares.

```typescript
type AppMiddlewareMetadata = CombinedMiddlewaresConfig<typeof customMiddlewares>;
```

## Best Practices

1. **Always use `as const`** for middleware arrays to preserve literal types
2. **Define metadata interfaces** for custom middlewares
3. **Use the type-safe methods** (`setMiddlewareMetadata`, `updateMiddlewareMetadata`)
4. **Leverage IntelliSense** for autocomplete and type checking
5. **Provide sensible defaults** in middleware definitions

## Troubleshooting

### Common Issues

**Q: IntelliSense not working**
A: Ensure your middleware array is defined with `as const` and the middleware has proper type annotations.

**Q: "Cannot find name" errors**
A: Check that all middleware metadata interfaces are exported from their respective files.
