-- Migration 016: Create system_audit_log table
-- Feature: 006-erp-core-upgrade (US7: Audit & Controls)
-- Constitution: IX. Observability & Auditability — immutable, append-only

CREATE TABLE IF NOT EXISTS system_audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  justification TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sal_tenant ON system_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sal_tenant_entity ON system_audit_log(tenant_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_sal_tenant_user ON system_audit_log(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_sal_tenant_date ON system_audit_log(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sal_tenant_action ON system_audit_log(tenant_id, action);

-- Prevent DELETE on system_audit_log
CREATE OR REPLACE FUNCTION prevent_audit_log_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Cannot delete from system_audit_log. Audit records are immutable.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_delete
  BEFORE DELETE ON system_audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_delete();

-- Prevent UPDATE on system_audit_log
CREATE OR REPLACE FUNCTION prevent_audit_log_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Cannot update system_audit_log. Audit records are immutable.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_audit_update
  BEFORE UPDATE ON system_audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_update();

COMMENT ON TABLE system_audit_log IS 'Immutable, append-only audit log for all critical system operations';
