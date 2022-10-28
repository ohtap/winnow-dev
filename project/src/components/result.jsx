
import { AuthContext } from "../context/AuthContext";
import { useContext,useState,useEffect } from "react";
import useCollapse from 'react-collapsed';
import SearchForm from "./searchform";
import "./result.css";
import { useNavigate } from "react-router";
import { createRoot } from "react-dom/client";
import Highlighter from "react-highlight-words";

export default function DisplayResult() {


let testStart = "Test file words here, we can see how this will look if we keep writing a bunch of words. All the good things will happen, everythign will look great and we can all\
             go on our mery way having a grand ole time. All these words are gonna wrap, and scroll, and be aligned on the page, its gonna be wonderful!!! "


  // TODO rewrite recentRunDir to better reflect that it is whatever run we wish to display on the results page. 
  // BETTER: figure out how to actually pass the props because really this should just be a prop. 
  const navigate = useNavigate();
let {dispatch,recentRunDir, winnowDir} = useContext(AuthContext);
  const { getCollapseProps, getToggleProps, isExpanded } = useCollapse();

  // state for about readout
  let [about, setAbout] = useState("");
  let [viewerContent,setViewerContent] = useState()
  let [fileList, setFileList] = useState({})
  let [keyWords, setKeyWords] = useState([])
  let [fileViewed,setFileViewed] =useState();

  // /TODO: fix the multiple page run issue.
  //runs the main function, prevents multiple reruns of main
  useEffect( () => {
    main();
  },[recentRunDir])

  const fileToReader = async(event) => {
    event.preventDefault();
    // snagging the path from the state
    let fileName = event.target.id;
    setFileViewed(fileName)
    let filePath = fileList[fileName];
    console.log(filePath);

    // looping through the path to construct the proper fileHandle
    let dirHandle = await winnowDir.getDirectoryHandle("Winnow Collections")
    for (let i = 0; i < filePath.length -1; i++){
      dirHandle = await dirHandle.getDirectoryHandle(filePath[i]);
    }
    let fileHandle = await dirHandle.getFileHandle(filePath[filePath.length - 1]);
    
    const file = await fileHandle.getFile();
    const fileText = await file.text();
    console.log(fileText)
    setViewerContent(fileText)

  }
  // returns an object containing all of the JSON data written in the about.txt file of the recently searched corpus
  const getAboutData = async() => {
   //const data_Handle = await recentRunDir.getDirectoryHandle("Winnow_data");
    console.log("entered get about Data")

    const aboutFileHandle = await recentRunDir.getFileHandle("about.txt");
    var aboutFile = await aboutFileHandle.getFile();
    aboutFile = await aboutFile.text();

    const aboutData = JSON.parse(aboutFile);

    setKeyWords(Object.keys(aboutData["wordCounts"]));
    const resultsFileHandle = await recentRunDir.getFileHandle("results.txt");
    const resultsFile = await resultsFileHandle.getFile();
    const resultsContent = await resultsFile.text();

    const resultsData = JSON.parse(resultsContent);


     // TDOO  move this to a better place
    let files = document.getElementById("fileList");


    // TODO FIGURE OUT WHY: every time I add a button it doesnt do anything when clicked - even when I harcode it as html. - otherwise we will be stuck bc we cannot nest forms. 
    // TO DO add folder heirarchies - look at the file path, parse it and keep grabbing entries within it. 
    for (let i =0; i<resultsData.length && i < 100;i++){
      let fileName = resultsData[i].fileName;
      let filePath = resultsData[i].filePath

      fileList[fileName] = filePath;
      // okay we parsed the file path to start with so we have an array. we just need to create a handle to the file from the array. 
      // TODO figure out if we can push this into the ability to call a function - I tihnk I need to create an object in state and then the form will just have the key as the ID. 
      let file = document.createElement('button');
      file.innerText = fileName
      file.className = "fileButton"
      let fileForm = document.createElement('form')
      fileForm.id = fileName
      fileForm.onsubmit = fileToReader
      fileForm.appendChild(file);
      files.appendChild(fileForm);
    }

    console.log("finished get about data")

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
   //   console.log(logs)
  //    console.log(recentRunDir.name)
      const result = await logs.getDirectoryHandle(recentRunDir.name)
 //    console.log(result)
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

  //TODO Snag results from the files and load them into state - then we can map all that out here, - maybe just through a function that copies links into the div 
  // TODO BIG TODO : need to snag a file location somehow so we can go grab the file - In search we save the file list as a file name and a filepath 
  // in the results we need to check for permissions to the folders before accessing them - this will likely need to be recursive folder accessing strategy. 
  

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

 
  <div className="files">
  <div id = "fileList" className="fileList"> 
  </div>
  <div id="testDiv" className="fileReader">
    <p>{fileViewed}</p>
    <Highlighter id ="test" searchWords = {keyWords} textToHighlight={viewerContent}>
    </Highlighter>
  </div>
  </div>
 
  <div>
          <button onClick={deleteResults}>Delete Results</button>
        </div>
    </div>
    
  );
}