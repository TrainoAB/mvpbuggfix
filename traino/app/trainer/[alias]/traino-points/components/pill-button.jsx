import './pill-button.css';

export default function PillButton(props){
    return(
        <button className="pill-button">{props.text}</button>
    )
}