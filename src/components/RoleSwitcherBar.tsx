import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Shield, Store, HeartHandshake, User as UserIcon, Check, Sparkles, UserPlus } from 'lucide-react';

interface Props {
  onOpenRegisterModal: () => void;
  onRoleSwitched?: (role: Role) => void;
}

export const RoleSwitcherBar: React.FC<Props> = ({ onOpenRegisterModal, onRoleSwitched }) => {
  const { user, role, switchRole, isLoading } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const rolesConfig: { id: Role; label: string; name: string; icon: React.ReactNode; desc: string; badge: string }[] = [
    {
      id: 'customer',
      label: 'Customer',
      name: 'Alex Rivera',
      icon: <UserIcon className="w-4 h-4 text-emerald-600" />,
      desc: 'Browse dishes, get personalized recommendations, discover Taste Twins, & reserve surplus deals.',
      badge: 'Foodie & Taste Match'
    },
    {
      id: 'vendor',
      label: 'Vendor / Fest Stall',
      name: 'Chef Marco / Ramesh',
      icon: <Store className="w-4 h-4 text-orange-600" />,
      desc: 'Manage inventory in ₹, select business type (Restaurant, Canteen, Fest Stall), set surplus discounts & donate.',
      badge: 'Restaurant, Canteen & Fest Stall'
    },
    {
      id: 'ngo',
      label: 'NGO Volunteer',
      name: 'Sarah Jenkins',
      icon: <HeartHandshake className="w-4 h-4 text-rose-600" />,
      desc: 'Claim safe surplus food donations for community shelters, coordinate pickups, & track impact.',
      badge: 'City Food Rescue'
    },
    {
      id: 'admin',
      label: 'Administrator',
      name: 'Elena Rostova',
      icon: <Shield className="w-4 h-4 text-indigo-600" />,
      desc: 'Full system oversight: inventory audit, platform impact verification, and organization controls.',
      badge: 'System Admin'
    }
  ];

  return (
    <div className="bg-stone-900 text-stone-200 border-b border-stone-800 text-xs py-2 px-4 select-none transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Current Active Role status */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-bold text-stone-100 uppercase tracking-wider text-[11px] bg-stone-800 px-2 py-0.5 rounded-md">
            <Sparkles className="w-3 h-3 text-amber-400" /> Demo Role Switcher:
          </span>
          <span className="text-stone-300 hidden sm:inline">
            Currently acting as: <strong className="text-white font-semibold">{user?.name || 'Customer'}</strong> ({rolesConfig.find(r => r.id === role)?.badge})
          </span>
        </div>

        {/* Center / Right: Quick switch buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {rolesConfig.map(r => {
            const isActive = role === r.id;
            return (
              <button
                key={r.id}
                onClick={async () => {
                  await switchRole(r.id);
                  onRoleSwitched?.(r.id);
                }}
                disabled={isLoading}
                title={r.desc}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-stone-950 font-bold shadow-xs'
                    : 'bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white'
                }`}
              >
                {r.icon}
                <span>{r.label}</span>
                {isActive && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            );
          })}

          <button
            onClick={onOpenRegisterModal}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 hover:border-amber-400 transition-all cursor-pointer ml-1"
          >
            <UserPlus className="w-3 h-3" />
            <span>New User</span>
          </button>
        </div>
      </div>
    </div>
  );
};
