'use client';
import "./Header.css";

export const Header = ({txt = 'test'}) => {
  return (
    <nav className="header">
      <a href="/train">{'<'}</a>
      <p>{txt}</p>
    </nav>
  );
};
