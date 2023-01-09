

import './App.css';

// import components
import NavBar from "./components/navbar/navbar";
import Landing from './components/landing';
import DisplayResult from './components/result';
import SearchForm from './components/searchform';
import SearchHistory from './components/history/history';
import SearchTerms from './components/searchTerms/searchTerms';
import { useContext, useState, useEffect } from "react";

export const Pages = {
  Landing: Symbol("landing"),
  SearchTerms: Symbol("search terms"),
  Search: Symbol("search"),
  Results: Symbol("results"),
  History: Symbol("history")
}

function App() {
  // Enum for which page we are on
  let [page, setPage] = useState(Pages.Landing);

  return (
    <div className="mw-100 vh-100">
      <NavBar pageSet={(arg) => setPage(arg)} />
      <div className="h-75">
        {page === undefined && console.error("404 page not found")}

        {(page !== undefined && page === Pages.Landing) && <Landing pageSet={setPage} ></Landing>}

        {(page !== undefined && page === Pages.Search) && <SearchForm fromLanding={1} pageSet={setPage} />}

        {(page !== undefined && page === Pages.History) && <SearchHistory pageSet={setPage} />}

        {(page !== undefined && page === Pages.SearchTerms) && <SearchTerms pageSet={setPage} />}

        {(page !== undefined && page === Pages.Results) && <DisplayResult pageSet={setPage} />}

      </div>
    </div>
  )
};

export default App
