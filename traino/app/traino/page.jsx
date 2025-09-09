'use client';
import IconHeading from '../components/IconHeading';
import './../about/page.css';
import '../train/page.css';
import Link from 'next/link';
import Navigation from '@/app/components/Menus/Navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useAppState } from '@/app/hooks/useAppState';
import { ContactUs } from '../components/ContactUs';

export default function Traino() {
  const router = useRouter();

  const handleBack = () => {
    if (router && router.back) {
      router.back();
    } else {
      window.history.back();
    }
  };

  const [isAnimating, setIsAnimating] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(null);

  const firstUpdate = useRef(true);
  const slideshowIndexRef = useRef(slideshowIndex);

  const slideshowImages = [
    { src: './assets/whatistraino1.jpg', id: 0 },
    { src: './assets/whatistraino2.jpg', id: 1 },
  ];

  useEffect(() => {
    if (firstUpdate.current) {
      firstUpdate.current = false;
      return;
    }

    slideshowIndexRef.current = slideshowIndex;
    setIsAnimating(true);

    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 2000); // Animation duration

    // Clear timeout on unmount
    return () => {
      clearTimeout(timer);
    };
  }, [slideshowIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPreviousIndex(slideshowIndexRef.current);
      setSlideshowIndex((prevIndex) => (prevIndex + 1) % slideshowImages.length);
    }, 5000); // Time between slides

    // Clear timeout on unmount
    return () => {
      clearInterval(interval);
    };
  }, [slideshowImages.length]);

  const getOpacity = (id) => {
    if (id === slideshowIndex) {
      return 1; // Show current image
    }

    // Both images opaque during animation
    if (isAnimating && id === previousIndex) {
      return 1;
    }

    return 0; // Hide other images otherwise
  };

  const getZIndex = (id) => {
    if (id === slideshowIndex) {
      return 1; // Current image stays on top
    } else {
      return 0;
    }
  };

  return (
    <>
      <main id="about-page" className="train-wrapper-one">
        <Navigation />
        <div className="about-container">
          <div className="heading-container">
            <div class="back-btn" onClick={handleBack}></div>
            <div className="slideshow">
              <div className="slideshow-images">
                {slideshowImages.map((image) => (
                  <img
                    key={image.id}
                    src={image.src}
                    alt="Slideshow Image"
                    className="slide"
                    style={{ opacity: getOpacity(image.id), zIndex: getZIndex(image.id) }}
                  />
                ))}
              </div>
              <div className="slideshow-text">
                <h2 className="logo">Traino</h2>
                <h3>Välkommen till TRAINO!</h3>
                <p>
                  TRAINO är en digital plattform både för tränare och tränande. Hitta din personliga tränare eller coach
                  inom allt från Gym till Simning eller E-sport.
                </p>
              </div>
              {/* <div className="slideshow-hint">
                <span className="icon-chevron"></span>
                <p>Skrolla för att läsa mer</p>
              </div> */}
            </div>
            <div className="content-wrap">
              <div className="content">
                <h4>Vår vision</h4>
                <p className="quote">
                  <span className="quote-mark">“</span>
                  TRAINO's vision är att skapa en gemenskap där personlig träning är tillgänglig och anpassad för alla,
                  och där varje träningsupplevelse är positiv, motiverande och resultatdriven.
                  <span className="quote-mark">”</span>
                </p>
                <div className="two-column">
                  <p>
                    På TRAINO strävar vi efter att göra personlig träning tillgänglig och enkel för alla, oavsett
                    bakgrund, erfarenhetsnivå eller träningsmål. Vi är övertygade om att personlig träning inte bara är
                    för elitidrottare utan något som kan gynna människor på alla nivåer av fysisk aktivitet. Vår
                    plattform riktar sig både till nybörjare som precis börjat sin träningsresa och till erfarna
                    idrottare som vill ta sin prestation till nästa nivå.
                  </p>
                  <p>
                    Vi tror på att erbjuda en mångfald av tränare med olika specialiteter, så att varje användare kan
                    hitta en tränare som passar just deras behov och preferenser. Vare sig du vill förbättra din
                    kondition, bygga muskelstyrka, återhämta dig från en skada eller bara hålla dig aktiv och frisk, ska
                    du hos TRAINO kunna hitta den personliga tränaren som kan hjälpa dig att nå dina specifika mål.
                  </p>
                </div>
              </div>
              <div className="content">
                <h4>Vad vi erbjuder</h4>
                <div className="highlight-wrap">
                  <div className="highlight">
                    <span className="icon-about-findtrainer"></span>
                    <h5>Hitta personliga tränare</h5>
                    <p className="description-text">
                      Utforska ett brett utbud och hitta den som passar dina mål och behov.
                    </p>
                  </div>
                  <div className="highlight">
                    <span className="icon-about-booking"></span>
                    <h5>Enkel bokning</h5>
                    <p className="description-text">
                      Planera din träning smidigt med vår enkla bokningsfunktion få omedelbar bekräftelse.
                    </p>
                  </div>
                  <div className="highlight">
                    <span className="icon-about-training"></span>
                    <h5>Skräddarsydd träning</h5>
                    <p className="description-text">
                      Få ett träningsprogram som är anpassat efter dina unika mål och förutsättningar.
                    </p>
                  </div>
                </div>
              </div>
              <div className="content flex even">
                <h4>För tränare</h4>
                <div className="sub-content">
                  <div className="mockup-wrap">
                    <div className="gradient-overlay"></div>
                    <img src="./assets/mockup-trainer-profile-sq-2.png" alt="Trainer Profile" />
                  </div>
                  <div className="sub-content-text">
                    <h5>Skapa din profil</h5>
                    <p>
                      Appen erbjuder en rad omfattande funktioner som är särskilt utformade för tränare. Tränare kan
                      skapa och redigera sin egen profil, vilket gör det enkelt att uppdatera personlig information och
                      professionella detaljer. Verktyg för att lägga till träningspass och aktiviteter är inkluderade,
                      vilket möjliggör en smidig hantering av träningsscheman och anpassade träningsprogram för
                      klienter.
                    </p>
                  </div>
                </div>
                <div className="sub-content">
                  <div className="mockup-wrap">
                    <div className="gradient-overlay"></div>
                    <img src="./assets/mockup-trainer-booking-sq-2.png" alt="Trainer Booking" />
                  </div>
                  <div className="sub-content-text">
                    <h5>Organisera dina pass</h5>
                    <p>
                      En bokningssida för schemaläggning är tillgänglig, vilket underlättar för tränare att organisera
                      och planera sina sessioner med klienter. Dessutom finns en integrerad chattfunktion som gör det
                      enkelt att kommunicera med klienter direkt genom appen, vilket främjar en bättre och mer
                      kontinuerlig dialog.
                    </p>
                  </div>
                </div>
                <div className="sub-content">
                  <div className="mockup-wrap">
                    <div className="gradient-overlay"></div>
                    <img src="./assets/mockup-trainer-stripe-sq-2.png" alt="Trainer Stripe" />
                  </div>
                  <div className="sub-content-text">
                    <h5>Få betalt via Stripe</h5>
                    <p>
                      För att göra administrationen ännu enklare, erbjuder appen också en betalningsvy där tränare kan
                      hantera betalningar och hålla koll på ekonomiska transaktioner. Sammanfattningsvis, dessa
                      funktioner gör det möjligt för tränare att effektivt hantera och utveckla sin verksamhet genom en
                      och samma plattform.
                    </p>
                  </div>
                </div>
              </div>
              <div className="content flex odd">
                <h4>För utövare</h4>
                <div className="sub-content">
                  <div className="mockup-wrap">
                    <div className="gradient-overlay"></div>
                    <img src="./assets/mockup-trainee-profile-sq-2.png" alt="Trainee Profile" />
                  </div>
                  <div className="sub-content-text">
                    <h5>Hitta din perfekta coach</h5>
                    <p>
                      Appen erbjuder en rad funktioner som är skräddarsydda för utövare. Utövare kan skapa och anpassa
                      en personlig profil, vilket gör det enkelt att hålla information uppdaterad och relevant. En
                      interaktiv karta finns tillgänglig, vilket gör det möjligt att söka efter tränare i närområdet och
                      hitta den perfekta matchningen baserat på plats och specialisering.
                    </p>
                  </div>
                </div>
                <div className="sub-content">
                  <div className="mockup-wrap">
                    <div className="gradient-overlay"></div>
                    <img src="./assets/mockup-trainee-map-sq-2.png" alt="Trainee Map" />
                  </div>
                  <div className="sub-content-text">
                    <h5>Allt du behöver på ett ställe</h5>
                    <p>
                      Möjligheten att boka träningar direkt genom appen gör det smidigt att planera och organisera
                      träningssessioner utan krångel. Dessutom innehåller appen en chatfunktion som gör det möjligt för
                      utövare att kommunicera direkt med sina tränare, vilket främjar en bättre och mer kontinuerlig
                      dialog.
                    </p>
                  </div>
                </div>
                <div className="sub-content">
                  <div className="mockup-wrap">
                    <div className="gradient-overlay"></div>
                    <img src="./assets/mockup-trainee-payments-sq-2.png" alt="Trainee Payments" />
                  </div>
                  <div className="sub-content-text">
                    <h5>Håll koll på dina utgifter</h5>
                    <p>
                      För att underlätta betalningar och hålla koll på ekonomiska transaktioner finns även en
                      betalningsvy. Sammanfattningsvis ger dessa funktioner utövare ett kraftfullt verktyg för att
                      hantera och förbättra sin träningsupplevelse genom en och samma plattform.
                    </p>
                  </div>
                </div>
              </div>
              <div class="content merch">
                <h4>Merch</h4>
                <div class="merch-images">
                  <a href="https://www.redbubble.com/i/t-shirt/Traino-Logo-BIG-Color-by-TRAINO/165255561.WFLAH">
                    <img
                      src="https://ih1.redbubble.net/image.5666402614.5561/ssrco,classic_tee,flatlay,fafafa:ca443f4786,front,wide_portrait,750x1000.u1.webp"
                      alt="TRAINO Big Logo Shirt"
                    />
                  </a>
                  <a href="https://www.redbubble.com/i/t-shirt/Traino-Logo-Small-White-by-TRAINO/165255464.IJ6L0.XYZ">
                    <img
                      src="https://ih1.redbubble.net/image.5666398956.5464/ssrco,classic_tee,flatlay,101010:01c5ca27c6,front,wide_portrait,750x1000.u1.webp"
                      alt="TRAINO Logo Shirt"
                    />
                  </a>
                  <a href="https://www.redbubble.com/i/sticker/Traino-Logo-Color-by-TRAINO/165255227.EJUG5">
                    <img
                      src="https://ih1.redbubble.net/image.5666391044.5227/sss,small,wide_portrait,750x1000.1u1.webp"
                      alt="TRAINO Sticker"
                    />
                  </a>
                </div>
                <a href="https://www.redbubble.com/people/traino/shop">
                  <button class="button">Bläddra fler produkter</button>
                </a>
              </div>
              <ContactUs />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
