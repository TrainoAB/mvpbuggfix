
// // ********************************************************************************************************************
// //                                                 DANIELS FETCH KOD
// // ********************************************************************************************************************
// const response = await fetch(${baseUrl}/api/proxy, {
//     method: 'POST',
//     headers: {
//       Authorization: Bearer ${sessionObject.token},
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       url: ${baseUrl}/api/products/user?alias=${alias};,
//       method: 'GET',
//     }),
//   });
// if (!response.ok) {
//     throw new Error(HTTP error! Status: ${response.status});
//   }

//   // Parse the JSON response
 
// const userDetails = await getUserDetailsAlias(userAliasEncoded);

// // ********************************************************************************************************************
// //                                                 CYRUS FETCH KOD
// // ********************************************************************************************************************

// const fetchData = async () => {
//     setLoading(true);
//     const urlPath = ${baseUrl}/api/products/user?alias=${userAlias};
//     DEBUG && console.log('Fetching data from:', urlPath);

//     try {
//       const response = await fetch(${baseUrl}/api/proxy, {
//         method: 'POST',
//         headers: {
//           Authorization: Bearer ${sessionObject.token},
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           url: urlPath,
//           method: 'GET',
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(HTTP error! Status: ${response.status});
//       }