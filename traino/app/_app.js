// import { useEffect } from 'react';
// import App from 'next/app';

// function MyApp({ Component, pageProps }) {
//   useEffect(() => {
//     const script = document.createElement('script');
//     script.async = true;
//     script.src = 'https://connect.facebook.net/en_US/sdk.js';
//     script.onload = () => {
//       window.fbAsyncInit = function() {
//         FB.init({
//           appId: 'YOUR_APP_ID', // Replace with your app ID
//           cookie: true,
//           xfbml: true,
//           version: 'v14.0' // Replace with your desired version
//         });

//         // Check login status
//         FB.getLoginStatus(function(response) {
//           statusChangeCallback(response);
//         });
//       };
//     };
//     document.head.appendChild(script);
//   }, []);

//   // ... rest of your component ...

//   function statusChangeCallback(response) {
//     console.log('statusChangeCallback');
//     console.log(response);
//     // Handle different status cases here
//     switch (response.status) {
//       case 'connected':
//         // Logged into your app and Facebook
//         // Redirect to logged-in experience or fetch user data
//         break;
//       case 'not_authorized':
//         // Logged into Facebook but not your app
//         // Show a login button or prompt
//         break;
//       case 'unknown':
//         // Not logged into Facebook
//         // Show a login button or prompt
//         break;
//       default:
//         console.log('Login status unknown');
//     }
//   }

//   return <Component {...pageProps} />;
// }

// export default MyApp;
