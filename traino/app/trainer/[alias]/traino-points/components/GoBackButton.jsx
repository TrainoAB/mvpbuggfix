import './GoBackButton.css';

export default function GoBackButton(props){
    return(
        <div className="circle" onClick={props.onClick}>
            <span>&lt;</span>
        </div>
    )
}