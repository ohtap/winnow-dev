
import { AuthContext } from "../../context/AuthContext";
import { useContext,useState,useEffect } from "react";
import useCollapse from 'react-collapsed';
import "./searchEntry.css";
import SearchEntry from "./searchEntry";


export default function SearchHistory() {

  // TODO rewrite recentRunDir to better reflect that it is whatever run we wish to display on the results page. 
  // BETTER: figure out how to actually pass the props because really this should just be a prop. 

var {winnowDir} = useContext(AuthContext);
  const { getCollapseProps, getToggleProps, isExpanded } = useCollapse();

  // state for about readout
  var [about, setAbout] = useState("");
    const [entries,setEntries] = useState([])  ;
  //runs the main function, prevents multiple reruns of main
  useEffect( () => {
    main();
  },[winnowDir])

  // returns an object containing all of the JSON data written in the about.txt file of the recently searched corpus
  const getSearchList = async() => {
    console.log("in search List");
    console.log(winnowDir);
    const entryCont = [];
    for await (const [key, value] of winnowDir.entries()) {
        if(value.kind != "file"){
        entryCont.push(value);}
        // take the value and grab the about json object from it
        // add this and the name to props and create a searchEntry component with them
        // somehow display this component on the page. 

        console.log({ key, value })
    }
    setEntries(entryCont);
    console.log("succesfully set entries");
  }

  const main = async() =>{
    console.log("getting search list");
    getSearchList();
     /* const about_data = await getAboutData();
      displayAbout(about_data);
      createKeyWordTable(about_data["wordCounts"]);*/

  }
  


  return (

   <div>
    {
        entries.map((entry)=>(
            <SearchEntry key = {entry.name} data = {entry}/>
        ))
    }
   </div>

    
  );
}