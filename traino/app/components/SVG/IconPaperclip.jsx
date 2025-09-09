const IconPaperclip = ({ className, strokeWidth = '1.2', strokeColor = '#000000', fill = '#000000' }) => (
  <svg
    className={className}
    style={{ enableBackground: 'new 0 0 512 512' }}
    height="512px"
    version="1.1"
    viewBox="0 0 512 512"
    width="512px"
    xmlSpace="preserve"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
  >
    <g id="paperclip">
      <path
        d="M316,314.77v59.46c0,30.38-24.62,55-55,55s-55-24.62-55-55v-59.45c-15.99,14.79-26,35.95-26,59.45   c0,44.74,36.27,81,81,81c44.74,0,81-36.26,81-81C342,350.729,331.99,329.56,316,314.77z"
        fill={fill}
      />
      <path
        d="M292,337.59V338c-0.22,19.14-15.81,34.59-35,34.59c-19.19,0-34.78-15.45-35-34.59v-0.41   c0-16.22,11.03-29.859,26-33.83V338c0,4.97,4.03,9,9,9c4.971,0,9-4.03,9-9v-34.24C280.97,307.73,292,321.37,292,337.59z"
        fill={fill}
      />
      <rect fill={fill} height="263" width="26" x="180" y="110" />
      <rect fill={fill} height="228" width="26" x="266" y="110" />
      <rect fill={fill} height="152" width="26" x="222" y="186" />
      <path
        d="M236,54c-30.93,0-56,25.07-56,56c0,19.89,10.37,37.36,26,47.29V110c0-16.57,13.43-30,30-30s30,13.43,30,30   v47.29c15.63-9.93,26-27.4,26-47.29C292,79.07,266.93,54,236,54z"
        fill={fill}
      />
      <rect fill={fill} height="263" width="26" x="316" y="110" />
      <circle cx="235" cy="185.5" fill={fill} r="13" />
      <circle cx="329" cy="109.5" fill={fill} r="13" />
    </g>
  </svg>
);

export default IconPaperclip;
