'use client';

import { ReactNode } from 'react';
import { HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown } from 'react-icons/hi2';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color?: string;
}

export function StatsCard({ title, value, icon, trend, color = '#0E7490' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#CBD5E1] shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#64748B] truncate">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isUp ? (
                <HiOutlineArrowTrendingUp size={16} className="text-green-500" />
              ) : (
                <HiOutlineArrowTrendingDown size={16} className="text-red-500" />
              )}
              <span
                className={`text-xs font-semibold ${
                  trend.isUp ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value}%
              </span>
              <span className="text-xs text-[#64748B]">vs last period</span>
            </div>
          )}
        </div>
        <div
          className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
