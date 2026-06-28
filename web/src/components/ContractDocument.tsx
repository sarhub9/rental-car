'use client';

/**
 * ContractDocument — formal printable rental agreement that mirrors the
 * company's paper contract (see contract.pdf). Rendered on screen as an A4
 * sheet and printed/exported as-is via window.print().
 *
 * Empty fields and empty sections are hidden automatically so the contract
 * never shows blank "—" rows. Customer and officer signatures are shown in
 * their own separate places.
 */

import { VEHICLE_PARTS, conditionMeta } from '@/lib/vehicle-parts';
import { resolveUpload } from '@/lib/asset-url';

type Row = [string, any];

const fmt = (n: any) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: any) => (d ? new Date(d).toLocaleDateString('en-GB') : '');
const fmtDateTime = (d: any) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const FUEL_PCT: Record<string, string> = {
  EMPTY: '0%', QUARTER: '25%', HALF: '50%', THREE_QUARTER: '75%', FULL: '100%',
};
const fuel = (f: any) => (f ? FUEL_PCT[f] || f : '');

const has = (v: any) => v !== null && v !== undefined && String(v).trim() !== '' && String(v).trim() !== '—';

const DEFAULT_TERMS = [
  'Insurance Excess: The hirer is liable to pay an insurance excess of AED 2,000 per incident if at fault in an accident. Drivers under 25 at fault are responsible for 10% of the total repair cost plus applicable insurance charges.',
  'Police Report Requirement: A valid police report is mandatory for all accidents. Failure to submit one results in full liability for all related damages.',
  'Authorized Drivers: Only listed drivers may operate the vehicle. If driven by an unauthorized person, the hirer accepts full responsibility for all damages.',
  'Liability for Damages and Downtime: In at-fault accidents, the hirer is liable for the insurance excess and rental income loss during repairs.',
  'Minimum Rental Period: Minimum rental is 1 day (24 hours). Hourly or prorated rentals are not allowed.',
  'Fuel Policy: Return the vehicle with the same fuel level as at pickup. A refueling charge will apply otherwise.',
  'Airport Pickup/Drop-Off: Subject to additional parking and delivery/pick-up charges.',
  'Toll Charges (Salik & DARB): Toll charges are billed at actual cost plus AED 1 administrative fee per toll.',
  'Traffic Fines: All traffic fines during the rental period are the hirer’s responsibility. A 10% admin fee and VAT apply.',
  'Payment Default & Vehicle Lock: The vehicle has GPS tracking. After a 24-hour notice for unpaid dues or overdue return, the car may be locked remotely.',
  'Expense Threshold for Deposit Deductions: If charges exceed 20% of the security deposit, the customer must pay the excess within 24 hours of notification.',
  'Insurance Exclusions: Insurance is void if the vehicle is driven under the influence, or used for racing, towing, off-roading or illegal activities.',
  'Vehicle Impoundment: If impounded due to legal violations, the customer must cover all impound fees and rental income loss.',
  'Security Deposit Refund: Deposits are refunded within 20 days after vehicle return. Processing/transfer fees are the customer’s responsibility.',
  'Early or Late Return: Early returns are non-refundable. Late returns beyond a 1-hour grace period are charged as an additional full day.',
  'Visa Status Change: If switching from a Visit Visa to a UAE Residence Visa, the customer must immediately provide a valid UAE Driving License and Emirates ID.',
  'Smoking Policy: Smoking is strictly prohibited in all vehicles. A cleaning fee of AED 250 applies if violated.',
  'Vehicle Cleaning Fee: AED 30 for exterior wash; AED 250 for interior cleaning/detailing if returned dirty.',
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 text-white text-[11px] font-bold uppercase tracking-wide px-2 py-1 mt-3 mb-1.5">
      {children}
    </div>
  );
}

/** A two-column block that hides empty rows and the whole block if all empty. */
function FieldBlock({ title, rows }: { title: string; rows: Row[] }) {
  const present = rows.filter(([, v]) => has(v));
  if (!present.length) return null;
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      {present.map(([label, value]) => (
        <div key={label} className="flex text-[11px] leading-tight border-b border-gray-200 py-1">
          <span className="text-gray-500 w-32 shrink-0">{label}</span>
          <span className="font-medium text-gray-900 break-words">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

function ChargeRow({ label, rate, amount }: { label: string; rate?: string; amount: any }) {
  const amt = Number(amount || 0);
  if (!amt) return null;
  return (
    <tr className="border-b border-gray-200">
      <td className="px-2 py-1 text-[11px]">{label}</td>
      <td className="px-2 py-1 text-[11px] text-gray-500">{rate || ''}</td>
      <td className="px-2 py-1 text-[11px] text-right font-medium">{fmt(amt)}</td>
    </tr>
  );
}

function ChecklistBlock({ title, fuelLevel, mileage, date, notes, parts, photos }: {
  title: string; fuelLevel: any; mileage: any; date: any; notes?: string;
  parts?: Record<string, string>; photos?: any[];
}) {
  const meta: Row[] = [
    ['Fuel', fuel(fuelLevel)],
    ['Mileage', mileage],
    ['Date', fmtDate(date)],
  ];
  const metaPresent = meta.filter(([, v]) => has(v));
  const damaged = VEHICLE_PARTS.filter((p) => parts?.[p] && parts[p] !== 'GOOD');
  return (
    <div className="border border-gray-300 rounded mb-3">
      <div className="bg-gray-100 px-2 py-1 text-[11px] font-bold uppercase flex justify-between">
        <span>{title}</span>
        {!!damaged.length && <span className="text-red-600 normal-case font-semibold">{damaged.length} item(s) marked</span>}
      </div>
      <div className="p-2">
        {!!metaPresent.length && (
          <div className="flex gap-6 text-[11px] mb-2">
            {metaPresent.map(([l, v]) => (
              <div key={l}><span className="text-gray-500">{l}:</span> <span className="font-medium">{String(v)}</span></div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-4 gap-x-3 gap-y-0.5">
          {VEHICLE_PARTS.map((p) => {
            const cond = parts?.[p] || 'GOOD';
            const m = conditionMeta(cond);
            const isDamaged = cond !== 'GOOD';
            return (
              <div key={p} className="flex items-center gap-1 text-[10px] text-gray-700">
                <span className={`inline-block w-2.5 h-2.5 rounded-sm shrink-0 border ${isDamaged ? m.dot + ' border-transparent' : 'border-gray-400'}`} />
                <span className={isDamaged ? 'font-semibold' : ''}>{p}{isDamaged ? ` (${m.label})` : ''}</span>
              </div>
            );
          })}
        </div>
        {has(notes) && <p className="text-[10px] text-gray-600 mt-2"><b>Remarks:</b> {notes}</p>}
        {!!photos?.length && (
          <div className="grid grid-cols-6 gap-1 mt-2">
            {photos.slice(0, 12).map((p: any, i: number) => {
              const src = typeof p === 'string' ? p : (p.photo_url || p.url || '');
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={resolveUpload(src)} alt="" className="w-full h-12 object-cover rounded border border-gray-200" />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** A signature slot: shows the captured image if present, else a blank line to sign. */
function SignatureSlot({ label, name, imageUrl }: { label: string; name?: string; imageUrl?: string }) {
  return (
    <div>
      <div className="h-16 flex items-end">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolveUpload(imageUrl)} alt={label} className="max-h-16 object-contain" />
        ) : null}
      </div>
      <div className="border-t border-gray-400 pt-1">
        <p className="text-[10px] text-gray-500">{label}</p>
        {has(name) && <p className="text-[11px] font-medium text-gray-800">{name}</p>}
      </div>
    </div>
  );
}

export default function ContractDocument({ agreement, evidence }: { agreement: any; evidence: any }) {
  const a = agreement || {};
  const c = a.customer || {};
  const v = a.vehicle || {};
  const co = a.company || {};
  const checkout = evidence?.checkout || {};
  const ret = evidence?.return || {};

  const days = (() => {
    if (!a.rental_start_datetime || !a.rental_end_datetime) return '';
    const ms = new Date(a.rental_end_datetime).getTime() - new Date(a.rental_start_datetime).getTime();
    return Math.max(1, Math.ceil(ms / 86400000));
  })();

  const rent = Number(a.estimated_amount || 0);
  const charges: [string, string, any][] = [
    ['Applied Rent', has(a.snapshot_daily_rate || a.daily_rate) ? `${fmt(a.snapshot_daily_rate || a.daily_rate)} /day` : '', rent],
    ['Salik / Toll', '', a.salik_charges],
    ['Fines', '', a.fines_charges],
    ['Damages', '', a.damages_charges],
    ['Fuel Charges', '', a.fuel_charges],
    ['Extra KM Charge', has(a.rate_per_extra_km) ? `${fmt(a.rate_per_extra_km)} /km` : '', a.extra_km_charges],
    ['Delivery Charges', '', a.delivery_charges],
    ['Pickup Charges', '', a.pickup_charges],
    ['Extra Hour Charges', '', a.extra_hour_charges],
    ['Other Charges', '', a.other_charges],
    ['CDW', '', a.cdw_amount],
    ['Excess Insurance', '', a.excess_insurance_amount],
    ['Deposit', '', a.deposit_amount],
    ['Deposit Waiver', '', a.deposit_waiver_amount ? -Number(a.deposit_waiver_amount) : 0],
  ];

  const total =
    rent +
    Number(a.salik_charges || 0) + Number(a.fines_charges || 0) + Number(a.damages_charges || 0) +
    Number(a.fuel_charges || 0) + Number(a.extra_km_charges || 0) + Number(a.delivery_charges || 0) +
    Number(a.pickup_charges || 0) + Number(a.extra_hour_charges || 0) + Number(a.other_charges || 0) +
    Number(a.cdw_amount || 0) + Number(a.excess_insurance_amount || 0) + Number(a.deposit_amount || 0) -
    Number(a.deposit_waiver_amount || 0);

  const terms = has(co.agreement_terms)
    ? String(co.agreement_terms).split(/\n+/).filter(Boolean)
    : DEFAULT_TERMS;

  const customerName = c.full_name_en || a.customer_name || '';
  const companyAddress = [co.address, co.city, co.country].filter(Boolean).join(', ');
  const sig = a.customer_signature_url;
  const officerSig = a.officer_signature_url;

  // Inspection (checklist + photos + notes). Photos fall back to evidence.
  const insp = a.inspection || {};
  const before = insp.before || {};
  const after = insp.after || {};
  const beforePhotos = [...(before.photos || []), ...(checkout.photo_urls || [])];
  const afterPhotos = [...(after.photos || []), ...(ret.photo_urls || [])];

  // Section row definitions (empty rows auto-hidden by FieldBlock).
  const billingRows: Row[] = [
    ['Name', customerName],
    ['Email', c.email],
    ['Phone', c.phone_number],
    ['Address', c.address || c.address_line_1],
    ['TRN No.', co.trn_number],
    ['Trade License', co.trade_license_number],
  ];
  const vehicleRows: Row[] = [
    ['Car', v.make ? `${v.make} ${v.model || ''} ${v.year || ''}`.trim() : ''],
    ['Type', v.vehicle_type || v.category_name || v.body_type],
    ['Plate Number', v.plate_number],
    ['Color', v.color],
    ['Chassis No.', v.chassis_number],
  ];
  const hirerRows: Row[] = [
    ['Name', customerName],
    ['Nationality', c.nationality],
    ['Phone', c.phone_number],
    ['WhatsApp No.', c.whatsapp_number],
    ['E-Mail', c.email],
    ['Date of Birth', fmtDate(c.date_of_birth)],
    ['Emirates ID', c.emirates_id],
    ['EID Expiry', fmtDate(c.id_expiry_date)],
    ['Address', c.address || c.address_line_1],
  ];
  const periodRows: Row[] = [
    ['On Hire Date', fmtDateTime(a.checkout_timestamp || a.rental_start_datetime)],
    ['Off Hire Date', fmtDateTime(a.rental_end_datetime)],
    ['Departure Km', checkout.odometer_reading],
    ['Fuel', fuel(checkout.fuel_level)],
    ['Daily Km Limit', a.snapshot_km_allowance_per_day || a.km_allowance_per_day],
    ['No. of Days', days],
  ];
  const licenseRows: Row[] = [
    ['License No.', c.driving_license_number],
    ['Date of Expiry', fmtDate(c.license_expiry_date)],
    ['Place of Issue', c.license_country],
  ];
  const additionalDriverRows: Row[] = [
    ['Name', a.additional_driver_name],
    ['D/L No.', a.additional_driver_license],
    ['Exp. Date', fmtDate(a.additional_driver_license_expiry)],
    ['Emirates ID', a.additional_driver_eid],
    ['Date of Birth', fmtDate(a.additional_driver_dob)],
  ];

  return (
    <div id="contract-doc" className="contract-doc mx-auto bg-white text-gray-900">
      {/* ============ PAGE 1 ============ */}
      <div className="contract-page border border-gray-300 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-gray-800 pb-3">
          <div className="flex items-center gap-3">
            {co.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveUpload(co.logo_url)} alt="logo" className="h-14 w-14 object-contain" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold text-lg">
                {(co.name || 'CR').slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold uppercase leading-tight">{co.name || 'Car Rental'}</h1>
              {has(co.name_ar) && <p className="text-xs text-gray-600">{co.name_ar}</p>}
              <p className="text-[10px] text-gray-500">Car Rental Agreement</p>
            </div>
          </div>
          <div className="text-right text-[10px] text-gray-600 leading-snug">
            {has(co.phone_number) && <div>{co.phone_number}</div>}
            {has(co.contact_email) && <div>{co.contact_email}</div>}
            {has(companyAddress) && <div>{companyAddress}</div>}
          </div>
        </div>

        {/* Contract No + status */}
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm font-bold">Contract No: {a.agreement_number || '—'}</p>
          {has(a.status) && <p className="text-[11px] text-gray-500">Status: {a.status}</p>}
        </div>

        {/* Billing + Vehicle */}
        <div className="grid grid-cols-2 gap-4 mt-1">
          <FieldBlock title="Billing Information" rows={billingRows} />
          <FieldBlock title="Vehicle Details" rows={vehicleRows} />
        </div>

        {/* Hirer Information */}
        <div className="grid grid-cols-2 gap-x-6">
          <FieldBlock title="Hirer Information" rows={hirerRows.slice(0, 5)} />
          <FieldBlock title=" " rows={hirerRows.slice(5)} />
        </div>

        {/* Rental period */}
        <SectionTitle>Rental Period</SectionTitle>
        <div className="grid grid-cols-3 gap-x-6">
          {periodRows.filter(([, val]) => has(val)).map(([label, val]) => (
            <div key={label} className="flex text-[11px] leading-tight border-b border-gray-200 py-1">
              <span className="text-gray-500 w-28 shrink-0">{label}</span>
              <span className="font-medium text-gray-900">{String(val)}</span>
            </div>
          ))}
        </div>

        {/* Rental Charges */}
        <SectionTitle>Rental Charges Information</SectionTitle>
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-2 py-1 text-left text-[10px] font-bold uppercase">Particular</th>
              <th className="px-2 py-1 text-left text-[10px] font-bold uppercase">Rate</th>
              <th className="px-2 py-1 text-right text-[10px] font-bold uppercase">Amount (AED)</th>
            </tr>
          </thead>
          <tbody>
            {charges.map(([label, rate, amount]) => (
              <ChargeRow key={label} label={label} rate={rate} amount={amount} />
            ))}
            <tr className="bg-gray-800 text-white">
              <td className="px-2 py-1.5 text-[12px] font-bold" colSpan={2}>TOTAL</td>
              <td className="px-2 py-1.5 text-[12px] font-bold text-right">AED {fmt(total)}</td>
            </tr>
          </tbody>
        </table>

        {/* Driver's License + Additional Driver */}
        <div className="grid grid-cols-2 gap-4">
          <FieldBlock title="Driver's License Details" rows={licenseRows} />
          <FieldBlock title="Additional Driver" rows={additionalDriverRows} />
        </div>

        {/* Additional Remarks */}
        {has(a.additional_remarks) && (
          <>
            <SectionTitle>Additional Remarks</SectionTitle>
            <p className="text-[11px] text-gray-700 py-1">{a.additional_remarks}</p>
          </>
        )}

        {/* Acknowledgement + signatures (customer vs officer separate) */}
        <SectionTitle>Acknowledgement from Hirer</SectionTitle>
        <p className="text-[10px] text-gray-600 leading-snug py-1">
          I have read and agreed to the terms and conditions of this agreement and confirm that if payment is to be made by
          credit card, my signature below shall constitute authority to debit my credit card company with the total amount due.
          I also agree to pay charges for traffic and other violations.
        </p>
        <div className="grid grid-cols-2 gap-10 mt-4">
          <SignatureSlot label="Customer Signature" name={customerName} imageUrl={sig} />
          <SignatureSlot label="Authorized Officer" name={co.name} imageUrl={officerSig} />
        </div>
      </div>

      {/* ============ PAGE 2 — CHECKLIST ============ */}
      <div className="contract-page contract-page-break border border-gray-300 p-6 mt-6">
        <div className="flex justify-between items-center border-b-2 border-gray-800 pb-2 mb-3">
          <h2 className="text-base font-bold uppercase">Vehicle Check List</h2>
          <div className="text-right text-[11px]">
            <div>Contract No: {a.agreement_number || '—'}</div>
            {has(v.plate_number) && (
              <div className="text-gray-500">{v.make ? `${v.make} ${v.model || ''} ${v.year || ''}` : ''} {v.plate_number}</div>
            )}
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[10px] text-amber-800 mb-3">
          <b>Important Notes:</b> In case of any accident do not panic and wait for the Police. Do not accept fault or liability.
          Do not smoke inside the car. Obey all traffic signs and rules. Always wear your seat belt while driving.
        </div>

        <ChecklistBlock
          title="Departure (Checkout) Vehicle Essentials"
          fuelLevel={checkout.fuel_level}
          mileage={checkout.odometer_reading}
          date={a.checkout_timestamp || a.rental_start_datetime}
          notes={before.notes}
          parts={before.parts}
          photos={beforePhotos}
        />
        <ChecklistBlock
          title="Dropoff (Return) Vehicle Essentials"
          fuelLevel={ret.fuel_level}
          mileage={ret.odometer_reading}
          date={a.return_timestamp}
          notes={after.notes}
          parts={after.parts}
          photos={afterPhotos}
        />
        {has(ret.damage_description) && (
          <div className="text-[11px] text-red-700 mb-3">
            <b>Return Damage Notes:</b> {ret.damage_description}
          </div>
        )}

        {/* Terms */}
        <SectionTitle>Terms &amp; Conditions</SectionTitle>
        <ol className="list-decimal pl-4 space-y-1">
          {terms.map((t, i) => (
            <li key={i} className="text-[9.5px] text-gray-700 leading-snug">{t}</li>
          ))}
        </ol>

        <div className="grid grid-cols-2 gap-10 mt-6">
          <SignatureSlot label="Authorized Officer" name={co.name} imageUrl={officerSig} />
          <SignatureSlot label="Customer Signature" name={customerName} imageUrl={sig} />
        </div>
      </div>

      <style>{`
        .contract-doc { max-width: 820px; }
        @media print {
          .contract-page-break { page-break-before: always; }
          .contract-doc { max-width: none; }
        }
      `}</style>
    </div>
  );
}
