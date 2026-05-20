-- Migration 028: Make message_threads.customer_id optional
-- Allows customers who logged in via OTP (without a linked customer record)
-- to send messages through the portal.

-- Drop the NOT NULL constraint and FK on customer_id
ALTER TABLE message_threads
  ALTER COLUMN customer_id DROP NOT NULL;

-- Add created_by_user_id so threads can be owned by a user even without a customer record
ALTER TABLE message_threads
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_message_threads_user ON message_threads(created_by_user_id);
