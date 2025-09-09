const IconVideo = ({ className, strokeWidth = '2', strokeColor = '#000000', fill = 'none' }) => (
  <svg
    className={className}
    enableBackground="new 0 0 50 50"
    height="50px"
    id="iconvideo"
    version="1.1"
    viewBox="0 0 50 50"
    width="50px"
    xmlSpace="preserve"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
  >
    <rect fill="none" height="50" width="50" />
    <polygon
      fill={fill}
      points="49,14 36,21 36,29 49,36"
      stroke={strokeColor}
      strokeLinecap="round"
      strokeMiterlimit="10"
      strokeWidth={strokeWidth}
    />
    <path
      d="M36,36c0,2.209-1.791,4-4,4 H5c-2.209,0-4-1.791-4-4V14c0-2.209,1.791-4,4-4h27c2.209,0,4,1.791,4,4V36z"
      fill={fill}
      stroke={strokeColor}
      strokeLinecap="round"
      strokeMiterlimit="10"
      strokeWidth={strokeWidth}
    />
  </svg>
);

export default IconVideo;
