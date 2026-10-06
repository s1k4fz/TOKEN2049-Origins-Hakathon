# Frontend

Vite + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui.

## Run

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
npm run build
npm run lint
```

## Conventions

Directory boundaries, state management and code style: [`.cursor/rules/frontend.mdc`](../.cursor/rules/frontend.mdc).

## Pre-existing work disclosure

The tooling config (Vite / TypeScript / ESLint / shadcn), the theme tokens in `src/index.css`, the shadcn/ui primitives in `src/components/ui/`, and the sidebar shell components (`SidebarItem`, `SidebarSection`, `SidebarMoreMenu`, `ActionMenu`) were adapted from the author's earlier public project [lemma-ai](https://github.com/Lemma-AI-Projects/lemma-ai). Everything else was written during the hackathon (after Oct 6, 12:00 SGT).
