'use client';
import { useEffect, useState } from 'react';
import './RewardProductCardMini.css';

export default function RewardProductCardMini(props) {

    
    const isOrderable = props.isOrderable;
    const isAlreadyOrdered = props.isAlreadyOrdered === true;
    const isNotAffordeble = !props.isOrderable;

    const getClassName = () => {
        if (isAlreadyOrdered)
            return 'already-ordered';
        else if (isOrderable)
            return 'orderable';
        else if (isNotAffordeble)
            return 'not-affordable';        
    }

    console.log('Class name:', getClassName());

    return (
        <>
        {isAlreadyOrdered || isOrderable ? (
            <div id="reward-product-card-mini" onClick={props.onCardButtonClick}>
                <div className={`container-text-and-image ${getClassName()}`}>
                    <img src={props.image} alt="reward image" />
                    <h3 className="header-card-mini">{props.name}</h3>
                    <h4 className="subheader-card-mini">{props.points} Poäng</h4>
                </div>
                {isAlreadyOrdered && 
                <div>
                    <span className="checkmark">✓</span>  
                </div>}
            </div>
        ) : (
            <div id="reward-product-card-mini" onClick={props.onCardButtonClick}>
                <div className={`container-text-and-image ${getClassName()}`}>
                    <img src={props.image} alt="reward image" />
                    <h4 className="subheader-not-affordable">{props.name}</h4>
                </div>
                <div>
                    <span className='header-not-affordable'>{props.points} Poäng</span>  
                </div>
            </div>
        )}
        </>
    )
}
