


import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // React Router, for Page Navigation and Loading
import './App.css';

// import components
import NavBar from "./components/navbar/navbar";
import SearchFiles from './components/searchFunc';
import Search from './pages/search'
import Home from "./pages/home.jsx";
import Result from "./pages/result";



function App() {


  return (
    
    <Router>
    <div className="mw-100 vh-100">
      <NavBar />
      <div className="h-75">
        <Routes>
          <Route exact path="/" element = {Home()}/>
          <Route path = "/search" element = {Search()}/>
          <Route path = "/results" element = {Result()}/>
          {/* add error component here */}
        </Routes>
        
      </div>
    </div>
  </Router>
    
  )};
export default App
