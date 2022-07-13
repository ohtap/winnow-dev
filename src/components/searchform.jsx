/* File: Login.jsx
 * Author: Ben Ruland, Carlo Dino
 *
 * This file contains the React code for the Login page component of the
 * EpicConnect website. The page creates a form entry with two input
 * elements to collect the {username} and {password} fields from the user,
 * before connecting to the server to authenticate login credentials.
 */


import { Link } from "react-router-dom";
// import styles from main page, and auth.css
import "./searchform.css";
import { promises, useContext, useRef, useState } from "react";
import searchFiles from "./searchFunc";

export default function SearchForm() {

    // store selected directories to be passed on
    const [corpus, corpusUpdate]= useState();

    // store 
    const to_include = useRef();
    const to_exclude = useRef();

    // temp function to run as button onClick event
    const handleSubmit = (event) => {
        event.preventDefault();

        // TODO check if corpus hasn been selected


        //snags inputs
        const includeTokens = keywordParse(to_include.current.value);
        const excludeTokens = keywordParse(to_exclude.current.value);

        searchFiles(corpus,includeTokens,excludeTokens);

    };

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




    // picks a directory then prints all the files of the directory
    const filePicker = async(event) => {
        event.preventDefault();
        console.log(  "This is our file:");
        // grabs a directory
        const fileHandle = await showDirectoryPicker()

        // updates the global state to pass this handle around
        corpusUpdate(fileHandle);

        // Changes button text to represent the user selection
        // TODO check if there is a 'react' way of doing this. 
        document.getElementById("corpus").innerHTML = fileHandle.name;

        
    };


    return (
        <div className="w-100 vh-100 align-items-center source-sans border main" >
            {/* text div, stores "Sign in" etc text from top of the page */}
            <div className="w-auto">
                <h1 className="text-center">Winnow</h1>
                <p className="text-center login-text fs-5">Select your Corpus and search terms to begin</p>
            </div>
            {/* create form */}
            <div className="formContainer h-50">
                <form className="form-div mx-auto" onSubmit={handleSubmit}>
                    <button id = "corpus" className="form-input" onClick= {filePicker}> Pick Corpus
                    </button>
                    <input
                        className="form-input"
                        ref={to_include}
                        placeholder="Search Terms">
                    </input>
                    <input
                        className="form-input"
                        ref={to_exclude}
                        placeholder="Disclude Terms">
                    </input>
                    {/* submission button, uses onClick event to upload to server */}
                    <button type="submit" id="submit-btn" className="btn btn-success">
                        submit
                    </button>
                </form>
                <div className="w-auto pt-5">
                    <p className="text-center login-text fs-5 m-0">New to EpicConnect?</p>
                </div>
                 {/* create account redirect */}
                <div className="w-100 d-flex justify-content-center">
                    <Link to="/register" className="btn btn-success text-decoration-none">Create an Account</Link>
                </div>
            </div>
        </div>
    );
}
