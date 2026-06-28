'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineArrowUturnLeft, HiOutlineCamera, HiOutlineDocumentText, HiOutlinePrinter, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineBanknotes, HiOutlinePencilSquare } from 'react-icons/hi2';
import apiClient from '@/lib/api-client';
import { Spinner } from '@/components/Spinner';
import { StatusBadge } from '@/components/StatusBadge';
import { SignaturePad } from '@/components/SignaturePad';
import ContractDocument from '@/components/ContractDocument';
import VehicleInspection from '@/components/VehicleInspection';
import type { Inspection } from '@/lib/vehicle-parts';
import { agreementService } from '@/services/agreement.service';
import { extractApiError } from '@/lib/api-error';

const extract = (r: any) => { const d = r.data; return d && typeof d === 'object' && 'data' in d ? d.data : d; };
const fmt = (n: any) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function AgreementDetailPage() {
  const { id } = useParams<{id:string}>();
  const router  = useRouter();
  const [agreement, setAgreement] = useState<any>(null);
  const [evidence, setEvidence]   = useState<any>(null);
  const [charges, setCharges]     = useState<any[]>([]);
  const [payments, setPayments]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<'contract'|'inspection'|'billing'>('contract');

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount]   = useState('');
  const [payMethod, setPayMethod]   = useState('CASH');
  const [payRef, setPayRef]         = useState('');
  const [savingPay, setSavingPay]   = useState(false);

  const loadPayments = () =>
    agreementService.getAgreementPayments(id).then((p)=>setPayments(Array.isArray(p)?p:[])).catch(()=>{});

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiClient.get(`/v1/agreements/${id}`).then(extract),
      apiClient.get(`/v1/agreements/${id}/evidence`).then(extract).catch(()=>null),
      apiClient.get(`/v1/agreements/${id}/charges`).then(extract).catch(()=>[]),
      agreementService.getAgreementPayments(id).catch(()=>[]),
    ]).then(([a,e,c,p]) => { setAgreement(a); setEvidence(e); setCharges(Array.isArray(c)?c:[]); setPayments(Array.isArray(p)?p:[]); })
      .catch(err=>toast.error(extractApiError(err,'Failed to load')))
      .finally(()=>setLoading(false));
  }, [id]);

  const handleRecordPayment = async () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      setSavingPay(true);
      await agreementService.recordAgreementPayment(id, {
        amount, payment_method: payMethod, transaction_reference: payRef || undefined,
      });
      toast.success('Payment recorded');
      setShowPayModal(false); setPayAmount(''); setPayRef(''); setPayMethod('CASH');
      loadPayments();
    } catch (err:any) {
      toast.error(extractApiError(err,'Failed to record payment'));
    } finally {
      setSavingPay(false);
    }
  };

  const handleSaveSignature = async (url: string) => {
    if (agreement?.status && agreement.status !== 'DRAFT') {
      toast.error('Signatures cannot be changed once the agreement is active');
      return;
    }
    try {
      await agreementService.saveAgreementSignature(id, url);
      setAgreement((a:any)=>({ ...a, customer_signature_url: url }));
      toast.success('Signature saved');
    } catch (err:any) {
      toast.error(extractApiError(err,'Failed to save signature'));
    }
  };

  const handleSaveOfficerSignature = async (url: string) => {
    if (agreement?.status && agreement.status !== 'DRAFT') {
      toast.error('Signatures cannot be changed once the agreement is active');
      return;
    }
    try {
      await agreementService.saveAgreementOfficerSignature(id, url);
      setAgreement((a:any)=>({ ...a, officer_signature_url: url }));
      toast.success('Officer signature saved');
    } catch (err:any) {
      toast.error(extractApiError(err,'Failed to save officer signature'));
    }
  };

  const handleSaveInspection = async (inspection: Inspection) => {
    await agreementService.saveAgreementInspection(id, inspection);
    setAgreement((a:any)=>({ ...a, inspection }));
  };

  const handleActivate = () => {
    if (!agreement?.customer_signature_url) {
      toast.error('Customer signature is required before activation');
      setTab('billing');
      return;
    }
    router.push(`/agreements/${id}/checkout`);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!agreement) return <div className="text-center py-20 text-gray-400">Agreement not found</div>;

  const a = agreement;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={()=>router.push('/agreements')} className="p-2 hover:bg-gray-100 rounded-lg" title="Back to Agreements"><HiOutlineArrowLeft className="h-5 w-5 text-gray-600"/></button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">{a.agreement_number}</h1>
              <StatusBadge status={a.status}/>
            </div>
            <p className="text-xs text-gray-500">{a.customer_name||'—'} · {a.plate_number||'—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {a.status === 'DRAFT' && (
            <button
              onClick={()=>router.push(`/agreements/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <HiOutlinePencilSquare className="h-4 w-4"/>Edit
            </button>
          )}
          {a.status === 'DRAFT' && (
            <button
              onClick={handleActivate}
              disabled={!a.customer_signature_url}
              title={!a.customer_signature_url ? 'Capture the customer signature first' : 'Proceed to vehicle handover & activate'}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiOutlineCheckCircle className="h-4 w-4"/>Activate Agreement
            </button>
          )}
          {a.status === 'ACTIVE' && (
            <button
              onClick={()=>router.push(`/agreements/${id}/return`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              <HiOutlineArrowUturnLeft className="h-4 w-4"/>Return Vehicle
            </button>
          )}
          <button onClick={()=>window.print()} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <HiOutlinePrinter className="h-4 w-4"/>Print / PDF
          </button>
        </div>
      </div>

      {/* Draft signature reminder */}
      {a.status === 'DRAFT' && !a.customer_signature_url && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 print:hidden">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Signature required.</span> Capture the customer&apos;s signature below to activate this agreement.
          </p>
          <button onClick={()=>setTab('billing')} className="shrink-0 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700">
            Sign now
          </button>
        </div>
      )}

      <div className="flex border-b border-gray-200 print:hidden">
        {([['contract','Contract',<HiOutlineDocumentText className="h-4 w-4"/>],['inspection','Inspection',<HiOutlineCamera className="h-4 w-4"/>],['billing','Billing & Payments',<HiOutlineBanknotes className="h-4 w-4"/>]] as any[]).map(([k,l,ic])=>(
          <button key={k} onClick={()=>setTab(k)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===k?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>{ic}{l}</button>
        ))}
      </div>

      {tab==='contract' && (
        <ContractDocument agreement={agreement} evidence={evidence} />
      )}

      {tab==='inspection' && (
        <div className="space-y-5">
          {/* Interactive vehicle inspection — checklist + photos for before/after */}
          <VehicleInspection value={a.inspection || null} onSave={handleSaveInspection} />

          {/* Compact handover summary (odometer / fuel) — only if recorded */}
          {(evidence?.checkout?.odometer_reading || evidence?.return?.odometer_reading) && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Handover Readings</p>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 w-1/4">Field</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-blue-600">Checkout</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-emerald-600">Return</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400">Difference</th>
                </tr></thead>
                <tbody>
                  <tr><td className="px-4 py-2.5 text-gray-500 text-xs font-medium">Odometer</td>
                    <td className="px-4 py-2.5">{evidence?.checkout?.odometer_reading ? `${evidence.checkout.odometer_reading} km` : '—'}</td>
                    <td className="px-4 py-2.5">{evidence?.return?.odometer_reading ? `${evidence.return.odometer_reading} km` : '—'}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{evidence?.checkout?.odometer_reading && evidence?.return?.odometer_reading ? `${evidence.return.odometer_reading - evidence.checkout.odometer_reading} km driven` : '—'}</td>
                  </tr>
                  <tr className="bg-gray-50"><td className="px-4 py-2.5 text-gray-500 text-xs font-medium">Fuel Level</td>
                    <td className="px-4 py-2.5">{evidence?.checkout?.fuel_level || '—'}</td>
                    <td className="px-4 py-2.5">{evidence?.return?.fuel_level || '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-gray-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab==='billing' && (() => {
        const chargesTotal = charges.reduce((s,c)=>s+parseFloat(c.amount||0),0);
        const totalPaid = payments.reduce((s,p)=>s+parseFloat(p.amount||0),0);
        const due = Number(a.estimated_amount||0) + chargesTotal - totalPaid;
        return (
          <div className="space-y-5">
            {/* Payment summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500">Estimated Total</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{fmt(a.estimated_amount)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                <p className="text-xs text-emerald-600">Total Paid</p>
                <p className="text-lg font-bold text-emerald-700 mt-1">{fmt(totalPaid)}</p>
              </div>
              <div className={`rounded-xl border p-4 ${due > 0 ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-xs ${due > 0 ? 'text-amber-600' : 'text-gray-500'}`}>Balance Due</p>
                <p className={`text-lg font-bold mt-1 ${due > 0 ? 'text-amber-700' : 'text-gray-700'}`}>{fmt(due)}</p>
              </div>
            </div>

            {/* Auto-generated charges (extra km, fuel, late fee, damage) */}
            {charges.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">Auto-Generated Charges</p>
                  <p className="text-xs text-gray-400">From checkout / return (extra KM, fuel, late fee, damage)</p>
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Type</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Description</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Amount</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Status</th>
                  </tr></thead>
                  <tbody>
                    {charges.map((c:any,i:number)=>(
                      <tr key={i} className={i%2===0?'bg-white':'bg-gray-50'}>
                        <td className="px-4 py-2.5 capitalize text-xs font-medium">{(c.charge_type||'').replace(/_/g,' ')}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{c.description||'—'}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{fmt(c.amount)}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={c.approval_status}/></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="border-t bg-gray-50 font-bold">
                    <td colSpan={2} className="px-4 py-3 text-gray-700">Total Charges</td>
                    <td className="px-4 py-3 text-right">{fmt(chargesTotal)}</td>
                    <td/>
                  </tr></tfoot>
                </table>
              </div>
            )}

            {/* Payments list + record */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-700">Payments</p>
                <button onClick={()=>setShowPayModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 print:hidden">
                  <HiOutlineBanknotes className="h-4 w-4"/> Record Payment
                </button>
              </div>
              {!payments.length ? (
                <div className="text-center py-10 text-gray-400 text-sm">No payments recorded yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Date</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Ref</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">Method</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">Amount</th>
                  </tr></thead>
                  <tbody>
                    {payments.map((p:any,i:number)=>(
                      <tr key={i} className={i%2===0?'bg-white':'bg-gray-50'}>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">{p.payment_number || p.transaction_reference || '—'}</td>
                        <td className="px-4 py-2.5 text-xs">{(p.payment_method||'').replace(/_/g,' ')}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{fmt(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Signatures — customer & officer separately */}
            {a.status !== 'DRAFT' && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
                <HiOutlineXCircle className="h-4 w-4 shrink-0" />
                Signatures are locked — they cannot be changed once the agreement is {String(a.status).toLowerCase()}.
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <HiOutlinePencilSquare className="h-4 w-4"/> Customer Signature
                </p>
                <SignaturePad
                  label="Customer Signature"
                  category="agreement-signatures"
                  docKey="CUSTOMER_SIGNATURE"
                  value={a.customer_signature_url || ''}
                  onChange={handleSaveSignature}
                  readOnly={a.status !== 'DRAFT'}
                />
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <HiOutlinePencilSquare className="h-4 w-4"/> Officer Signature
                </p>
                <SignaturePad
                  label="Officer Signature"
                  category="agreement-signatures"
                  docKey="OFFICER_SIGNATURE"
                  value={a.officer_signature_url || ''}
                  onChange={handleSaveOfficerSignature}
                  readOnly={a.status !== 'DRAFT'}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 print:hidden" onClick={()=>setShowPayModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Record Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (AED)</label>
                <input type="number" min={0} step="0.01" value={payAmount} onChange={(e)=>setPayAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                <select value={payMethod} onChange={(e)=>setPayMethod(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none">
                  {['CASH','CARD','BANK_TRANSFER','CHEQUE','ONLINE'].map(m=><option key={m} value={m}>{m.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reference (optional)</label>
                <input value={payRef} onChange={(e)=>setPayRef(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none" placeholder="Txn / cheque no." />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={()=>setShowPayModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleRecordPayment} disabled={savingPay}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {savingPay ? 'Saving...' : 'Save Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 12mm; }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color: #111 !important;
          }
          #contract-doc, #contract-doc * { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
