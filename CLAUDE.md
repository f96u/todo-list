# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # Start development server
npm run build  # Build for production
npm run lint   # Run ESLint
```

No test suite is configured.

## Architecture

**Stack**: Next.js (App Router) + TypeScript + Firebase (Firestore + Auth) + Tailwind CSS v4

**Authentication**: Firebase anonymous auth, triggered automatically on page load via `AuthProvider`. No user accounts — each browser/device gets a unique guest UID. Data is scoped to that UID.

**Data persistence**: Single Firestore document per user at `users/{userId}`, containing a `todolist.todos` array and an `expireAt` field (7 days TTL). All todo operations read/write the entire array in one document (no subcollections).

**Component flow**:
- `layout.tsx` wraps the app in `AuthProvider` (provides `useAuth()` hook)
- `page.tsx` renders `TodoSection` + `UserInfo`
- `TodoSection.tsx` owns all state and Firestore CRUD logic
- `TodoList.tsx` is a pure presentational component receiving props from `TodoSection`

**Firestore data model**:
```
users/{userId}
  expireAt: Timestamp       // 7 days from creation
  todolist.todos: [
    { id: string, text: string, completed: boolean, createdAt: Timestamp }
  ]
```

**Path alias**: `@/*` maps to `./src/*`

**Deployment**: Firebase App Hosting (asia-east1). Config in `firebase.json` and `apphosting.yaml`. Firestore security rules in `firestore.rules` — only own user document is accessible.
