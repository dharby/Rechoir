import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Heart,
  DollarSign,
  Calendar,
  CheckSquare,
  Shirt,
  Music,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  Church,
  Bell,
  ClipboardCheck,
  Link2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import useThemeStore, { getThemeColors } from '../../stores/themeStore';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isDark } = useThemeStore();
  const colors = getThemeColors(isDark);
  const navigate = useNavigate();
  
  const userStr = localStorage.getItem('rechoir_user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const isTeamLead = user?.role === 'TEAM_LEAD' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isMember = user?.role === 'MEMBER';

  const mainNavItems = isMember
    ? [
        { path: '/member/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/member/songs', icon: Music, label: 'Songs' },
        { path: '/member/chat', icon: MessageSquare, label: 'Chat' },
      ]
    : [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/members', icon: Users, label: 'Members' },
        { path: '/prayer-chains', icon: Heart, label: 'Prayer Chains' },
        { path: '/prayer-calendar', icon: Calendar, label: 'Prayer Calendar' },
        { path: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
        { path: '/payments', icon: DollarSign, label: 'Payments' },
        { path: '/rehearsals', icon: Calendar, label: 'Rehearsals' },
        { path: '/checklists', icon: CheckSquare, label: 'Checklists' },
        { path: '/uniforms', icon: Shirt, label: 'Uniforms' },
        { path: '/songs', icon: Music, label: 'Songs' },
        { path: '/chat', icon: MessageSquare, label: 'Chat' },
        { path: '/broadcast', icon: Bell, label: 'Broadcast' },
        { path: '/invite', icon: Link2, label: 'Invite Members' },
      ];

  const handleLogout = () => {
    localStorage.removeItem('rechoir_user');
    localStorage.removeItem('rechoir_token');
    localStorage.removeItem('rechoir_team');
    navigate('/login');
  };

  return (
    <aside
      style={{
        width: collapsed ? '80px' : '260px',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        borderRight: `1px solid ${colors.border}`,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        boxShadow: isDark ? 'none' : '4px 0 20px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          padding: collapsed ? '20px 10px' : '20px 24px',
          borderBottom: `1px solid ${colors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)', borderRadius: '10px', padding: '6px' }}>
              <Church size={20} color="#fff" />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '700', color: colors.text }}>
              RECHOIR
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: colors.textSecondary,
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.surfaceHover}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <ChevronLeft
            size={20}
            style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}
          />
        </button>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {mainNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: collapsed ? '12px' : '12px 16px',
                  borderRadius: '12px',
                  color: isActive ? '#fff' : colors.textSecondary,
                  backgroundColor: isActive ? 'linear-gradient(135deg, #1e40af, #7c3aed)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  ...(isActive && {
                    background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
                    boxShadow: '0 4px 15px rgba(30, 64, 175, 0.3)',
                  }),
                })}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{ padding: '16px 12px', borderTop: `1px solid ${colors.border}` }}>
        {!isMember && (
          <NavLink
            to="/settings"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: collapsed ? '12px' : '12px 16px',
              borderRadius: '12px',
              color: isActive ? '#fff' : colors.textSecondary,
              backgroundColor: 'transparent',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              justifyContent: collapsed ? 'center' : 'flex-start',
            })}
          >
            <Settings size={20} />
            {!collapsed && <span>Settings</span>}
          </NavLink>
        )}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: collapsed ? '12px' : '12px 16px',
            borderRadius: '12px',
            color: colors.textSecondary,
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)';
            e.currentTarget.style.color = colors.error;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.textSecondary;
          }}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;