import "./RectangleButton.css";

export default function RectangleButton(props) {
    return (
        <button className="rectangle-button" onClick={props.onClick}>
            {props.text}
        </button>
    );
}