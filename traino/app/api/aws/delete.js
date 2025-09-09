export async function deleteImage({ user, type, src }) {
  try {
    const response = await fetch('/api/aws/delete-img', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user, type, src }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Image deleted:', result);
      return;
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
}

export default deleteImage;

