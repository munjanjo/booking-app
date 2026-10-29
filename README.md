# 💇 Booker — Salon Booking App

Full-stack web aplikacija za online rezervaciju termina u salonima (frizerski, kozmetički, barber…).
Klijenti pretražuju salone, biraju uslugu i radnika te rezerviraju slobodan termin, a vlasnici salona
upravljaju uslugama, radnicima, radnim vremenom i rezervacijama kroz kalendarski prikaz.

![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4-6DB33F?logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)

---

## ✨ Funkcionalnosti

### Za klijente
- Registracija s **verifikacijom e-maila**, prijava, **reset lozinke**
- Pregled salona s galerijom slika, uslugama i recenzijama
- Odabir usluge i **konkretnog radnika ili "bilo koji radnik"**
- Prikaz **slobodnih termina** u realnom vremenu (uzima u obzir radno vrijeme, iznimke, zatvaranja salona i postojeće rezervacije)
- Pregled, otkazivanje i premještanje vlastitih rezervacija
- **Recenzije** salona nakon završenog termina
- Automatski **e-mail podsjetnik 24h prije termina**

### Za vlasnike salona
- Kreiranje salona (uz **odobrenje administratora**)
- Upravljanje uslugama (trajanje, cijena), radnicima i slikama (pohrana na **AWS S3**)
- Radno vrijeme po radniku + iznimke (godišnji, bolovanje) i zatvaranja salona
- **Kalendarski prikaz rezervacija s drag & drop** premještanjem
- Ručni unos rezervacija (npr. telefonske) i pretraga klijenata
- Označavanje **no-show** termina
- **Analitika** — sažetak prihoda/rezervacija i statistika po uslugama

### Sustav
- JWT autentikacija (stateless)
- Scheduled jobovi: podsjetnici i automatsko označavanje prošlih termina kao `COMPLETED`
- Transakcijski e-mailovi preko **Resend** API-ja
- OpenAPI / **Swagger UI** dokumentacija

---

## 🛠️ Tech stack

| Sloj | Tehnologije |
|------|-------------|
| **Backend** | Java 21, Spring Boot 4 (Web MVC, Data JPA, Security, Validation), JJWT, Lombok, springdoc-openapi |
| **Baza** | MySQL 8 (Hibernate `ddl-auto: update`) |
| **Frontend** | React 19, Vite, React Router 7, Tailwind CSS 4, Axios, react-datepicker |
| **Integracije** | AWS S3 (slike), Resend (e-mail) |

---

## 📁 Struktura projekta

```
booking-app/
├── src/main/java/org/example/bookingapp/
│   ├── config/        # S3 konfiguracija
│   ├── controller/    # REST kontroleri
│   ├── dto/           # request/response objekti
│   ├── entity/        # JPA entiteti
│   ├── exception/     # globalni exception handler
│   ├── repository/    # Spring Data repozitoriji
│   ├── security/      # JWT filter, SecurityConfig, Swagger
│   └── service/       # poslovna logika, e-mail, S3, scheduleri
├── src/main/resources/application.yml
├── frontend/          # React + Vite klijent
│   └── src/
│       ├── api/       # Axios klijent
│       ├── components/
│       ├── hooks/
│       └── pages/
└── pom.xml
```

### Domenski model

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

## 🚀 Pokretanje lokalno

### Preduvjeti
- Java 21+
- Node.js 20+
- MySQL 8 (baza `booking_db` se kreira automatski)
- (opcionalno) AWS S3 bucket i Resend API ključ

### 1. Environment varijable

U rootu projekta napravi `.env` datoteku:

```env
DB_USERNAME=root
DB_PASSWORD=your_password

JWT_SECRET=neki-dugi-random-secret-min-32-znaka
APP_BASE_URL=http://localhost:5173
ADMIN_SECRET=tajni-admin-kljuc

RESEND_API_KEY=re_xxxxxxxx
MAIL_FROM_ADDRESS=noreply@tvojadomena.com

AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
AWS_S3_BUCKET=booking-app-images
AWS_S3_REGION=eu-central-1
```

### 2. Backend

```bash
./mvnw spring-boot:run
```

Backend radi na `http://localhost:8080`, a Swagger UI na `http://localhost:8080/swagger-ui.html`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend radi na `http://localhost:5173`; Vite proxy prosljeđuje `/api` zahtjeve na backend.

---

## 🔌 API pregled

| Resurs | Base path |
|--------|-----------|
| Autentikacija | `/api/auth` — register, login, verify-email, forgot/reset-password |
| Saloni | `/api/salons` |
| Usluge | `/api/salons/{salonId}/services` |
| Radnici | `/api/salons/{salonId}/workers` |
| Slike | `/api/salons/{salonId}/images` |
| Zatvaranja | `/api/salons/{salonId}/closures` |
| Recenzije | `/api/salons/{salonId}/reviews` |
| Radno vrijeme | `/api/workers/{workerId}/working-hours` |
| Iznimke radnog vremena | `/api/workers/{workerId}/working-hours-exceptions` |
| Rezervacije | `/api/appointments` — slobodni termini, moje rezervacije, reschedule, no-show, analitika |
| Admin | `/api/admin/salons` — odobravanje salona (header `X-Admin-Secret`) |

Kompletna dokumentacija s request/response shemama dostupna je u Swagger UI.

---

## 👤 Autor

**Ivo Munitić** — [@munjanjo](https://github.com/munjanjo)
