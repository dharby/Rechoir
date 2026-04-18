import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell, Sun, Moon, Menu, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import useAuthStore from '../../stores/authStore';
import useThemeStore, { getThemeColors } from '../../stores/themeStore';
import { useState, useEffect } from 'react';

const MainLayout = () => {
  const { profile } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const colors = getThemeColors(isDark);
  const isMember = profile?.role === 'MEMBER';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      transition: 'background-color 0.3s ease',
      flexDirection: 'column',
    }}>
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            zIndex: 200,
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: colors.text,
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span style={{ fontSize: '18px', fontWeight: '700', color: colors.text }}>
            RECHOIR
          </span>
          <div style={{ width: '40px' }} />
        </div>
      )}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 250,
          }}
        />
      )}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />
      <main
        className="main-content"
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : '260px',
          padding: isMobile ? '80px 16px 32px' : '32px',
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