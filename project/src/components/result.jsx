
import { AuthContext } from "../context/AuthContext";
import { useContext,useState,useEffect } from "react";
import useCollapse from 'react-collapsed';

import "./result.css";



export default function DisplayResult() {

  // TODO rewrite recentRunDir to better reflect that it is whatever run we wish to display on the results page. 
  // BETTER: figure out how to actually pass the props because really this should just be a prop. 

var {dispatch, winnowDir, recentRunDir,runResults} = useContext(AuthContext);
  const { getCollapseProps, getToggleProps, isExpanded } = useCollapse();


  var [about, setAbout] = useState("");

  useEffect( () => {
    console.log("running use effect");
    main();
  },[])
  // returns an object containing all of the JSON data written in the about.txt file of the recently searched corpus
  const getAboutData = async() => {
    const data_Handle = await recentRunDir.getDirectoryHandle("Winnow_data");


    const aboutFileHandle = await data_Handle.getFileHandle("about.txt");
    var aboutFile = await aboutFileHandle.getFile();
    aboutFile = await aboutFile.text();

    const aboutData = JSON.parse(aboutFile);

    return aboutData
  }

  // takes an object and displays in the about search section all of the keys and values that are not
  // keyword counts. 
  const displayAbout = (aboutData)=> {
    var tag = document.createElement("p"); 
    var text = "";
    
    for (var key of Object.keys(aboutData)){
      if (key === "wordCounts"){
        //do nothing 
      }else {
        text += `${key}: ${aboutData[key]}    ` ;
      }
      
    }
  
    setAbout(text);
    var element = document.getElementById("about");
    element.appendChild(tag);
  }

 const createKeyWordTable = (keyWordCounts) => {

  const keyWords = Object.keys(keyWordCounts);

  // getting the div in which to place the element and creating the table element
    const div = document.getElementById("keyWordContent");


    const tbl = document.createElement('table');

    // adding style
     tbl.classList.add("style");
    //tbl.style.width = "100%";
    //tbl.style.border = '1px solid black';

    // need to dynamically determine how to create these rows and cols
    console.log(keyWords.length);
    var i = 0;
     while(i < keyWords.length){
      const tr = tbl.insertRow();
      for (let j = 0; j < 3; j++) {
        const td = tr.insertCell();
        td.appendChild(document.createTextNode(`${keyWords[i]}:  ${keyWordCounts[keyWords[i]]}`) );
        i++;
        /*if (i === 1 && j === 1) {
          td.setAttribute('rowSpan', '2');
        }*/
        
      }
    }

    div.appendChild(tbl);
  }

  const main = async() =>{

    if(runResults){
      await dispatch({ type: "RUN RESULTS", payload: false});
      runResults = false;
      const about_data = await getAboutData();
      displayAbout(about_data);
      createKeyWordTable(about_data["wordCounts"]);

    }

    
  }
  
  console.log("running page");


  return (
    <div>
      <div className="aboutSearch" id = "about">
         <pre className = "aboutTxt">{about} </pre>
      </div>

    <div className="keyWordsContainer">
        <div className="header" {...getToggleProps()}>
          {isExpanded ? 'Collapse' : 'Expand'}
        </div>
        <div {...getCollapseProps()}>
          <div className="keyWordsContent" id = "keyWordContent">
          </div>
        </div>
  </div>

    </div>
    
  );
}