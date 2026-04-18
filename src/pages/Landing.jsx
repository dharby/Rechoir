import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Church, Users, Music, Calendar, ChevronRight, Star, Sparkles } from 'lucide-react';
import useThemeStore, { getThemeColors } from '../stores/themeStore';

const AnimatedText = ({ text, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <span
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease-out',
        display: 'inline-block',
      }}
    >
      {text}
    </span>
  );
};

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

const FloatingCard = ({ icon: Icon, title, delay, left }) => (
  <FadeIn delay={delay}>
    <div
      style={{
        position: 'absolute',
        [left ? 'left' : 'right']: left ? '-80px' : '-60px',
        top: '20%',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: `float 6s ease-in-out infinite`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #d97706, #f59e0b)',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
        }}
      >
        <Icon size={24} color="#fff" />
      </div>
      <div>
        <div style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>{title}</div>
      </div>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  </FadeIn>
);

const Landing = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const colors = getThemeColors(isDark);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
        background: isDark 
          ? `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(30, 64, 175, 0.3) 0%, #0f172a 50%)`
          : `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.15) 0%, #f8fafc 50%)`,
        transition: 'background 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Elements */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 100px,
            ${isDark ? 'rgba(30, 64, 175, 0.03)' : 'rgba(59, 130, 246, 0.02)'} 100px,
            ${isDark ? 'rgba(30, 64, 175, 0.03)' : 'rgba(59, 130, 246, 0.02)'} 200px
          )`,
          animation: 'slide 20s linear infinite',
        }}
      >
        <style>{`
          @keyframes slide {
            0% { transform: translate(0, 0); }
            100% { transform: translate(100px, 100px); }
          }
        `}</style>
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            background: isDark ? 'rgba(217, 119, 6, 0.4)' : 'rgba(245, 158, 11, 0.3)',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `pulse ${Math.random() * 4 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        >
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.5); opacity: 1; }
            }
          `}</style>
        </div>
      ))}

      {/* Header */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '24px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: isDark ? 'none' : 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
              borderRadius: '12px',
              padding: '10px',
              display: 'flex',
            }}
          >
            <Church size={28} color="#fff" />
          </div>
          <span
            style={{
              fontSize: '28px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #1e40af, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}
          >
            RECHOIR
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={toggleTheme}
            style={{
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '12px',
              padding: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isDark ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
          <Link
            to="/login"
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              color: isDark ? '#f8fafc' : '#0f172a',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
          >
            Sign In
          </Link>
          <Link
            to="/register"
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
              textDecoration: 'none',
              color: '#fff',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(30, 64, 175, 0.3)',
            }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ position: 'relative', zIndex: 10, padding: '80px 48px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
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
                  padding: '8px 16px',
                  marginBottom: '24px',
                }}
              >
                <Sparkles size={16} color={isDark ? '#d97706' : '#f59e0b'} />
                <span style={{ color: isDark ? '#d97706' : '#f59e0b', fontWeight: '500', fontSize: '14px' }}>
                  <AnimatedText text="Choir Management Reimagined" />
                </span>
              </div>
            </FadeIn>

            <h1
              style={{
                fontSize: '64px',
                fontWeight: '800',
                lineHeight: '1.1',
                marginBottom: '24px',
                color: isDark ? '#f8fafc' : '#0f172a',
              }}
            >
              <AnimatedText text="Organize Your" delay={200} />{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #1e40af, #d97706)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                <AnimatedText text="Choir" delay={300} />
              </span>
              <br />
              <AnimatedText text="Like Never Before" delay={400} />
            </h1>

            <FadeIn delay={500}>
              <p
                style={{
                  fontSize: '20px',
                  lineHeight: '1.6',
                  color: isDark ? '#94a3b8' : '#64748b',
                  marginBottom: '40px',
                  maxWidth: '500px',
                }}
              >
                The all-in-one platform for church choir operations. 
                Manage members, schedules, songs, payments, and more 
                with professional-grade tools.
              </p>
            </FadeIn>

            <FadeIn delay={600}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '48px' }}>
                <Link
                  to="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 32px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
                    textDecoration: 'none',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '16px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 8px 30px rgba(30, 64, 175, 0.4)',
                  }}
                >
                  Start Free Trial
                  <ChevronRight size={20} />
                </Link>
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '16px 32px',
                    borderRadius: '14px',
                    background: 'transparent',
                    border: `2px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontWeight: '600',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Watch Demo
                </button>
              </div>
            </FadeIn>

            <FadeIn delay={700}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      color="#f59e0b"
                      fill="#f59e0b"
                      style={{ marginLeft: i === 0 ? 0 : -4 }}
                    />
                  ))}
                </div>
                <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '14px' }}>
                  Trusted by 500+ churches
                </span>
              </div>
            </FadeIn>
          </div>

          {/* Right Content - Animated Dashboard Preview */}
          <div style={{ position: 'relative' }}>
            <FloatingCard icon={Users} title="500+ Members" delay={800} left />
            <FloatingCard icon={Calendar} title="50+ Events" delay={1000} left={false} />
            
            <FadeIn delay={500}>
              <div
                style={{
                  background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '24px',
                  padding: '32px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                }}
              >
                {/* Dashboard Preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1e40af, #7c3aed)' }} />
                  <div>
                    <div style={{ width: 120, height: 16, borderRadius: 4, background: isDark ? '#334155' : '#e2e8f0', marginBottom: 4 }} />
                    <div style={{ width: 80, height: 12, borderRadius: 4, background: isDark ? '#1e293b' : '#f1f5f9' }} />
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  {[
                    { label: 'Active Members', value: '247', color: '#1e40af' },
                    { label: 'This Week', value: '12', color: '#059669' },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      style={{
                        background: isDark ? '#1e293b' : '#f8fafc',
                        borderRadius: '16px',
                        padding: '20px',
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                      }}
                    >
                      <div style={{ fontSize: '32px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Progress Bars */}
                {[
                  { label: 'Song Readiness', value: 78 },
                  { label: 'Attendance', value: 92 },
                ].map((progress, i) => (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b' }}>{progress.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: isDark ? '#f8fafc' : '#0f172a' }}>{progress.value}%</span>
                    </div>
                    <div style={{ height: 8, background: isDark ? '#1e293b' : '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${progress.value}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #1e40af, #7c3aed)',
                          borderRadius: 4,
                          animation: `grow 1s ease-out`,
                        }}
                      />
                    </div>
                  </div>
                ))}
                <style>{`
                  @keyframes grow {
                    from { width: 0; }
                  }
                `}</style>
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Features Section */}
        <div style={{ marginTop: '120px' }}>
          <FadeIn delay={800}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2
                style={{
                  fontSize: '48px',
                  fontWeight: '700',
                  color: isDark ? '#f8fafc' : '#0f172a',
                  marginBottom: '16px',
                }}
              >
                Everything You Need
              </h2>
              <p
                style={{
                  fontSize: '18px',
                  color: isDark ? '#94a3b8' : '#64748b',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                Powerful features designed specifically for church choir management
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {features.map((feature, i) => (
              <FadeIn delay={900 + i * 100} key={i}>
                <div
                  style={{
                    background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    padding: '32px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px',
                    }}
                  >
                    <feature.icon size={28} color="#fff" />
                  </div>
                  <h3
                    style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      marginBottom: '8px',
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b' }}>
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
          padding: '48px',
          marginTop: '80px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)', borderRadius: '8px', padding: '8px' }}>
              <Church size={20} color="#fff" />
            </div>
            <span style={{ fontSize: '18px', fontWeight: '600', color: isDark ? '#f8fafc' : '#0f172a' }}>RECHOIR</span>
          </div>
          <p style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '14px' }}>
            © 2025 RECHOIR. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;