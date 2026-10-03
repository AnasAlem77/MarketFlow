<div align="center">

# ⚡ MarketFlow

### Premium Product Discovery Platform for Shopee

A modern, curated product discovery platform built to showcase selected Shopee products through a fast, visual, and bilingual shopping experience.

**English · Bahasa Indonesia**

</div>

---

## 🌟 Overview

**MarketFlow** is a curated product discovery platform designed to help users discover selected and recommended products from Shopee.

Instead of trying to replicate a full e-commerce marketplace, MarketFlow focuses on presenting a carefully selected collection of products through a clean, modern, and mobile-first interface.

The platform combines a premium dark-themed UI, bilingual support, product categories, search and discovery features, social sharing, analytics, and an administrative dashboard for managing the product catalog.

---

## ✨ Key Features

### 🛍️ Product Discovery

- Curated Shopee product catalog
- Featured products
- Product categories
- Product search
- Product detail pages
- IDR currency formatting
- Direct Shopee product links

### 🌐 Bilingual Experience

- English
- Bahasa Indonesia
- Dynamic language switching
- Localized interface text

### 📱 Responsive Design

- Mobile-first interface
- Responsive layouts
- Optimized browsing across desktop and mobile devices
- Modern dark-themed visual design

### 📤 Social Sharing

Products can be shared through:

- WhatsApp
- Telegram
- Facebook
- X / Twitter

### 📊 Analytics

The platform includes backend support for tracking:

- Product views
- Product clicks
- User activity
- Engagement metrics

### 🔐 Admin Dashboard

The admin area provides management tools for:

- Products
- Categories
- Featured products
- Product activation status
- Product images
- Product ordering
- Basic statistics

### 🖼️ Image Storage

Product images are stored using **Cloudflare R2** with a server-side image proxy for reliable delivery.

---

## 🏗️ Architecture

MarketFlow uses a lightweight architecture built around vanilla web technologies and serverless APIs.

```text
┌─────────────────────────────┐
│        MarketFlow UI        │
│     HTML / CSS / JavaScript │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│    Vercel Serverless API    │
│       Node.js / JavaScript  │
└──────────────┬──────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
┌─────────────┐ ┌─────────────┐
│    Neon     │ │ Cloudflare  │
│ PostgreSQL  │ │     R2      │
│   Database  │ │    Images   │
└─────────────┘ └─────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Responsive / mobile-first design

### Backend

- Node.js
- Vercel Serverless Functions
- JavaScript API endpoints

### Database

- PostgreSQL
- Neon

### Image Storage

- Cloudflare R2
- S3-compatible API
- Presigned uploads
- Server-side image proxy

### Deployment

- GitHub
- Vercel

---

## 📁 Project Structure

```text
MarketFlow/
│
├── admin/
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── products.html
│   ├── category.html
│   └── stats.html
│
├── api/
│   ├── categories.js
│   ├── products.js
│   ├── image.js
│   ├── upload-image.js
│   └── test-db.js
│
├── assets/
│   ├── css/
│   │   ├── main.css
│   │   └── admin.css
│   │
│   ├── js/
│   │   ├── main.js
│   │   ├── admin.js
│   │   └── language.js
│   │
│   ├── images/
│   │   ├── logo.svg
│   │   └── placeholder.svg
│   │
│   └── locales/
│       ├── en.json
│       └── id.json
│
├── index.html
├── search.html
├── category.html
├── product.html
├── about.html
├── contact.html
├── privacy.html
├── terms.html
│
├── database.sql
├── package.json
├── package-lock.json
├── README.md
└── .gitignore
```

---

## ⚙️ Local Development

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd MarketFlow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file:

```text
.env.local
```

Required variables include:

```env
DATABASE_URL=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

> Never commit `.env` or `.env.local` to GitHub.

### 4. Run the project locally

```bash
npx vercel dev
```

The application will be available through the local Vercel development server.

---

## 🗄️ Database

MarketFlow uses **Neon PostgreSQL** as its production database.

The `database.sql` file contains the database schema and initial database configuration used by the project.

The database includes structures for:

- Products
- Categories
- Admin users
- Analytics
- Activities
- Settings

---

## 🖼️ Image Management

Product images are uploaded to **Cloudflare R2**.

The application uses the following flow:

```text
Admin
  ↓
Upload API
  ↓
Presigned R2 Upload
  ↓
Cloudflare R2
  ↓
Image Proxy
  ↓
MarketFlow
```

This architecture keeps R2 credentials on the server and prevents sensitive storage credentials from being exposed to the browser.

---

## 🔐 Environment & Security

Sensitive configuration is managed through environment variables.

The repository intentionally excludes:

```text
.env
.env.local
.vercel/
node_modules/
.DS_Store
```

Never commit database credentials, R2 credentials, API keys, or other sensitive configuration to the repository.

---

## 🚀 Deployment

MarketFlow is designed to be deployed on **Vercel**.

The production architecture follows:

```text
GitHub
   ↓
Vercel
   ↓
Serverless API
   ↓
Neon PostgreSQL
   ↓
Cloudflare R2
```

Production environment variables must be configured in the Vercel project settings.

---

## 📌 Project Status

**Status: Production-ready**

The current version includes:

- Product catalog
- Categories
- Search
- Product detail pages
- Bilingual interface
- Admin product management
- Product image uploads
- PostgreSQL database
- Cloudflare R2 storage
- Serverless API
- Analytics foundation
- Responsive UI

---

## 📄 License

This project is currently maintained as a private/personal project.

---

<div align="center">

**⚡ MarketFlow**

Curated products. Better discovery.

</div>