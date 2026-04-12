-- SQL Schema for Supabase / PostgreSQL
-- Run this in your Supabase SQL Editor to initialize the database

CREATE TABLE IF NOT EXISTS property (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    total_rooms INTEGER NOT NULL,
    total_beds INTEGER NOT NULL,
    occupied_beds INTEGER DEFAULT 0,
    monthly_revenue DOUBLE PRECISION DEFAULT 0.0,
    manager TEXT NOT NULL,
    phone TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tenant (
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
    rent_status TEXT NOT NULL,
    join_date TEXT NOT NULL,
    advance DOUBLE PRECISION NOT NULL,
    aadhar_number TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS room (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES property(id),
    property_name TEXT NOT NULL,
    room_number TEXT NOT NULL,
    floor INTEGER NOT NULL,
    total_beds INTEGER NOT NULL,
    occupied_beds INTEGER NOT NULL,
    rent_per_bed DOUBLE PRECISION NOT NULL,
    amenities TEXT,
    status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS complaint (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    tenant_name TEXT NOT NULL,
    property_id INTEGER REFERENCES property(id),
    property_name TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS notice (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    property_id INTEGER NOT NULL,
    property_name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    urgent BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS renttransaction (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    tenant_name TEXT NOT NULL,
    property_name TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    month TEXT NOT NULL,
    paid_date TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    receipt_number TEXT NOT NULL
);
