
import useCollapse from 'react-collapsed';
import { useContext,useState,useEffect } from "react";
import "./searchEntry.css";
import { useNavigate } from "react-router";
import { AuthContext } from '../../context/AuthContext';


export default function SearchEntry({data}) {
    const [isExpanded, setExpanded] = useState(false);
    const { getCollapseProps, getToggleProps } = useCollapse({isExpanded});
    const {dispatch} = useContext(AuthContext);
    const navigate = useNavigate();

    const keyWordContent = data.name + "content";
    const keyWordsContainer = data.name;

    // TODO
    // Dtermine how to do a collapse/expand on hover so we can add keywords on hover over. 

    
    var [about, setAbout] = useState("");

  //runs the main function, prevents multiple reruns of main
  useEffect( () => {
    main();
  },[data])



  const changeDel = () => {
    setDel(!del);
  }

  // returns an object containing all of the JSON data written in the about.txt file of the recently searched corpus
  
  const getAboutData = async() => {
   // const data_Handle = await data.getDirectoryHandle("Winnow_data");


    const aboutFileHandle = await data.getFileHandle("about.txt");
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
    const div = document.getElementById(keyWordContent);

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

  const goTo = () => {
    dispatch({ type: "RECENT RUN CHANGE", payload: data});
   console.log("we will navigate to results");
   navigate("/results");
   //TODO change the recentRunDir to this fileHandle then nav to results to 
   // display the full results

  }

  const collapse = (e) =>{ 

    e.stopPropagation();
    const div = document.getElementById(keyWordContent);
   //var height = div.clientHeight;
    const topContainer =  document.getElementById(keyWordsContainer);
   if (div.style.maxHeight){
    div.style.maxHeight = null;
    div.style.border = "none";
    topContainer.style.borderRadius = "10px"
    topContainer.style.borderBottom = "1px solid";
  } else {
    div.style.border="1px solid";
    div.style.borderTop = "none";
    div.style.maxHeight = div.scrollHeight + "px";
    topContainer.style.borderRadius = "10px 10px 0px 0px";
    topContainer.style.borderBottom = "none";
  }
  }

  const main = async() =>{
      const about_data = await getAboutData();
      displayAbout(about_data);
      createKeyWordTable(about_data["wordCounts"]);
  }

 // <div> <pre className = "aboutTxt">{about} </pre></div>
 

  return (
    <div>
    <div className="keyWordsContainer" id = {keyWordsContainer} onClick={goTo} >

        <div> <pre className = "aboutTxt">{about} </pre></div>
        <div className = "expandButton" onClick={(e) => {collapse(e);} }> 
        <p  className = "expandLabel">KeyWords</p> </div>
     </div>
     <div className="keyWordsContent" id = {keyWordContent}></div>
  </div>


    
  );
}