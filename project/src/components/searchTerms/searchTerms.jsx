
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
let [render, setRender] = useState(0);
let [wordGroupsHandle, setWordGroupsHandle] = useState({})
const [wordGroups, setWordGroups] = useState([]);
const [wordsOnDel, setWordsOnDel] = useState([])
const [newTitle, setNewTitle] = useState();
useEffect(
   () => {
   getWordGroups();
  //setWordGroups(groups);
}, [winnowDir]);



    // obj containing the keyword groups - key is groupname - value is list of words to search with

  const createNew = () => {

        wordGroups.unshift({groupName: newTitle, words:""})
         setRender(render+1);
        
    }



    const getWordGroups = async () => {
      const dataDir = await winnowDir.getDirectoryHandle("Winnow Data");
      const wordGroups= await dataDir.getFileHandle("wordGroups.json");
      setWordGroupsHandle(wordGroups)
      let wordGroupsFile = await wordGroups.getFile()
      wordGroupsFile = await wordGroupsFile.text()
      wordGroupsFile = await JSON.parse(wordGroupsFile)
    
      let wordsOutcome = Object.keys(wordGroupsFile)

      let wordData = []
      for(let i =0; i< wordsOutcome.length; i++){
          let group = {groupName: wordsOutcome[i], words: wordGroupsFile[wordsOutcome[i]]}
          wordData.push(group)
      }
      setWordGroups(wordData);
    };
  

    const setWords = (idx, words) => {
      console.log("words changin")
      const newWordGroups = [...wordGroups];
      newWordGroups[idx].words = words;
      setWordGroups(newWordGroups);

    };
  
    const deleteGroup = (idx) => {

      const newWordGroups = [];
      for(let i = 0; i < wordGroups.length; i++){
         newWordGroups.push(wordGroups[i])
      }

      newWordGroups.splice(idx, 1);
      saveOnDel(newWordGroups)
    };


    const save = async(newWordGroups) => {
       
       
       /*if (title == "New Word Group"){
           alert("please change the title name before saving");
           return;
       }*/

       // saves the object to the file system. 
       
       let saveData = {}
       for (let i = 0; i< wordGroups.length; i++){
          let name = wordGroups[i].groupName
          let content = wordGroups[i].words
          saveData[name] = content;
       }

       const writer = await wordGroupsHandle.createWritable();
       await writer.write(JSON.stringify(saveData,null,2)).then(() => writer.close());
   }


  const saveOnDel = async(groupWords) => {
    
    /*if (title == "New Word Group"){
        alert("please change the title name before saving");
        return;
    }*/

    // saves the object to the file system. 
    
    let saveData = {}
    for (let i = 0; i< groupWords.length; i++){
       let name = groupWords[i].groupName
       let content = groupWords[i].words
       saveData[name] = content;
    }

    const writer = await wordGroupsHandle.createWritable();
    await writer.write(JSON.stringify(saveData,null,2)).then(() => writer.close());
    setWordGroups(groupWords)
}

  return (
    <div>
      <button onClick= {createNew}>Create New</button>
      <textarea id = "newTitle" placeholder="New Group Name" onChange={(event) => setNewTitle(event.target.value)}></textarea>
      {
        
        wordGroups.map((group, idx) => {
          const { groupName, words } = group;
          return (
            <WordGroup key={groupName} idx={idx} {...group}
                       setWords={(words) => setWords(idx, words)}
                       deleteEntry={() => deleteGroup(idx)}
                       save = {save}/>
          );
        })
      }
    </div>
  );
 
 
 /*   return (
    <div>
        
        {
            wordsMap.map(((word)=>(
                <WordGroup key = {word} groupName = {word} />
            )))
        }


   </div>
    
  );*/
}