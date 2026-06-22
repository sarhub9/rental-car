-- Migration 031: Vehicle photos (front / rear / side / interior)
-- Lets staff store reference photos of each car in the system.

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS photo_front_url    TEXT,
  ADD COLUMN IF NOT EXISTS photo_rear_url     TEXT,
  ADD COLUMN IF NOT EXISTS photo_side_url     TEXT,
  ADD COLUMN IF NOT EXISTS photo_interior_url TEXT;
