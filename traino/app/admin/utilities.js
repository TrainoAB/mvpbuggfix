import { useAppState } from '@/app/hooks/useAppState';

export async function fetchUser(userId, user) {
  const { DEBUG, baseUrl, sessionObject } = useAppState();

  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionObject.token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        url: `${baseUrl}/api/users/users?id=${userId}`,
        method: 'GET',
      }),
    });

    const data = await response;
    user(data.id ? [data] : []);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
export async function fetchUserOnSearch(userName, setError, setUser, currentPage) {
  const { DEBUG, baseUrl, sessionObject } = useAppState();

  let user = encodeURIComponent(userName);
  // let searchUrl;

  let queryParams;

  if (!isNaN(user) && !isNaN(parseFloat(user))) {
    // searchUrl = `https://traino.nu/php/admin_search.php?id=${user}&perpage=25&page=${currentPage}`;

    queryParams = new URLSearchParams({
      id: user,
      perpage: 25,
      page: currentPage,
    });
  } else {
    // searchUrl = `https://traino.nu/php/admin_search.php?query=${user}&perpage=25&page=${currentPage}`;

    queryParams = new URLSearchParams({
      query: user,
      perpage: 25,
      page: currentPage,
    });
  }

  try {
    const response = await fetch(`${baseUrl}/api/proxy`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionObject.token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        url: `${baseUrl}/api/admin/users?${queryParams.toString()}`,
        method: 'GET',
      }),
    });

    // Log the response status for debugging
    DEBUG && console.log('API/Users Response Status:', response.status);

    if (response.status === 401) {
      console.error('Unauthorized: Check if it has correct and the necessary permissions.');
      setError('Unauthorized: Incorrect or lack necessary permissions.');
      return;
    }

    const data = await response.json();

    // Log the returned users for debugging
    DEBUG && console.log('Fetched users:', data);

    if (!isNaN(user) && !isNaN(parseFloat(user))) {
      if (data) {
        setUser({
          users: [data] || [],
        });
      } else {
        setUser([]);
      }
    } else {
      if (data.users) {
        setUser(data);
      } else {
        setUser([]);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    setError('An error occurred while fetching data.');
  }
}
