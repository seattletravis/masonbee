# 🐝 Mason Bee Tracker — Django + PostgreSQL Project

A community‑driven platform for mapping Seattle‑area gardens, tracking mason bee habitats, and supporting ecological stewardship. This project blends data engineering, geospatial modeling, and privacy‑preserving design to create a tool that helps gardeners and educators support native pollinators.

---

## 🌱 Project Overview

Mason bees are highly efficient native pollinators, but their success depends on access to safe nesting sites and nearby forage. This project aims to:

- Map community gardens and green spaces in the Seattle region
- Allow users to register and manage mason bee houses
- Provide privacy‑preserving visibility into local pollinator activity
- Support educators, gardeners, and ecological volunteers
- Build a scalable, open‑source foundation for future expansion

This repository contains the full Django backend, PostgreSQL schema, and data‑import pipeline for garden datasets.

---

## 🧱 Tech Stack

| Layer           | Tools                                                        |
| --------------- | ------------------------------------------------------------ |
| Backend         | Django 5, Python 3.13                                        |
| Database        | PostgreSQL (local dev via pgAdmin)                           |
| Environment     | `beevenv` virtual environment                                |
| Data            | Seattle community garden datasets (ETL pipeline in progress) |
| Deployment      | Local development → server migration planned                 |
| Version Control | Git + GitHub                                                 |

---

## 📂 Project Structure

masonbee/ beevenv/ # Virtual environment (ignored by Git) masonbee_project/ # Django project folder manage.py config/ # Django settings package settings.py urls.py wsgi.py asgi.py gardens/ # App for gardens + bee houses (coming soon)

---

## 🐝 Features (In Development)

- Garden model with geospatial fields
- BeeHouse model with ownership + privacy logic
- Import pipeline for Seattle community garden data
- Admin interface for managing gardens and bee houses
- Map‑based UI (future milestone)
- Event‑driven notifications (future milestone)

---

## 🌿 Data Model Overview

The system is organized around a set of relational models that describe gardens, bee houses, ecological activity, user interactions, privacy controls, and subscription‑based features. The architecture is designed to be privacy‑first, scalable, and expressive enough to support both community gardens and private backyard installations.

🏡 Gardens
Represents a physical or community garden space. Supports public, community, and private gardens with optional location data, ownership, and metadata.

- Key fields: name, garden_type, address, coordinates, neighborhood, metadata fields
- Ownership: private gardens may have an owner
- Visibility: is_public determines global accessibility
- Relations: connects to BeeHouse, GardenImage, GardenChatMessage, UserPinnedGarden, PrivateGardenAccess

🐝 Bee Houses
Each garden can contain multiple bee houses, each with its own ecological state, installation lifecycle, and coordinates.

- Unique per garden: beehouse_id scoped to the garden
- Lifecycle: install/uninstall dates, active state, validation rules
- Ecology: tube capacity, orientation, height
- Relations: connects to BeeHouseEvent

📘 Bee House Events
Time‑stamped ecological or maintenance events recorded for a bee house.

- Event types: emergence, cleaning, winterizing, parasite checks, installation, etc.
- Metadata: notes, created_by, timestamps
- Indexes: optimized for chronological and type‑based queries

💬 Garden Chat
A lightweight chat system for each garden with basic moderation.

- Moderation: banned‑word validation
- Ordering: chronological
- Relations: garden, user

✉️ Direct Messaging
A simple private messaging system built around threads and participants.

- Threads: represent conversations
- Participants: users in a thread
- Messages: ordered, indexed, sender‑attributed

📌 Pinned Gardens
Allows users to follow gardens they care about.

- One pin per user per garden
- Used for: profile display, notification preferences
- Relations: user ↔ garden

🔐 Private Garden Access
Controls visibility for private gardens and supports delegated management.

- Roles:
- Viewer — can see the garden
- Manager — can grant access to others
- Ownership: owner is defined on the Garden model
- Relations: user ↔ garden

🖼️ Garden Images
Supports photo albums and banner images for each garden.

- Uploads: authenticated users
- Visibility: inherits garden visibility rules
- Banner support: is_banner flag
- Metadata: caption, uploaded_by, timestamps

💳 User Subscription
Represents a user’s subscription tier and enables future paid features.

- Tiers: free, premium, pro
- Used for: upload limits, feature gating, future billing integration
- One‑to‑one with User

## 🚀 Getting Started (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/masonbee.git
cd masonbee

source beevenv/Scripts/activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver
```

## 🚀 Development Log

📅 February 26, 2026 — Data Model Validation & First Real BeeHouse Entries
Today the core data architecture for the mason bee application proved itself in practice. After finalizing the Garden and BeeHouse models, I registered both in Django Admin and successfully added two real private gardens (front yard and back yard) along with their corresponding BeeHouses. All lifecycle logic, unique constraints, and privacy rules behaved exactly as designed.
Key outcomes:

- Confirmed that private gardens remain hidden from public visibility while still supporting BeeHouse entries and ecological tracking.
- Verified that BeeHouse creation works end‑to‑end, including unique garden‑scoped IDs, coordinate handling, and lifecycle validation.
- Added helper text to clarify the meaning of uninstall_date and prevent accidental decommissioning.
- Validated that the admin interface is intuitive and minimalistic, supporting clean data entry without unnecessary friction.
- Established a clear separation between private ecological nodes and future public-facing gardens (e.g., a street-facing BeeHouse for community access).
  This completes the foundational data layer for the MVP. The next step—scheduled for tomorrow—is designing the BeeHouseNotes model to capture lifecycle events (cleaning, emergence, parasite checks, installation, etc.). Once that is in place, I can begin building the map interface and minimal GUI for user signup, login, and garden/BeeHouse submission.

📅 February 27, 2026 — Backend Messaging Layer, Garden Chat, and Data Architecture Refinements

- Added GardenChatMessage model and registered it in Django Admin, enabling garden‑level chat feeds tied to user accounts and garden visibility rules.
- Implemented the Direct Messaging system (threads, participants, messages) and completed migrations to create the underlying tables in PostgreSQL.
- Validated relational integrity across messaging models and confirmed admin visibility for moderation and testing.
- Finalized architectural decisions for garden‑level chat vs. beehouse‑level chat, ensuring a clean, intuitive communication model aligned with privacy and user experience goals.
- Established the plan for notification opt‑in, private messaging behavior, and profile‑page responsibilities (notifications, private gardens, settings).
- Confirmed that Django’s built‑in User model is sufficient for the platform, avoiding unnecessary customization and keeping authentication stable.
- Outlined the final backend tasks for tomorrow: BeeHouseNotes, notification preferences, and private garden access model, after which frontend development can begin.

🗓️ February 28, 2026 — Model Architecture Finalization + Image & Subscription System
Today I completed a major pass on the backend data architecture, bringing the models to a stable, production‑ready state. This included adding support for garden photo albums, banner images, and a future‑proof subscription system. I also reviewed and validated all relational models together as a cohesive system.
Key accomplishments

- Added GardenImage model to support per‑garden photo albums, banner images, and authenticated uploads.
- Added UserSubscription model with tier support (free, premium, pro) to enable future upload limits and paid features.
- Finalized PrivateGardenAccess with role‑based permissions (viewer, manager) to support delegated access control.
- Validated all models together (~350 lines) for relational consistency, naming clarity, and privacy‑first behavior.
- Confirmed that public gardens are globally visible while private gardens enforce strict access rules.
- Ensured that the data layer now fully supports:
- pinned gardens
- per‑garden notifications
- private access lists
- delegated managers
- chat moderation
- beehouse lifecycle events
- image uploads
- subscription‑based limits

🗓️ march 3rd, 2026

🧩 What’s New

✔️ BeeHouseEvent API (Create, List, Filter)

A new BeeHouseEventViewSet now supports:

- Creating lifecycle and maintenance events
- Listing events globally or filtered by beehouse
- Enforcing garden‑level visibility rules
- Returning events in newest‑first order

✔️ Controlled Vocabulary for Event Types

event_type now uses a strict, model‑backed vocabulary:
emergence, activated, deactivated, tubes_added, cleaned,
parasite_check, tubes_replaced, winterized, maintenance,
installed, uninstalled, destroyed, other

Invalid values are rejected with clear API errors.

✔️ Nested Endpoint: /api/beehouses/<id>/events/

A new nested route allows the frontend to fetch events directly from a beehouse detail page without query parameters.

✔️ Automatic Ordering

All event lists are returned in descending chronological order (-created_at), giving users a natural timeline view.

📘 API Schema (Current Endpoints)

Below is a full overview of the current API surface, including URLs, methods, and behavior.

🌱 Garden Endpoints
GET /api/gardens/
Returns all public gardens and private gardens the user owns or has access to.
POST /api/gardens/
Creates a new garden.
Private by default unless is_public=true.
GET /api/gardens/<id>/
Returns a single garden if visible to the user.
PATCH /api/gardens/<id>/
Updates garden metadata (owner or managers only).
DELETE /api/gardens/<id>/
Deletes a garden (owner only).

🔒 Garden Access Management
GET /api/gardens/<id>/access_list/
Returns users who have access to a private garden.
POST /api/gardens/<id>/grant_access/
Grants access to another user.
POST /api/gardens/<id>/revoke_access/
Revokes access from a user.

📌 Pinned Gardens
POST /api/gardens/<id>/pin/
Pins a garden for the current user.
DELETE /api/gardens/<id>/unpin/
Unpins a garden.
GET /api/pinned/
Returns all gardens pinned by the user.

🖼️ Garden Images
GET /api/gardens/<id>/images/
Returns all images for a garden.
POST /api/gardens/<id>/upload_image/
Uploads a new image to the garden.
DELETE /api/garden-images/<id>/
Deletes an image (owner/managers only).

🏠 BeeHouse Endpoints
GET /api/beehouses/
Returns all visible bee houses.
POST /api/beehouses/
Creates a new bee house.
If no beehouse_id is provided, the system auto‑generates:
House 1, House 2, House 3, ...

GET /api/beehouses/<id>/
Returns a single bee house.
PATCH /api/beehouses/<id>/
Updates a bee house.
DELETE /api/beehouses/<id>/
Deletes a bee house.

🧾 Nested: BeeHouse Events
GET /api/beehouses/<id>/events/
Returns all events for a specific bee house, ordered newest‑first.
Example response:
[
{
"id": 3,
"event_type": "cleaned",
"notes": "Cleaned tubes and removed debris.",
"created_at": "2026-03-03T19:25:11.270118Z",
"beehouse": 4,
"created_by": 1
}
]

🐝 BeeHouse Event Endpoints
GET /api/beehouse-events/
Returns all visible events across all gardens.
GET /api/beehouse-events/?beehouse=<id>
Filters events by beehouse.
POST /api/beehouse-events/
Creates a new event.
Example payload:
{
"beehouse": 4,
"event_type": "cleaned",
"notes": "Cleaned tubes and removed debris."
}

Validation
Invalid event types return:
{
"event_type": ["\"clear\" is not a valid choice."]
}

🔐 Authentication Endpoints
POST /api/login/
Authenticates a user and sets session + CSRF cookies.
POST /api/logout/
Logs out the current user.
GET /api/me/
Returns the authenticated user’s profile.

🗓️ April 5th, 2026

# 🐝 MasonBee API — Backend Documentation

The MasonBee backend is a Django REST Framework (DRF) API that powers a community-driven mason bee habitat tracking platform. Users can create gardens, manage bee houses, upload ecological data, and maintain public or private profiles.

This document summarizes the current API endpoints and recent development progress.

---

## 🚀 Recent Work (March–April 2026)

### ✔ Core API Completed

- Implemented **User Profiles** with GET/PUT and avatar upload.
- Added **automatic profile creation** on user registration.
- Completed **Garden** and **Bee House** CRUD endpoints.
- Added **Bee House Event** logging and retrieval.
- Implemented **public/private garden access control**.
- Added **image upload** support for gardens and avatars.
- Integrated **JWT authentication** (login, refresh, logout).
- Cleaned and validated URL routing for all API modules.
- Verified all endpoints via Postman with working auth.

### ✔ Infrastructure & Architecture

- Modularized API into `beegarden/api/` with serializers, views, and routers.
- Added `app_name = "api"` and namespaced URL includes.
- Fixed URL resolution issues caused by newline-encoded requests.
- Updated project structure for clarity and maintainability.

### ⏳ Deferred (Not Required for MVP)

- Friends system
- Direct messaging
- Thread participants
- Notifications

These features are fully modeled but intentionally postponed until after the frontend MVP is complete.

---

## 🔐 Authentication Endpoints

| Method | Endpoint              | Description                             |
| ------ | --------------------- | --------------------------------------- |
| POST   | `/api/register/`      | Create a new user + auto-create profile |
| POST   | `/api/token/`         | Obtain JWT access + refresh tokens      |
| POST   | `/api/token/refresh/` | Refresh access token                    |
| POST   | `/api/token/logout/`  | Blacklist refresh token                 |
| GET    | `/api/me/`            | Return authenticated user info          |

---

## 👤 User Profile Endpoints

| Method | Endpoint               | Description                               |
| ------ | ---------------------- | ----------------------------------------- |
| GET    | `/api/profile/`        | Retrieve authenticated user's profile     |
| PUT    | `/api/profile/`        | Update profile fields (partial allowed)   |
| POST   | `/api/profile/avatar/` | Upload avatar image (multipart/form-data) |

**Profile fields:**

- `display_name`
- `bio`
- `avatar`
- `location_enabled`
- `latitude`
- `longitude`
- `friend_request_notifications`

---

## 🌱 Garden Endpoints

These endpoints are generated via DRF routers.

| Method    | Endpoint             | Description             |
| --------- | -------------------- | ----------------------- |
| GET       | `/api/gardens/`      | List all public gardens |
| POST      | `/api/gardens/`      | Create a new garden     |
| GET       | `/api/gardens/<id>/` | Retrieve garden details |
| PUT/PATCH | `/api/gardens/<id>/` | Update garden           |
| DELETE    | `/api/gardens/<id>/` | Delete garden           |

### Garden Access Control

| Method | Endpoint                           | Description            |
| ------ | ---------------------------------- | ---------------------- |
| GET    | `/api/gardens/<id>/access_list/`   | List users with access |
| POST   | `/api/gardens/<id>/grant_access/`  | Grant private access   |
| POST   | `/api/gardens/<id>/revoke_access/` | Revoke access          |

### Garden Images

| Method | Endpoint                          | Description         |
| ------ | --------------------------------- | ------------------- |
| POST   | `/api/gardens/<id>/upload_image/` | Upload garden image |
| GET    | `/api/gardens/<id>/images/`       | List garden images  |

### Pinned Gardens

| Method | Endpoint                   | Description    |
| ------ | -------------------------- | -------------- |
| POST   | `/api/gardens/<id>/pin/`   | Pin a garden   |
| POST   | `/api/gardens/<id>/unpin/` | Unpin a garden |

---

## 🏚 Bee House Endpoints

| Method    | Endpoint               | Description                |
| --------- | ---------------------- | -------------------------- |
| GET       | `/api/beehouses/`      | List all bee houses        |
| POST      | `/api/beehouses/`      | Create a bee house         |
| GET       | `/api/beehouses/<id>/` | Retrieve bee house details |
| PUT/PATCH | `/api/beehouses/<id>/` | Update bee house           |
| DELETE    | `/api/beehouses/<id>/` | Delete bee house           |

### Bee House Events

| Method    | Endpoint                      | Description                 |
| --------- | ----------------------------- | --------------------------- |
| GET       | `/api/beehouses/<id>/events/` | List events for a bee house |
| POST      | `/api/beehouses/<id>/events/` | Create a new event          |
| GET       | `/api/beehouse-events/<id>/`  | Retrieve event details      |
| PUT/PATCH | `/api/beehouse-events/<id>/`  | Update event                |
| DELETE    | `/api/beehouse-events/<id>/`  | Delete event                |

---

## 📦 Project Structure (Backend)

📘 Update — Backend & Frontend Progress (April 2026)
🏗️ Backend Updates

1. Added default_garden endpoint
   Introduced a dedicated endpoint to retrieve the user’s default garden:

Code
GET /api/gardens/default/
Purpose:  
Provide a single source of truth for the user’s “active” or “primary” garden, used across the Dashboard, Navbar, and My Garden page.

Behavior:

Returns the serialized garden object if a default exists

Returns null with 200 OK if the user has no default garden

Eliminates noisy 404 responses in the frontend

Supports future features like “Set as Default Garden” and “Pinned Gardens”

Backend changes included:

Added is_default field to UserPinnedGarden model

Created/updated migrations

Implemented default_garden view with safe fallback behavior

Updated API routing under beegarden/api/urls.py

2. Improved API consistency
   We standardized the behavior of preference‑style endpoints:

Default garden returns 200 with null instead of 404

Watched gardens endpoint returns predictable structures

All garden‑related endpoints now align with REST expectations

This ensures the frontend can rely on stable, predictable responses without special‑case error handling.

3. Database schema alignment
   We resolved a schema mismatch where the is_default column was missing in the database.
   This required:

Regenerating migrations

Applying them cleanly

Verifying model integrity

This step stabilized the entire garden preference system.

🎨 Frontend Updates

1. Centralized default garden loading in AuthProvider
   The app now loads the user’s default garden once on startup:

Keeps Navbar state consistent

Allows Dashboard to show/hide My Garden card

Allows MyGardenPage to render correctly

Prevents redundant API calls across pages

This is the foundation for future global user‑state features.

2. Cleaned up API client and error handling
   We reverted from Axios to a stable fetch‑based client and improved it:

Silenced harmless 404/401 logs

Added safe null‑return behavior

Preserved token refresh logic

Prevented console noise from network‑level errors

The result is a quieter, more predictable dev environment.

3. Routing structure stabilized
   The app now uses a clear, maintainable route layout:

Code
/login
/dashboard
/my-garden
/journal
/garden/:id/journal
All protected routes are wrapped in ProtectedRoute, and the layout is handled by MainLayout.

4. My Garden Page groundwork
   We prepared the My Garden page to support:

Default garden display

Empty‑state onboarding

Future pinned gardens

Future garden switching

Future journal integration

This page will become the user’s “home base” for garden activity.

🌱 What’s Next (Roadmap)

1. Garden Finder Page
   Search gardens

Sort by distance

Infinite scroll

Garden cards

Pin/Unpin

Set Default Garden

Map integration (P‑Patch + user gardens)

2. Pinned Gardens System
   Multiple pinned gardens

One default garden

Quick switching

Dashboard integration

3. Journal Enhancements
   Garden‑specific journals

Bee house event linking

Timeline view

4. UI/UX Polish
   Global toast notifications

Smooth transitions

Consistent card components

Mobile‑first layout improvements
