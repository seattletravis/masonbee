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

## 🚀 Getting Started (Local Development)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/masonbee.git
cd masonbee

source beevenv/Scripts/activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver


📅 February 26, 2026 — Data Model Validation & First Real BeeHouse Entries
Today the core data architecture for the mason bee application proved itself in practice. After finalizing the Garden and BeeHouse models, I registered both in Django Admin and successfully added two real private gardens (front yard and back yard) along with their corresponding BeeHouses. All lifecycle logic, unique constraints, and privacy rules behaved exactly as designed.
Key outcomes:
- Confirmed that private gardens remain hidden from public visibility while still supporting BeeHouse entries and ecological tracking.
- Verified that BeeHouse creation works end‑to‑end, including unique garden‑scoped IDs, coordinate handling, and lifecycle validation.
- Added helper text to clarify the meaning of uninstall_date and prevent accidental decommissioning.
- Validated that the admin interface is intuitive and minimalistic, supporting clean data entry without unnecessary friction.
- Established a clear separation between private ecological nodes and future public-facing gardens (e.g., a street-facing BeeHouse for community access).
This completes the foundational data layer for the MVP. The next step—scheduled for tomorrow—is designing the BeeHouseNotes model to capture lifecycle events (cleaning, emergence, parasite checks, installation, etc.). Once that is in place, I can begin building the map interface and minimal GUI for user signup, login, and garden/BeeHouse submission.
