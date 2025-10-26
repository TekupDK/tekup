import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { User, Settings, Shield, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface UserMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserMenu({ isOpen, onClose }: UserMenuProps) {
  const { user, logout } = useAuth()

  if (!isOpen || !user) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="absolute right-0 mt-2 w-64 glass-dark rounded-xl border border-white/10 shadow-xl py-2 z-50"
    >
      {/* User Info */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <div className="font-medium text-white">{user.name}</div>
            <div className="text-sm text-slate-400">{user.email}</div>
            <div className="text-xs text-accent-400">{user.role}</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        <Link
          to="/settings/profile"
          className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors group"
          onClick={onClose}
        >
          <User className="w-4 h-4" />
          <span className="flex-1">Profil indstillinger</span>
          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        
        <Link
          to="/settings"
          className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors group"
          onClick={onClose}
        >
          <Settings className="w-4 h-4" />
          <span className="flex-1">Indstillinger</span>
          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>

        {user.role === 'SUPER_ADMIN' && (
          <Link
            to="/admin"
            className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 transition-colors group"
            onClick={onClose}
          >
            <Shield className="w-4 h-4" />
            <span className="flex-1">Administration</span>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        )}
      </div>

      <div className="border-t border-white/10 pt-2">
        <button
          onClick={() => {
            onClose()
            logout()
          }}
          className="flex items-center gap-3 px-4 py-2 w-full text-left text-danger-300 hover:text-danger-200 hover:bg-danger-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log ud</span>
        </button>
      </div>
    </motion.div>
  )
}

