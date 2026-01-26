import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'SIROS Developer Docs',
  favicon: 'img/favicon.ico',
  themes: ['@docusaurus/theme-mermaid'],
  markdown: { mermaid: true, },

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://sirosfoundation.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/docs',

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
      title: 'SIROS Developer Docs',
      logo: {
        alt: 'SIROS Foundation',
        src: 'img/logo.svg',
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
          sidebarId: 'wwWalletSidebar',
          position: 'left',
          label: 'wwWallet',
        },
        {
          href: 'https://github.com/sirosfoundation',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      copyright: `Copyright © ${new Date().getFullYear()} SIROS Foundation. Built with Docusaurus.`,
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
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
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
