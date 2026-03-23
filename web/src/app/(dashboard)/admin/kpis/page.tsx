'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiChartPie,
  HiTruck,
  HiCurrencyDollar,
  HiExclamationTriangle,
  HiCalculator,
} from 'react-icons/hi2';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { adminService } from '@/services/admin.service';
import { PageHeader } from '@/components/PageHeader';
import { StatsCard } from '@/components/StatsCard';
import type { KpiResponse } from '@/types';

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const BAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

function formatAED(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `AED ${num.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function KpiDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KpiResponse | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Default date range: current month
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  }, []);

  const fetchKpis = useCallback(async () => {
    if (!dateFrom || !dateTo) return;
    try {
      setLoading(true);
      const data = await adminService.getKpis({
        from: dateFrom,
        to: dateTo,
      });
      setKpiData(data);
    } catch (error) {
      toast.error('Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="KPI Dashboard" />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const fleet = kpiData?.fleet;
  const revenue = kpiData?.revenue;
  const risk = kpiData?.risk;
  const profit = kpiData?.profit;

  const fleetPieData = fleet
    ? [
        { name: 'Rented Days', value: fleet.rented_days ?? 0 },
        { name: 'Idle Days', value: fleet.idle_days ?? 0 },
        { name: 'Downtime Days', value: fleet.downtime_days ?? 0 },
      ]
    : [];

  const revenueBarData = revenue
    ? [
        { name: 'Base Rental', value: revenue.base_rental_revenue ?? 0 },
        { name: 'Extra KM', value: revenue.extra_km_revenue ?? 0 },
        { name: 'Late Fees', value: revenue.late_fee_revenue ?? 0 },
        { name: 'Fuel', value: revenue.fuel_revenue ?? 0 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="KPI Dashboard" />

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Fleet KPIs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <HiTruck className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Fleet KPIs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Vehicles"
            value={fleet?.total_vehicles ?? 0}
            icon={<HiTruck className="h-6 w-6" />}
          />
          <StatsCard
            title="Utilization Rate"
            value={`${(fleet?.utilization_percent ?? 0).toFixed(1)}%`}
            icon={<HiChartPie className="h-6 w-6" />}
          />
          <StatsCard
            title="Rented Days"
            value={fleet?.rented_days ?? 0}
            icon={<HiChartPie className="h-6 w-6" />}
          />
          <StatsCard
            title="Idle Days"
            value={fleet?.idle_days ?? 0}
            icon={<HiChartPie className="h-6 w-6" />}
          />
        </div>

        {fleetPieData.some((d) => d.value > 0) && (
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={300} maxHeight={300}>
              <PieChart>
                <Pie
                  data={fleetPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {fleetPieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Revenue KPIs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <HiCurrencyDollar className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">Revenue KPIs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Base Rental Revenue"
            value={formatAED(revenue?.base_rental_revenue ?? 0)}
            icon={<HiCurrencyDollar className="h-6 w-6" />}
          />
          <StatsCard
            title="Extras Total"
            value={formatAED(revenue?.extras_total ?? 0)}
            icon={<HiCurrencyDollar className="h-6 w-6" />}
          />
          <StatsCard
            title="Total Revenue"
            value={formatAED(revenue?.total_revenue ?? 0)}
            icon={<HiCurrencyDollar className="h-6 w-6" />}
          />
        </div>

        {revenueBarData.length > 0 && (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={revenueBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatAED(value as number)} />
              <Bar dataKey="value" name="Amount">
                {revenueBarData.map((_, index) => (
                  <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Risk KPIs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <HiExclamationTriangle className="h-5 w-5 text-yellow-600" />
          <h2 className="text-lg font-semibold">Risk KPIs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Damage Frequency"
            value={`${(risk?.damage_frequency ?? 0).toFixed(2)}%`}
            icon={<HiExclamationTriangle className="h-6 w-6" />}
          />
          <StatsCard
            title="Overdue Returns"
            value={risk?.overdue_return_count ?? 0}
            icon={<HiExclamationTriangle className="h-6 w-6" />}
          />
          <StatsCard
            title="Overdue Rate"
            value={`${(risk?.overdue_return_rate ?? 0).toFixed(1)}%`}
            icon={<HiExclamationTriangle className="h-6 w-6" />}
          />
        </div>
      </div>

      {/* Profit KPIs */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <HiCalculator className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Profit KPIs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatsCard
            title="Total Revenue"
            value={formatAED(profit?.total_revenue ?? 0)}
            icon={<HiCurrencyDollar className="h-6 w-6" />}
          />
          <StatsCard
            title="Total Cost"
            value={formatAED(profit?.total_cost ?? 0)}
            icon={<HiCalculator className="h-6 w-6" />}
          />
          <StatsCard
            title="Total Margin"
            value={formatAED(profit?.total_margin ?? 0)}
            icon={<HiCalculator className="h-6 w-6" />}
          />
        </div>

        {/* Per-Vehicle Breakdown Table */}
        {profit?.vehicles && profit.vehicles.length > 0 && (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-sm font-medium text-gray-500">
                  <th className="px-6 py-3">Vehicle</th>
                  <th className="px-6 py-3 text-right">Revenue</th>
                  <th className="px-6 py-3 text-right">Cost</th>
                  <th className="px-6 py-3 text-right">Margin</th>
                  <th className="px-6 py-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {profit.vehicles.map((vehicle, index: number) => {
                  const vRevenue = typeof vehicle.total_revenue === 'string' ? parseFloat(vehicle.total_revenue) : (vehicle.total_revenue ?? 0);
                  const vCost = typeof vehicle.total_cost === 'string' ? parseFloat(vehicle.total_cost) : (vehicle.total_cost ?? 0);
                  const vMarginAmt = typeof vehicle.margin === 'string' ? parseFloat(vehicle.margin) : (vehicle.margin ?? vRevenue - vCost);
                  const vMarginPct = vRevenue > 0 ? (vMarginAmt / vRevenue) * 100 : 0;
                  return (
                    <tr key={vehicle.vehicle_id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">
                        {vehicle.vehicle_number || `Vehicle ${vehicle.vehicle_id}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600">
                        {formatAED(vRevenue)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-600">
                        {formatAED(vCost)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium">
                        <span className={vMarginAmt >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatAED(vMarginAmt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className={vMarginPct >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {vMarginPct.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
