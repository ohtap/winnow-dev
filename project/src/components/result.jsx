
import { AuthContext } from "../context/AuthContext";
import { useContext, useState, useEffect } from "react";
import SearchForm from "./searchform";
import "./result.css";
import { Pages } from "../App";
import Index from "./fullTextSearch";

export default function DisplayResult(props) {

  const { pageSet } = props;

  // TODO rewrite recentRunDir to better reflect that it is whatever run we wish to display on the results page. 
  // BETTER: figure out how to actually pass the props because really this should just be a prop. 
  let { recentRunDir, winnowDir } = useContext(AuthContext);

  // state for about readout
  let [about, setAbout] = useState("");
  let [viewerContent, setViewerContent] = useState()
  let [fileList, setFileList] = useState({})
  let [keyWords, setKeyWords] = useState([])
  let [resultsRaw, setResultsRaw] = useState([])
  let [marks, setMarks] = useState([])
  let [fileViewed, setFileViewed] = useState();
  let [curMark, setCurMark] = useState(0);


  //runs the main function, prevents multiple reruns of main
  useEffect(() => {
    main();
  }, [recentRunDir])

  //TODO - move into utility file as this is used across several files. 
  async function* getFilesRecursively(entry, pathname, path) {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      if (file !== null) {
        file.relativePath = pathname;
        file.pathArr = path;
        yield file;
      }
    } else if (entry.kind === 'directory') {
      for await (const handle of entry.values()) {
        let temp_path = []
        for (let f of path) {
          temp_path.push(f)
        }
        temp_path.push(handle.name)
        yield* getFilesRecursively(handle, ([pathname] + `/${handle.name}`), temp_path);
      }
    }
  }

  const fileFromList = async (fileName) => {
    let filePath = fileList[fileName];
    //console.log(filePath);

    // looping through the path to construct the proper fileHandle
    let dirHandle = await winnowDir.getDirectoryHandle("Winnow Collections")
    for (let i = 0; i < filePath.length - 1; i++) {
      dirHandle = await dirHandle.getDirectoryHandle(filePath[i]);
    }
    let fileHandle = await dirHandle.getFileHandle(filePath[filePath.length - 1]);
    return fileHandle
  }

  // Saves files, files handles MUST have a relative path property appended to them.- TODO move into a utility file as its used across several files. 
  const saveFile = async (fileHandle, subCorp_handle) => {
    let destHandle = subCorp_handle;
    const paths = [];
    // console.log(subCorp_handle);

    // splitting to get each folder along the path 
    let filePath = fileHandle.relativePath
    for (let path of filePath) {
      paths.push(path);
    }
    // TODO once we remove filename from relative path we dont need to push to array, can process after split

    // jumping through the file path and creating the folders if need be as we go
    for (let i = 1; i < (paths.length - 1); i++) {
      destHandle = await destHandle.getDirectoryHandle(paths[i], { create: true });
    }

    let destFileHandle = await destHandle.getFileHandle(fileHandle.name, { create: true });

    // CONSIDER pasing this in to avoid the extra work. 
    fileHandle = await fileHandle.getFile()
    const text = await fileHandle.text();

    const destWriter = await destFileHandle.createWritable();
    destWriter.write(text).then(() => destWriter.close());
  }

  // write the thing that snags the filehanlde from file path - see function below for this. 
  const saveResults = async (event) => {
    event.preventDefault();
    let destHandle = await showDirectoryPicker();
    if (destHandle) {
      for (let fileName of Object.keys(fileList)) {
        let fileHandle = await fileFromList(fileName);
        fileHandle.relativePath = fileList[fileName]
        await saveFile(fileHandle, destHandle);
      }
    }
  }
  const getHighlightData = async (fileName, fileText) => {
    const aboutFileHandle = await recentRunDir.getFileHandle("about.txt");
    let aboutFile = await aboutFileHandle.getFile();
    aboutFile = await aboutFile.text();

    const aboutData = JSON.parse(aboutFile);
    let searchWords = (aboutData["Searched Words"])
    console.log(searchWords)

    // scrubbing text for html characters that will cause issues
    fileText = fileText.replaceAll(/</g,'')
    fileText = fileText.replaceAll(/>/g,'')

    let srch = new Index(true);
    srch.add(fileName, fileText);

    let result = srch.searchTxtIndex(searchWords)

    let newFileText = fileText

    let entries = {};
    console.log(result[fileName])
    try {
      entries = result[fileName].sort(function (a, b) {
        if (a["start"] > b["start"]) {
          return 1;
        }
        if (a["start"] < b["start"]) {
          return -1;
        }
        return 0;
      })
    } catch {
      console.log("something failed in the highlight search")
      setMarks(0)
      setCurMark(0)
      document.getElementById("textCont").innerHTML = fileText;
      return;
    }
    console.log(entries)
    let x = 0;
    let newMarks = []
    for (let entry of entries) {
      console.log(newFileText.substring(entry["start"], entry["start"] + entry["len"]));
     newFileText = newFileText.substring(0, entry["start"]) + "<mark id='" + x + "'>" + (newFileText.substring(entry["start"], entry["start"] + entry["len"]) + "</mark>" + newFileText.substring(entry["start"] + entry["len"]));
      x++;
      newMarks.push(JSON.stringify(x));
      for (let en of entries) {
        en["start"] += 19 +(x > 9) + JSON.stringify(x).length;
      }
    }
    setMarks(newMarks);
    setCurMark(0);
    //setViewerContent(newFileText)
    let ourText = document.getElementById("textCont")
    ourText.innerHTML = newFileText

    console.log(document.getElementById("0"));
    let tag = document.getElementById("0")
    tag.scrollIntoView()
  }

  const scrollHighlights = () => {

    if (fileViewed){
    
    let nextMark = curMark + 1;
    if (curMark === (marks.length - 1)) {
      nextMark = 0;
    }
    setCurMark(nextMark)
    let tag = document.getElementById(JSON.stringify(nextMark));
    tag.scrollIntoView();
  }

  }

  // currently maps the "n" key to incrementing the highlighted keyword if 
  // there is a file on display. 
  const keyPressScroll = (event) =>{
    if(event.key === 'n' && fileViewed){
      scrollHighlights();
    }
  }


  const fileToReader = async (result) => {
   // event.preventDefault();
    console.log("in fileToReader");
    // snagging the path from the state
    console.log(result)
    let fileName = result.fileName;
    setFileViewed(fileName)
    let fileHandle = await fileFromList(fileName);

    const file = await fileHandle.getFile();
    const fileText = await file.text();
    getHighlightData(fileHandle.name, fileText);

  }

  // returns an object containing all of the JSON data written in the about.txt file of the recently searched corpus
  const getAboutData = async () => {
    //const data_Handle = await recentRunDir.getDirectoryHandle("Winnow_data");
    console.log("entered get about Data")

    const aboutFileHandle = await recentRunDir.getFileHandle("about.txt");
    let aboutFile = await aboutFileHandle.getFile();
    aboutFile = await aboutFile.text();

    const aboutData = JSON.parse(aboutFile);
    setKeyWords((aboutData["Searched Words"]));
    const resultsFileHandle = await recentRunDir.getFileHandle("results.txt");
    const resultsFile = await resultsFileHandle.getFile();
    const resultsContent = await resultsFile.text();
    const resultsData = JSON.parse(resultsContent);

    setResultsRaw(Object.values(resultsData));

    let tempResults = [];
    for (let result of Object.values(resultsData)){
      tempResults[result.fileName] = result.filePath;
    }

    setFileList(tempResults);

    return aboutData
  }


  // takes an object and displays in the about search section all of the keys and values that are not
  // keyword counts. 
  const displayAbout = (aboutData) => {
    let text = "";

    for (let key of Object.keys(aboutData)) {
      if (key === "wordCounts" || key === "date") {
        //do nothing 
      } else {
        text += `${key}: ${aboutData[key]}    `;
      }

    }

    setAbout(text);
  }

  // creates and displays a table of all keyword counts
  const createKeyWordTable = (keyWordCounts) => {
    const keyWords = Object.keys(keyWordCounts);

    // getting the div in which to place the element and creating the table element
    const div = document.getElementById("wordContent");

    // removing any existing table on reloads.
   // while (div.firstChild !== null) {
    //  div.removeChild(div.firstChild);
    //}

    const tbl = document.createElement('table');
    // adding style
    tbl.classList.add("style");

    // creating the content of the table
    let i = 0;
    while (i < keyWords.length) {
      const tr = tbl.insertRow();
      for (let j = 0; j < 3; j++) {
        const td = tr.insertCell();
        td.appendChild(document.createTextNode(`${keyWords[i]} : ${keyWordCounts[keyWords[i]]}`));
        i++;

        if (i >= keyWords.length) {
          break;
        }

      }
    }

    div.appendChild(tbl);
  }

  /*
    deletes the entries data from the search logs and redirects to the search history page. 
  */
  const deleteResults = async () => {
    const logs = await winnowDir.getDirectoryHandle("Search Logs");
    //   console.log(logs)
    //    console.log(recentRunDir.name)
    const result = await logs.getDirectoryHandle(recentRunDir.name)
    //    console.log(result)
    try {
      for await (let value of result.keys()) {
        await result.removeEntry(value)
      }
      await logs.removeEntry(result.name)
      pageSet(Pages.History);
    }
    catch (err) {
      console.log(err)
    }
  }

  const main = async () => {
    console.log("running results");
  //  let previousFiles = document.getElementById('fileList');
   // previousFiles.textContent = '';
    // maybe I need to clear everything bc we are no longer refreshing. 
    const about_data = await getAboutData();
    console.log("finishing get about data");
    displayAbout(about_data);
    console.log("finished display about");
    // ADD back in once keyword counts is enabled
    //createKeyWordTable(about_data["wordCounts"]);

  }

  return (
    <div onKeyDown = {keyPressScroll} tabIndex = "0">
      <SearchForm fromLanding={0} pageSet={pageSet} />
      <div className="aboutSearch" id="about">
        <p className="aboutTxt">{about} </p>
      </div>

      {/* <div className="wordsContainer">
        <div className="header" {...getToggleProps()}>
            Key Word Frequencies 

  <div className = "collapseExpand">{isExpanded ? '-' : '+'}</div>
          
        </div>
        <div {...getCollapseProps()}>
          <div className="wordsContent" id = "wordContent">
          </div>
        </div>

  </div>*/}

      <div className="files">
        <div id="fileList" className="fileList">
          { resultsRaw.map(result => (
          // TODO - restructure how we deal with results so we don't need to dont need fileList at all.       
          //           
            <div key = {result.fileName}><button className = "fileButton" onClick = {() => fileToReader(result)}>{result.fileName}</button></div>
            ))}
        </div>
        <div>
          <div id="scrollMarks">
            <button className="scrollBtn" onClick={scrollHighlights}> {curMark + 1}/{marks.length} Select Next Match</button>
            <p className = "selectedFile">Selected File:  {fileViewed}</p>
          </div>
          <div className="fileReader">

            {/*  <Highlighter id ="test" searchWords = {keyWords} textToHighlight={viewerContent}>
    </Highlighter>*/}
            <p className="textCont" id="textCont">{viewerContent}</p>
          </div>
        </div>
      </div>

      <div>
        <button className = "downloadButton" onClick={saveResults}> Download Results</button>
        <button className = "deleteButton" onClick={deleteResults}>Delete Results of This Search</button>
      </div>
    </div>

  );
}