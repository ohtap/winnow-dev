import { useContext, useState, useEffect } from "react";
import { AuthContext } from '../../context/AuthContext';
import "./wordGrouping.css"
export default function WordGroup(props) {

    const {words: origWords, groupName, deleteEntry,save, setWords: setOrigWords} = props;
    const [words, setWords] = useState(origWords);

    const [edit,setEdit] = useState(false);

    /* Update words when origWords changes */
    useEffect (()=> {
         setWords(origWords);
        }, [origWords]);


    const changeEdit= () =>{
        setEdit(!edit);
        }

    
    const saveTerm = (event) => {
        setEdit(!edit)
        setOrigWords(words)
        save()
    }
    return (

        <div>
            
            {
                edit ?
                    <div className="wordGroup">
                        <button className="editButton" onClick={saveTerm} >Save</button>
                        <button className = "deleteButton" onClick = {deleteEntry}>Delete</button>
                        <div className="title">
                            <p id = "title"> {groupName}</p>
                        </div>
                        <div>
                            <label  className="label1">Search Terms:</label> <textarea id = "searchWords" 
                                                onChange={(event) => setWords(event.target.value)}>{words}  
                            </textarea>
                        </div>
                    </div> :

                    <div className="wordGroup">
                        <button className="editButton" onClick={changeEdit}>Edit</button>
                        <div className="title">
                            <p id = "titleNE"> {groupName}</p>
                        </div>
                        <div>
                            <label className="label1">Search Terms:</label> <p>{words}</p>
                        </div>
                    </div>

            }
            </div>
        


    )
}

/*
    let { winnowDir } = useContext(AuthContext);
onBlur={() => saveWords(words)}
    let [wordGroupsHandle,setWordGroupsHandle] = useState()
    let [wordGroupsObj, setWordGroupsObj] = useState()
    let [words, setWords] = useState();
    let [edit, setEdit] = useState(false)
    let [name, setName] = useState(groupName);
    let [deleted,setDeleted] = useState(false);
    useEffect(() => {
        if (name == "New Word Group"){
            setEdit(true);
        }
        getInfo();
    }, [winnowDir])

    // uses the given group name and our default path for word word groups to grab the all the information associated with the word grouping
    const getInfo = async () => {
        const dataDir = await winnowDir.getDirectoryHandle("Winnow Data");
        const wordGroups = await dataDir.getFileHandle("wordGroups.json");
        setWordGroupsHandle(await wordGroups);
        let wordGroupsFile = await wordGroups.getFile()
        wordGroupsFile = await wordGroupsFile.text()
        wordGroupsFile = await JSON.parse(wordGroupsFile)
        setWordGroupsObj(await wordGroupsFile);
        setWords(wordGroupsFile[name])
        // console.log(wordGroupsFile)

    }

    const getData = async() => {
        const dataDir = await winnowDir.getDirectoryHandle("Winnow Data");
        const wordGroups = await dataDir.getFileHandle("wordGroups.json");
        let wordGroupsFile = await wordGroups.getFile()
        wordGroupsFile = await wordGroupsFile.text()
        wordGroupsFile = await JSON.parse(wordGroupsFile)

        return wordGroupsFile;
    }
   



    const save = async() => {
        
       let  wordGroups = await getData();
        console.log("runnin save")
        let searchWords = document.getElementById("searchWords").innerText
        let title = document.getElementById("title").value

       
        if (title == "New Word Group"){
            alert("please change the title name before saving");
            return;
        }

        delete (wordGroups[name]);
        // updates the word groups Map
        wordGroups[title] = searchWords; 
 
        // saves the object to the file system. 

        const writer = await wordGroupsHandle.createWritable();
        await writer.write(JSON.stringify(wordGroups,null,2)).then(() => writer.close());

        setEdit(false);
        setName(title);
        setWords(searchWords);
    }

    const deleteEntry= async() =>{
        let wordGroups = await getData();
        delete(wordGroups[name]);
        console.log(wordGroups);
        const writer = await wordGroupsHandle.createWritable();
        await writer.write(JSON.stringify(wordGroups,null,2)).then(() => writer.close());

        setDeleted(true);
    }
    /*
    New Thoughts TODO: 
    Create a more robust txt file with word groups

    Create a component that displays these well: NAME : WORDS 
    Create an EDIT BUTTON in the component
    CREATE A FLAG for the edit button, render the original contents conditionally based off this component. 
    the other thing to render off this flag is:
    Create a txt box with an id - save the contents of this box in state on the press of a submit button. 

    On submit - place the info into the state that is being rendered : 
    rewrite the JSON object entry for this -> (first remove the entry, then place this entry back to easily handle the occurencd of a title change)

    Place a delete button - and a delete flag - delete button deletes the entry on submit and rewrites the file. It then sets the flag - we conditionally render everything based off this flag.
    */

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

