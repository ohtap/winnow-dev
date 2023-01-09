import { useState, useEffect } from "react";
import "./wordGrouping.css"
export default function WordGroup(props) {

    const { words: origWords, groupName, deleteEntry, save, setWords: setOrigWords } = props;
    const [words, setWords] = useState(origWords);
    const [edit, setEdit] = useState(false);

    /* Update words when origWords changes */
    useEffect(() => {
        setWords(origWords);
    }, [origWords]);

    const changeEdit = () => {
        setEdit(!edit);
    }

    const saveTerm = (event) => {
        setEdit(!edit)
        setOrigWords(words)
        save()
    }
    return (

        <div>

            {
                edit ?
                    <div className="wordGroup">
                        <button className="editButton" onClick={saveTerm} >Save</button>
                        <button className="deleteButton" onClick={deleteEntry}>Delete</button>
                        <div className="title">
                            <p id="title"> {groupName}</p>
                        </div>
                        <div>
                            <label className="label1">Search Terms:</label> <textarea id="searchWords"
                                onChange={(event) => setWords(event.target.value)}>{words}
                            </textarea>
                        </div>
                    </div> :

                    <div className="wordGroup">
                        <button className="editButton" onClick={changeEdit}>Edit</button>
                        <div className="title">
                            <p id="titleNE"> {groupName}</p>
                        </div>
                        <div>
                            <label className="label1">Search Terms:</label> <p>{words}</p>
                        </div>
                    </div>
            }
        </div>



    )
}

