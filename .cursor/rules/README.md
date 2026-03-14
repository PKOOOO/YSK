# .cursor/rules — SciJudge

Drop all `.mdc` files from this folder into `.cursor/rules/` at your project root.

```
scijudge/
└── .cursor/
    └── rules/
        ├── general.mdc     ← stack, folder structure, global coding conventions
        ├── database.mdc    ← full Prisma schema + Neon/DB rules
        ├── auth.mdc        ← Clerk setup, roles, middleware, webhook
        ├── frontend.mdc    ← UI design system, Tailwind patterns, components
        ├── ai.mdc          ← Vercel AI Gateway, all 4 AI features, model rules
        ├── uploads.mdc     ← UploadThing setup and file handling
        └── actions.mdc     ← Server Actions patterns + full list
```

Cursor will auto-inject the relevant rule file based on which file you have open (controlled by the `globs` in each file's frontmatter). You never need to paste context manually again.

## First prompt to use in Cursor after setup

```
Read all files in .cursor/rules/ to understand the project.
Then scaffold the project: install all packages, set up the folder structure, create prisma/schema.prisma, lib/prisma.ts, lib/auth.ts, lib/ai.ts, middleware.ts, and the Clerk webhook route.
Do not build any UI yet — just the foundation.
```
