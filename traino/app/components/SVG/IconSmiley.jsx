const IconSmiley = ({ className, strokeWidth = '1.2', strokeColor = '#000000', fill = '#000000' }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M19.4 10C19.4 15.1915 15.1915 19.4 10 19.4C4.80852 19.4 0.6 15.1915 0.6 10C0.6 4.80852 4.80852 0.6 10 0.6C15.1915 0.6 19.4 4.80852 19.4 10Z"
      stroke={fill}
      strokeWidth={strokeWidth}
    />
    <path
      d="M13.5 10C14.3284 10 15 9.32843 15 8.5C15 7.67157 14.3284 7 13.5 7C12.6716 7 12 7.67157 12 8.5C12 9.32843 12.6716 10 13.5 10Z"
      fill={fill}
    />
    <path
      d="M5.5 12.5C6 13.5 8 15 10 15C12.5 15 14 13.5 14.5 12.5"
      stroke={fill}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6.5 10C7.32843 10 8 9.32843 8 8.5C8 7.67157 7.32843 7 6.5 7C5.67157 7 5 7.67157 5 8.5C5 9.32843 5.67157 10 6.5 10Z"
      fill={fill}
    />
  </svg>
);

export default IconSmiley;
