# Traino Points

TRAINO Points är ett belöningssystem inom TRAINO-applikationen. Det finns bara en page.jsx, resten av "_navigeringen_" sker genom komponeneter som görs synbara eller ej. Det finns även en del mindre komponenter som tex knappar som ligger under mappen `components`. Här är en översikt över hur koden är strukturerad.

### Huvudkomponenter

- `TrainoPointsHome`: "**<u>första sidan</u>**". Huvudkomponenten som hanterar visningen av användarens poäng, tillgängliga belöningar och möjligheten att lösa in poäng.
- `InfoCard`: En informationsruta som visar detaljer om TRAINO Points-systemet. Visas när användaren klickar på ikonen med ett i.
- `RewardProductCard`: En komponent som visar detaljer om en specifik belöning. Visas när användaren klickar på en belöning.
- `RewardProductCardMini`: En mindre version av RewardProductCard som också (genom varierad styling) visar om produkten är tillgänlig, om den redan beställts etc.
- `OrderConfirmation`: "<u>**andra sidan**</u>". Visas framför TrainoPointsHome och innehåller information/bekräftelse av beställningen.
- `NotificationCard`: "<u>**trejde sidan**</b>". Tackar användaren för beställningen och ger möjlighet att navigera tillbaka till början (första sidan).

### Viktiga State-Variabler och Funktioner

- `userData`: Innehåller användarens data inklusive poäng.
- `selectedProductForInfoCard`: Innehåller den valda produkten för att visa detaljer i ett informationskort.
- `orderableProducts`: En lista över produkter som användaren kan lösa in baserat på deras poäng.
- `isConfirmationVisible`: En boolean som styr visningen av bekräftelseöverlägget dvs **andra sidan**.

### Exempel på Viktiga Funktioner

- `handleSelectedProductForInfoCard`: Uppdaterar **selectedProductForInfoCard** när användaren klickar på en belöningsprodukt.
- `handleToggleOverlay`: Växlar visningen av **andra sidan**.
  findingOrderableProducts: Filtrerar och sorterar belöningsprodukterna baserat på användarens poäng.
- `fillCircle`: Uppdaterar graden av cirkeln baserat på användarens poäng och den valda produktens poängkrav.
- `addSparkleEffect`: Lägger till en visuell effekt när användaren har tillräckligt med poäng för att lösa in en belöning.

### Hämtning av data

Mockad data hämtas från json filen `mock-data.js` tills det att koppling till databas kan ordnas. (finns bara ett utkast på en **custom hook** vid namn `useFetchUserData`som har funktionen att hämta användardata)
