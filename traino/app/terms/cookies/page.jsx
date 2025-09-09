'use client';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
import './../../components/Terms.css';

export default function CookiesTerms({ handleBack }) {
  const { DEBUG, language } = useAppState();

  const router = useRouter();

  const handleBackClick = () => {
    if (handleBack) {
      handleBack();
    } else {
      router.back();
    }
  };

  switch (language) {
    case 'sv':
      return (
        <div id="terms-container">
          <div className="categorytop secondarytop">
            <div className="btn-back" onClick={handleBackClick}></div>
            <div>Cookies</div>
            <div></div>
          </div>
          <div className="terms-content">
            <div className="terms-body">
              <h2>Cookie-policy för TRAINO-plattformen</h2>
              <p>
                Denna cookie-policy förklarar hur TRAINO använder cookies och liknande tekniker för att förbättra din
                upplevelse på vår webbplats och för att förstå hur du använder vår webbplats. Genom att fortsätta
                använda vår webbplats samtycker du till vår användning av cookies enligt denna policy.
              </p>
              <p>
                1. <strong>Vad är cookies?</strong> Cookies är små textfiler som lagras på din enhet när du besöker en
                webbplats. Dessa textfiler innehåller information som används för att förbättra webbplatsens
                funktionalitet och för att spåra din användning av webbplatsen.
              </p>
              <p>
                2. <strong>Hur används cookies på TRAINO-plattformen?</strong> TRAINO använder cookies för att förbättra
                din upplevelse på vår webbplats genom att spara dina inställningar och för att analysera hur du använder
                vår webbplats. Vi använder även cookies för att anpassa vår marknadsföring till dina intressen.
              </p>
              <p>
                3. <strong>Vilka typer av cookies använder TRAINO?</strong> TRAINO använder både egna cookies och
                cookies från tredje part. Egna cookies används för att spara dina inställningar och för att förbättra
                funktionaliteten på vår webbplats. Cookies från tredje part används för att analysera hur du använder
                vår webbplats och för att anpassa vår marknadsföring till dina intressen.
              </p>
              <p>
                4. <strong>Hur kan jag hantera cookies?</strong> Du kan kontrollera och hantera cookies genom att ändra
                inställningarna i din webbläsare. Observera att om du inaktiverar cookies kan vissa delar av vår
                webbplats sluta att fungera korrekt.
              </p>
              <p>
                5. <strong>Ytterligare information</strong> Om du har frågor om vår cookie-policy eller vår användning
                av cookies, är du välkommen att kontakta oss.
              </p>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div id="terms-container">
          <div className="categorytop secondarytop">
            <div className="btn-back" onClick={handleBackClick}></div>
            <div>Cookies</div>
            <div></div>
          </div>
          <div className="terms-content">
            <div className="terms-body">
              <h2>Cookie Policy for the TRAINO Platform</h2>
              <p>
                This cookie policy explains how TRAINO uses cookies and similar technologies to enhance your experience
                on our website and to understand how you use our website. By continuing to use our website, you consent
                to our use of cookies in accordance with this policy.
              </p>
              <p>
                1. <strong>What are cookies?</strong> Cookies are small text files stored on your device when you visit
                a website. These text files contain information used to enhance the functionality of the website and to
                track your usage of the website.
              </p>
              <p>
                2. <strong>How are cookies used on the TRAINO platform?</strong> TRAINO uses cookies to improve your
                experience on our website by saving your preferences and to analyze how you use our website. We also use
                cookies to tailor our marketing to your interests.
              </p>
              <p>
                3. <strong>What types of cookies does TRAINO use?</strong> TRAINO uses both first-party cookies and
                third-party cookies. First-party cookies are used to save your settings and to improve the functionality
                of our website. Third-party cookies are used to analyze how you use our website and to personalize our
                marketing according to your interests.
              </p>
              <p>
                4. <strong>How can I manage cookies?</strong> You can control and manage cookies by adjusting the
                settings in your browser. Please note that if you disable cookies, some parts of our website may stop
                functioning properly.
              </p>
              <p>
                5. <strong>Additional information</strong> If you have any questions about our cookie policy or our use
                of cookies, you are welcome to contact us.
              </p>
            </div>
          </div>
        </div>
      );
  }
}
