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
      respectPrefersColorScheme: true,
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
    mermaid: {
      theme: {
        light: 'base',
        dark: 'dark',
      },
      options: {
        // Improve rendering quality
        securityLevel: 'loose',
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
        themeVariables: {
          // SIROS brand colors
          primaryColor: '#EFF6FF',
          primaryTextColor: '#1E40AF',
          primaryBorderColor: '#3B82F6',
          secondaryColor: '#F0FDF4',
          secondaryTextColor: '#166534',
          secondaryBorderColor: '#22C55E',
          tertiaryColor: '#F9FAFB',
          tertiaryTextColor: '#374151',
          tertiaryBorderColor: '#D1D5DB',
          
          // Typography
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          
          // Flowchart styling
          lineColor: '#6B7280',
          nodeTextColor: '#1F2937',
          nodeBorder: '#3B82F6',
          clusterBkg: '#F8FAFC',
          clusterBorder: '#CBD5E1',
          
          // Sequence diagram styling
          actorTextColor: '#1F2937',
          actorBorder: '#3B82F6',
          actorBkg: '#EFF6FF',
          signalColor: '#3B82F6',
          signalTextColor: '#1F2937',
          sequenceNumberColor: '#FFFFFF',
          
          // Additional polish
          noteBkgColor: '#FEF3C7',
          noteBorderColor: '#F59E0B',
          noteTextColor: '#92400E',
          activationBkgColor: '#DBEAFE',
          activationBorderColor: '#3B82F6',
        },
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
