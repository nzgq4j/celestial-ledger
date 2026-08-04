import Script from "next/script";

export function GoogleIntegrations({
  analyticsId,
  recaptchaSiteKey,
}: {
  analyticsId?: string;
  recaptchaSiteKey?: string;
}) {
  return (
    <>
      {analyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`}
            strategy="afterInteractive"
          />
          <Script
            id="celestial-atlas-ga4"
            strategy="afterInteractive"
          >{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${analyticsId}',{anonymize_ip:true,allow_google_signals:false});`}</Script>
        </>
      )}
      {recaptchaSiteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(recaptchaSiteKey)}`}
          strategy="afterInteractive"
        />
      )}
    </>
  );
}
