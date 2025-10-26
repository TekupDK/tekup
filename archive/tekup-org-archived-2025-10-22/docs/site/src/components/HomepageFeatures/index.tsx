import React from 'react';
import clsx from 'clsx';
import Translate, {translate} from '@docusaurus/Translate';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: translate({
      id: 'homepage.features.aiFirst.title',
      message: 'AI-First Architecture',
    }),
    Svg: require('@site/static/img/ai-brain.svg').default,
    description: (
      <Translate id="homepage.features.aiFirst.description">
        Built with AI integration at its core, featuring Gemini Live API integration 
        for advanced voice processing and intelligent automation across all business processes.
      </Translate>
    ),
  },
  {
    title: translate({
      id: 'homepage.features.multiTenant.title',
      message: 'Multi-Tenant Platform',
    }),
    Svg: require('@site/static/img/multi-tenant.svg').default,
    description: (
      <Translate id="homepage.features.multiTenant.description">
        Robust multi-tenancy with Row Level Security (RLS) ensuring complete data isolation 
        between tenants while maintaining shared infrastructure efficiency.
      </Translate>
    ),
  },
  {
    title: translate({
      id: 'homepage.features.comprehensive.title',
      message: 'Comprehensive Ecosystem',
    }),
    Svg: require('@site/static/img/ecosystem.svg').default,
    description: (
      <Translate id="homepage.features.comprehensive.description">
        25+ interconnected applications working as a unified organism, from CRM and lead 
        management to voice AI and security compliance - all documented and integrated.
      </Translate>
    ),
  },
  {
    title: translate({
      id: 'homepage.features.realTime.title',
      message: 'Real-Time Communication',
    }),
    Svg: require('@site/static/img/real-time.svg').default,
    description: (
      <Translate id="homepage.features.realTime.description">
        Advanced WebSocket-based real-time communication system enabling instant updates, 
        live collaboration, and seamless data synchronization across all applications.
      </Translate>
    ),
  },
  {
    title: translate({
      id: 'homepage.features.security.title',
      message: 'Enterprise Security',
    }),
    Svg: require('@site/static/img/security.svg').default,
    description: (
      <Translate id="homepage.features.security.description">
        Comprehensive security framework with JWT authentication, role-based access control, 
        compliance monitoring, and automated incident response capabilities.
      </Translate>
    ),
  },
  {
    title: translate({
      id: 'homepage.features.danish.title',
      message: 'Danish Market Focus',
    }),
    Svg: require('@site/static/img/danish-flag.svg').default,
    description: (
      <Translate id="homepage.features.danish.description">
        Specialized for the Danish SME market with native Danish language support, 
        local compliance frameworks, and culturally adapted business processes.
      </Translate>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3 className={styles.featureTitle}>{title}</h3>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          <div className="col col--12">
            <div className="text--center margin-bottom--lg">
              <h2 className={styles.featuresTitle}>
                <Translate id="homepage.features.title">
                  Why Choose TekUp?
                </Translate>
              </h2>
              <p className={styles.featuresSubtitle}>
                <Translate id="homepage.features.subtitle">
                  A comprehensive AI-powered business platform designed for Danish SMEs, 
                  combining cutting-edge technology with practical business solutions.
                </Translate>
              </p>
            </div>
          </div>
        </div>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
        <div className="row margin-top--lg">
          <div className="col col--12">
            <div className="text--center">
              <h3 className={styles.ctaTitle}>
                <Translate id="homepage.cta.title">
                  Ready to Get Started?
                </Translate>
              </h3>
              <p className={styles.ctaDescription}>
                <Translate id="homepage.cta.description">
                  Explore our comprehensive documentation, try our APIs, or dive into 
                  the technical architecture to understand how TekUp can transform your business.
                </Translate>
              </p>
              <div className={styles.ctaButtons}>
                <a
                  className="button button--primary button--lg margin--sm"
                  href="/docs/getting-started">
                  <Translate id="homepage.cta.documentation">
                    Browse Documentation
                  </Translate>
                </a>
                <a
                  className="button button--secondary button--lg margin--sm"
                  href="/api">
                  <Translate id="homepage.cta.api">
                    Explore APIs
                  </Translate>
                </a>
                <a
                  className="button button--outline button--secondary button--lg margin--sm"
                  href="/whitepapers">
                  <Translate id="homepage.cta.whitepapers">
                    Read Whitepapers
                  </Translate>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}