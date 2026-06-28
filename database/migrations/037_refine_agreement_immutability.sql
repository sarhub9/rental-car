-- Migration 037: Refine rental-agreement immutability
-- The original trigger blocked ANY change to an ACTIVE/immutable agreement,
-- which also blocked legitimate post-activation updates: vehicle inspection
-- (return condition/photos) and closing the agreement (status/return/actual).
--
-- This refines it to lock only the contract-defining + signature columns when
-- immutable, while allowing operational columns (status, return_timestamp,
-- actual_amount, inspection, updated_at) to change.
--
-- Net effect: signatures and pricing/terms stay locked once active (the API
-- returns a clear "cannot be changed once active" message), but return
-- inspection and closing keep working.

CREATE OR REPLACE FUNCTION prevent_immutable_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_immutable = TRUE THEN
    IF (
         NEW.customer_id            IS DISTINCT FROM OLD.customer_id
      OR NEW.vehicle_id             IS DISTINCT FROM OLD.vehicle_id
      OR NEW.rental_start_datetime  IS DISTINCT FROM OLD.rental_start_datetime
      OR NEW.rental_end_datetime    IS DISTINCT FROM OLD.rental_end_datetime
      OR NEW.daily_rate             IS DISTINCT FROM OLD.daily_rate
      OR NEW.weekly_rate            IS DISTINCT FROM OLD.weekly_rate
      OR NEW.monthly_rate           IS DISTINCT FROM OLD.monthly_rate
      OR NEW.estimated_amount       IS DISTINCT FROM OLD.estimated_amount
      OR NEW.km_allowance_per_day   IS DISTINCT FROM OLD.km_allowance_per_day
      OR NEW.rate_per_extra_km      IS DISTINCT FROM OLD.rate_per_extra_km
      OR NEW.customer_signature_url IS DISTINCT FROM OLD.customer_signature_url
      OR NEW.officer_signature_url  IS DISTINCT FROM OLD.officer_signature_url
    ) THEN
      RAISE EXCEPTION 'Cannot modify immutable rental agreement (ID: %)', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
