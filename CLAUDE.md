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

**Data persistence**: Single Firestore document per user at `users/{userId}`, containing a `todolist.todos` array and a `todolist.memos` array. All todo/memo operations read/write the entire array in one document (no subcollections). Memos use soft-deletion (`deletedAt` field) so deleted items can be restored from a trash UI.

For anonymous users only, the document carries an `expireAt: Timestamp` (7 days from initial document creation) which a Firestore TTL policy uses to auto-delete the entire document. Non-anonymous users do not get this field; if a document is loaded with a non-anonymous user and `expireAt` is present (e.g., upgraded from anonymous), it is removed via `deleteField()`.

**Component flow**:
- `layout.tsx` wraps the app in `AuthProvider` (provides `useAuth()` hook)
- `page.tsx` renders `TodoSection` + `UserInfo`
- `TodoSection.tsx` owns all state and Firestore CRUD logic
- `TodoList.tsx` is a pure presentational component receiving props from `TodoSection`

**Firestore data model**:
```
users/{userId}
  expireAt?: Timestamp       // 7 days from creation, anonymous users only (TTL policy target)
  todolist.todos: [
    { id: string, text: string, completed: boolean, createdAt: Timestamp }
  ]
  todolist.memos: [
    { id: string, content: string, createdAt: Timestamp, updatedAt: Timestamp, deletedAt?: Timestamp }
  ]
```

**Path alias**: `@/*` maps to `./src/*`

**Deployment**: Firebase App Hosting (asia-east1). Config in `firebase.json` and `apphosting.yaml`. Firestore security rules in `firestore.rules` — only own user document is accessible.
