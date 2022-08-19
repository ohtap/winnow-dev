/* 
 * Queries user to search their selected corpus,
 Sends user entered information to the SearchFunc component to run the actual search
 * 
 * -Ben Ruland
 */


// TODO :  ADD READING, SAVING FILES, flags and functionality. 

// import styles from main page, and auth.css
import search from "./search.jsx";
import "./searchform.css";
import { useContext, useRef, useState,useEffect} from "react";
import { useNavigate } from "react-router";

import { AuthContext } from "../context/AuthContext";

// takes in a 1 if called from the landing page, and a 0 if called from elsewhere within the site. 
export default function SearchForm({fromLanding}) {

    
    // stores the selected directories to be passed on
    const [corpus, corpusUpdate]= useState();
    // finished searching flag, will use later to redirect to results page
    const [flag, setFlag] = useState(false);
    // loading flag, used to conditionally render a loading screen while searching
    const [loading, setLoading] = useState(false);
    // used to render how many files have been searched
    var [progress, setProgress] = useState(0);
    const [metaFile, setMetaFile] = useState();
    // used to navigate to a new page
    const navigate = useNavigate();



    useEffect(() => {
        if(!winnowDir){
            navigate("/");
        }
    },[]);
    // saving state variables
    const raw_include = useRef();
    const raw_exclude = useRef();
    const subCorp_name = useRef();

    // grabing the working dir
    const {winnowDir, dispatch} = useContext(AuthContext);


 
    const updateProgCount = ()=>{
        setProgress(progress+= 1);
    }
    async function verifyPermission(fileHandle,withWrite) {
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
        
        // checks if corpus has been selected then runs search then navigates to the results pag
         if (corpus){
            console.log("Navigating to results");
         runSearch().then(() => {
            console.log("navigating")
            setLoading(false);
            navigate("/results")});
        } else {
            alert("please select a corpus");
        }
    };

    // parses keywords, sets loading flag, then runs the actual search and save process
    const runSearch = async() => {
        const includeTokens = keywordParse(raw_include.current.value);
        const excludeTokens = keywordParse(raw_exclude.current.value);

        // begin loading
        setLoading(true);

        
       // send off to do the search, then set the created results directory in the global state
        await search(corpus,includeTokens,subCorp_name.current.value,winnowDir, updateProgCount).then((recentRunDir) => {
            if (!recentRunDir){
                alert("There was an error in searching, please try again or contact a developer");
            }

            dispatch({ type: "RECENT RUN CHANGE", payload: recentRunDir});
        });
        
       
      
    }

    // parses comma seperated keywords into an array and trims whitespaces

    // TODO add handling of strict search characters and other modifiers 
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
        var fileHandle = await showDirectoryPicker();
       
        // updates the global state to pass this handle around
        corpusUpdate(fileHandle);
        verifyPermission(fileHandle, true);
        // Changes button text to represent the user selection
        // TODO check if there is a 'react' way of doing this. 
        document.getElementById("corpus").innerHTML = fileHandle.name;

        
    };

    const metaFilePicker = async(event) => {
        event.preventDefault();
        console.log(  "This is our file:");
        // grabs a directory
        const fileHandle = await showDirectoryPicker()
        
        // updates the global state to pass this handle around
        setMetaFile(fileHandle);
        verifyPermission(fileHandle, true);
        // Changes button text to represent the user selection
        document.getElementById("metadata").innerHTML = fileHandle.name;

    }


    return (
        <div>
            {/* Conditionally rendering a loading screen or the search form*/}
            {loading 
                ? <div>
                    
                    {!flag &&
                     <div className = {`loaderContainer${fromLanding}`}>
                        <div className="loader"></div>
                         <p>Searching files, {progress} files searched</p>
                     </div>}
                    </div>
                :<div className={`page${fromLanding}`} >
                    {/* text div, stores "Sign in" etc text from top of the page */}
                    <div className={`header${fromLanding}`}>
                        <h1 className="text-center">Winnow</h1>
                        <p className="text-center login-text fs-5">Select your Corpus and search terms to begin</p>
                    </div>
                    {/* create form */}
                    <div className={`formContainer${fromLanding} h-50`}>
                        <form className={`form-div${fromLanding}`} onSubmit={handleSubmit}>
                            <button type = "button" id = "corpus" className={`form-button${fromLanding}`} onClick= {filePicker}> Pick Corpus</button>
                         
                              <button
                              type = "button"
                                className = {`form-button${fromLanding}`}
                               id = "metadata"
                               onClick = {metaFilePicker}>
                             Metadata 
                            </button>
                            <input 
                                 className={`form-input${fromLanding}`}
                                 ref={subCorp_name}
                                 placeholder="Results Name">
                                     
                             </input>
                            <input
                                className={`form-input${fromLanding}`}
                                ref={raw_include}
                                placeholder="Search Terms">
                            </input>
                            
                            <input
                                className={`form-input${fromLanding}`}
                                ref={raw_exclude}
                                placeholder="Exclude Terms">
                            </input>
                          
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
