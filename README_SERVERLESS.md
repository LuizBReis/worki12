# Worki - Serverless Architecture

This project has been migrated from a monolithic Node.js backend to a Serverless architecture using Supabase.

## Architecture Overview

-   **Frontend**: Angular Standalone Application (`frontend/`).
-   **Backend**: Supabase (Database, Auth, Storage, Edge Functions).
-   **Legacy Backend**: The old `backend/` folder has been moved to `backend_legacy/` and should be deleted after final verification.

## Key Components

### 1. Database & Security
-   **PostgreSQL**: Managed by Supabase.
-   **RLS (Row Level Security)**: All data access is secured by RLS policies.
-   **Triggers**: `on_auth_user_created` automatically provisions public `User` and `Profile` records.

### 2. Edge Functions (`supabase/functions/`)
-   `jobs-api`: Handles Job creation, updates, and applications.
-   `applications-api`: Handles Application workflow (reviews, status updates).
-   `profiles-api`: Handles Profile updates, Skills, and Experience.

### 3. Realtime
-   **Chat**: Uses Supabase Realtime (`postgres_changes`) on the `Message` table.
-   **Notifications**: Uses `broadcast` channels.

## Development

### Prerequisites
-   Supabase CLI (optional, for local dev).
-   Node.js (for Frontend).

### Running Frontend
```bash
cd frontend
npm install
npm start
```

### Deploying Edge Functions
```bash
npx supabase functions deploy jobs-api
npx supabase functions deploy applications-api
npx supabase functions deploy profiles-api
```
