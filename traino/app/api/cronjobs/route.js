export const dynamic = 'force-dynamic'; // Forces dynamic rendering
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Parse the request body
    console.log('Entering route handler');

    // Fetch data from the external server
    const response = await fetch('https://traino.nu/php/aimedpayout.php', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionObject.token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    // Check if the response is ok
    if (!response.ok) {
      console.error('Network response was not ok:', response.status, response.statusText);
      throw new Error('Network response was not ok');
    }

    // Log the response text
    const responseText = await response.text();
    console.log('Response Text:', responseText);

    // Parse the JSON if the response is not empty
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      data = { error: 'Invalid JSON response' };
    }
    console.log('Received data from external server:', data);

    // Send back the response data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
