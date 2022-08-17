/* 
 * Queries user to search their selected corpus, Sends user entered information to the SearchFunc component to run the actual search
 * 
 * -Ben Ruland
 */


// TODO :  ADD READING, SAVING FILES, flags and functionality. 

// import styles from main page, and auth.css
import search from "./search.jsx";
import "./searchform.css";
import { useContext, useRef, useState} from "react";
import { useNavigate } from "react-router";

import { AuthContext } from "../context/AuthContext";

export default function SearchForm() {

    
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

    // saving state variables
    const raw_include = useRef();
    const raw_exclude = useRef();
    const subCorp_name = useRef();

    // grabing the working dir
    const {winnowDir, dispatch} = useContext(AuthContext);


    /* IMPLEMENTATION THOUGHTS:
        Metadata

        add an optional metadata field to the form (ideal if we use some different form colors), make sure it only takes the proper file format

        pass all of this to a seperate metadata function. 
        // How does one even process an excel sheet? 
            some info on that, can use others libraries
            could also try and read it in myself? .. any way to do it in a general fashion? 
               well collecting could be possible but the treatment for each column is totally different dependent on the col data. 
                will get all the data into a 2d array 
*/
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
         runSearch().then(() => navigate("/results"));
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
            dispatch({ type: "RECENT RUN CHANGE", payload: recentRunDir});
        });
        
        if (!recentRunDir){
            alert("There was an error in searching, please try again or contact a developer");
        }
      
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
        // CHANGE BACK TO DIRECTORY PICKER
        var fileHandle = await showDirectoryPicker();
        console.log(fileHandle);
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
        // TODO check if there is a 'react' way of doing this. 
        document.getElementById("metadata").innerHTML = fileHandle.name;

    }

    return (
        <div>
            {/* Conditionally rendering a loading screen or the search form*/}
            {loading 
                ? <div>
                    
                    {!flag &&
                     <div className = "loaderContainer">
                        <div className="loader"></div>
                         <p>Searching files, {progress} files searched</p>
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
                            <button type = "button" id = "corpus" className="form-input" onClick= {filePicker}> Pick Corpus</button>
                         
                              <button
                              type = "button"
                                className = "form-input"
                               id = "metadata"
                               onClick = {metaFilePicker}>
                                Metadata (optional)
                            </button>
                            <input 
                                 className="form-input"
                                 ref={subCorp_name}
                                 placeholder="Results Name">
                                     
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
