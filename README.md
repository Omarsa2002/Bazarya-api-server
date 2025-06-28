# Bazarya-api-server
# 🧠 Bazarya Backend

This is the **backend API** for a multi-vendor e-commerce platform that connects small businesses and customers in a digital marketplace.

Built with **Node.js**, **Express**, and **MongoDB**, this backend provides a complete REST API with authentication, vendor/shop management, product CRUD, and order handling.

---

## ⚙️ Tech Stack

- **Node.js + Express** – server and routing
- **MongoDB + Mongoose** – database and models
- **JWT** – authentication
- **Multer** – product image uploads
- **Redis** – caching
- **Stripe** (optional) – payment integration
- **Dotenv** – environment config
- **Cors + Morgan** – dev & security utilities

---

## 📁 Folder Structure
```bash
Bazarya-api-server-/
├── app
|  ├── auth/
|  ├── db/
|  |  ├── models/
|  ├──middleware/
|  ├── utils/
|  ├── uploads/ # Product images
|  ├── routes-index.js
│  ├── schema-index.js
│  └──
├── config/
├── .env
├── .env.example
├── index.js # Entry point
```
---

## 🚀 Features

### 🧑‍💼 Auth & Users
- Register/Login (Customer, Vendor, Admin)
- JWT-based authentication
- Role-based access control

### 🛍️ Vendors & Products
- Vendor shop creation
- Product CRUD (Create, Read, Update, Delete)
- Image upload via Multer
- Pagination and search
- Redis caching (for listing)

### 📦 Orders
- Place orders
- View order history
- Order status update (for vendors/admin)

### 🛠️ Admin Tools
- Approve or suspend vendors
- Manage users and categories

---

## 🔐 Environment Setup

Create a `.env` file based on `.env.example`:

```bash
PORT=
JWT_SECRET=your_jwt_secret

```
