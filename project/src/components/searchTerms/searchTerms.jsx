
import { AuthContext } from "../../context/AuthContext";
import { useContext,useState,useEffect } from "react";
import useCollapse from 'react-collapsed';
import "./searchTerms.css";
import { renderMatches } from "react-router";
import WordGroup from "./wordGrouping";
import "./wordGrouping.css"

export default function SearchTerms() {

  // TODO rewrite recentRunDir to better reflect that it is whatever run we wish to display on the results page. 
  // BETTER: figure out how to actually pass the props because really this should just be a prop. 

var {winnowDir} = useContext(AuthContext);
let [wordsMap,setWordsMap] = useState([]);
let [render, setRender] = useState(0);
    // obj containing the keyword groups - key is groupname - value is list of words to search with


  //runs the main function, prevents multiple reruns of main
  useEffect( () => {
   main();
  },[winnowDir])


  // Loads up the JSON object contaning all keyword groups 
  const getInfo = async() =>{
    const dataDir = await winnowDir.getDirectoryHandle("Winnow Data");
    const wordGroups= await dataDir.getFileHandle("wordGroups.json");
    let wordGroupsFile = await wordGroups.getFile()
    wordGroupsFile = await wordGroupsFile.text()
    wordGroupsFile = await JSON.parse(wordGroupsFile)
    
    let wordsOutcome = Object.keys(await wordGroupsFile)
    setWordsMap(wordsOutcome)

   // console.log(wordGroupsFile)
    
}

  const main = async() =>{
   getInfo();
  }
  const createNew = () => {

  
        wordsMap.unshift("New Word Group")
         setRender(render+1);
        
    }

  return (
    <div>
        <button onClick= {createNew}>Create New</button>
        {
            wordsMap.map(((word)=>(
                <WordGroup key = {word} groupName = {word} />
            )))
        }


   </div>
    
  );
}