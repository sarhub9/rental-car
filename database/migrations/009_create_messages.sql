-- Migration 009: In-App Messaging System
-- Creates tables for customer-support messaging

-- Message Threads Table
CREATE TABLE IF NOT EXISTS message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_message_threads_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT chk_message_thread_status CHECK (status IN ('OPEN', 'CLOSED'))
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  sender_user_id UUID NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  message_text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_messages_thread FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_message_threads_tenant ON message_threads(tenant_id);
CREATE INDEX idx_message_threads_customer ON message_threads(customer_id);
CREATE INDEX idx_message_threads_status ON message_threads(status);
CREATE INDEX idx_message_threads_last_message ON message_threads(last_message_at DESC);

CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_sender ON messages(sender_user_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_messages_unread ON messages(is_read) WHERE is_read = FALSE;

-- Trigger to update last_message_at on message_threads
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE message_threads
  SET last_message_at = NEW.created_at,
      updated_at = NOW()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_thread_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_thread_last_message();

-- Comments
COMMENT ON TABLE message_threads IS 'Customer-support message threads';
COMMENT ON TABLE messages IS 'Individual messages within threads';
COMMENT ON COLUMN message_threads.status IS 'Thread status: OPEN or CLOSED';
COMMENT ON COLUMN messages.attachments IS 'Array of attachment URLs (S3/MinIO)';
COMMENT ON COLUMN messages.is_read IS 'Whether the recipient has read this message';
