'use client'

import { useState } from 'react'
import { Sparkles, Calendar, CheckCircle, Users, Star, TrendingUp, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react'

export default function RendetaljeOSSimple() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (loginForm.email === 'admin@rendetalje.dk' && loginForm.password === 'rendetalje2024') {
      setIsLoggedIn(true)
    }
  }

  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  }

  const backgroundStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)',
    position: 'relative' as const,
  }

  const buttonStyle = {
    ...glassCardStyle,
    padding: '12px 24px',
    color: 'white',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '14px',
    fontWeight: '500',
  }

  const inputStyle = {
    ...glassCardStyle,
    padding: '12px 16px',
    color: 'white',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
  }

  if (!isLoggedIn) {
    return (
      <div style={backgroundStyle}>
        {/* Animated background orbs */}
        <div style={{
          position: 'absolute',
          top: '25%',
          left: '25%',
          width: '384px',
          height: '384px',
          background: 'rgba(59, 130, 246, 0.2)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'pulse 4s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          top: '75%',
          right: '25%',
          width: '384px',
          height: '384px',
          background: 'rgba(147, 51, 234, 0.2)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'pulse 4s ease-in-out infinite 1s',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '25%',
          left: '50%',
          width: '384px',
          height: '384px',
          background: 'rgba(6, 182, 212, 0.2)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          animation: 'pulse 4s ease-in-out infinite 2s',
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '16px',
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{
            ...glassCardStyle,
            width: '100%',
            maxWidth: '400px',
            padding: '32px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Sparkles size={32} color="white" />
              </div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px',
              }}>
                Rendetalje OS
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                Professionel rengøringsstyring - Tekup Ecosystem
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <input
                  type="password"
                  placeholder="Adgangskode"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>
              <button type="submit" style={{
                ...buttonStyle,
                width: '100%',
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              }}>
                Log ind
              </button>
            </form>

            <div style={{
              ...glassCardStyle,
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
            }}>
              <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Demo Login:
              </h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', margin: '4px 0' }}>
                Email: admin@rendetalje.dk
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', margin: '4px 0' }}>
                Password: rendetalje2024
              </p>
            </div>
          </div>
        </div>

        {/* Tekup Ecosystem Indicator */}
        <div style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 50,
        }}>
          <div style={{
            ...glassCardStyle,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              background: '#10b981',
              borderRadius: '50%',
              animation: 'pulse 2s ease-in-out infinite',
            }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
              Tekup Ecosystem
            </span>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={backgroundStyle}>
      <div style={{
        ...glassCardStyle,
        margin: '32px',
        padding: '32px',
        position: 'relative',
        zIndex: 10,
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Kontrolpanel
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '32px' }}>
          Oversigt over Rendetalje OS aktiviteter
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}>
          <div style={{
            ...glassCardStyle,
            padding: '24px',
            transition: 'transform 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '8px' }}>
                  Aktive opgaver
                </p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  15
                </p>
              </div>
              <CheckCircle size={40} color="#10b981" />
            </div>
          </div>

          <div style={{
            ...glassCardStyle,
            padding: '24px',
            transition: 'transform 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '8px' }}>
                  Medarbejdere
                </p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  12
                </p>
              </div>
              <Users size={40} color="#3b82f6" />
            </div>
          </div>

          <div style={{
            ...glassCardStyle,
            padding: '24px',
            transition: 'transform 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '8px' }}>
                  Månedlig omsætning
                </p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  125.000 kr
                </p>
              </div>
              <TrendingUp size={40} color="#8b5cf6" />
            </div>
          </div>

          <div style={{
            ...glassCardStyle,
            padding: '24px',
            transition: 'transform 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '8px' }}>
                  Kundetilfredshed
                </p>
                <p style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  4.9/5
                </p>
              </div>
              <Star size={40} color="#f59e0b" />
            </div>
          </div>
        </div>

        <div style={{
          ...glassCardStyle,
          padding: '24px',
          marginBottom: '24px',
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            🧹 Rendetalje Services
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px', fontSize: '14px' }}>
            Vores professionelle rengøringsydelser
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}>
            {[
              { icon: '🧹', name: 'Daglig rengøring', price: '150 kr', duration: '120 min' },
              { icon: '✨', name: 'Hovedrengøring', price: '300 kr', duration: '240 min' },
              { icon: '🪟', name: 'Vinduespudsning', price: '200 kr', duration: '90 min' },
              { icon: '🎉', name: 'Event cleanup', price: '250 kr', duration: '180 min' },
            ].map((service, index) => (
              <div key={index} style={{
                ...glassCardStyle,
                padding: '16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                transition: 'transform 0.3s ease',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>{service.icon}</div>
                <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>
                  {service.name}
                </h3>
                <p style={{ color: '#06b6d4', fontWeight: 'bold', fontSize: '14px' }}>{service.price}</p>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>⏱️ {service.duration}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
          <div style={{
            ...glassCardStyle,
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
          }}>
            <span>💰</span>
            <span>349 kr/time inkl. moms</span>
          </div>
          <div style={{
            ...glassCardStyle,
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
          }}>
            <span>📱</span>
            <span>MobilePay: 71759</span>
          </div>
          <div style={{
            ...glassCardStyle,
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
          }}>
            <span>📍</span>
            <span>Aarhus og omegn</span>
          </div>
        </div>

        <button
          onClick={() => setIsLoggedIn(false)}
          style={{
            ...buttonStyle,
            position: 'absolute',
            top: '24px',
            right: '24px',
            padding: '8px 16px',
            fontSize: '12px',
          }}
        >
          <LogOut size={16} style={{ marginRight: '8px' }} />
          Log ud
        </button>
      </div>
    </div>
  )
}
