-- Migration: Add immutability triggers
-- Feature: 003-rental-agreement-evidence
-- Date: 2026-02-12

-- Trigger 1: Prevent updates to immutable rental agreements
CREATE OR REPLACE FUNCTION prevent_immutable_updates()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_immutable = TRUE AND NEW != OLD THEN
        RAISE EXCEPTION 'Cannot modify immutable rental agreement (ID: %)', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_rental_agreement_immutable_updates
    BEFORE UPDATE ON rental_agreements
    FOR EACH ROW
    EXECUTE FUNCTION prevent_immutable_updates();

-- Trigger 2: Prevent updates to checkout evidence when agreement is active or closed
CREATE OR REPLACE FUNCTION prevent_checkout_evidence_updates()
RETURNS TRIGGER AS $$
DECLARE
    agreement_status_val agreement_status;
BEGIN
    SELECT status INTO agreement_status_val
    FROM rental_agreements
    WHERE id = OLD.agreement_id;

    IF agreement_status_val IN ('ACTIVE', 'CLOSED') THEN
        RAISE EXCEPTION 'Cannot modify checkout evidence after agreement activation (Agreement ID: %)', OLD.agreement_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_checkout_evidence_immutable_updates
    BEFORE UPDATE ON checkout_evidence
    FOR EACH ROW
    EXECUTE FUNCTION prevent_checkout_evidence_updates();

-- Trigger 3: Prevent any updates to return evidence (always immutable)
CREATE OR REPLACE FUNCTION prevent_return_evidence_updates()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Return evidence is immutable and cannot be modified (ID: %)', OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_return_evidence_immutable_updates
    BEFORE UPDATE ON return_evidence
    FOR EACH ROW
    EXECUTE FUNCTION prevent_return_evidence_updates();

-- Trigger 4: Prevent updates to immutable photos
CREATE OR REPLACE FUNCTION prevent_photo_evidence_updates()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_immutable = TRUE THEN
        RAISE EXCEPTION 'Cannot modify immutable photo evidence (ID: %)', OLD.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_photo_evidence_immutable_updates
    BEFORE UPDATE ON photo_evidence
    FOR EACH ROW
    EXECUTE FUNCTION prevent_photo_evidence_updates();

-- Trigger 5: Set immutability flags when agreement is activated
CREATE OR REPLACE FUNCTION set_immutability_on_activation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ACTIVE' AND OLD.status = 'DRAFT' THEN
        -- Set agreement as immutable
        NEW.is_immutable := TRUE;

        -- Set checkout evidence as immutable
        UPDATE checkout_evidence
        SET is_immutable = TRUE
        WHERE agreement_id = NEW.id;

        -- Set checkout photos as immutable
        UPDATE photo_evidence
        SET is_immutable = TRUE
        WHERE agreement_id = NEW.id AND evidence_type = 'CHECKOUT';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_immutability_on_agreement_activation
    BEFORE UPDATE ON rental_agreements
    FOR EACH ROW
    WHEN (NEW.status = 'ACTIVE' AND OLD.status = 'DRAFT')
    EXECUTE FUNCTION set_immutability_on_activation();

-- Trigger 6: Prevent any updates or deletes to audit log (append-only)
CREATE OR REPLACE FUNCTION prevent_audit_log_modifications()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log is append-only and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_audit_log_updates
    BEFORE UPDATE ON agreement_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modifications();

CREATE TRIGGER prevent_audit_log_deletes
    BEFORE DELETE ON agreement_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modifications();

-- Trigger 7: Prevent updates to auto-generated charges (always immutable)
CREATE OR REPLACE FUNCTION prevent_charge_updates()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Auto-generated charges are immutable and cannot be modified (ID: %)', OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_auto_charge_updates
    BEFORE UPDATE ON auto_generated_charges
    FOR EACH ROW
    EXECUTE FUNCTION prevent_charge_updates();

-- Comments
COMMENT ON FUNCTION prevent_immutable_updates() IS 'Prevents updates to rental agreements when is_immutable flag is TRUE';
COMMENT ON FUNCTION prevent_checkout_evidence_updates() IS 'Prevents updates to checkout evidence when agreement is ACTIVE or CLOSED';
COMMENT ON FUNCTION prevent_return_evidence_updates() IS 'Prevents any updates to return evidence (always immutable)';
COMMENT ON FUNCTION prevent_photo_evidence_updates() IS 'Prevents updates to photos when is_immutable flag is TRUE';
COMMENT ON FUNCTION set_immutability_on_activation() IS 'Sets immutability flags when agreement transitions from DRAFT to ACTIVE';
COMMENT ON FUNCTION prevent_audit_log_modifications() IS 'Prevents any modifications to audit log (append-only)';
COMMENT ON FUNCTION prevent_charge_updates() IS 'Prevents updates to auto-generated charges (always immutable)';
