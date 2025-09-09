'use client';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/app/hooks/useAppState';
import './../../components/Terms.css';

export default function GeneralTerms({ handleBack }) {
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
          <div
            className="categorytop secondarytop"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div className="btn-back" onClick={handleBackClick} style={{ position: 'absolute', left: 0 }}></div>
            <div></div>
            <div style={{ textAlign: 'center', flex: 1 }}>Allmänna Villkor</div>
            <div></div>
          </div>

          <div className="terms-content">
            <div className="terms-body">
              <h2>Allmänna Villkor för TRAINOs Trainees</h2>
              <p>
                Välkommen till TRAINO! Genom att skapa ett konto som trainee på TRAINO-plattformen samtycker du till
                följande allmänna villkor:
              </p>
              <p>
                1. <strong>Användaransvar:</strong> Som trainee ansvarar du för att all information som lämnas vid
                registrering och under användning av TRAINO-plattformen är korrekt och uppdaterad. Du är också ansvarig
                för att skydda ditt användarnamn och lösenord och för att inte dela dem med andra.
              </p>
              <p>
                2. <strong>Betalning och Prissättning:</strong> Genom att använda TRAINO-plattformen för att boka
                träningssessioner samtycker du till att betala de avgifter som anges av tränarna på deras profiler.
                TRAINO förbehåller sig rätten att debitera trainees för bokade sessioner och att hantera betalningar på
                deras vägnar.
              </p>
              <p>
                3. <strong>Avbokningspolicy:</strong> Trainees måste följa tränarens avbokningspolicy vid ändringar
                eller avbokningar av bokade sessioner. TRAINO kan tillämpa avgifter eller sanktioner för trainees som
                inte följer avbokningsreglerna
              </p>
              <p>
                4. <strong>Beteendekodex:</strong> Trainees förväntas uppträda på ett respektfullt och lämpligt sätt
                gentemot tränare och andra användare av TRAINO-plattformen. Diskriminering, trakasserier eller annan
                olämplig beteende kommer inte att tolereras och kan leda till avstängning från plattformen.
              </p>
              <p>
                5. <strong>Säkerhet och Ansvarsfriskrivning:</strong> TRAINO strävar efter att skapa en säker och trygg
                miljö för alla användare, men trainees deltar i träningssessioner på egen risk. TRAINO ansvarar inte för
                eventuella skador eller olyckor som kan inträffa under träningssessioner och rekommenderar att trainees
                rådgör med en läkare innan de påbörjar någon ny träningsrutin.
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
          <div
            className="categorytop secondarytop"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div className="btn-back" onClick={handleBackClick} style={{ position: 'absolute', left: 0 }}></div>
            <div></div>
            <div style={{ textAlign: 'center', flex: 1 }}>General Terms</div>
            <div></div>
          </div>

          <div className="terms-content">
            <div className="terms-body">
              <h2>General Terms for TRAINO Trainees</h2>
              <p>
                Welcome to TRAINO! By creating an account as a trainee on the TRAINO platform, you agree to the
                following general terms:
              </p>
              <p>
                1. <strong>User Responsibility:</strong> As a trainee, you are responsible for ensuring that all
                information provided during registration and use of the TRAINO platform is accurate and up to date. You
                are also responsible for protecting your username and password and for not sharing them with others.
              </p>
              <p>
                2. <strong>Payment and Pricing:</strong> By using the TRAINO platform to book training sessions, you
                agree to pay the fees set by the trainers on their profiles. TRAINO reserves the right to charge
                trainees for booked sessions and to handle payments on their behalf.
              </p>
              <p>
                3. <strong>Cancellation Policy:</strong> Trainees must follow the trainer's cancellation policy when
                making changes or canceling booked sessions. TRAINO may apply fees or penalties to trainees who do not
                adhere to the cancellation rules.
              </p>
              <p>
                4. <strong>Code of Conduct:</strong> Trainees are expected to act respectfully and appropriately toward
                trainers and other users of the TRAINO platform. Discrimination, harassment, or other inappropriate
                behavior will not be tolerated and may result in suspension from the platform.
              </p>
              <p>
                5. <strong>Safety and Disclaimer:</strong> TRAINO strives to create a safe and secure environment for
                all users, but trainees participate in training sessions at their own risk. TRAINO is not responsible
                for any injuries or accidents that may occur during training sessions and recommends that trainees
                consult a doctor before starting any new training routine.
              </p>
              <p>
                By creating an account as a trainee on the TRAINO platform, you confirm that you have read and accepted
                these general terms. If you have any questions or need clarification, feel free to contact us.
              </p>
            </div>
          </div>
        </div>
      );
  }
}
