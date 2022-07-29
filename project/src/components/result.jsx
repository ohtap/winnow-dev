
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

export default function DisplayResult() {

  const {winnowDir, dispatc,recentRunDir} = useContext(AuthContext);

  const readResults = async() => {

    const aboutFileHandle = await recentRunDir.getFileHandle("about.txt");
    const aboutFile = await aboutFileHandle.getFile();

    console.log(aboutFile);

    const fileText = await aboutFile.text();
    document.getElementById("result").innerHTML = fileText;

  }

  readResults();
  
  return (
    <div>
      <p> Recent Run Dir Name {recentRunDir.name}</p>
      <pre id = "result"> Loading File</pre>
    </div>
  );
}