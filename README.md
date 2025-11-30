# TapCall Simple v1.0

A simplified QR-based service request system for restaurants.

## Features
- Customer scans QR code to call waiter or request bill
- Staff dashboard to view and manage requests
- Real-time notifications using Socket.io
- PostgreSQL database

## Project Structure
tapcall-simple/
├── backend/ # Node.js/Express server
├── customer-web/ # Customer-facing web app
├── staff-dashboard/ # Staff management dashboard
└── README.md

## Setup Instructions

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb tapcall

# Run schema setup (see backend/setup.sql)