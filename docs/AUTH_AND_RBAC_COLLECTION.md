# AssetFlow — Phase 1 Auth & RBAC API Reference & Verification Collection

This document provides exact `cURL` commands and test specifications for testing authentication, role immutability, database exclusion constraints, and Role-Based Access Control (RBAC).

---

## 🔐 1. Authentication Endpoints

### **A. User Signup (Enforces Global Constraint 1: Employee Role Only)**
Even if an attacker sends `"role": "Admin"`, the server ignores it and assigns `"Employee"`.

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.employee@assetflow.com",
    "password": "Employee@123",
    "fullName": "New Employee User",
    "role": "Admin"
  }'
```
**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "...",
      "name": "New Employee User",
      "email": "new.employee@assetflow.com",
      "role": "Employee",
      "departmentId": null
    }
  }
}
```

---

### **B. User Login (Admin Account)**
Logs in with the seeded Admin account (`admin@assetflow.com` / `Admin@123`) and sets an `httpOnly` Refresh Cookie + returns a 15-minute Access JWT.

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@assetflow.com",
    "password": "Admin@123"
  }'
```
**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1Ni...",
    "user": {
      "id": "...",
      "email": "admin@assetflow.com",
      "role": "Admin",
      "name": "Alex Morgan (Admin)"
    }
  }
}
```

---

### **C. Get Current Authenticated Profile (`GET /api/auth/me`)**
Requires `Authorization: Bearer <TOKEN>`.

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

---

## 🛡️ 2. Role-Based Access Control (RBAC) Verification

### **A. Promote Employee Role (`PATCH /api/employees/:id/role`) — Admin Only**
Promoting an employee role is restricted strictly to users with the `Admin` role.

#### Test 1: Request as Employee (Should Fail with 403 Forbidden)
```bash
curl -X PATCH http://localhost:5000/api/employees/<EMPLOYEE_ID>/role \
  -H "Authorization: Bearer <EMPLOYEE_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role": "AssetManager"}'
```
**Expected Output (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_ROLE",
    "message": "Access forbidden. Requires one of roles: [Admin]"
  }
}
```

#### Test 2: Request as Admin (Should Succeed with 200 OK)
```bash
curl -X PATCH http://localhost:5000/api/employees/<EMPLOYEE_ID>/role \
  -H "Authorization: Bearer <ADMIN_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role": "AssetManager"}'
```
**Expected Output (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "<EMPLOYEE_ID>",
      "name": "Jordan Taylor (Employee)",
      "email": "employee@assetflow.com",
      "role": "AssetManager"
    }
  }
}
```

---

## ⚡ 3. Automated Database Constraint Verification Suite

You can run the full automated verification suite directly via npm:

```bash
npm run test:constraints
```

This runs:
1. **Signup Role Immutability Test** (`Global Constraint 1`)
2. **Postgres Partial Unique Index Test** (`Global Constraint 3`: `one_active_allocation_per_asset`)
3. **Postgres Exclusion Constraint Test** (`Global Constraint 4`: `btree_gist` overlap check on `bookings`)
