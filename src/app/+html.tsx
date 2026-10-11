import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// Este archivo es solo para web y define el <head> de todas las páginas
// durante el render estático. Solo se ejecuta en Node (sin DOM).
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        />

        {/* PWA */
        }
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="TDAH" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <link rel="apple-touch-icon" href="/logo192.png" />

        <ScrollViewStyleReset />

        {/* Altura de viewport dinámica: evita que el teclado del móvil tape el
            input inferior en la PWA (web). */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
  html, body, #root { height: 100%; }
  @supports (height: 100dvh) {
    html, body, #root { height: 100dvh; }
  }
  body { background-color: #000000; }
`;
