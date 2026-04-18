import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Church, Users, Music, Calendar, ChevronRight, Star, Sparkles } from 'lucide-react';
import useThemeStore, { getThemeColors } from '../stores/themeStore';

const FadeIn = ({ children, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s ease-out',
      }}
    >
      {children}
    </div>
  );
};

const Landing = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const colors = getThemeColors(isDark);

  const features = [
    { icon: Users, title: 'Member Management', desc: 'Manage choir members, roles & access' },
    { icon: Calendar, title: 'Schedule Planning', desc: 'Rehearsals, services & events' },
    { icon: Music, title: 'Song Readiness', desc: 'Track song progress & assignments' },
    { icon: Church, title: 'Prayer Chains', desc: 'Organize prayer schedules' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark ? '#0f172a' : '#f8fafc',
        transition: 'background 0.3s ease',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .landing-header { padding: 16px 20px !important; flex-direction: column; gap: 12px; }
          .landing-hero { padding: 40px 20px !important; }
          .hero-title { font-size: 36px !important; line-height: 1.2 !important; }
          .hero-subtitle { font-size: 16px !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .hero-buttons { flex-direction: column; }
          .features-grid { grid-template-columns: 1fr !important; }
          .feature-card { padding: 20px !important; }
          .footer-content { flex-direction: column; gap: 16px; text-align: center; }
          .header-buttons { display: none !important; }
          .header-right { width: 100%; justify-content: center; }
        }
        @media (max-width: 480px) {
          .landing-hero { padding: 32px 16px !important; }
          .hero-title { font-size: 28px !important; }
          .feature-title { font-size: 16px !important; }
          .stat-value { font-size: 24px !important; }
        }
      `}</style>

      {/* Header */}
      <header
        className="landing-header"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '20px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
              borderRadius: '10px',
              padding: '8px',
              display: 'flex',
            }}
          >
            <Church size={24} color="#fff" />
          </div>
          <span
            style={{
              fontSize: '24px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #1e40af, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            RECHOIR
          </span>
        </div>

        <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={toggleTheme}
            style={{
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              cursor: 'pointer',
            }}
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
          <Link
            to="/login"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              textDecoration: 'none',
              color: isDark ? '#f8fafc' : '#0f172a',
              fontWeight: '500',
              fontSize: '14px',
            }}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
              textDecoration: 'none',
              color: '#fff',
              fontWeight: '600',
              fontSize: '14px',
            }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="landing-hero" style={{ position: 'relative', zIndex: 10, padding: '60px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
          {/* Left Content */}
          <div>
            <FadeIn delay={100}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isDark ? 'rgba(217, 119, 6, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                  border: `1px solid ${isDark ? 'rgba(217, 119, 6, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  borderRadius: '30px',
                  padding: '6px 12px',
                  marginBottom: '20px',
                }}
              >
                <Sparkles size={14} color={isDark ? '#d97706' : '#f59e0b'} />
                <span style={{ color: isDark ? '#d97706' : '#f59e0b', fontWeight: '500', fontSize: '12px' }}>
                  Choir Management
                </span>
              </div>
            </FadeIn>

            <h1
              className="hero-title"
              style={{
                fontSize: '52px',
                fontWeight: '800',
                lineHeight: '1.1',
                marginBottom: '20px',
                color: isDark ? '#f8fafc' : '#0f172a',
              }}
            >
              Organize Your{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #1e40af, #d97706)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Choir
              </span>
              <br />
              Like Never Before
            </h1>

            <FadeIn delay={300}>
              <p
                className="hero-subtitle"
                style={{
                  fontSize: '18px',
                  lineHeight: '1.6',
                  color: isDark ? '#94a3b8' : '#64748b',
                  marginBottom: '32px',
                  maxWidth: '480px',
                }}
              >
                The all-in-one platform for church choir operations. 
                Manage members, schedules, songs, payments, and more.
              </p>
            </FadeIn>

            <FadeIn delay={400}>
              <div className="hero-buttons" style={{ display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
                <Link
                  to="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
                    textDecoration: 'none',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                >
                  Start Free
                  <ChevronRight size={18} />
                </Link>
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '14px 24px',
                    borderRadius: '12px',
                    background: 'transparent',
                    border: `2px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Learn More
                </button>
              </div>
            </FadeIn>

            <FadeIn delay={500}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      color="#f59e0b"
                      fill="#f59e0b"
                      style={{ marginLeft: i === 0 ? 0 : -2 }}
                    />
                  ))}
                </div>
                <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '12px' }}>
                  Trusted by 500+ churches
                </span>
              </div>
            </FadeIn>
          </div>

          {/* Right Content */}
          <div style={{ display: { xs: 'none', md: 'block' } }}>
            <FadeIn delay={300}>
              <div
                style={{
                  background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  padding: '24px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }} />
                  <div>
                    <div style={{ width: 100, height: 14, borderRadius: 4, background: isDark ? '#334155' : '#e2e8f0', marginBottom: 4 }} />
                    <div style={{ width: 60, height: 10, borderRadius: 4, background: isDark ? '#1e293b' : '#f1f5f9' }} />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'Active Members', value: '247', color: '#1e40af' },
                    { label: 'This Week', value: '12', color: '#059669' },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      style={{
                        background: isDark ? '#1e293b' : '#f8fafc',
                        borderRadius: '14px',
                        padding: '16px',
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                      }}
                    >
                      <div className="stat-value" style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ marginTop: '80px' }}>
          <FadeIn delay={600}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2
                style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  marginBottom: '12px',
                }}
              >
                Everything You Need
              </h2>
              <p
                style={{
                  fontSize: '16px',
                  color: isDark ? '#94a3b8' : '#64748b',
                  maxWidth: '500px',
                  margin: '0 auto',
                }}
              >
                Powerful features designed specifically for church choir management
              </p>
            </div>
          </FadeIn>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {features.map((feature, i) => (
              <FadeIn delay={700 + i * 100} key={i}>
                <div
                  className="feature-card"
                  style={{
                    background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <feature.icon size={24} color="#fff" />
                  </div>
                  <h3
                    className="feature-title"
                    style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      marginBottom: '6px',
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
                    {feature.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          position: 'relative',
          zIndex: 10,
          borderTop: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          padding: '32px 48px',
          marginTop: '60px',
        }}
      >
        <div className="footer-content" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)', borderRadius: '6px', padding: '6px' }}>
              <Church size={16} color="#fff" />
            </div>
            <span style={{ fontSize: '16px', fontWeight: '600', color: isDark ? '#f8fafc' : '#0f172a' }}>RECHOIR</span>
          </div>
          <p style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '12px' }}>
            © 2025 RECHOIR. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;