
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

export default function DisplayResult() {
  const {winnowDir, dispatch,recentRunDir} = useContext(AuthContext);

  const readResults = async() => {
    console.log(recentRunDir);
    const data_Handle = await recentRunDir.getDirectoryHandle("Winnow_data");
    console.log(data_Handle);

    const aboutFileHandle = await data_Handle.getFileHandle("about.txt");
    const aboutFile = await aboutFileHandle.getFile();

    console.log(aboutFile);

    const fileText = await aboutFile.text();
    document.getElementById("result").innerHTML = fileText;

  }

  readResults();
  
  return (
    <div>
      <p> Results: {recentRunDir.name}</p>
      <pre id = "result"> Loading File</pre>
    </div>
  );
}