
import { AuthContext } from "../../context/AuthContext";
import { useContext, useState, useEffect } from "react";
import "./searchEntry.css";
import SearchEntry from "./searchEntry";
import { Pages } from "../../App";

export default function SearchHistory(props) {

  const { pageSet } = props
  // TODO rewrite recentRunDir to better reflect that it is whatever run we wish to display on the results page. 
  // BETTER: figure out how to actually pass the props because really this should just be a prop. 

  let { winnowDir } = useContext(AuthContext);

  // state for about readout
  var [about, setAbout] = useState("");
  const [entries, setEntries] = useState([]);
  //runs the main function, prevents multiple reruns of main
  useEffect(() => {
    main();
  }, [winnowDir])

  // returns an object containing all of the JSON data written in the about.txt file of the recently searched corpus
  const getSearchList = async () => {
    console.log("in search List");
    console.log(winnowDir);
    const entryCont = [];

    let historyFolder = await winnowDir.getDirectoryHandle("Search Logs");
    for await (const [key, value] of historyFolder.entries()) {
      if (value.kind != "file") {
        // snagging date and tacking that on to sort by
        const dataFile = await value.getFileHandle("about.txt");
        const data = await dataFile.getFile();
        const dataText = await data.text();
        const dataObj = await JSON.parse(dataText);

        if (dataObj.date){
          value.date = dataObj.date;
        }else {
          // if it doesn't have a date we append a really old date. (makes it retro active)
          value.date = new Date("2020-12-17T03:24:00");
        }
        entryCont.push(value);
      }

    }

    entryCont.sort(function(a,b){ 
      return new Date(b.date) - new Date(a.date);})
    setEntries(entryCont);
    console.log("succesfully set entries");
  }

  const main = async () => {
    getSearchList();
  }



  return (

    <div>
      {
             entries.map((entry) => (
          <SearchEntry key={entry.name} data={entry} pageSet={pageSet} />
        ))
      }
    </div>


  );
}