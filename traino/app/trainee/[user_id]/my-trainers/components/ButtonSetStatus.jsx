import './ButtonSetStatus.css';

export default function ButtonSetStatus({ buttonText, onClick }) {
return (
    <button id="set-status-button" onClick={onClick}>{buttonText}</button>
);
}
