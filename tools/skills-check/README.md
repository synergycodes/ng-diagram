# skills-check

Checks the agent skills in [`/skills`](../../skills). Both checks run in CI.

| Command                                                      | What it checks                                                                                                                                                       | Part of            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `pnpm --filter @ng-diagram-package/skills-check lint:check`  | Frontmatter (`name`, `description`, `license`), the standard footer, size limits, links between skills and to `references/` files, no internal names                 | `pnpm lint:check`  |
| `pnpm --filter @ng-diagram-package/skills-check check-types` | Every TypeScript and HTML code block of the skills compiles against the library build, with strict TypeScript and Angular `strictTemplates`. Build the library first | `pnpm check-types` |

An error points to the line in the skill's markdown file. The generated files stay in `.snippets/`.

## How a code block is compiled

- **TypeScript** (` ```ts ` or ` ```typescript `) compiles as module code, as members of a component class, or as both: module code, then class members, then module code again, split at blank lines.
- **Class members** can use these services through `this` without declaring them: `injector`, `diagram`, `diagramService`, `modelService`, `nodeService`, `groupsService`, `selection`, `selectionService`, `viewport`, `viewportService`, `clipboard`.
- **A block without imports** gets the names it uses from `ng-diagram` and `@angular/core` imported for it (`Node` always means the ng-diagram type). **A block with imports** must import everything it uses, because readers copy it as it is.
- **HTML** (` ```html `) always needs a scaffold.

## Scaffolds

A block that uses something from the rest of the app (your own service, data type or helper) needs a scaffold: a file in `scaffolds/<skill>/` with any name.

```ts
// snippet: readonly model = signal(initializeModel(bigData));
declare const bigData: Partial<Model>;
```

- The first line names a line of the block, so the scaffold finds its block even when blocks move. Pick a line that no other block in the same file has.
- For a block in a reference file, add `// doc: references/<file>.md` as the second line.
- Without a `/* @snippet */` placeholder, the scaffold goes before the block. To add members to the class around class members, declare `interface SnippetHost { ... }`.
- With a `/* @snippet */` placeholder, the block replaces it. HTML blocks use this inside a component template.

A scaffold that no longer matches exactly one block is an error, so stale scaffolds do not pile up.
