import './PillButton.css';

export default function PillButton(props){
    return(
        <button className="pill-button" onClick={props.onClick}>{props.text}</button>
    )
}