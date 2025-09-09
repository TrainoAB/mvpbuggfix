export const onDragOver = (e) => {
  e.preventDefault();
  e.stopPropagation();

  e.dataTransfer.dropEffect = 'copy';

  e.currentTarget.classList.add('upload-zone--dragover');
};

export const onDragLeave = (e) => {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('upload-zone--dragover');
};

export const onDrop = (e, data, read) => {
  e.preventDefault();
  e.stopPropagation();

  const file = e.dataTransfer.files[0];

  if (file && file.type.startsWith('image/')) {
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
        const mimeString = webpDataUrl
          .split(',')[0]
          .split(':')[1]
          .split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });

        const newFile = new File([blob], 'profile-image.webp', {
          type: 'image/webp',
        });
        data(newFile);
        read(webpDataUrl);
      };

      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
};
