'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CheckoutContainer from '../../components/Checkout/CheckoutContainer';

const SuccessPage = () => {
  const router = useRouter();
  const [timer, setTimer] = useState(10);
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    const storedRedirectUrl =
      typeof window !== 'undefined' ? sessionStorage.getItem('redirectUrl') : null;

    if (storedRedirectUrl) {
      setRedirectUrl(storedRedirectUrl);
      const timerId = setTimeout(() => {
        router.push(storedRedirectUrl);
        typeof window !== 'undefined' && sessionStorage.removeItem('redirectUrl');
      }, 10000);

      return () => clearTimeout(timerId);
    }
  }, [router]);

  const handleOkClick = () => {
    if (redirectUrl) {
      router.push(redirectUrl);
      typeof window !== 'undefined' && sessionStorage.removeItem('redirectUrl');
    }
  };

  useEffect(() => {
    let timerId;
    if (timer > 0 && redirectUrl) {
      timerId = setTimeout(() => {
        setTimer(timer - 1);
      }, 1000);
    }

    return () => clearTimeout(timerId);
  }, [timer, redirectUrl]);

  return (
    <CheckoutContainer type="success">
      {redirectUrl && (
        <div>
          <p>Du kommer att omdirigeras om {timer} sekunder</p>
          <button onClick={handleOkClick}>OK</button>
        </div>
      )}
    </CheckoutContainer>
  );
};

export default SuccessPage;
