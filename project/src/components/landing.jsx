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
            navigate("/search");
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
    </div>
</div>);
};
