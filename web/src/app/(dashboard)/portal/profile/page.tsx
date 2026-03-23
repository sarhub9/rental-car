'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlinePencilSquare,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { customerPortalService } from '@/services/customer-portal.service';

interface ProfileData {
  email: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

const initialProfile: ProfileData = {
  email: '',
  full_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [original, setOriginal] = useState<ProfileData>(initialProfile);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await customerPortalService.getCustomerProfile();
      const data = res.data || {};
      const mapped: ProfileData = {
        email: data.email || '',
        full_name: data.full_name || data.name || '',
        phone: data.phone_number || '',
        address_line_1: data.address_line_1 || data.address?.line_1 || '',
        address_line_2: data.address_line_2 || data.address?.line_2 || '',
        city: data.city || data.address?.city || '',
        state: data.state || data.address?.state || '',
        postal_code: data.postal_code || data.address?.postal_code || '',
        country: data.country || data.address?.country || '',
      };
      setProfile(mapped);
      setOriginal(mapped);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await customerPortalService.updateCustomerProfile(profile as any);
      setOriginal(profile);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(original);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const fields: { key: keyof ProfileData; label: string; type?: string }[] = [
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'address_line_1', label: 'Address Line 1' },
    { key: 'address_line_2', label: 'Address Line 2' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'postal_code', label: 'Postal Code' },
    { key: 'country', label: 'Country' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and update your personal information.
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <HiOutlinePencilSquare className="h-4 w-4" />
            Edit Profile
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <HiOutlineXMark className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Avatar Placeholder */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full">
            <HiOutlineUser className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {profile.full_name || 'Customer'}
            </p>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              {editing ? (
                <input
                  name={field.key}
                  type={field.type || 'text'}
                  value={profile[field.key]}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile[field.key] || (
                    <span className="text-gray-400">Not provided</span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Save */}
        {editing && (
          <div className="mt-6 pt-6 border-t border-gray-200 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
