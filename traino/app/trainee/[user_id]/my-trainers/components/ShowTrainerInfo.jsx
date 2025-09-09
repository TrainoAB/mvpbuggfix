import ShowTrainerDetail from './ShowTrainerDetail.';
import './ShowTrainerInfo.css';

export default function ShowTrainerInfo ( { photo, firstname, lastname, age, gender, sports} ) {
    return (
        <div id="trainer-info">
            <div className="trainer-info__photo-container">
                    <img src={photo} className="trainer-info__photo-container--profile-photo"/>
            </div>
            <div className="trainer-info__container">
                <div className="trainer-info__name">
                <ShowTrainerDetail value={firstname} />
                &nbsp;
                <ShowTrainerDetail value={lastname} />                 
                </div>
                <table className="trainer-info__table">
                    <thead className="trainer-info__table--header">
                        <tr>
                            <td>Age</td>
                            <td>Gender</td>
                            <td>Sport</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="trainer-info__table--column">
                            <td><ShowTrainerDetail value={age} /></td>
                            <td><ShowTrainerDetail value={gender}/></td>
                            <td><ShowTrainerDetail value={sports}/></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}