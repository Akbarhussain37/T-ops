# 🔐 Talent Ops - User Credentials

## Setup Order
1. Executive (Creates projects, adds team members)
2. Managers (Manage projects, assign tasks)
3. Team Leads (Lead teams, assign tasks)
4. Consultants/Employees (Work on tasks)

---

## 👔 Executive
| Field | Value |
|-------|-------|
| Email | `Aditya@gmail.com` |
| Password | `Aditya@123` |
| Full Name | Aditya Kumar |
| Role | `executive` |

---

## 📊 Managers
| Name | Email | Password | Role |
|------|-------|----------|------|
| Pavan | `pavan@talentops.com` | `Pavan@123` | `manager` |
| Deekshith | `deekshith@talentops.com` | `Deekshith@123` | `manager` |

---

## 🎯 Team Leads
| Name | Email | Password | Role |
|------|-------|----------|------|
| Sudheer | `sudheer@talentops.com` | `Sudheer@123` | `team_lead` |
| Vyntage | `vyntage@talentops.com` | `Vyntage@123` | `team_lead` |

---

## 👨‍💻 Consultants/Employees
| Name | Email | Password | Role |
|------|-------|----------|------|
| Mohith | `mohith@talentops.com` | `Mohith@123` | `employee` |
| Moneesh | `moneesh@talentops.com` | `Moneesh@123` | `employee` |
| Vardhan | `vardhan@talentops.com` | `Vardhan@123` | `employee` |
| Akash | `akash@talentops.com` | `Akash@123` | `employee` |

---

## 📋 Setup Steps

### Step 1: Create Executive in Supabase
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create New User"
3. Enter: `executive@talentops.com` / `Executive@123`
4. Check "Auto Confirm"
5. After creation, go to Table Editor → `profiles`
6. Find the new user and set `role` = `executive`

### Step 2: Login as Executive
- URL: `http://localhost:3000/login`
- Create projects and add team members

---

## 🏢 Projects to Create
| Project Name | Description |
|--------------|-------------|
| TalentOps | Main product development |
| JanmaSetu | Client project |

---

*Generated: 2025-12-29*
