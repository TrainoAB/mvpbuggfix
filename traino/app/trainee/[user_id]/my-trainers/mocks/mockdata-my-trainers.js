const mockDataMyTrainers = [
    {
        id: 1,
        firstname: 'Chatgp',
        lastname: 'T-800',
        photo: '/assets/trainee-test-profile-photo4.jpg',
        isActiveCustomer: false,
        age: 84,
        sports: ['Laserdoom'],
        gender: ''
    }, 
    {
        id: 2,
        firstname: 'Tor-Peder',
        lastname: 'Testsson',
        photo: '/assets/trainee-test-profile-photo2.jfif',
        isActiveCustomer: false,
        age: 25,
        sports: ['Yoga'],
        gender: 'Man'
    },
    {
        id: 3,
        firstname: 'Kenny-Jan',
        lastname: 'Andersson',
        photo: '/assets/trainee-test-profile-photo3.jfif',
        isActiveCustomer: true,
        age: 33,
        sports: ['Bodybuilding'],
        gender: 'Woman'
    },
]

const activityLogsMockData = {
    händelser: [
        { id: 1, date: "27 Maj 2025", activityType: "Training Session", description: "Weightlifting", durationInMinutes: 60, priceInSEK: 600 },
        { id: 2, date: "20 Maj 2030", activityType: "Training Session", description: "Weightlifting", durationInMinutes: 45, priceInSEK: 450 },
        { id: 3, date: "20 Maj 2024", activityType: "Training Session", description: "Weightlifting", durationInMinutes: 45, priceInSEK: 450 },
        { id: 4, date: "28 Oktober 2024", activityType: "Online Session", description: "Weightlifting", durationInMinutes: 60, priceInSEK: 600 },
        { id: 5, date: "20 April 2024", activityType: "Online Session", description: "Weightlifting", durationInMinutes: 45, priceInSEK: 450 },
        { id: 6, date: "20 April 2024", activityType: "Training Session", description: "Weightlifting", durationInMinutes: 45, priceInSEK: 450 }
    ],

    anteckningar: [
        { id: 1, date: "27 Maj 2024", note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt..." },
        { id: 2, date: "19 Maj 2024", note: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt..." },
    ],
    dokument: [
        { id: 1, name: "Dokument-namn.txt", date: "2024-08-28", isOngoing: true },
        { id: 2, name: "Dokument-namn.txt", date: "2024-08-28", isOngoing: false},
    ],
};

const challenges = [
    { id: 1, date: "27 Maj 2024", title: "Utmaning 1", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt...", endDate: "2026-12-12" },
    { id: 2, date: "19 Maj 2024", title: "Utmaning 2", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt...", endDate: "2024-08-28" },
    { id: 3, date: "19 Maj 2024", title: "Utmaning 3", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt...", endDate: "2024-08-28" },
    { id: 4, date: "19 Maj 2024", title: "Utmaning 4", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt...", endDate: "2024-08-28" },
    { id: 5, date: "19 Maj 2024", title: "Utmaning 5", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt...", endDate: "2024-08-28" },
];

export {mockDataMyTrainers, activityLogsMockData, challenges};