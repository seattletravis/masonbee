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

| Layer | Tools |
|-------|-------|
| Backend | Django 5, Python 3.13 |
| Database | PostgreSQL (local dev via pgAdmin) |
| Environment | `beevenv` virtual environment |
| Data | Seattle community garden datasets (ETL pipeline in progress) |
| Deployment | Local development → server migration planned |
| Version Control | Git + GitHub |

---

## 📂 Project Structure

masonbee/ beevenv/                  # Virtual environment (ignored by Git) masonbee_project/         # Django project folder manage.py config/               # Django settings package settings.py urls.py wsgi.py asgi.py gardens/              # App for gardens + bee houses (coming soon)

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


