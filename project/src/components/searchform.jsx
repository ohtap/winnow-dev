/* 
 * Queries user to search their selected corpus, Sends user entered information to the SearchFunc component to run the actual search
 * 
 * -Ben Ruland
 */


// TODO :  ADD READING, SAVING FILES, flags and functionality. 

// import styles from main page, and auth.css
import "./searchform.css";
import { useContext, useRef, useState} from "react";
import SearchFiles from "./searchFunc";
import { useNavigate } from "react-router";

import { AuthContext } from "../context/AuthContext";
import { useEffect } from "react";

export default function SearchForm() {

    
    // stores the selected directories to be passed on
    const [corpus, corpusUpdate]= useState();
    // finished searching flag, will use later to redirect to results page
    const [flag, setFlag] = useState(false);
    // loading flag, used to conditionally render a loading screen while searching
    const [loading, setLoading] = useState(false);
    // used to render how many files have been searched
    const [progress, setProgress] = useState(0);

    // used to navigate to a new page
    const navigate = useNavigate();

    // saving state variables
    const raw_include = useRef();
    const raw_exclude = useRef();
    const subCorp_name = useRef();

    // grabing the working dir
    const {winnowDir} = useContext(AuthContext);

    // controls navigating to the results page when done searching
    // using a useEffect to keep everything rendering in the same order for react. 
    useEffect(() => {
        if(winnowDir && flag) {
        // TODO update state for the most recent processed file 
        // then navigate to results page. 
        navigate("/results");
        }
    },[flag])

    // Runs the form submission
    const handleSubmit = async (event) => {
        // prevents page refresh
        event.preventDefault();
        // checks if corpus has been selected then runs search
        if (corpus){
        runSearch().then(() => setFlag(true));
        } else {
            alert("please select a corpus");
        }
    };

    // parses keywords, sets loading flag, then runs the actual search and save process
    const runSearch = async() => {
        const includeTokens = keywordParse(raw_include.current.value);
        const excludeTokens = keywordParse(raw_exclude.current.value);

        setLoading(true);

        return await SearchFiles(corpus,includeTokens,excludeTokens,subCorp_name.current.value, progress, setProgress,winnowDir);
        // takes the place of redirecting to a new page at the moment
        
        // TODO sends the search results (probably a file handle and status of search) to a new page. 
        
    }

    // parses comma seperated keywords into an array and trims whitespaces

    // TODO add wildcards. 
    const keywordParse = (keywords) => {
        const tokens = keywords.split(',');
        const cleantokens = [];

        for (var token of tokens){
            // cleaning tokens 
            token = token.toLowerCase();
            token= token.replace(/[,."!?@#$%&*]+/g, " ").trim();

            cleantokens.push(token.trim());
        }
        return cleantokens;
    }

    // picks a directory to use 
    const filePicker = async(event) => {
        event.preventDefault();
        console.log(  "This is our file:");
        // grabs a directory
        const fileHandle = await showDirectoryPicker({mode: "readwrite"})

        // updates the global state to pass this handle around
        corpusUpdate(fileHandle);

        // Changes button text to represent the user selection
        // TODO check if there is a 'react' way of doing this. 
        document.getElementById("corpus").innerHTML = fileHandle.name;

        
    };


    return (
        <div>
            {/* Conditionally rendering a loading screen or the search form*/}
            {loading 
                ? <div>
                    
                    {!flag &&
                     <div>
                        <div className="loader"></div>
                         <p>Compiling files, {progress} files read</p>
                     </div>}
                    
                    </div>
                :<div className="w-100 vh-100 align-items-center source-sans border main" >
                    {/* text div, stores "Sign in" etc text from top of the page */}
                    <div className="w-auto">
                        <h1 className="text-center">Winnow</h1>
                        <p className="text-center login-text fs-5">Select your Corpus and search terms to begin</p>
                    </div>
                    {/* create form */}
                    <div className="formContainer h-50">
                        <form className="form-div mx-auto" onSubmit={handleSubmit}>
                            <button id = "corpus" className="form-input" onClick= {filePicker}> Pick Corpus</button>
                           {/* <button id = "destCorpus" className="form-input" onClick= {destPicker}> Pick Corpus
                            </button>*/}
                            <input 
                                 className="form-input"
                                 ref={subCorp_name}
                                 placeholder="Subcorpi Name"> 
                             </input>
                            <input
                                className="form-input"
                                ref={raw_include}
                                placeholder="Search Terms">
                            </input>
                            
                            <input
                                className="form-input"
                                ref={raw_exclude}
                                placeholder="Exclude Terms">
                            </input>
                            {/* submission button, uses onClick event to upload to server */}
                            <button type="submit" id="submit-btn" className="btn btn-success">
                                submit
                            </button>
                        </form>
                    </div>
                </div>}
        </div>
    );
}
