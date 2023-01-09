/*
  a full text search library with limited features designed to use low resources while compiling an index for large corpora. 
*/
import { stemmer } from 'stemmer'

// default stop word list TODO - actually fill out with something decent
let defaultStopWords = ["to", "you", "of", "them", "that", "this", "all"]
let defaultStemmer = stemmer;

export default class Index {
    constructor(wordIndex, stopWords, stemmer) {
        // sets the flag on storing word match indexes, (we will accept null here as well)
        this.wordIndexes = wordIndex || false;

        // TODO - add exception onto input to force it to be an array of strings. 
        if (stopWords == undefined) {
            this.stopWords = defaultStopWords;
        } else {
            this.stopWords = stopWords;
        }

        // TODO add exceptions - stemmer is  f: String => String
        if (stemmer == undefined) {
            this.stemmer = defaultStemmer;
        } else {
            this.stemmer = stemmer;
        }

        // the potatoes of the class - where all the word:document:(optional)index   pairings are stored
        this._index = {}

        // adding stop words to index. 
        // TODO - evaluate if this is wise to run it through stemmer - i.e there might not be synergy here and could cause issues. 
        for (let stopWord of this.stopWords) {
            stopWord = this.stemmer(stopWord)
            this._index[stopWord] = -1
        }
        // adds the empty string bc we will invariably get this when tokenizing - TODO - better tokenize to elim this. 
        this._index[""] = -1;
    }

    add(id, document) {
        if (this.wordIndexes) {
            console.log("adding index doc")
            this.addForIndexes(id, document);
            return
        }
        // preferrably addd some sort err instead of console.log
        if (id == undefined || document == undefined) {
            console.log("ERR - invalid key/document pair in index.add")
            return
        }

        let words = document.split(/[\n\s]+/);

        // tokenizing 
        for (let word of words) {
            word = word.replace(/[,."!?@#$%&]+/g, "").trim();
            word = this.stemmer(word.toLowerCase());

            if (this._index[word] != -1) {
                this._index[word] ||= new Set();
                try {
                    this._index[word].add(id)
                } catch (err) {
                    console.log(err)
                }
            }
        }

    }

    addForIndexes(id, document) {
        if (id == undefined || document == undefined) {
            console.log("ERR - invalid key/document pair in index.add")
            return
        }
        let words = []
        // I believe this is slower then the regex split - I imagine we have some better ways of getting indexes with regex
        for (let i = 0; i < document.length; i++) {
            if (document[i].match(/[\n\s]+/) || i == 0) {
                let j = i + 1
                while (j < document.length && !(document[j].match(/[\n\s]+/))) {
                    j++
                }
                // just a test but now need to add these in. 
                let wordIndx = { "word": document.substring(i + 1, j).toLowerCase(), "start": i + 1, "len": j - (i + 1) }
                let word = document.substring(i + 1, j).toLowerCase()
                word = word.replace(/[,."!?@#$%&]+/g, "").trim();
                word = this.stemmer(word)

                if (this._index[word] != -1) {
                    this._index[word] ??= {};
                    this._index[word][id] ??= [];
                    this._index[word][id].push(wordIndx);
                }
                i = --j;
            }

        }
        console.log(this._index)
    }

    get index() {
        return this._index;
    }

    remove(id) {
        // TODO
        return;
    }

    searchTxt(tokens) {
        //TODO - filter is optional - allows the user to write up some custom filters for the search. 
        // TODO - just run through take each token search the index and return the resulting keys (and values) in an array.


        // TODO add a line that dumps in the wordIndexes bool
        // LATER TODO - if we want this to be a more mature lib then add support for serializing optional stemmers - or some pipeline clearly explained for
        // setting a stemmer on load, bc stemmer is probably not worth serializing. 

        // TODO - write up support for indexedWords  - likely push this off to a private function that handles it bc everyhting is different
        console.log(tokens)
        console.log(this._index)

        console.log(this._index[tokens[0]])

        let cleanedTokens = new Set()
        for (let word of tokens) {
            word = word.replace(/[,."!?@#$%&]+/g, "").trim();
            word = this.stemmer(word.toLowerCase());
            cleanedTokens.add(word)
        }
        tokens = cleanedTokens
        let results = new Set();
        for (let token of tokens) {
            if (this._index[token] != undefined && this._index[token] != -1) {
                for (let entry of this._index[token]) {
                    results.add(entry)
                }
            }
        }
        return Array.from(results);
    }

    searchTxtIndex(tokens) {
        console.log(tokens)
        console.log(this._index)
        let cleanedTokens = new Set()
        for (let word of tokens) {
            word = word.replace(/[,."!?@#$%&]+/g, "").trim();
            word = this.stemmer(word.toLowerCase());
            cleanedTokens.add(word)
        }

        let results = {};
        for (let token of cleanedTokens) {
            if (this._index[token] != undefined && this._index[token] != -1) {
                console.log("used ", token, "and found something at least")
                console.log(Object.keys(this._index[token]))
                for (let entry of Object.keys(this._index[token])) {
                    console.log(entry)
                    results[entry] ??= []
                    for (let word of this._index[token][entry]) {
                        results[entry].push(word);
                    }
                }
            }

        }
        return results
    }
    // Assuming we have access to the fileHandle here
    // TODO check permissions and add query should we not have permissions here
    async save(directoryHandle, fileName) {

        // TODO add support for writing in the indexedWords here
        // TODO check if we can stringify a nested dict array struct succesfully! 
        let index = {}
        for (let key of Object.keys(this._index)) {
            if (this._index[key] != -1) {
                index[key] = Array.from(this._index[key])
            }
        }
        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
        const fileWriter = await fileHandle.createWritable();
        await fileWriter.write(JSON.stringify(index, null, 2)).then(() => fileWriter.close());
    }

    // takes in an serialized object and rehydrates it into an index
    load(indexText) {
        // TODO - add support for reading in the indexedWords bool once we add it to save

        let index = JSON.parse(indexText);
        for (let key of Object.keys(index)) {
            let arr = index[key]
            if (arr != -1) {
                this._index[key] = new Set(index[key])
            } else {
                this._index[key] = -1
            }
        }
    }

}
