# Premium Locks BD

Full-stack e-commerce web app built with **Go** (backend) and **TypeScript + React** (frontend).  
Products are stored in an Excel file (`products.xlsx`) — no database required.

---

## Tech Stack

| Layer    | Technology                                |
|----------|-------------------------------------------|
| Backend  | Go 1.21, Gin, excelize, uuid              |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS  |
| Storage  | Excel (`.xlsx`) via `excelize`            |
| Images   | Stored in `backend/uploads/`, served statically |

---

## Project Structure

```
/
├── backend/
│   ├── main.go
│   ├── handlers/        # HTTP layer
│   ├── models/          # Product struct
│   ├── services/        # Business logic
│   ├── storage/         # Excel read/write
│   ├── uploads/         # Uploaded product images
│   └── data/            # products.xlsx (auto-created)
└── frontend/
    └── src/
        ├── api/         # Axios API wrapper
        ├── components/  # Navbar, ProductCard, LoadingSpinner
        ├── pages/       # Home, Admin, ProductDetail
        └── types/       # TypeScript interfaces
```

---

## Getting Started

### Prerequisites

- Go 1.21+
- Node.js 18+

---

### Backend

```bash
cd backend
go mod tidy
go run main.go
```

Server runs on **http://localhost:8080**

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on **http://localhost:5173**

---

## API Endpoints

| Method | Route                  | Description               |
|--------|------------------------|---------------------------|
| GET    | /api/products          | List all products         |
| GET    | /api/products/:id      | Get single product        |
| POST   | /api/products          | Create product (multipart)|
| PUT    | /api/products/:id      | Update product (multipart)|
| DELETE | /api/products/:id      | Delete product            |
| GET    | /uploads/:filename     | Serve product image       |
| GET    | /health                | Health check              |

All create/update requests use `multipart/form-data` (supports image upload).

---

## Pages

| Route          | Description                                      |
|----------------|--------------------------------------------------|
| `/`            | Storefront — product grid with search + filter   |
| `/admin`       | Admin panel — CRUD table with modal forms        |
| `/product/:id` | Product detail — full info + add to cart UI      |
