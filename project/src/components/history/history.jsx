
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
        entryCont.push(value);
      }
    }
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