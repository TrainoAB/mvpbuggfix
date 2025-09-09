// 'use client';
// import { useRouter } from 'next/navigation';
// import { useRef } from 'react';
// import { useState } from 'react';
// import CheckoutButton from './CheckoutButton';
// import './CheckoutComponent.css';
// import CheckoutReceipt from './CheckoutReceipt';
// import { DEBUG } from './functions';

// const CheckoutComponent = ({ selectedProducts, totalCost }) => {
//   let controller = useRef('').current;
//   const router = useRouter();
//   DEBUG && console.log('CheckoutComponent entered');

//   const handleGoBack = () => {
//     if (typeof window !== 'undefined') {
//       router.back();
//       controller.abort();
//     }
//   };

//   if (!selectedProducts) return null;

//   return (
//     <>
//       <div className="icon-back" onClick={handleGoBack}></div>
//       <CheckoutReceipt selectedProducts={selectedProducts} totalCost={totalCost} />
//       <hr />
//       <CheckoutButton selectedProducts={selectedProducts} totalCost={totalCost} />
//     </>
//   );
// };

// export default CheckoutComponent;
