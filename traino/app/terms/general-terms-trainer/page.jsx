'use client';

import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
import './../../components/Terms.css';

export default function GeneralTrainerTerms({ handleBack }) {
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
            <div>Allmänna Villkor</div>
            <div></div>
          </div>
          <div className="terms-content">
            <div className="terms-body">
              <h2>Allmänna Villkor för TRAINOs Trainers</h2>
              <p>
                Välkommen till TRAINO! Genom att skapa ett konto som tränare på TRAINO-plattformen samtycker du till
                följande allmänna villkor:
              </p>
              <p>
                1. <strong>Registrering och Profilhantering:</strong> Som tränare ansvarar du för att skapa och
                underhålla en korrekt och uppdaterad profil på TRAINO-plattformen. Detta inkluderar att tillhandahålla
                relevant information om din erfarenhet, specialiseringar, prissättning och tillgänglighet.
              </p>
              <p>
                2. <strong>Bokningar och Sessionshantering:</strong>Genom att använda TRAINO-plattformen för att ta emot
                bokningar och genomföra träningspass samtycker du till att följa den överenskomna tidtabellen och
                leverera kvalitativ träning i enlighet med dina kunders förväntningar.
              </p>
              <p>
                3. <strong>Betalningspolicy och Avgifter:</strong> Tränare förbinder sig att följa TRAINOs
                betalningspolicy och acceptera betalningar från trainees via TRAINO-plattformen. TRAINO förbehåller sig
                rätten att debitera en serviceavgift för varje genomförd bokning.
              </p>
              <p>
                4. <strong>Avbokningspolicy:</strong> Tränare måste tydligt ange sin avbokningspolicy på sin profil och
                följa den vid ändringar eller avbokningar av bokade sessioner. TRAINO kan tillämpa sanktioner mot
                tränare som inte följer avbokningsreglerna.
              </p>
              <p>
                5. <strong>Säkerhet och Ansvarsfriskrivning:</strong> TRAINO strävar efter att skapa en säker och trygg
                miljö för alla användare, men trainees deltar i träningssessioner på egen risk. TRAINO ansvarar inte för
                eventuella skador eller olyckor som kan inträffa under träningssessioner och rekommenderar att trainees
                rådgör med en läkare innan de påbörjar någon ny träningsrutin.
              </p>
              <p>
                6. <strong>Ansvarsfriskrivning och Försäkringar:</strong> Tränare åtar sig att inte försöka "sno"
                trainees från TRAINOs plattform för att boka träningspass utanför plattformen. Detta inkluderar att inte
                kontakta trainees som har bokat sessioner genom TRAINO för att erbjuda liknande tjänster utanför
                plattformen.
              </p>
              <p>
                7. <strong>Beteendekodex och Professionalism:</strong> Tränare förväntas agera professionellt och
                respektfullt gentemot sina trainees och andra användare av TRAINO-plattformen. Diskriminering,
                trakasserier eller olämpligt beteende kommer inte att tolereras och kan leda till avstängning från
                plattformen.
              </p>
              <p>
                Genom att skapa ett konto som tränare på TRAINO-plattformen bekräftar du att du har läst och godkänt
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
            <div className="btn-back" onClick={handleBackClick}></div>
            <div>General Terms</div>
            <div></div>
          </div>
          <div className="terms-content">
            <div className="terms-body">
              <h2>General Terms for TRAINO Trainers</h2>
              <p>
                Welcome to TRAINO! By creating an account as a trainer on the TRAINO platform, you agree to the
                following general terms:
              </p>
              <p>
                1. <strong>Registration and Profile Management:</strong> As a trainer, you are responsible for creating
                and maintaining an accurate and up-to-date profile on the TRAINO platform. This includes providing
                relevant information about your experience, specializations, pricing, and availability.
              </p>
              <p>
                2. <strong>Bookings and Session Management:</strong> By using the TRAINO platform to accept bookings and
                conduct training sessions, you agree to adhere to the agreed-upon schedule and deliver high-quality
                training in accordance with your clients' expectations.
              </p>
              <p>
                3. <strong>Payment Policy and Fees:</strong> Trainers agree to follow TRAINO’s payment policy and accept
                payments from trainees via the TRAINO platform. TRAINO reserves the right to charge a service fee for
                each completed booking.
              </p>
              <p>
                4. <strong>Cancellation Policy:</strong> Trainers must clearly specify their cancellation policy on
                their profile and follow it when making changes or cancellations to booked sessions. TRAINO may apply
                penalties to trainers who do not comply with the cancellation rules.
              </p>
              <p>
                5. <strong>Safety and Disclaimer:</strong> TRAINO strives to create a safe and secure environment for
                all users, but trainees participate in training sessions at their own risk. TRAINO is not responsible
                for any injuries or accidents that may occur during training sessions and recommends that trainees
                consult a doctor before starting any new training routine.
              </p>
              <p>
                6. <strong>Disclaimer and Insurance:</strong> Trainers agree not to attempt to "poach" trainees from the
                TRAINO platform to book training sessions outside the platform. This includes not contacting trainees
                who have booked sessions through TRAINO to offer similar services outside the platform.
              </p>
              <p>
                7. <strong>Code of Conduct and Professionalism:</strong> Trainers are expected to act professionally and
                respectfully towards their trainees and other users of the TRAINO platform. Discrimination, harassment,
                or inappropriate behavior will not be tolerated and may result in suspension from the platform.
              </p>
              <p>
                By creating an account as a trainer on the TRAINO platform, you confirm that you have read and accepted
                these general terms. If you have any questions or need clarification, feel free to contact us.
              </p>
            </div>
          </div>
        </div>
      );
  }
}
