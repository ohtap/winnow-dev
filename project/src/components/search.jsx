/**
 * search looks through every file in the selected directory (and its subdirectories)
 * this function maintains a count of occurences for each keyword.
 * Finally it saves the all the files containing at least one keyword, maintaining original file structure when doing so,
 * then saves a file "about.txt" containing data regarding the search under a folder named "winnow_data"
 * @param  {directoryHandle} corpus_dir - the directory handle, with read permissions,which we are searching
 * @param  {Array[String]} searchWords - key word tokens to be searched for 
 * @param  {String} subCorp_name - name for the folder within which the results will be saved
 * @param  {directoryHandle} winnowDir - a directory handle, with read/write permissions granted, used to access where the search results will be stored
 * @param  {updateProgCount} function - a function which updates the state in the caller to reflect how many files have been processed
 * @return {directoryHandle}      a directory handle to the results directory created within this function
 */

import Index from "./fullTextSearch"
export default async function search(corpus_dir, searchWords, subCorp_name, winnowDir, updateProgCount,date) {

    // adapted from the recursive scan function provided in the mozilla documentation https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle
    async function* getFilesRecursively(entry, pathname, path) {
        if (entry.kind === 'file') {
            const file = await entry.getFile();
            if (file !== null) {
                file.relativePath = pathname;
                file.pathArr = path;
                yield file;
            }
        } else if (entry.kind === 'directory') {
            for await (const handle of entry.values()) {
                let temp_path = []
                for (let f of path) {
                    temp_path.push(f)
                }
                temp_path.push(handle.name)
                yield* getFilesRecursively(handle, ([pathname] + `/${handle.name}`), temp_path);
            }
        }
    }

    // Returns the search logs folder or creates it if it does not exist
    async function checkHistory() {
        var historyFolder = await winnowDir.getDirectoryHandle("Search Logs", { create: true });
        return historyFolder
    }

    // Saves the data under the fileName in the passed in folder Hanlde. Will overwrite the file if it already exists. Folder must exist already. 
    const saveFileGeneric = async (data, fileName, folderHandle) => {
        try {
            let destHandle = folderHandle;
            const fileHandle = await destHandle.getFileHandle(fileName, { create: true })
            const destWriter = await fileHandle.createWritable();
            destWriter.write(data).then(() => destWriter.close());
        } catch (error) {
            console.log(err)
        }
    }

    const saveFile = async (fileHandle, subCorp_handle) => {
        var destHandle = subCorp_handle;
        const paths = [];

        // splitting to get each folder along the path 
        var filePath = fileHandle.relativePath.split('/');
        for (var path of filePath) {
            paths.push(path);
        }
        // TODO once we remove filename from relative path we dont need to push to array, can process after split
        // jumping through the file path and creating the folders if need be as we go
        for (var i = 1; i < (paths.length - 1); i++) {
            destHandle = await destHandle.getDirectoryHandle(paths[i], { create: true });
        }

        var destFileHandle = await destHandle.getFileHandle(fileHandle.name, { create: true });
        const text = await fileHandle.text();

        const destWriter = await destFileHandle.createWritable();
        destWriter.write(text).then(() => destWriter.close());
    }

    const checkandAddCorpus = async () => {
        const collectionsHandle = await winnowDir.getDirectoryHandle("Winnow Collections");
        const ourCollectionHandle = await collectionsHandle.getDirectoryHandle(corpus_dir.name, { create: true });

        return ourCollectionHandle;
    }

    const aboutWriter = async (data, results) => {

        let historyFolder = await checkHistory();
        let resultsFolder = await historyFolder.getDirectoryHandle(subCorp_name, { create: true });

        data["Searched Words"] = searchWords
        data["date"] = date;
        // write about file
        const aboutHandle = await resultsFolder.getFileHandle("about.txt", { create: true });
        const aboutWriter = await aboutHandle.createWritable();
        await aboutWriter.write(JSON.stringify(data, null, 2)).then(() => aboutWriter.close());

        // write results file list
        const listHandle = await resultsFolder.getFileHandle("results.txt", { create: true })
        const listWriter = await listHandle.createWritable();
        await listWriter.write(JSON.stringify(results, null, 2)).then(() => listWriter.close());

        return resultsFolder;
    }

    const bldSrchIndex = async (saveDestHandle, fileRef) => {

        let srch = new Index();
        let results = {};

        // here we feed the files to the search method. Each fileHanlde object has the data necessary for searching and copying itself into a new dir. 
        for await (const fileHandle of getFilesRecursively(corpus_dir, corpus_dir.name, [corpus_dir.name])) {
            // there are several extraneous files we ignore when searching. 
            if (fileHandle.name[0] == '.' || fileHandle.name == "asearchIndx.json" || fileHandle.name == "fileRef.txt") {
                continue;
            }
            updateProgCount();

            // grabbing file
            let file_text = await fileHandle.text();
            var filePath = fileHandle.pathArr

            srch.add(fileHandle.name, file_text)
            // adding the file name to the results object
            results[fileHandle.name] = ({ "fileName": fileHandle.name, "filePath": filePath });

            // If we are in this function then the corpus has not been run before, so we will save a copy of it to collections. 
            try {
                await saveFile(fileHandle, saveDestHandle);

            } catch (err) {
                console.log(err);
            }
        }

        console.log((srch.index));
        await srch.save(saveDestHandle, "asearchIndx.json")

        // save a copy of all the file to path mappings 
        // TODO - move this to top of collections since it is no longer search specific. 
        let historyFolder = await checkHistory();
        let resultsFolder = await historyFolder.getDirectoryHandle(subCorp_name, { create: true });
        await saveFileGeneric(JSON.stringify(results, null, 2), "fileRef.txt", saveDestHandle);

        fileRef = results;
        return [srch, results]
    }

    const processResults = async (about, lunrResults) => {
        for (let entry of lunrResults) {
            // storing an array of the indexes for word highlighting in results. 
            hLInd[entry.ref] = entry.matchData.metadata

            // WE can go grab the word and all its data by passing along the results object referencing it to get text and all like original! 
            for (let word of Object.keys(entry.matchData.metadata)) {
                for (let words of Object.values(entry.matchData.metadata[word].body)) {
                    // not ideal I think
                    for (let wordPos of words) {
                        // adds every word to our word counts - now we can grab some nice file counts too if we so choose! 
                        let wordCounts = about["wordCounts"];
                        wordCounts[word] = wordCounts[word] || 0;
                        wordCounts[word]++;
                        //console.log(searchText.substring(wordPos[0],wordPos[0]+wordPos[1]))
                    }
                }
            }
        }
    }
    // meant to take a results object (files, and thier path), an about object (with wc dict),the file result from Lunr, and a mapping obj of filenames to their paths, and their fileHandles.  
    // adds the filename and its path to results, 
    // uses the filename to lookup the handle, uses the handle to get the text, uses Lunr positions to snag words from text and to possibly highlight
    // adds those words to the word counts in about obj. Increments files found in about obj 

    const main = async () => {
        // creating object that will hold a list of all files that match the search
        // uncertain we need this var
        let fileCount = 0;
        let aboutSearch = {}
        aboutSearch["wordCounts"] = {}

        // creating the SubCorpus for collections
        const saveDestHandle = await checkandAddCorpus();
        let historyFolder = await checkHistory();
        let fileRefFolder = await historyFolder.getDirectoryHandle(subCorp_name, { create: true });

        let srchIndx = {}
        let fileRef = {}
        try {
            let index = await saveDestHandle.getFileHandle("asearchIndx.json", { create: false });
            console.log("made it into actual search")
            index = await index.getFile();
            index = await index.text();
            console.log("made it 2nd")
            srchIndx = new Index();
            srchIndx.load(index);
            let fileRef1 = await saveDestHandle.getFileHandle("fileRef.txt")
            let fileRef2 = await fileRef1.getFile()
            let fileRef3 = await fileRef2.text()
            fileRef = JSON.parse(fileRef3)
            console.log("finished !! ")
        } catch (err) {
            console.log(err)
            console.log("couldn't find index, proceeding to build one")
            let answerArr = await bldSrchIndex(saveDestHandle);
            srchIndx = answerArr[0]
            fileRef = answerArr[1]
        }
        console.log(fileRef);
        let results = srchIndx.searchTxt(searchWords);

        let resultsFull = []
        for (let res of results) {
            resultsFull.push(fileRef[res])
        }
        // if succesfull lets send something off to process the results. 

        aboutSearch["Name"] = subCorp_name;
        aboutSearch["Source Corpus Name"] = corpus_dir.name;
        aboutSearch["Files in Corpus"] = resultsFull.length;

        let hLIndx = {}
        let resultsFolder = await aboutWriter(aboutSearch, resultsFull);
        // save the highlight index to the corpus...

        return resultsFolder
    }
    return main();
}