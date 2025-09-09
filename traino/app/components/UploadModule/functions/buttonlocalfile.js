export const onClick = (e, data, read, folder) => {
  e.preventDefault();
  const input = Object.assign(document.createElement('input'), {
    type: 'file',
    accept: 'image/*',
    onchange: () => {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const webpDataUrl = canvas.toDataURL('image/webp');
          const byteString = atob(webpDataUrl.split(',')[1]);
          const mimeString = webpDataUrl.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });

          const newFile = new File([blob], folder ? `${folder}-image.webp` : `${file.name.split('.')[0]}.webp`, {
            type: 'image/webp',
          });

          data(newFile);
          read(webpDataUrl);
        };

        img.src = reader.result;
      };

      reader.readAsDataURL(file);
    },
  });
  input.click();
};
