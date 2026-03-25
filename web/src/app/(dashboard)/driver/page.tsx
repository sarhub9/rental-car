'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
  HiOutlineFunnel,
} from 'react-icons/hi2';
import { driverTaskService } from '@/services/driver-task.service';
import { PageHeader } from '@/components/PageHeader';
import { StatsCard } from '@/components/StatsCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Spinner } from '@/components/Spinner';

type TaskStatus = 'ALL' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
type TaskType = 'ALL' | 'DELIVERY' | 'PICKUP' | 'RECOVERY';

export default function DriverDashboardPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    completedToday: 0,
    pending: 0,
    inProgress: 0,
  });
  const [statusFilter, setStatusFilter] = useState<TaskStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<TaskType>('ALL');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (typeFilter !== 'ALL') params.type = typeFilter;

      const [tasksRes, statsRes] = await Promise.all([
        driverTaskService.getDriverTasks(params),
        driverTaskService.getDriverTasks(),
      ]);

      // Handle response - API returns array directly after our service fix
      const tasksData = Array.isArray(tasksRes) ? tasksRes : (tasksRes.data || tasksRes);
      const statsData = Array.isArray(statsRes) ? statsRes : (statsRes.data || statsRes);

      setTasks(tasksData);
      setStats({
        completedToday: statsData.completed_today ?? 0,
        pending: statsData.pending ?? 0,
        inProgress: statsData.in_progress ?? 0,
      });
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to load driver tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'DELIVERY':
        return 'bg-blue-100 text-blue-800';
      case 'PICKUP':
        return 'bg-green-100 text-green-800';
      case 'RECOVERY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'HIGH':
      case 'URGENT':
        return 'text-red-600 font-semibold';
      case 'MEDIUM':
        return 'text-yellow-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Driver Dashboard" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Completed Today"
          value={stats.completedToday}
          icon={<HiOutlineCheckCircle className="h-8 w-8 text-green-500" />}
        />
        <StatsCard
          title="Pending Tasks"
          value={stats.pending}
          icon={<HiOutlineClock className="h-8 w-8 text-yellow-500" />}
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgress}
          icon={<HiOutlineArrowPath className="h-8 w-8 text-blue-500" />}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
        <HiOutlineFunnel className="h-5 w-5 text-gray-400" />
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TaskType)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="DELIVERY">Delivery</option>
            <option value="PICKUP">Pickup</option>
            <option value="RECOVERY">Recovery</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <HiOutlineTruck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No tasks found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => router.push(`/driver/tasks/${task.id}`)}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-4 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(task.type)}`}
                >
                  {task.type}
                </span>
                <StatusBadge status={task.status} />
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {task.vehicle?.plate_number ?? task.vehicle_plate ?? 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {task.vehicle?.make} {task.vehicle?.model}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="text-sm text-gray-700">
                    {task.customer?.name ?? task.customer_name ?? 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Destination</p>
                  <p className="text-sm text-gray-700 truncate">
                    {task.destination ?? task.destination_address ?? 'N/A'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Scheduled</p>
                    <p className="text-sm text-gray-700">
                      {task.scheduled_time
                        ? new Date(task.scheduled_time).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  <span className={`text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority ?? 'NORMAL'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
