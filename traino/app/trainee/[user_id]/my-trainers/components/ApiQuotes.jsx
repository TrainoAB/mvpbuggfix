'use client';
import { useEffect, useState } from 'react';
import './ApiQuotes.css';

export default function ApiQuotes() {
    const [quote, setQuote] = useState({
        text: 'Difficulties in your life do not come to destroy you, but to help you realize your hidden potential and power. Let difficulties know that you too are difficult.',
        author: 'P. Nydahl'
    });

    async function loadQuote() {
        const response = await fetch('https://api.allorigins.win/get?url=https://zenquotes.io/api/random');
        const data = await response.json();
        const quoteData = JSON.parse(data.contents);
        setQuote({
            text: quoteData[0].q,
            author: quoteData[0].a
        });
    }

    useEffect(() => {
        loadQuote();
    }, []);

    return (
        <div id="api-quotes">
            <p>{quote.text}</p>
            <p><em>- {quote.author}</em></p>
        </div>
    );
}