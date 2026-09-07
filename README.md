# UrbanPark — Smart Parking Management System

UrbanPark is an enterprise-grade full-stack MERN application engineered for real-time smart parking management across high-density metropolitan zones, designed for the Jaipur Municipal Area, Rajasthan.

The platform provides citizen-facing dynamic parking discovery, interactive bay selection, atomic hold timers, dynamic surge pricing, and QR-based gate check-in/check-out, alongside an executive administrative analytics dashboard with predictive demand forecasting.

---

## Architectural Principles

1. **Strict MVC Separation**: Complete decoupling of routing declarations (`server/routes/`), business controllers (`server/controllers/`), and Mongoose schemas (`server/models/`).
2. **Modular Code Standard**: All source files adhere strictly to a 200–400 lines of code boundary, extracting complex logic into cohesive subcomponents.
3. **Executive White Theme**: High-contrast, accessibility-focused enterprise palette (`#ffffff` canvas, `#f8fafc` backdrop, `#e2e8f0` borders, `#2563eb` royal blue accents).
4. **Clean SVG Iconography**: All raw unicode emojis are replaced with scalable, accessible vector icons (`Icons.js`).
5. **Zero-Cost Local Architecture**: Seamless offline in-memory fallback for Redis, zero-cost mock OTP verification, and free-of-cost demo payment processing.

---

## Core Capabilities

### Citizen Experience
* **OTP Authentication**: Passwordless phone number authentication with localized cooldown timers and rate limiting.
* **Interactive Facility Explorer**: Live availability status streamed directly from IoT sensor feeds with Carto Positron light map integration.
* **Granular Slot Matrix**: Multi-level floor navigation with real-time bay status indicators (Available, Occupied, Reserved, EV Charger, Accessible).
* **Atomic Hold Timer**: 10-minute temporary bay lock during checkout to eliminate double-booking race conditions.
* **Dynamic Surge Pricing**: Real-time algorithmic rate multipliers (1.5x during peak surges, 0.8x off-peak, and occupancy-based multipliers).
* **Digital QR Gate Pass**: Auto-generated scannable voucher and printable receipt for facility entry and exit.

### Administrator Operations
* **Predictive Demand Telemetry**: Dual-mode interactive visualization (Bar Chart and Smooth Area Trend) with real-time timeframe filters (24H, Peak Windows, Morning, Evening).
* **Operational KPIs**: Live municipal occupancy rates, active sessions, and revenue metrics.
* **Global Booking Ledger**: Platform-wide transaction history with real-time status filtering and search.
* **Gate Scanner API**: Unified verification endpoint (`POST /api/bookings/scan-qr`) for physical barrier check-in and check-out.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | React 18, React Router v6, React-Toastify |
| **Design System** | Vanilla CSS Tokens, Executive White Theme, Responsive Breakpoints |
| **Mapping Engine** | Leaflet.js, React-Leaflet, Carto Positron Tiles |
| **Data Visualization** | Chart.js 4, React-Chartjs-2 |
| **Backend Runtime** | Node.js, Express.js |
| **Architecture** | Model-View-Controller (MVC) |
| **Database** | MongoDB, Mongoose ODM |
| **Real-time Engine** | Socket.io (Bi-directional WebSocket streaming) |
| **Caching Layer** | Redis Client with transparent in-memory TTL fallback |
| **Voucher Engine** | Node QRCode generator |

---

## Directory Structure

```
Urban-park/
├── client/                                 # React Frontend (Port 3001)
│   ├── src/
│   │   ├── components/
│   │   │   ├── DemandChart.js              # Predictive demand telemetry chart
│   │   │   ├── Icons.js                    # Enterprise SVG icon system
│   │   │   ├── Navbar.js                   # Responsive navigation & mobile drawer
│   │   │   ├── ParkingMap.js               # Modular Carto light map
│   │   │   └── SlotGridMatrix.js           # Multi-level bay selector matrix
│   │   ├── pages/
│   │   │   ├── AdminBookings.js            # Platform reservations ledger
│   │   │   ├── AdminDashboard.js           # Administrative KPI telemetry
│   │   │   ├── BookingPage.js              # Reservation checkout & hold timer
│   │   │   ├── BookingSuccess.js           # Digital QR voucher & receipt
│   │   │   ├── Dashboard.js                # Facility explorer & map view
│   │   │   ├── Landing.js                  # City gateway landing page
│   │   │   ├── Login.js                    # Phone OTP authentication
│   │   │   ├── LotView.js                  # Real-time bay status page
│   │   │   └── MyBookings.js               # Citizen reservation history
│   │   ├── context/
│   │   │   └── AuthContext.js              # Session & role state management
│   │   ├── utils/
│   │   │   ├── api.js                      # Central Axios client
│   │   │   └── pricing.js                  # Surge formulas & telemetry mocks
│   │   ├── index.css                       # Core white theme tokens
│   │   └── responsive.css                  # Adaptive breakpoints & touch targets
│   └── package.json
│
├── server/                                 # Express Backend (Port 5000)
│   ├── config/
│   │   ├── db.js                           # MongoDB connection handler
│   │   └── redis.js                        # Redis store with in-memory proxy fallback
│   ├── controllers/
│   │   ├── adminController.js              # Administrative statistics & audit
│   │   ├── authController.js               # OTP generation, rate limit & JWT
│   │   ├── bookingController.js            # Atomic reservations, QR & gate scans
│   │   └── parkingController.js            # Facilities, bay management & status
│   ├── models/
│   │   ├── Booking.js                      # Reservation schema & indexes
│   │   ├── OTP.js                          # Temporary verification hashes
│   │   ├── ParkingLot.js                   # Parking facilities & coordinates
│   │   ├── ParkingSlot.js                  # Individual bay state & hold locks
│   │   ├── Payment.js                      # Transaction records & demo gateway
│   │   └── User.js                         # Citizen & administrator profiles
│   ├── routes/
│   │   ├── admin.js                        # Admin endpoints
│   │   ├── auth.js                         # Authentication endpoints
│   │   ├── bookings.js                     # Booking & gate scanner routes
│   │   └── parking.js                      # Facility & slot routes
│   ├── middleware/
│   │   └── auth.js                         # JWT verification & role authorization
│   ├── socket/
│   │   └── handler.js                      # IoT sensor simulator & WebSocket feeds
│   ├── seed.js                             # Database seeder (Jaipur facilities)
│   └── server.js                           # Entry point & CORS configuration
│
└── package.json                            # Unified project scripts
```

---

## Quick Start Guide

### Prerequisites
* Node.js v18.x or higher
* MongoDB running locally (`mongodb://127.0.0.1:27017/smart-parking`) or MongoDB Atlas URI

### 1. Installation
Clone the repository and install dependencies for both client and server:
```bash
# Install root orchestration packages
npm install

# Install dependencies for both client and server
npm run install-all
```

### 2. Environment Configuration
Verify or create `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/smart-parking
JWT_SECRET=urban_park_jwt_enterprise_secret_jaipur_2026
REDIS_URL=redis://127.0.0.1:6379
```

Verify or create `client/.env`:
```env
PORT=3001
BROWSER=none
```

### 3. Database Initialization
Seed the database with default facilities, bays, and administrator accounts:
```bash
npm run seed
```
This populates:
* 3 Jaipur metropolitan parking facilities (Pink City Hub, Amer Bazaar Park, Vaishali Nagar Complex)
* 60 individual bays categorized by type (Regular, EV Charging, Compact, Accessible)
* Default municipal administrator profile

### 4. Running the Application
Launch both backend and frontend concurrently:
```bash
npm run dev
```
* **Frontend Portal:** [http://localhost:3001](http://localhost:3001)
* **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)

---

## Default Access Credentials

| Profile | Phone Number | Verification Code (Dev Mode) | Access Role |
| :--- | :--- | :--- | :--- |
| **Municipal Administrator** | `9999999999` | `111111` (or logged OTP) | Admin Dashboard, Telemetry, Ledger |
| **Citizen / Driver** | Any 10-digit number | Displayed on screen | Discovery, Reservation, Pass Voucher |

---

## REST API Specification

### Authentication
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | Public | Dispatches verification OTP (rate limited to 5/10m) |
| `POST` | `/api/auth/verify-otp` | Public | Validates OTP, creates user session, returns JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current user session and role |

### Parking Facilities & Bays
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/parking/lots` | Public | Retrieves all active facilities with live occupancy |
| `GET` | `/api/parking/lots/:id` | Public | Retrieves metadata for a single parking facility |
| `GET` | `/api/parking/lots/:id/slots` | Public | Retrieves all bays and real-time statuses |
| `POST` | `/api/parking/slots/:id/lock` | Authenticated | Acquires atomic 10-minute lock on a specific bay |
| `POST` | `/api/parking/slots/:id/unlock` | Authenticated | Releases an active bay lock |
| `PUT` | `/api/parking/slots/:id/status` | Admin Only | Administrative manual status override |

### Reservations & Gate Operations
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Authenticated | Creates confirmed reservation with atomic bay locking |
| `GET` | `/api/bookings/my` | Authenticated | Retrieves citizen reservation history |
| `GET` | `/api/bookings/:id` | Authenticated | Retrieves single booking voucher and QR code |
| `PUT` | `/api/bookings/:id/cancel` | Authenticated | Cancels booking and releases assigned parking bay |
| `POST` | `/api/bookings/scan-qr` | Authenticated | Gate barrier check-in / check-out scanner endpoint |

### Administration
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin Only | Aggregates revenue, occupancy rate, and telemetry |
| `GET` | `/api/admin/bookings` | Admin Only | Retrieves complete platform reservation ledger |
| `POST` | `/api/admin/lots` | Admin Only | Provisions new municipal parking facility |

---

## Concurrency & Security Model

1. **Race Condition Prevention**: Prevents double-booking by utilizing atomic MongoDB operations (`findOneAndUpdate`) with preconditions (`status: 'available'`).
2. **Conflict Detection**: Checks existing reservations for bay timeframe overlaps prior to finalizing bookings.
3. **Temporal Bounds Validation**: Rejects reservations set in the past or exceeding the maximum 72-hour booking threshold.
4. **Zero-Cost Fallbacks**: Redis connection failures automatically switch to an in-memory TTL cache without terminating server execution.
5. **Simulated IoT Safety**: The background sensor simulator in `socket/handler.js` explicitly ignores bays marked as `reserved` or `locked`, ensuring citizen checkout flows remain uninterrupted.

---

## Production Deployment Notes

To transition from local development mode to production:
1. **SMS Gateway**: Integrate Twilio, MSG91, or Fast2SMS inside `server/controllers/authController.js` to replace internal console logging.
2. **Payment Processing**: Configure live Razorpay, Stripe, or Cashfree credentials in `server/controllers/bookingController.js`.
3. **Persistent Cache**: Provide a managed Redis URI in `server/.env` to persist session rate-limiting across multi-instance clusters.
4. **Environment Mode**: Set `NODE_ENV=production` to disable development OTP bypasses.
