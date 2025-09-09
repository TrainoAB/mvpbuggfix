
'use client';
import GoBackButton from "./GoBackButton"
import Link from "next/link";
import HamburgerMenu from "./HamburgerMenu";
import './HeaderMyCustomers.css'

export default function HeaderMyCustomers(props) {
    console.log("Navigation Path:", props.navigationPath); // Logga värdet av navigationPath

    return (
            <div id="header-my-customers">
                <Link href={`${props.navigationPath}`} className="header__nav-button" >
                    <GoBackButton />
                </Link>
                <HamburgerMenu />
                <span className="header__title">{props.title}</span>
                
            </div>)
}