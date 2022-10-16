import { useContext,useState,useEffect } from "react";
import { AuthContext } from '../../context/AuthContext';

export default function WordGroup({groupName}){
    let {winnowDir} = useContext(AuthContext);

    let [words,setWords] = useState();
    
    // uses the given group name and our default path for word word groups to grab the all the information associated with the word grouping
    const getInfo = async() =>{
        const dataDir = await winnowDir.getDirectoryHandle("Winnow Data");
        const wordGroups= await dataDir.getFileHandle("wordGroups.json");
        let wordGroupsFile = await wordGroups.getFile()
        wordGroupsFile = await wordGroupsFile.text()
        wordGroupsFile = await JSON.parse(wordGroupsFile)
        
        setWords(wordGroupsFile["hello"])
       // console.log(wordGroupsFile)
        
    }

    // Okay, not exactly what I was hoping for since strings are immutable it means I gotta do some work on this one. 
    // Silly to have to snag it outta the html element -> we will see if we can just drop this as a p tag
    const highLightTest = () =>{
        let txt = document.getElementById("text");
        txt = txt.innerHTML
        console.log(txt)
        let newTxT = "<mark>" + txt.substring(0,10) + "</mark>" + txt.substring(10,txt.length);

        document.getElementById("text").innerHTML = newTxT;
    }

    
    /*
    To Do - go back to EpicConnect and check out how we set things up as a text field

    Smash this into a flex box
    Add a section for the wordGroup title
    a section for the search terms
    a section for exclude terms

    lay down a button for edit
    Make the button switch to the save button & delete button on click

    Make all text change to a field with that text entered into it on edit click

    Save this stuff to the file and change back to normal text on save click. 

    */

    let p = "<p> yo yo<mark> yo this </mark> is whats up </p>"


  getInfo();

    return (
        <div><p>Hello {words}</p>
        <p id = "text"> Here is a but load of text and hopefully some highlighting will work</p>
        
        </div>
    )
}