


import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // React Router, for Page Navigation and Loading
import './App.css';

// import components
import NavBar from "./components/navbar/navbar";
import Home from "./pages/home.jsx";


function App() {


  // updates the global state to pass this handle around

  // just a test here, iterates thru all the files, then prints the results in parallel. 
  /*const files = [];

  for await(const entry of fileHandle){
      files.push(entry);
      console.log(entry.kind);
}*/
//console.log(files);
//<button onClick = {filePicker}> File Upload</button>
  return (
    
    <Router>
    <div className="mw-100 vh-100">
      <NavBar />
      <div className="h-75">
        <Routes>
          <Route exact path="/" element = {Home()}/>
          {/* add error component here */}
          
        </Routes>
      </div>
    </div>
  </Router>
    
  )};
export default App
