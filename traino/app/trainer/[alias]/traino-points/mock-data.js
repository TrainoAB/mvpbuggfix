import AddressAutoComplete from '@/app/components/Inputs/AddressAutoComplete';

const rewardProductListData = [
  {
    id: 1,
    name: 'Nocco',
    imgUrl: '/assets/traino-points-nocco.jpg', //alltså ligger de i public just nu, la alla jpg där ju TODO:tabortkommentar
    shortDescribingText: 'Ice Soda',
    //around 25 words
    longDescribingText:
      'Nocco är en funktionsdryck berikad med BCAA, koffein, vitaminer och utan socker. Den är framtagen för att stödja energinivåer och återhämtning efter träning.',
    pointsRequired: 6000,
    alreadyClaimed: false,
  },
  {
    id: 2,
    name: 'Vattenflaska',
    imgUrl: '/assets/traino-points-water-bottle.jpg',
    shortDescribingText: 'ONE SIZE',
    //around 25 words
    longDescribingText:
      'Trainos vattenflaska för träning är hållbar och ergonomiskt utformad. Den rymmer 750 ml, har en läcksäker design och är enkel att använda under intensiva träningspass.',
    pointsRequired: 5000,
    alreadyClaimed: false,
  },
  {
    id: 3,
    name: 'T-shirt',
    imgUrl: '/assets/traino-points-tshirt.jpg',
    shortDescribingText: '100% Bomull',
    //around 25 words
    longDescribingText:
      'Trainos T-shirt är tillverkad av mjukt, hållbart bomullsmaterial, med en klassisk passform. Perfekt för både träning och vardagsbruk. ',
    pointsRequired: 4000,
    alreadyClaimed: false,
  },
  {
    id: 4,
    name: 'Nocco',
    imgUrl: '/assets/traino-points-nocco.jpg', //alltså ligger de i public just nu, la alla jpg där ju TODO:tabortkommentar
    shortDescribingText: 'Ice Soda',
    //around 25 words
    longDescribingText:
      'Nocco är en funktionsdryck berikad med BCAA, koffein, vitaminer och utan socker. Den är framtagen för att stödja energinivåer och återhämtning efter träning.',
    pointsRequired: 3000,
    alreadyClaimed: false,
  },
  {
    id: 5,
    name: 'Vattenflaska',
    imgUrl: '/assets/traino-points-water-bottle.jpg',
    shortDescribingText: 'ONE SIZE',
    //around 25 words
    longDescribingText:
      'Trainos vattenflaska för träning är hållbar och ergonomiskt utformad. Den rymmer 750 ml, har en läcksäker design och är enkel att använda under intensiva träningspass.',
    pointsRequired: 2000,
    alreadyClaimed: false,
  },
  {
    id: 6,
    name: 'T-shirt',
    imgUrl: '/assets/traino-points-tshirt.jpg',
    shortDescribingText: '100% Bomull',
    //around 25 words
    longDescribingText:
      'Trainos T-shirt är tillverkad av mjukt, hållbart bomullsmaterial, med en klassisk passform. Perfekt för både träning och vardagsbruk. ',
    pointsRequired: 1000,
    alreadyClaimed: true,
  },
  {
    id: 7,
    name: 'Nocco',
    imgUrl: '/assets/traino-points-nocco.jpg', //alltså ligger de i public just nu, la alla jpg där ju TODO:tabortkommentar
    shortDescribingText: 'Ice Soda',
    //around 25 words
    longDescribingText:
      'Nocco är en funktionsdryck berikad med BCAA, koffein, vitaminer och utan socker. Den är framtagen för att stödja energinivåer och återhämtning efter träning.',
    pointsRequired: 7000,
    alreadyClaimed: false,
  },
  {
    id: 8,
    name: 'Vattenflaska',
    imgUrl: '/assets/traino-points-water-bottle.jpg',
    shortDescribingText: 'ONE SIZE',
    //around 25 words
    longDescribingText:
      'Trainos vattenflaska för träning är hållbar och ergonomiskt utformad. Den rymmer 750 ml, har en läcksäker design och är enkel att använda under intensiva träningspass.',
    pointsRequired: 8000,
    alreadyClaimed: false,
  },
];

const userList = [
  {
    id: 1,
    firstName: 'Kalle',
    lastName: 'Anka',
    points: 5001,
    street_adress: 'Kungsgatan 1',
    city: 'Stockholm',
    zipcode: '111 22',
  },
  {
    id: 2,
    firstName: 'Kajsa',
    lastName: 'Anka',
    points: 3000,
    streetAdress: 'Drottninggatan 1',
    city: 'Stockholm',
    zipCode: '111 22',
  },
  {
    id: 3,
    firstName: 'Kim',
    lastName: 'Harrison',
    points: 4000,
    streetAdress: 'Kungsgatan 1',
    city: 'Stockholm',
    zipCode: '111 22',
  },
];
export { userList, rewardProductListData };
