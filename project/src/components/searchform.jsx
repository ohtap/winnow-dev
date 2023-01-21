/* 
 * Queries user to search their selected corpus,
 Sends user entered information to the SearchFunc component to run the actual search
 * 
 * -Ben Ruland
 */

// import styles from main page, and auth.css
import search from "./search.jsx";
import "./searchform.css";
import { useContext, useRef, useState, useEffect } from "react";

import { AuthContext } from "../context/AuthContext";
//import { parse } from '@fast-csv/parse';

import { Pages } from "../App.jsx";
// takes in a 1 if called from the landing page, and a 0 if called from elsewhere within the site. 
export default function SearchForm(props) {
    const { fromLanding, pageSet } = props

    // stores the selected directories to be passed on
    const [corpus, corpusUpdate] = useState();
    // finished searching flag, will use later to redirect to results page
    const [flag, setFlag] = useState(false);
    // loading flag, used to conditionally render a loading screen while searching
    const [loading, setLoading] = useState(false);
    // used to render how many files have been searched
    let [progress, setProgress] = useState(0);
    // keyWord groups
    let [wordGroups, setWordGroups] = useState({});
    // all the folder names in logged searches
    let [prevSearches,setprevSearches] = useState([]);
    const [metaFile, setMetaFile] = useState();

    useEffect(() => {
        snagWordGroups();
        snagPrevSearches();
        if (!winnowDir) {
            pageSet(Pages.Landing);
        }
    }, []);

    // saving state variables
    const raw_include = useRef();
    const subCorp_name = useRef();
    const selected_Group = useRef();

    // grabing the working dir
    const { winnowDir, dispatch } = useContext(AuthContext);

    const snagWordGroups = async () => {
        const dataDir = await winnowDir.getDirectoryHandle("Winnow Data");
        const wordGroupsHandle = await dataDir.getFileHandle("wordGroups.json");

        let wordGroupsFile = await wordGroupsHandle.getFile()
        wordGroupsFile = await wordGroupsFile.text()
        const wordGroupsdata = await JSON.parse(wordGroupsFile)

        setWordGroups(wordGroupsdata);
    }

    const snagPrevSearches = async() => {
        const logs = await winnowDir.getDirectoryHandle("Search Logs");
        const test2 = await winnowDir.getFileHandle("test.txt");
        const tempSearches = [];
        const searches = await winnowDir.getDirectoryHandle("Search Logs")
        for await (const entry of searches.values()) {
            tempSearches.push(entry.name);
          }
        setprevSearches(tempSearches);
    }

    const updateProgCount = () => {
        setProgress(progress += 1);
    }
    async function verifyPermission(fileHandle, withWrite) {
        const opts = {};
        if (withWrite) {
            opts.mode = 'readwrite';
        }
        // Check if we already have permission, if so, return true.
        if (await fileHandle.queryPermission(opts) === 'granted') {
            console.log("permission = true");
            return true;
        }
        // Request permission to the file, if the user grants permission, return true.
        if (await fileHandle.requestPermission(opts) === 'granted') {
            return true;
        }
        console.log("could not obtain permission");
        // The user did not grant permission, return false.
        return false;
    }

    // Runs the form submission
    const handleSubmit = async (event) => {

        // prevents page refresh
        event.preventDefault();
        // error checking
        if (!corpus){
            alert("please select a corpus");
        }else if(prevSearches.includes(subCorp_name.current.value)){
            alert("Results name already used, rename search to continue");
        }
        else {
            console.log("Navigating to results");
            runSearch().then(() => {
                console.log("navigating")
                setLoading(false);
                pageSet(Pages.Results)
            });
        }
    };

    // parses keywords, sets loading flag, then runs the actual search and save process
    const runSearch = async () => {

        let groupWords = ""
        if (selected_Group.current.value != ' ' && selected_Group.current.value != '') {
            groupWords = wordGroups[selected_Group.current.value];
        }

        const includeTokens = keywordParse(raw_include.current.value + "," + groupWords);
        //const excludeTokens = keywordParse(raw_exclude.current.value);

        // begin loading
        setLoading(true);

        const date = new Date();
        // TODO pass prop containing the metaData file. 
        // send off to do the search, then set the created results directory in the global state
        await search(corpus, includeTokens, subCorp_name.current.value, winnowDir, updateProgCount,date).then((recentRunDir) => {
            if (!recentRunDir) {
                alert("There was an error in searching, please try again or contact a developer");
            }

            dispatch({ type: "RECENT RUN CHANGE", payload: recentRunDir });
            setProgress(0);
        });
    }

    // parses comma seperated keywords into an array and trims whitespace
    // TODO add handling of strict search characters and other modifiers 
    const keywordParse = (keywords) => {
        const tokens = keywords.split(',');
        const cleantokens = [];

        for (var token of tokens) {
            // cleaning tokens 
            token = token.toLowerCase();
            token = token.replace(/[,."!?@#$%&]+/g, " ").trim();

            cleantokens.push(token.trim());
        }
        return cleantokens;
    }

    // picks a directory to use 
    const filePicker = async (event) => {
        event.preventDefault();

        // grabs a directory
        var fileHandle = await showDirectoryPicker();
        console.log("This is our file:");
        console.log(fileHandle);
        // updates the global state to pass this handle around
        corpusUpdate(fileHandle);
        verifyPermission(fileHandle, true);
        // Changes button text to represent the user selection
        // TODO check if there is a 'react' way of doing this. 
        document.getElementById("corpus").innerHTML = fileHandle.name;


    };

    // Most html components below pull from the props to determine their CSS styling. 
    return (
        <div>
            {/* Conditionally rendering a loading screen or the search form*/}
            {loading
                ? <div>

                    {!flag &&
                        <div className={`loaderContainer${fromLanding}`}>
                            <div className="loader"></div>
                            <p>Searching files, {progress} files searched</p>
                        </div>}
                </div>
                : <div className={`page${fromLanding}`} >
                    {/* text div, stores "Sign in" etc text from top of the page */}
                    <div className={`header${fromLanding}`}>
                        <h1 className="text-center">Winnow</h1>
                        <p className="text-center login-text fs-5">Select your Corpus and search terms to begin</p>
                    </div>
                    {/* create form */}
                    <div className={`formContainer${fromLanding} h-50`}>
                        <form className={`form-div${fromLanding}`} onSubmit={handleSubmit}>
                            <button type="button" id="corpus" className={`form-button${fromLanding}`} onClick={filePicker}> Pick Corpus</button>

                            <input
                                className={`form-input${fromLanding}`}
                                ref={subCorp_name}
                                placeholder="Results Name">

                            </input>
                            <p> Enter search terms seperated by a comma. Single terms only, no phrases </p>
                            <input
                                className={`form-input${fromLanding}`}
                                ref={raw_include}
                                placeholder="Search Terms">
                            </input>

                            <div>
                            <label> Saved Search Terms:</label>
                            <select id="groupSelect" ref={selected_Group}>
                                <option></option>
                                {
                                Object.keys(wordGroups).map(group => 
                                    <option value = {group}>{group}</option>)
                                }
                            </select>
                            </div>

                            {/* submission button, uses onClick event to upload to server */}
                            <button type="submit" id="submit-btn" className={`submitButton${fromLanding}`}>
                                submit
                            </button>
                        </form>
                    </div>
                </div>}
        </div>
    );
}
