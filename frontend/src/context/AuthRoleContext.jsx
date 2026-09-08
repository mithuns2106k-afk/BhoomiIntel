import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthRoleContext = createContext(null);

export const ROLES = {
  RESEARCHER: 'researcher',
  POLICYMAKER: 'policymaker',
  PUBLIC: 'public'
};

const profileFor = (user) => ({
  name: user?.name || 'User',
  title: user?.designation || `${user?.role || 'public'} access`,
  affiliation: 'BhoomiIntel Land Governance Intelligence Platform',
  badge: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Public',
  badgeColor: user?.role === 'policymaker'
    ? 'bg-blue-100 text-blue-800 border-blue-300'
    : user?.role === 'researcher'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : 'bg-slate-100 text-slate-700 border-slate-300'
});

export function AuthRoleProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const result = await api.me();
      setUser(result.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const login = (nextUser) => setUser(nextUser);
  const logout = async () => { await api.logout(); setUser(null); };

  const role = user?.role || ROLES.PUBLIC;
  const permissions = {
    canUploadDocuments: role === ROLES.RESEARCHER,
    canRunSimulations: role === ROLES.POLICYMAKER || role === ROLES.RESEARCHER,
    canRunResearchAssistant: role === ROLES.RESEARCHER || role === ROLES.POLICYMAKER,
    isReadOnlyPublic: role === ROLES.PUBLIC
  };

  return (
    <AuthRoleContext.Provider value={{
      user,
      role,
      login,
      logout,
      refresh,
      loading,
      profile: profileFor(user),
      permissions
    }}>
      {children}
    </AuthRoleContext.Provider>
  );
}

export function useAuthRole() {
  const context = useContext(AuthRoleContext);
  if (!context) throw new Error('useAuthRole must be used within an AuthRoleProvider');
  return context;
}
