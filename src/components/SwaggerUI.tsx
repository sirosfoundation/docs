import React, {useEffect, useRef} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Head from '@docusaurus/Head';

interface SwaggerUIProps {
  specUrl: string;
}

function SwaggerUIInner({url}: {url: string}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    function tryInit() {
      const win = window as any;
      if (win.SwaggerUIBundle && containerRef.current) {
        win.SwaggerUIBundle({
          url,
          domNode: containerRef.current,
          presets: [win.SwaggerUIBundle.presets.apis, win.SwaggerUIStandalonePreset],
          layout: 'BaseLayout',
        });
      } else if (!cancelled) {
        setTimeout(tryInit, 200);
      }
    }
    tryInit();
    return () => { cancelled = true; };
  }, [url]);

  return <div ref={containerRef} />;
}

export default function SwaggerUI({specUrl}: SwaggerUIProps): React.ReactElement {
  const url = useBaseUrl(specUrl);
  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
        />
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" />
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" />
      </Head>
      <BrowserOnly fallback={<div>Loading API documentation...</div>}>
        {() => <SwaggerUIInner url={url} />}
      </BrowserOnly>
    </>
  );
}
