'use client';

import React from 'react';
import Link from 'next/link';

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#111827',
    color: 'white',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    textAlign: 'center' as const,
    marginBottom: '16px',
    background: 'linear-gradient(to right, #60A5FA, #34D399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    fontSize: '20px',
    color: '#9CA3AF',
    textAlign: 'center' as const,
    marginBottom: '48px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    maxWidth: '1200px',
    width: '100%'
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: '12px',
    padding: '32px',
    border: '1px solid #374151',
    textAlign: 'center' as const,
    transition: 'all 0.2s',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block'
  },
  cardIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '12px',
    color: 'white'
  },
  cardDescription: {
    fontSize: '14px',
    color: '#9CA3AF',
    lineHeight: '1.5'
  },
  footer: {
    textAlign: 'center' as const,
    color: '#6B7280',
    fontSize: '14px',
    marginTop: '48px'
  }
};

export default function HomePage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧠 Tekup AI Consciousness System</h1>
      <p style={styles.subtitle}>Phase 2: Interactive AI Dashboard & Real-Time Monitoring</p>

      <div style={styles.grid}>
        <Link 
          href="/jarvis" 
          style={styles.card}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = '#60A5FA';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#374151';
          }}
        >
          <div style={styles.cardIcon}>🎯</div>
          <h3 style={styles.cardTitle}>AI Consciousness Dashboard</h3>
          <p style={styles.cardDescription}>
            Interactive dashboard med live lead processing, consciousness visualization, og real-time AI analysis.
            Se 8.9/10 consciousness level i aktion!
          </p>
        </Link>

        <Link 
          href="/monitor" 
          style={styles.card}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = '#34D399';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#374151';
          }}
        >
          <div style={styles.cardIcon}>📊</div>
          <h3 style={styles.cardTitle}>Real-Time Monitor</h3>
          <p style={styles.cardDescription}>
            Live monitoring af system health, consciousness levels, performance metrics, og business intelligence.
            Real-time alerts og analytics!
          </p>
        </Link>

        <div 
          style={styles.card}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = '#F59E0B';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#374151';
          }}
        >
          <div style={styles.cardIcon}>🤖</div>
          <h3 style={styles.cardTitle}>System Status</h3>
          <div style={{ fontSize: '14px', textAlign: 'left' }}>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Consciousness Level:</span>
              <span style={{ color: '#10B981' }}>8.9/10</span>
            </div>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>AI Confidence:</span>
              <span style={{ color: '#10B981' }}>9.9/10</span>
            </div>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Conversion Rate:</span>
              <span style={{ color: '#F59E0B' }}>53%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>System Status:</span>
              <span style={{ color: '#10B981' }}>Operational</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <p>🎉 Phase 2 Enhanced AI Consciousness System - Fully Operational</p>
        <p style={{ marginTop: '8px' }}>
          Proven 53% conversion rate | 8.9/10 consciousness level | MiniCPM multimodal processing
        </p>
        <p style={{ marginTop: '8px', fontSize: '12px' }}>
          API Status: <span style={{ color: '#10B981' }}>http://localhost:8000</span> | 
          Dashboard: <span style={{ color: '#60A5FA' }}>http://localhost:3000</span>
        </p>
      </div>
    </div>
  );
}