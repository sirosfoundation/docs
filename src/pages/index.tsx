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
      <Heading as="h1" className={styles.heroTitle}>
        <span className={styles.heroTitleBrand}>
          <svg className={styles.heroTitleLogo} width={50} height={50} viewBox='0 0 50 50'>
            <image href='img/logo.svg' width={50} height={50} />
          </svg>
          SIROS Foundation
        </span>
        <span>Developer Docs</span>
      </Heading>
      {siteConfig.tagline && <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>}
      <div className={styles.heroButtons}>
        <Link
          className="button button--secondary button--lg"
          to="/docs/sirosid">
          SIROS ID
        </Link>
        <Link
          className="button button--secondary button--lg"
          to="/docs/wwwallet">
          wwWallet
        </Link>
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
