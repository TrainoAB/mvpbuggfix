'use client';
import { useState, useEffect } from 'react';
import './page.css';

export default function PaymentDiv({
  icon = 'placeholder',
  iconBG,
  title = 'placeholder',
  titleColor,
  titleSize = 1.25,
  amount = '1000',
  amountColor,
  amountSize = 1.75,
  iconText = '',
  payoutButton = false,
}) {
  // MARK: Markup
  return (
    <div className="payment-wrap">
      <div className="payment-container">
        <h1 className="icon-title">{title}</h1>
        <p className="icon-amount">{amount}</p>
      </div>
    </div>
  );
}
