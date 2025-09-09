import { useEffect, useState } from 'react';

function useFetchUserData(userId) {
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    fetch(`http://localhost/traino-intro-exercise-php/get_react.php?id=${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setUserData(null);
        } else {
          setUserData(data);
          setError(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        setError('User not found or an error occurred.');
        setUserData(null);
        setLoading(false);
      });
  }, [userId]);

  return { userData, error, loading };
}

export default useFetchUserData;