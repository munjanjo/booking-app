# 💇 Booker — Salon Booking App

A full-stack web application for booking salon appointments online (hair, beauty, barber…).
Clients browse salons, pick a service and a worker, and book a free time slot, while salon owners
manage services, workers, working hours and bookings through a calendar view.

![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)

---

## ✨ Features

### For clients
- Sign-up with **email verification**, login and **password reset**
- Salon pages with an image gallery, services and reviews
- Choose a service and a **specific worker or "any worker"**
- **Live available slots** that respect working hours, exceptions, salon closures and existing bookings
- View, cancel and reschedule your own bookings
- **Review** a salon after a completed appointment
- Automatic **email reminder 24 hours before** the appointment

### For salon owners
- Create a salon (subject to **admin approval**)
- Manage services (duration, price), workers and images (stored on **AWS S3**)
- Per-worker working hours, plus exceptions (vacation, sick leave) and salon closures
- **Calendar view of bookings with drag & drop** rescheduling
- Manual bookings (e.g. phone bookings) with client search
- Mark appointments as **no-show**
- **Analytics**: revenue and booking summary, plus per-service statistics

### System
- Stateless JWT authentication
- Scheduled jobs: reminders, and automatically marking past appointments as `COMPLETED`
- Transactional emails via the **Resend** API
- OpenAPI / **Swagger UI** documentation

---

## 🛠️ Tech stack

| Layer | Technologies |
|-------|--------------|
| **Backend** | Java 21, Spring Boot 4 (Web MVC, Data JPA, Security, Validation), JJWT, Lombok, springdoc-openapi |
| **Database** | MySQL 8 (Hibernate `ddl-auto: update`) |
| **Frontend** | React 19, Vite, React Router 7, Tailwind CSS 4, Axios, react-datepicker |
| **Integrations** | AWS S3 (images), Resend (email) |

---

## 📁 Project structure

```
booking-app/
├── src/main/java/org/example/bookingapp/
│   ├── config/        # S3 configuration
│   ├── controller/    # REST controllers
│   ├── dto/           # request/response objects
│   ├── entity/        # JPA entities
│   ├── exception/     # global exception handler
│   ├── repository/    # Spring Data repositories
│   ├── security/      # JWT filter, SecurityConfig, Swagger
│   └── service/       # business logic, email, S3, schedulers
├── src/main/resources/application.yml
├── frontend/          # React + Vite client
│   └── src/
│       ├── api/       # Axios client
│       ├── components/
│       ├── hooks/
│       └── pages/
└── pom.xml
```

### Domain model

```
User ──< Salon ──< Service
           │  ├──< Worker ──< WorkingHours
           │  │         └──< WorkingHoursException
           │  ├──< SalonImage
           │  ├──< SalonClosure
           │  └──< Review
           └──< Appointment (User + Service + Worker, status: BOOKED | CANCELLED | COMPLETED | NO_SHOW)
```

---

## 🚀 Running locally

### Prerequisites
- Java 21+
- Node.js 20+
- MySQL 8 (the `booking_db` database is created automatically)
- (optional) an AWS S3 bucket and a Resend API key

### 1. Environment variables

Create a `.env` file in the project root:

```env
DB_USERNAME=root
DB_PASSWORD=your_password

JWT_SECRET=a-long-random-secret-at-least-32-chars
APP_BASE_URL=http://localhost:5173
ADMIN_SECRET=your-admin-key

RESEND_API_KEY=re_xxxxxxxx
MAIL_FROM_ADDRESS=noreply@yourdomain.com

AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
AWS_S3_BUCKET=booking-app-images
AWS_S3_REGION=eu-central-1
```

### 2. Backend

```bash
./mvnw spring-boot:run
```

The backend runs on `http://localhost:8080`, and Swagger UI is at `http://localhost:8080/swagger-ui.html`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`; the Vite proxy forwards `/api` requests to the backend.

---

## 🔌 API overview

| Resource | Base path |
|----------|-----------|
| Auth | `/api/auth`: register, login, verify-email, forgot/reset-password |
| Salons | `/api/salons` |
| Services | `/api/salons/{salonId}/services` |
| Workers | `/api/salons/{salonId}/workers` |
| Images | `/api/salons/{salonId}/images` |
| Closures | `/api/salons/{salonId}/closures` |
| Reviews | `/api/salons/{salonId}/reviews` |
| Working hours | `/api/workers/{workerId}/working-hours` |
| Working hours exceptions | `/api/workers/{workerId}/working-hours-exceptions` |
| Appointments | `/api/appointments`: available slots, my bookings, reschedule, no-show, analytics |
| Admin | `/api/admin/salons`: salon approval (`X-Admin-Secret` header) |

Full request/response schemas are available in Swagger UI.

---

## 👤 Author

**Ivo Munitić** · [@munjanjo](https://github.com/munjanjo)
