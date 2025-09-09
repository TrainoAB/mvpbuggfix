'use client';

import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';

import './../../components/Terms.css';

export default function GDPRTerms({ handleBack }) {
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
            <div className="btn-back" onClick={handleBackClick}>
              {' '}
            </div>

            <div>GDPR Avtal</div>
            <div></div>
          </div>
          <div className="terms-content">
            <div className="terms-body">
              <h2>GDPR-avtal mellan TRAINO och dess användare</h2>
              <p>
                Detta avtal reglerar behandlingen av personuppgifter för användare av TRAINO-plattformen. Genom att
                använda TRAINO-plattformen godkänner användaren att deras personuppgifter behandlas enligt följande
                villkor:
              </p>
              <p>
                1. <strong>Personuppgifter som samlas in:</strong> TRAINO samlar in användarnas för- och efternamn,
                e-postadresser, telefonnummer och de sista fyra siffrorna av tränarens födelsedatum.
                Betalningsinformation samlas in genom tredjepartsplattformar som Klarna, Swish och Stripe.
              </p>
              <p>
                2. <strong>Insamlingsmetoder:</strong> Personuppgifter samlas in vid registrering och genom bokningar av
                träningspass. Dessutom kan data från bokningar och cookies sparas på TRAINOs plattform.
              </p>
              <p>
                3. <strong>Syftet med insamlingen:</strong> TRAINO samlar in personuppgifter för att förbättra
                användarupplevelsen och anpassa erbjudanden.
              </p>
              <p>
                4. <strong>Användarrättigheter enligt GDPR:</strong> Trainees förväntas uppträda på ett respektfullt och
                lämpligt sätt gentemot tränare och andra användare av TRAINO-plattformen. Diskriminering, trakasserier
                eller annan olämplig beteende kommer inte att tolereras och kan leda till avstängning från plattformen.
              </p>
              <p>
                5. <strong>Lagring och säkerhet:</strong> Användarna har rätt att begära rättelse av felaktiga uppgifter
                och radering av sina konton.
              </p>
              <p>
                6. <strong>Tredjepartsåtkoms:t</strong> TRAINO delar användarnas personuppgifter med AWS för lagring.
                Ytterligare tredjepartsföretag kan få tillgång vid användning av betalningsprocessorer eller andra
                tjänster.
              </p>
              <p>
                7. <strong>Lagringstid:</strong> Användarnas personuppgifter behålls under 6 till 12 månader från att
                kontot raderas.
              </p>
              <p>
                8. <strong>Juridisk grund för behandling:</strong> Behandlingen av användarnas personuppgifter sker med
                användarens samtycke vid kontoskapande
              </p>
              <p>
                Genom att skapa ett konto som trainee på TRAINO-plattformen bekräftar du att du har läst och godkänt
                dessa allmänna villkor. För eventuella frågor eller förtydliganden är du välkommen att kontakta oss.
              </p>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div id="terms-container">
          <div className="categorytop secondarytop">
            <div className="btn-back" onClick={handleBackClick}>
              {' '}
            </div>

            <div>GDPR Agreement</div>
            <div></div>
          </div>
          <div className="terms-content">
            <div className="terms-body">
              <h2>GDPR Agreement between TRAINO and its Users</h2>
              <p>
                This agreement regulates the processing of personal data for users of the TRAINO platform. By using the
                TRAINO platform, the user agrees that their personal data will be processed under the following terms:
              </p>
              <p>
                1. <strong>Personal data collected:</strong> TRAINO collects users' first and last names, email
                addresses, phone numbers, and the last four digits of the coach’s date of birth. Payment information is
                collected through third-party platforms such as Klarna, Swish, and Stripe.
              </p>
              <p>
                2. <strong>Methods of collection:</strong> Personal data is collected during registration and through
                the booking of training sessions. Additionally, data from bookings and cookies may be stored on the
                TRAINO platform.
              </p>
              <p>
                3. <strong>Purpose of collection:</strong> TRAINO collects personal data to improve the user experience
                and tailor offers.
              </p>
              <p>
                4. <strong>Users’ rights under GDPR:</strong> Trainees are expected to act respectfully and
                appropriately toward coaches and other users of the TRAINO platform. Discrimination, harassment, or
                other inappropriate behavior will not be tolerated and may result in suspension from the platform.
              </p>
              <p>
                5. <strong>Storage and security:</strong> Users have the right to request the correction of inaccurate
                data and the deletion of their accounts.
              </p>
              <p>
                6. <strong>Third-party access:</strong> TRAINO shares users' personal data with AWS for storage.
                Additional third-party companies may have access when using payment processors or other services.
              </p>
              <p>
                7. <strong>Retention period:</strong> Users' personal data is retained for 6 to 12 months after the
                account is deleted.
              </p>
              <p>
                8. <strong>Legal basis for processing:</strong> The processing of users' personal data is based on the
                user's consent when creating an account.
              </p>
              <p>
                By creating an account as a trainee on the TRAINO platform, you confirm that you have read and accepted
                these general terms. If you have any questions or need clarification, you are welcome to contact us.
              </p>
            </div>
          </div>
        </div>
      );
  }
}
