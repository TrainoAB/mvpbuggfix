export async function uploadImage(file, user = '', folder = '', filter = 'img') {
  const fileData = {
    name: file.name,
    type: file.type,
    size: file.size,
    content: await file.arrayBuffer().then(buffer => {
      const uint8Array = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i += 1024) { // Process in chunks of 1024
        binary += String.fromCharCode.apply(null, uint8Array.slice(i, i + 1024));
      }
      return btoa(binary);
    }),
  };  

  try {
    const response = await fetch('/api/aws/upload-img', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: fileData, user, folder, filter }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('Image uploaded:', result);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Error uploading image:', error);
  }
}

export default uploadImage;
