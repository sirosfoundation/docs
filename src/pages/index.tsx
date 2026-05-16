import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.hero}>
      <img
        src="/img/hero-bg.jpg"
        alt="Digital network visualization"
        className={styles.heroBg}
      />
      <div className={styles.heroOverlay} />

      <div className={styles.heroContent}>
        <Heading as="h1" className={styles.heroTitle}>
          <span className={styles.heroTitleAccent}>Developer Docs</span>
          <br />
          <span className={styles.heroTitleDark}>SIROS ID</span>
        </Heading>
        {siteConfig.tagline && (
          <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>
        )}
        <div className={styles.heroButtons}>
          <Link className="button button--primary button--lg" to="/sirosid">
            SIROS ID Documentation
          </Link>
          <Link className="button button--outline button--lg" to="/opensource">
            Open Source Projects
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Documentation site">
      <HomepageHeader />
    </Layout>
  );
}
