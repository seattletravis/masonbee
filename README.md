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