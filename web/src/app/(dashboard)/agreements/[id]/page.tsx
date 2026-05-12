'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineCamera, HiOutlineDocumentText, HiOutlinePrinter, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import apiClient from '@/lib/api-client';
import { Spinner } from '@/components/Spinner';
import { StatusBadge } from '@/components/StatusBadge';
import { extractApiError } from '@/lib/api-error';

const extract = (r: any) => { const d = r.data; return d && typeof d === 'object' && 'data' in d ? d.data : d; };
const fmt = (n: any) => `AED ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

function PhotoGrid({ photos }: { photos: any[] }) {
  const [zoom, setZoom] = useState<string|null>(null);
  if (!photos?.length) return <p className="text-sm text-gray-400 italic">No photos</p>;
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p:any, i:number) => {
          const src = typeof p === 'string' ? p : (p.photo_url||p.url||'');
          return <div key={i} onClick={()=>setZoom(src)} className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80"><img src={src} className="w-full h-full object-cover" alt="" /></div>;
        })}
      </div>
      {zoom && <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={()=>setZoom(null)}><img src={zoom} className="max-w-full max-h-full rounded-lg" alt="" /></div>}
    </>
  );
}

export default function AgreementDetailPage() {
  const { id } = useParams<{id:string}>();
  const router  = useRouter();
  const [agreement, setAgreement] = useState<any>(null);
  const [evidence, setEvidence]   = useState<any>(null);
  const [charges, setCharges]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<'details'|'comparison'|'charges'>('details');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      apiClient.get(`/v1/agreements/${id}`).then(extract),
      apiClient.get(`/v1/agreements/${id}/evidence`).then(extract).catch(()=>null),
      apiClient.get(`/v1/agreements/${id}/charges`).then(extract).catch(()=>[]),
    ]).then(([a,e,c]) => { setAgreement(a); setEvidence(e); setCharges(Array.isArray(c)?c:[]); })
      .catch(err=>toast.error(extractApiError(err,'Failed to load')))
      .finally(()=>setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (!agreement) return <div className="text-center py-20 text-gray-400">Agreement not found</div>;

  const a = agreement;
  const coPhotos  = evidence?.checkout?.photo_urls || [];
  const retPhotos = evidence?.return?.photo_urls   || [];

  const InfoCard = ({ title, rows }: { title: string; rows: [string,any][] }) => (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{title}</p>
      {rows.map(([l,v])=>(
        <div key={l} className="flex justify-between text-sm border-b border-gray-50 py-1.5 last:border-0">
          <span className="text-gray-500 shrink-0">{l}</span>
          <span className="font-medium text-gray-900 text-right ml-4">{v||'—'}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button onClick={()=>router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><HiOutlineArrowLeft className="h-5 w-5 text-gray-600"/></button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">{a.agreement_number}</h1>
              <StatusBadge status={a.status}/>
            </div>
            <p className="text-xs text-gray-500">{a.customer_name||'—'} · {a.plate_number||'—'}</p>
          </div>
        </div>
        <button onClick={()=>window.print()} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <HiOutlinePrinter className="h-4 w-4"/>Print / PDF
        </button>
      </div>

      <div className="flex border-b border-gray-200 print:hidden">
        {([['details','Details',<HiOutlineDocumentText className="h-4 w-4"/>],['comparison','Before / After Photos',<HiOutlineCamera className="h-4 w-4"/>],['charges','Charges',<HiOutlineXCircle className="h-4 w-4"/>]] as any[]).map(([k,l,ic])=>(
          <button key={k} onClick={()=>setTab(k)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab===k?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>{ic}{l}</button>
        ))}
      </div>

      {tab==='details' && (
        <div id="print-area" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="hidden print:block col-span-2 text-center pb-4 mb-2 border-b">
            <h1 className="text-2xl font-bold">Rental Agreement</h1>
            <p className="text-gray-600">{a.agreement_number} · {a.customer_name} · {a.plate_number}</p>
          </div>
          <InfoCard title="Agreement Info" rows={[
            ['Agreement #', a.agreement_number],
            ['Status', a.status],
            ['Start', a.checkout_timestamp ? new Date(a.checkout_timestamp).toLocaleString() : a.rental_start_datetime ? new Date(a.rental_start_datetime).toLocaleDateString() : null],
            ['Expected Return', a.rental_end_datetime ? new Date(a.rental_end_datetime).toLocaleDateString() : null],
            ['Actual Return', a.return_timestamp ? new Date(a.return_timestamp).toLocaleString() : null],
            ['Branch', a.branch_name],
          ]}/>
          <InfoCard title="Customer" rows={[
            ['Name', a.customer_name || a.customer?.full_name_en],
            ['Phone', a.customer?.phone_number],
            ['Type', a.customer?.customer_type],
            ['Emirates ID', a.customer?.emirates_id],
            ['License', a.customer?.driving_license_number],
          ]}/>
          <InfoCard title="Vehicle" rows={[
            ['Plate', a.plate_number || a.vehicle?.plate_number],
            ['Make / Model', a.vehicle ? `${a.vehicle.make} ${a.vehicle.model} ${a.vehicle.year}` : null],
            ['Color', a.vehicle?.color],
            ['Chassis', a.vehicle?.chassis_number],
          ]}/>
          <InfoCard title="Pricing" rows={[
            ['Daily Rate', fmt(a.snapshot_daily_rate || a.daily_rate)],
            ['Allowed KM/Day', a.snapshot_km_allowance || a.km_allowance_per_day],
            ['Extra KM Rate', fmt(a.snapshot_extra_km_rate || a.rate_per_extra_km)],
            ['Estimated Total', fmt(a.estimated_amount)],
            ['Actual Total', fmt(a.actual_amount)],
            ['Deposit', fmt(a.deposit_amount)],
          ]}/>
        </div>
      )}

      {tab==='comparison' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-1/4">Field</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-blue-600"><HiOutlineCheckCircle className="inline h-4 w-4 mr-1"/>Checkout</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-600"><HiOutlineCheckCircle className="inline h-4 w-4 mr-1"/>Return</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Difference</th>
              </tr></thead>
              <tbody>
                <tr className="bg-white"><td className="px-4 py-2.5 text-gray-500 text-xs font-medium">Odometer</td>
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
          {(coPhotos.length > 0 || retPhotos.length > 0) ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-bold text-blue-700 mb-3">📷 Checkout Photos ({coPhotos.length})</p>
                <PhotoGrid photos={coPhotos}/>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-sm font-bold text-emerald-700 mb-3">📷 Return Photos ({retPhotos.length})</p>
                <PhotoGrid photos={retPhotos}/>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <HiOutlineCamera className="h-12 w-12 mx-auto mb-3 text-gray-300"/>
              <p>No photos recorded for this agreement</p>
            </div>
          )}
        </div>
      )}

      {tab==='charges' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {!charges.length ? <div className="text-center py-12 text-gray-400">No charges recorded</div> : (
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
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
                <td colSpan={2} className="px-4 py-3 text-gray-700">Total</td>
                <td className="px-4 py-3 text-right">{fmt(charges.reduce((s,c)=>s+parseFloat(c.amount||0),0))}</td>
                <td/>
              </tr></tfoot>
            </table>
          )}
        </div>
      )}

      <style>{`@media print{.print\\:hidden{display:none!important}}`}</style>
    </div>
  );
}
