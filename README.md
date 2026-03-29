# 💼 Reimbursement Management System

An advanced expense reimbursement platform designed to streamline financial workflows with multi-level approvals, intelligent validation, and automated receipt processing.

---

## 🚀 Features

* 🔐 **Authentication & Authorization**

  * Secure user login and registration
  * Role-based access (Employee, Manager, Admin)

* 📄 **Expense Management**

  * Submit, edit, and track expense claims
  * Attach receipts and supporting documents

* ✅ **Multi-Level Approval Workflow**

  * Configurable approval hierarchy
  * Conditional approval rules based on amount or category

* 🧠 **OCR-Based Receipt Processing**

  * Automatically extract data from uploaded receipts
  * Reduce manual data entry errors

* 💱 **Multi-Currency Support**

  * Submit expenses in different currencies
  * Automatic conversion handling

* 📊 **Dashboard & Reporting**

  * Expense summaries and analytics
  * Status tracking (Pending, Approved, Rejected)

---

## 🏗️ Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* (Add your DB here: MongoDB / PostgreSQL / etc.)

---

## 📂 Project Structure

```
Reimbursement-Management/
│
├── frontend/        # React + Vite app
├── backend/         # Express API server
├── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Reimbursement-Management.git
cd Reimbursement-Management
```

---

### 2. Setup Backend

```bash
cd backend
npm install
npm run dev
```

Server runs on:

```
http://localhost:8080
```

---

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## 🔗 API Integration

The frontend uses a proxy to communicate with the backend:

```ts
/api → http://localhost:8080
```

Example API:

```
POST /api/v1/auth/signup
```

---

## 🧪 Environment Variables

Create a `.env` file in both frontend and backend if required.

Example:

```env
PORT=8080
GEMINI_API_KEY=your_api_key_here
```

---

## 🛠️ Common Issues

### ❌ ECONNREFUSED / ECONNRESET

* Ensure backend is running on correct port (8080)
* Check Vite proxy configuration
* Verify API routes match backend

### ❌ Port Already in Use

```bash
taskkill /IM node.exe /F
```

---

## 📌 Future Improvements

* Email notifications for approvals
* Mobile responsive enhancements
* Advanced analytics dashboard
* Role-based dashboards



---
