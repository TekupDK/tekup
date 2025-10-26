import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Multi-Tenant Architecture',
    Svg: require('@site/static/img/multi-tenant.svg').default,
    description: (
      <>
        Built from the ground up with multi-tenancy in mind. Row-level security,
        API key isolation, and tenant-aware routing ensure complete data separation.
      </>
    ),
  },
  {
    title: 'Real-Time Incident Response',
    Svg: require('@site/static/img/realtime.svg').default,
    description: (
      <>
        Sub-2 minute SLA for incident detection and response. WebSocket connections,
        real-time dashboards, and instant notifications keep your team informed.
      </>
    ),
  },
  {
    title: 'Cross-Platform Ecosystem',
    Svg: require('@site/static/img/ecosystem.svg').default,
    description: (
      <>
        Web, mobile, and desktop applications work seamlessly together.
        Flow API, CRM, mobile apps, and Inbox AI provide comprehensive coverage.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
