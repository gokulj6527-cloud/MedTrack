# MedTrack Database Architecture & SQL Documentation

This directory contains the MySQL 8.0+ relational database definitions, constraints, indexes, seed data, and report queries for **MedTrack (Smart Pharmaceutical Supply Chain & Pharmacy Management System)**.

---

## File Index

| File | Description |
| :--- | :--- |
| [`schema.sql`](file:///c:/Users/gokul/OneDrive/Desktop/Medtrack/database/schema.sql) | Complete 3NF normalized DDL script creating all 22 relational tables with PK/FK definitions. |
| [`constraints.sql`](file:///c:/Users/gokul/OneDrive/Desktop/Medtrack/database/constraints.sql) | Business rule `CHECK` constraints, unique pairs, and domain integrity rules. |
| [`indexes.sql`](file:///c:/Users/gokul/OneDrive/Desktop/Medtrack/database/indexes.sql) | Performance optimization B-tree indexes for searching, filtering, and JOIN performance. |
| [`seed.sql`](file:///c:/Users/gokul/OneDrive/Desktop/Medtrack/database/seed.sql) | Pre-populated academic demo data including 20 users across Admin, 3 MFRs, 6 Dist, 10 Pharmacies, medicines, batches, inventory, orders, shipments, temperature logs, drug interactions, recalls, and audit logs. |
| [`reports.sql`](file:///c:/Users/gokul/OneDrive/Desktop/Medtrack/database/reports.sql) | Complex SQL query suite utilizing `INNER JOIN`, `LEFT JOIN`, `GROUP BY`, `SUM()`, `COUNT()`, `DATEDIFF()`, and `HAVING`. |

---

## Core Entities & Relational Map

1. `roles` & `users`: User authentication, role assignment (`ADMIN`, `MANUFACTURER`, `DISTRIBUTOR`, `PHARMACIST`), password hashing (bcrypt), account status (`APPROVED`, `PENDING`, `BANNED`, `REJECTED`).
2. `manufacturers`, `distributors`, `pharmacies`: Organization profile master data linked 1-to-1 with `users`.
3. `medicines` & `medicine_compositions`: Drug master catalog and active pharmaceutical ingredients.
4. `batches`: Production batches linked to manufacturer and medicine with `manufacturing_date`, `expiry_date`, `quantity_produced`, `remaining_quantity`, and `batch_status` (`ACTIVE`, `EXPIRED`, `RECALLED`).
5. `inventory`: Multi-tier warehouse & pharmacy stock tracking by `batch_id`, `owner_type`, and `owner_id`.
6. `orders` & `order_items`: B2B procurement between Pharmacies and Distributors.
7. `shipments`, `shipment_items`, `temperature_readings`: Cold-chain & supply chain tracking with IoT sensor temperature logs.
8. `prescriptions`, `prescription_items`, `dispensations`, `dispensing_items`: Patient dispensing workflow with atomic stock deduction and drug interaction validation.
9. `drug_interactions`: Matrix of pairs of drugs with severity (`CONTRAINDICATED`, `HIGH`, `MODERATE`, `LOW`).
10. `recalls`, `alerts`, `audit_logs`: Governance, recall tracking, threshold alerts, and compliance activity logging.

---

## Execution Instructions

To execute in MySQL CLI or MySQL Workbench:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/constraints.sql
mysql -u root -p < database/indexes.sql
mysql -u root -p < database/seed.sql
```
