/* File: NavBar.js
 * Author(s): Ben Ruland
 *
 */


import { AuthContext } from "../../context/AuthContext";
import { useContext } from "react";
import "./navbar.css";
import "../../App.css";  // import App-wide style sheet
import { Pages } from "../../App";
function NavBar(props) {
    const { pageSet } = props

    console.log("setting page")
    //pageSet("fiver");
    const { winnowDir } = useContext(AuthContext);


    return (
        // create nav element to contain navbar elements
        // className="navbar d-flex source-sans justify-content-start sticky-top navbar-light bg-light px-3"
        <div className="navBar">
            {/* logo/name element div */}
            <div className="w-25">
                <div className="d-flex w-25 ps-3">

                    <p className="text-start text-grey ps-3 mt-2 fs-3">Winnow</p>
                </div>
            </div>
            {/* navigation links div */}
            {winnowDir ? <div className="d-flex w-50 fs-3 pb-2 justify-content-center">
                <button className="navlink" onClick={(event) => {
                    event.preventDefault;
                    pageSet(Pages.Landing)
                }}
                >Home</button>
                <button className="navlink" onClick={(event) => {
                    event.preventDefault;
                    pageSet(Pages.Search)
                }}>New 2.0 Search</button>
                <button className="navlink" onClick={(event) => {
                    event.preventDefault;
                    pageSet(Pages.SearchTerms)
                }}>Search-Term Library</button>
                <button className="navlink" onClick={(event) => {
                    event.preventDefault;
                    pageSet(Pages.History)
                }}>Search History</button>


            </div > :
                <div className="d-flex w-50 fs-3 pb-2 justify-content-center">
                    <button className="navlink" onClick={(event) => {
                        event.preventDefault;
                        pageSet(Pages.Landing)
                    }}
                    >Home</button>
                </div>}
        </div>
    );
}

export default NavBar;
