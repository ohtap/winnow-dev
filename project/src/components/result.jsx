
import { AuthContext } from "../context/AuthContext";
import { useContext,useState,useEffect } from "react";
import useCollapse from 'react-collapsed';
import SearchForm from "./searchform";
import "./result.css";
import { useNavigate } from "react-router";


export default function DisplayResult() {

  // TODO rewrite recentRunDir to better reflect that it is whatever run we wish to display on the results page. 
  // BETTER: figure out how to actually pass the props because really this should just be a prop. 
  const navigate = useNavigate();
var {dispatch,recentRunDir, winnowDir} = useContext(AuthContext);
  const { getCollapseProps, getToggleProps, isExpanded } = useCollapse();

  // state for about readout
  var [about, setAbout] = useState("");

  // /TODO: fix the multiple page run issue.
  //runs the main function, prevents multiple reruns of main
  useEffect( () => {
    main();
  },[recentRunDir])

  // returns an object containing all of the JSON data written in the about.txt file of the recently searched corpus
  const getAboutData = async() => {
   //const data_Handle = await recentRunDir.getDirectoryHandle("Winnow_data");


    const aboutFileHandle = await recentRunDir.getFileHandle("about.txt");
    var aboutFile = await aboutFileHandle.getFile();
    aboutFile = await aboutFile.text();

    const aboutData = JSON.parse(aboutFile);

    return aboutData
  }

  // takes an object and displays in the about search section all of the keys and values that are not
  // keyword counts. 
  const displayAbout = (aboutData)=> {
    //var tag = document.createElement("p"); 
    var text = "";
    
    for (var key of Object.keys(aboutData)){
      if (key === "wordCounts"){
        //do nothing 
      }else {
        text += `${key}: ${aboutData[key]}    ` ;
      }
      
    }
  
    setAbout(text);
    /*var element = document.getElementById("about");
    element.appendChild(tag);*/
  }

  // creates and displays a table of all keyword counts
 const createKeyWordTable = (keyWordCounts) => {

  const keyWords = Object.keys(keyWordCounts);

  // getting the div in which to place the element and creating the table element
    const div = document.getElementById("wordContent");

    // removing any existing table on reloads.
    while(div.firstChild){
      div.removeChild(div.firstChild);
    }

    const tbl = document.createElement('table');
    // adding style
     tbl.classList.add("style");

     // creating the content of the table
    var i = 0;
    while(i < keyWords.length){
    const tr = tbl.insertRow();
      for (let j = 0; j < 3; j++) {
        const td = tr.insertCell();
        td.appendChild(document.createTextNode(`${keyWords[i]} : ${keyWordCounts[keyWords[i]]}`) );
        i++; 
        
        if(i >= keyWords.length){
          break;
        }

      }
    }

    div.appendChild(tbl);
  }

  /*
    deletes the entries data from the search logs and redirects to the search history page. 
  */
  const deleteResults = async() => {
      const logs = await winnowDir.getDirectoryHandle("Search Logs");
      console.log(logs)
      console.log(recentRunDir.name)
      const result = await logs.getDirectoryHandle(recentRunDir.name)
      console.log(result)
      try {
        for await(let value of result.keys()){
          await result.removeEntry(value)
        }
      await logs.removeEntry(result.name)
      navigate("/history")
      }
      catch(err) {
        console.log(err)
      }
  }

  const main = async() =>{
      const about_data = await getAboutData();
      displayAbout(about_data);
      createKeyWordTable(about_data["wordCounts"]);

  }
  


  return (
    <div>
      <SearchForm fromLanding={0}/>
      <div className="aboutSearch" id = "about">
         <pre className = "aboutTxt">{about} </pre>
      </div>

    <div className="wordsContainer">
        <div className="header" {...getToggleProps()}>
            Key Word Frequencies
          <div className = "collapseExpand">{isExpanded ? '-' : '+'}</div>
          
        </div>
        <div {...getCollapseProps()}>
          <div className="wordsContent" id = "wordContent">
          </div>
        </div>

  </div>
  <div>
          <button onClick = {deleteResults}>Delete Results</button>
        </div>
    </div>
    
  );
}