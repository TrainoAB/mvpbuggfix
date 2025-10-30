'use server';
import { revalidatePath } from 'next/cache';

export const updateYtId = async (youtubeid, path, userData, baseUrl, sessionObject) => {
  const response = await fetch(`${baseUrl}/api/proxy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionObject.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: `${baseUrl}/api/users/edit/youtube`,
      method: 'POST',
      body: JSON.stringify({ id: userData.current.id, youtube_id: youtubeid }),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update youtube link');
  }

  const data = await response.json();

  revalidatePath(path);
  return data;
};

// pi7GrzVQi8c
