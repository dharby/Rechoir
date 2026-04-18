import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Sun, Moon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import useThemeStore, { getThemeColors } from '../../stores/themeStore';

const MainLayout = () => {
  const { profile } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const colors = getThemeColors(isDark);
  const isMember = profile?.role === 'MEMBER';

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false);
        return { unreadCount: count || 0 };
      } catch {
        return { unreadCount: 0 };
      }
    },
    enabled: !isMember,
    refetchInterval: 60000,
  });

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: colors.bg,
      transition: 'background-color 0.3s ease'
    }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: '260px',
          padding: '32px',
          minHeight: '100vh',
          transition: 'background-color 0.3s ease',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '32px',
            gap: '16px',
          }}
        >
          <button
            onClick={toggleTheme}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              color: colors.textSecondary,
              cursor: 'pointer',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colors.surfaceHover;
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = colors.surface;
              e.target.style.transform = 'scale(1)';
            }}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {!isMember && (
            <button
              style={{
                position: 'relative',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.textSecondary,
                cursor: 'pointer',
                padding: '10px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.surfaceHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.surface;
              }}
            >
              <Bell size={20} />
              {unreadData?.unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: colors.error,
                  }}
                />
              )}
            </button>
          )}
        </header>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;