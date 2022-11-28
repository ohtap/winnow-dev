/*
    The purpose of this page is to obtain the users permissions for the entire winnow directory so we do not need to ask again for any file manipulation and creation
    within the diredtory. 
*/

import { useNavigate, useLocation} from "react-router-dom";
// import styles from main page, and auth.css
import "./searchform.css";
import { useContext, useState,} from "react";
import { AuthContext } from "../context/AuthContext.jsx";
export default function Landing() {

    const [directory,setDirectory] = useState();
    const navigate = useNavigate();

    const { dispatch } = useContext(AuthContext);

    // taken from file system access API, checks for permissions and if not found requests them
    // must be called on a user action (i.e button press)
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
      
    
    // Serves the altogether important task of verifying the Winnow specific folders exits and if not, it creates these folders.
    // Current structre :
    /*
      Winnow Dir:
        Search Logs:
            *Winnow creates a folder for every search within *
        Winnow Data:
            wordGroups.json  *A file containing all the user created word groups*
                
    */
    const confirmFileStructure = async(winnowDir) => {
        const searchLogs  = await winnowDir.getDirectoryHandle("Search Logs", {create:true})
        const winnow_Data = await winnowDir.getDirectoryHandle("Winnow Data", {create:true})
        const collections = await winnowDir.getDirectoryHandle("Winnow Collections", {create:true})
        await winnow_Data.getFileHandle("wordGroups.json",{create:true})
    }
    

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // TODO check if corpus hasnt been selected

        // grabs user verification for write privledges 
         // await verifyPermission(destCorpus,true);
        
        if (directory) {
        const permission =  await verifyPermission(directory,true);

        if (permission){
            // Updating the context state. 
            console.log("dispatching payload");
            dispatch({ type: "DIRECTORY CHANGE", payload: directory });
            await confirmFileStructure(directory).then(() => { navigate("/search")});
        
            //protoSearch();
            
        }  

        /*if (permission) {
            changeWDirectory(directory);
            navigate("/search");
        }*/
        else {
            alert("Please allow access to Winnow files to be able to continue");
        }
    }else{
        alert("Please select a directory before continuing, If you do not have one please make an empty folder then select it");
    }
        
    };


    // picks a directory to use 
    const filePicker = async(event) => {
        event.preventDefault();
        // grabs a directory
        const fileHandle = await showDirectoryPicker({mode: "readwrite"})

        // updates the global state to pass this handle around
        setDirectory(fileHandle);

        // Changes button text to represent the user selection
        // TODO check if there is a 'react' way of doing this. 
        document.getElementById("workingDirectory").innerHTML = fileHandle.name;

        
    };

return (
<div className="w-100 vh-100 align-items-center source-sans border main" >
{/* text div, stores "Sign in" etc text from top of the page */}
    <div className="w-auto">
        <h1 className="text-center">Winnow</h1>
        <p className="text-center login-text fs-5">Please select the working directory for Winnow and allow read/write permissions</p>
        <p className = "text-center login-text fs-5"> If you do not have a Winnow directoy, go ahead and make a new folder. Preferably someplace easy to locate such as your desktop or documents. </p>
    </div>
    {/* create form */}
    <div className="formContainer1 h-50">
        <form className="form-div1 mx-auto" onSubmit={handleSubmit}>
            <button id = "workingDirectory" className="form-input1" onClick= {filePicker}> Pick Winnow Directory</button>
            {/* submission button,*/}
            <button type="submit" id="submit-btn" className="submitButton1">
                submit
            </button>
        </form>
        <br></br>
        <p> About Winnow: Winnow is designed to be a text search tool for researchers. Rather than giving you the most popular five items that match your search, we aim to give you a comprehensive and accurate account of all the articles that match your search.</p>
    <p>How to use Winnow? </p>
        <p> Winnow currently has several features, once you enter a working directory you can simply conduct a new search on the "New Search" page.
        If you have a large list of search terms you would like to store you can create a set of terms to search by in the "Search Term Library".
        To view a history of searches visit the "Search History" tab and if you wish to view the results of one of those searches you can click on the entry to take you to the results page.
        While on the results page you can choose to save a copy of all the files to your folder of choice by clicking "save results" at the bottom of the page, or if you do not like those results you can click "delete results" to remove them from your search history.
        Remember, it is important to select the winnow directory you used previously as all your winnow data is saved here</p>
    </div>
    
</div>);
};
