import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'SIROS Developer Docs',
  favicon: 'img/favicon.ico',
  themes: ['@docusaurus/theme-mermaid'],
  markdown: { mermaid: true, },
  // No additional plugins needed beyond theme-mermaid

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://developers.siros.org',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'sirosfoundation', // Usually your GitHub org/user name.
  projectName: 'docs', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/sirosfoundation/docs/tree/main',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Developer Docs',
      logo: {
        alt: 'SIROS Foundation',
        src: 'img/siros-logo.png',
        style: { height: '32px' },
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'sirosIdSidebar',
          position: 'left',
          label: 'SIROS ID',
        },
        {
          type: 'docSidebar',
          sidebarId: 'walletSidebar',
          position: 'left',
          label: 'Credential Manager',
        },
        {
          type: 'docSidebar',
          sidebarId: 'howtoSidebar',
          position: 'left',
          label: 'How-To Guides',
        },
        {
          type: 'docSidebar',
          sidebarId: 'openSourceSidebar',
          position: 'left',
          label: 'Open Source',
        },
        {
          type: 'docSidebar',
          sidebarId: 'securitySidebar',
          position: 'left',
          label: 'Security',
        },
        {
          type: 'html',
          position: 'right',
          value: '<a href="https://github.com/sirosfoundation" target="_blank" rel="noopener noreferrer" aria-label="SIROS Foundation on GitHub" class="navbar-github-link"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 .5C5.73.5.66 5.57.66 11.84c0 5.02 3.25 9.27 7.76 10.77.57.1.78-.25.78-.55 0-.27-.01-1-.02-1.96-3.16.69-3.83-1.52-3.83-1.52-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.69.08-.69 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.52-.29-5.18-1.26-5.18-5.6 0-1.24.44-2.25 1.17-3.04-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.15 1.16.91-.25 1.89-.38 2.86-.38.97 0 1.95.13 2.86.38 2.18-1.47 3.14-1.16 3.14-1.16.62 1.57.23 2.73.11 3.02.73.79 1.17 1.8 1.17 3.04 0 4.35-2.67 5.31-5.21 5.59.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.66.79.55 4.5-1.5 7.75-5.75 7.75-10.77C23.34 5.57 18.27.5 12 .5Z"/></svg></a>',
        },
      ],
    },
    footer: {
      style: 'light',
      logo: {
        alt: 'SIROS Foundation',
        src: 'img/siros-logo.png',
        href: 'https://siros.org',
        height: 32,
      },
      copyright: `© ${new Date().getFullYear()} SIROS Foundation`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    // Mermaid diagram styling for professional appearance
    // Using 'base' theme for both light and dark to ensure consistent styling
    mermaid: {
      theme: {
        light: 'base',
        dark: 'base',
      },
      options: {
        // Improve rendering quality
        securityLevel: 'loose',
        // Theme variables for base theme customization
        theme: 'base',
        themeVariables: {
          // ===========================================
          // SIROS Brand Mermaid Theme
          // Base: SIROS Blue #1C4587
          // Complement: Orange #C75A11 (for notes/highlights)
          // ===========================================
          
          // Primary palette (SIROS Blue family)
          primaryColor: '#E8EEF7',           // Light blue-gray background
          primaryTextColor: '#1C4587',       // SIROS brand blue text
          primaryBorderColor: '#1C4587',     // SIROS brand blue border
          
          // Secondary palette (Teal/Cyan - analogous for variety)
          secondaryColor: '#E6F4F1',         // Light teal background
          secondaryTextColor: '#0F5132',     // Dark teal text
          secondaryBorderColor: '#198754',   // Teal border
          
          // Tertiary palette (Neutral grays)
          tertiaryColor: '#F8F9FA',          // Very light gray
          tertiaryTextColor: '#343A40',      // Dark gray text
          tertiaryBorderColor: '#ADB5BD',    // Medium gray border
          
          // Typography
          fontFamily: 'Helvetica Neue, Arial, system-ui, sans-serif',
          fontSize: '14px',
          
          // Flowchart styling
          lineColor: '#495057',              // Dark gray for good contrast
          nodeTextColor: '#212529',          // Near-black for readability
          nodeBorder: '#1C4587',             // SIROS blue
          clusterBkg: '#F1F5F9',             // Light slate
          clusterBorder: '#1C4587',          // SIROS blue
          
          // Sequence diagram styling
          actorTextColor: '#212529',         // Near-black
          actorBorder: '#1C4587',            // SIROS blue
          actorBkg: '#E8EEF7',               // Light SIROS blue
          signalColor: '#1C4587',            // SIROS blue arrows
          signalTextColor: '#343A40',        // Dark gray for readability
          sequenceNumberColor: '#FFFFFF',    // White on blue
          labelBoxBkgColor: '#E8EEF7',       // Light SIROS blue
          labelBoxBorderColor: '#1C4587',    // SIROS blue
          labelTextColor: '#1C4587',         // SIROS blue
          loopTextColor: '#1C4587',          // SIROS blue
          
          // Notes - Complement orange for contrast/attention
          noteBkgColor: '#FFF3E0',           // Light orange/cream
          noteBorderColor: '#C75A11',        // Complement orange
          noteTextColor: '#7C3A00',          // Dark orange-brown
          
          // Activation bars
          activationBkgColor: '#D4E2F4',     // Medium SIROS blue
          activationBorderColor: '#1C4587',  // SIROS blue
        },
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
          padding: 20,
          nodeSpacing: 50,
          rankSpacing: 80,
          useMaxWidth: true,
        },
        sequence: {
          diagramMarginX: 50,
          diagramMarginY: 30,
          actorMargin: 80,
          width: 180,
          height: 60,
          boxMargin: 10,
          boxTextMargin: 8,
          noteMargin: 15,
          messageMargin: 45,
          mirrorActors: true,
          useMaxWidth: true,
          rightAngles: false,
          showSequenceNumbers: false,
        },
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
