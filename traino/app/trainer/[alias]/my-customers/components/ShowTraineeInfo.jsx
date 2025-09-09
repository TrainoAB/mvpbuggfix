'use client';
import {useState, useEffect} from 'react';
import ShowUserDetail from './ShowUserDetail';
import './ShowTraineeInfo.css';

const DEBUG = true; // Definiera DEBUG

export default function ShowTraineeInfo( { photo, firstname, lastname, age, gender, sports} ) {

    const customerSports = sports.join(', ');

    return (
        <div id="user-info">                
            <div className="user-info__photo-container">
                    <img src={photo} className="user-info__photo-container--profile-photo"/>
            </div>
            <div className="user-info__container">
                <div className="user-info__name">
                <ShowUserDetail value={firstname} />
                &nbsp;
                <ShowUserDetail value={lastname} />                 
                </div>
                <table className="user-info__table">
                    <thead className="user-info__table--header">
                        <tr>
                            <td>Age</td>
                            <td>Gender</td>
                            <td>Sport</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="user-info__table--column">
                            <td><ShowUserDetail value={age} /></td>
                            <td><ShowUserDetail value={gender}/></td>
                            <td><ShowUserDetail value={customerSports}/></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}