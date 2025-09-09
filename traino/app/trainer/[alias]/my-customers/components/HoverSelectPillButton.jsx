import './HoverSelectPillButton.css';

export default function HoverSelectPillButton({ text, onClick, selected }) {
    return (
        <button
            id='hover-select-pill-button'
            onClick={onClick}
        >
            {text}
        </button >
    );
}