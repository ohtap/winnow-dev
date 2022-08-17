


import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // React Router, for Page Navigation and Loading
import './App.css';

// import components
import NavBar from "./components/navbar/navbar";
import Landing from './components/landing';
import DisplayResult from './components/result';
import SearchForm from './components/searchform';


function App() {


  return (
    
    <Router>
    <div className="mw-100 vh-100">
      <NavBar />
      <div className="h-75">
        <Routes>
          <Route exact path="/" element = {<Landing/>}/>
          <Route path = "/search" element = {<SearchForm/>}/>
          <Route path = "/results" element = {<DisplayResult/>}/>
          {/* add error component here */}
        </Routes>
        
      </div>
    </div>
  </Router>
    
  )};

export default App
