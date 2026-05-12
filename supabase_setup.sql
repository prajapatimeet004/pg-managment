-- SQL Schema for Supabase / PostgreSQL (Full Initialization)
-- Run this in your Supabase SQL Editor to initialize the database

-- 1. DROP existing tables if they exist (Order matters due to foreign keys)
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS renttransaction CASCADE;
DROP TABLE IF EXISTS notice CASCADE;
DROP TABLE IF EXISTS complaint CASCADE;
DROP TABLE IF EXISTS room CASCADE;
DROP TABLE IF EXISTS tenant CASCADE;
DROP TABLE IF EXISTS property CASCADE;
DROP TABLE IF EXISTS owner CASCADE;

-- 2. CREATE Tables

-- OWNER (Master user table)
CREATE TABLE owner (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    otp TEXT,
    otp_expiry TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PROPERTY
CREATE TABLE property (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    total_rooms INTEGER NOT NULL,
    total_beds INTEGER NOT NULL,
    occupied_beds INTEGER DEFAULT 0,
    monthly_revenue DOUBLE PRECISION DEFAULT 0.0,
    manager TEXT NOT NULL,
    phone TEXT NOT NULL,
    owner_id INTEGER REFERENCES owner(id)
);

-- TENANT
CREATE TABLE tenant (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    property_id INTEGER REFERENCES property(id),
    property_name TEXT NOT NULL,
    room_number TEXT NOT NULL,
    bed_number TEXT NOT NULL,
    rent_amount DOUBLE PRECISION NOT NULL,
    rent_due_date TEXT NOT NULL,
    rent_status TEXT NOT NULL, -- 'paid', 'due', 'overdue'
    join_date TEXT NOT NULL,
    advance DOUBLE PRECISION NOT NULL,
    aadhar_number TEXT NOT NULL,
    owner_id INTEGER REFERENCES owner(id)
);

-- ROOM
CREATE TABLE room (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES property(id),
    property_name TEXT NOT NULL,
    room_number TEXT NOT NULL,
    floor INTEGER NOT NULL,
    total_beds INTEGER NOT NULL,
    occupied_beds INTEGER NOT NULL,
    rent_per_bed DOUBLE PRECISION NOT NULL,
    amenities TEXT,
    status TEXT NOT NULL, -- 'available', 'partial', 'full'
    owner_id INTEGER REFERENCES owner(id)
);

-- COMPLAINT
CREATE TABLE complaint (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    tenant_name TEXT NOT NULL,
    property_id INTEGER REFERENCES property(id),
    property_name TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL, -- 'open', 'in-progress', 'resolved', 'closed'
    priority TEXT NOT NULL, -- 'low', 'medium', 'high'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    owner_id INTEGER REFERENCES owner(id)
);

-- NOTICE
CREATE TABLE notice (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    property_id INTEGER NOT NULL,
    property_name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    urgent BOOLEAN DEFAULT FALSE,
    owner_id INTEGER REFERENCES owner(id)
);

-- RENT TRANSACTION
CREATE TABLE renttransaction (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    tenant_name TEXT NOT NULL,
    property_name TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    month TEXT NOT NULL,
    paid_date TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    receipt_number TEXT NOT NULL,
    owner_id INTEGER REFERENCES owner(id)
);

-- STAFF
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'Admin', 'Manager', 'Housekeeping', 'Security'
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    property_id INTEGER REFERENCES property(id),
    property_name TEXT,
    status TEXT DEFAULT 'Active', -- 'Active', 'On Leave', 'Terminated'
    shift TEXT DEFAULT 'Day', -- 'Day', 'Night'
    join_date TEXT NOT NULL,
    owner_id INTEGER REFERENCES owner(id)
);

-- 3. INDEXES for Performance
CREATE INDEX idx_owner_email ON owner(email);
CREATE INDEX idx_property_owner ON property(owner_id);
CREATE INDEX idx_tenant_owner ON tenant(owner_id);
CREATE INDEX idx_room_owner ON room(owner_id);
CREATE INDEX idx_complaint_owner ON complaint(owner_id);
CREATE INDEX idx_notice_owner ON notice(owner_id);
CREATE INDEX idx_transaction_owner ON renttransaction(owner_id);
CREATE INDEX idx_staff_owner ON staff(owner_id);
