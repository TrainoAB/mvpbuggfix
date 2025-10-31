'use server';
import { revalidateTag } from 'next/cache';

export const updateYtId = async (youtube_id, userData, baseUrl, sessionObject) => {
  const response = await fetch(`${baseUrl}/api/proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionObject.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: `${baseUrl}/api/users/edit/youtube`,
      method: 'POST',
      body: JSON.stringify({ id: userData.current.id, youtube_id }),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update youtube link');
  }

  const data = await response.json();

  revalidateTag('user-details');

  return data;
};

// pi7GrzVQi8c
// 1S6GXfZMGFw
