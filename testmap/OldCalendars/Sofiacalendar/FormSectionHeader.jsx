import React, { useState } from "react";
import { deleteCookie } from "@/app/functions/functions";
import "./FormSectionHeader.css";

const FormSectionHeader = ({ heading, subHeading, info }) => {
    const [isModalVisible, setModalVisible] = useState(false);

    const showInfoModal = () => {
        deleteCookie("scheduleModalShown");
        // localStorage.removeItem('scheduleModalShown');
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const className = info === "info" ? "visible" : "hidden";

    return (
        <div className="form-header">
            <div className="circle">
                <span className="form-icon"></span>
            </div>
            <div className="form-heading-content">
                <div className="form-heading-and-info">
                    <h4 className="form-heading">{heading}</h4>
                    <span className={className} onClick={showInfoModal}></span>
                </div>
                <h6 className="form-subheading">{subHeading}</h6>
            </div>
            {isModalVisible && (
                <div id="infoModal">
                    <div className="modal-overlay" onClick={closeModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>Information</h2>
                            <p>
                                På den här sidan kan du lägga till om du vill ha återkommande- eller tilfälliga
                                träningspass. Fyll i vilka pass du vill hålla i på denna tiden. När ett pass har en lila
                                border är den vald. (Se under rubriken "Välj pass"). Fyll i de dagar som du kan hålla i
                                en träning. (Se under rubriken "Vilka dagar är du tillgänglig?"). Fyll också i vilken
                                tidsspann som du kan hålla i din träning. (Se under rubriken "Vilka tider är du
                                tillgänglig?"). Du kan även fylla i startDatum och slutDatum (Se under rubriken
                                "Datum"). Dina ändringar reflekteras i kalendern. Du kan sedan klicka på varje dag för
                                att editera tider för den dagen. Obs!! Se till att fylla i alla fält(Exempelvis "Välj
                                pass", "Vilka dagar är du tillgänglig?", "Datum") för att dina ändringar ska synas i
                                kalendern.
                            </p>
                            <button onClick={closeModal}>Stäng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormSectionHeader;
