import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Translate, {translate} from '@docusaurus/Translate';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">
          <Translate id="homepage.title">
            {siteConfig.title}
          </Translate>
        </h1>
        <p className="hero__subtitle">
          <Translate id="homepage.tagline">
            {siteConfig.tagline}
          </Translate>
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started">
            <Translate id="homepage.getStarted">
              Get Started - 5min ⏱️
            </Translate>
          </Link>
          <Link
            className="button button--outline button--secondary button--lg margin-left--md"
            to="/api">
            <Translate id="homepage.apiReference">
              API Reference
            </Translate>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={translate({
        id: 'homepage.metaTitle',
        message: `Hello from ${siteConfig.title}`,
      })}
      description={translate({
        id: 'homepage.metaDescription',
        message: 'Comprehensive documentation for the TekUp AI-powered business platform',
      })}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}