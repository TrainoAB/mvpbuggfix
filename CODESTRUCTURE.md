# Kodstruktur

I detta dokument visar vi hur vi önskar strukturera koden, filer och mappar.

## Kataloger

> ### GÖR:
>
> Bara lowercase, med bindestreck som mellanslag.
>
> `traino\profile\[user_id]\confirm-email` > `traino\profile\[user_id]\confirm-email`

> ### GÖR INTE;
>
> Använd inte camelCase eller PascalCase i katalogstrukturen.
>
> `traino\profile\[user_id]\confirmEmail` > `Traino\Profile\[user_id]\Confirm-Email`

## page.jsx struktur

### GÖR:

Skriv i följande ordning. Exempel:

```jsx
"use client";
import { useState, useEffect } from "react"; // Alla react saker först
import { useRouter } from "next/navigation";
import { useAppState } from "@/app/hooks/useAppState";
import Link from "next/link";
import Loader from "@/app/components/Loader"; // Alla egna komponenter efter

import "./page.css"; // Sist css import

// För page.jsx vill vi det se ut såhär, och döp funktionen
// till samma som sidans katalognamn fast i PascalCase
export default function ForgotPassword({ params }) {
    // En tabb indent innuti brackets
    // Deklarera useContext, sedan useStates, sedan useRef's
    const { DEBUG } = useAppState();
    // Deklarera andra variablar som ska användas
    // useEffects
    // Funktioner
    // Döp handle funktioner just handleClick, handleInputChange
    // Använd const för andra små funktioner och döp dom calculateTime()
    // Ex:

    const calculateTime = () => {
        // Framför alla console.log använder vi DEBUG && och DEBUG hämtas ifrån context
        // För att kunna stänga av alla console loggar, och vi vill ha kvar dom i våra filer.
        DEBUG && console.log("Log");
    };

    // JSX
    return;

    <main id="forgot-password"></main>; // Sätt allt i en main tag och sätt ett ID samma som sidans namn
}
```

## page.css struktur

### GÖR:

Skriv CSS på följande sätt. Exempel:
För att CSS inte ska krocka med andra sidor så sätter vi ett ID och använder det på alla

```css
#forgot-password {
    background: white;
}

#forgot-password .divclassnamn {
    color: black;
}
```

## console.log

### GÖR:

Hämta DEBUG ifrån context. Skriv tydliga console.logs och spara alla.
Logga allt som kan orsaka att sidan inte skulle fungera, och skriv vilken
sida det handlar om.

```js
DEBUG && console.log("Username:", username);

DEBUG && console.log("API/Login Response:", response);
```

## Variablar

Skriv variablar på engelska, gör dom tydliga och korta.

### GÖR:

Skriv variablar på följande sätt. Exempel:

```js
const userAddress = "Stockholm";
// Eller
const user_address = "Stockholm";
// Om det är i ett objekt
const objectData = {
  user_address: userAddress;
}

// Om det är en global environment eller säkerhets variabel, kör capitalized
const SECURITY_VARIABLE = "13rfgbrjoyrhdtkhjo5kw#";
```
