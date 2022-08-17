import protoSearch from "./search.jsx";

/*
Notes to self: 
    Can access a file by name within a dir by using the dirHandle.getFileHandle(fileName); 
    The same can be done for directories - the create option can be set and it will create a new directory if not found! 
*/

// adapted this transform from 
// https://stackoverflow.com/questions/58268844/how-can-i-read-files-by-word-divided-with-space-and-return-like-s-g-with
// just creating a transform to take the stream and save it into the 


export default async function SearchFiles (corpus_dir, includeTokens, excludeTokens,subCorpusName,progress, setProgress, winnowDir){
    
    //TODO Seperate the file counting functions and saving functions to better facilitate testing. 
    // Check if it is the search pattern thats causing the issue
    // ISSUE: not finding all the proper files
        // unable to check dict for the issue. try downloading lite text editor

    // if there is a stored map in the corpus: reads the map into an object and returns it
    // if not returns an empty object
    const readMap = async() => {
        console.log("entered readMap");
        // updates 
        var contents = null;
        var mapFile = null;
        // TODO add some fail catches

        // attempting to access winnow_data and grab the map file, 
        // if the file does not exist then logs the err and returns null contents. 
        try {
            const mapDirHandle = await corpus_dir.getDirectoryHandle("Winnow_data");
            if(mapDirHandle){
            mapFile = await mapDirHandle.getFileHandle("searchMap.txt",)
            }
            }catch(err){
                console.log(err);
                return contents;}

        // if map file exists then turn its contents from a text file into a JS object. 
        if (mapFile){
            console.log("got the map");
            mapFile = await mapFile.getFile();
            mapFile = await mapFile.text();
            contents = await JSON.parse(mapFile);
        }
        // same for word counter
        return contents;
    }

    const readWordCounter = async() => {
        var wordCounter = null;
        var count = {};
        try {
            const dataDirHandle = await corpus_dir.getDirectoryHandle("Winnow_data");
            if (dataDirHandle){
                wordCounter = await dataDirHandle.getFileHandle("wordCounts.txt");
            }

        }catch(err){console.log(err)}
        if(wordCounter){
            wordCounter = await wordCounter.getFile();
            wordCounter = await wordCounter.text();
            count = await JSON.parse(wordCounter);
        }
        return count;
    }
    // Builds and then saves the search dictionary
    // TODO: build in metrics. 
    const buildMap = async(wordCounter) => {
        console.log("building ref");
        const refMap = {};
        for await(const entry of corpus_dir.values()){
            // ignores folders and any ds store files
            if (entry.kind === 'file' && entry.name !== ".DS_Store"){
                const fileHandle = await entry.getFile();

                // TODO: consider using a readableStream with a BYOB reader and implementing a single byte buffer to read into. 
                // things to discover: is the texts usable with a BYOB, will the chunks returned by the reader reduce down to the buffer size automatically, or will we hit overflow? 
                // ultimately if it overflows, the implementation to get a buffer and read system when chunk size is uknown is difficult at best. 
                // for now we will keep it at a high level of editing. Only pursue this if we need more speed. 

                var contents = await fileHandle.text();

                
                // regex splits on spaces and new lines
                contents = contents.split(' ');

                // create a new object to keep track of word counts
                wordCounter[fileHandle.name] = {};
                // to keep the code a little more readable
                var wordCounterFile = wordCounter[fileHandle.name];

                // going through each word 
                for (var word of contents){
                    

                        // cleaning up the keys: lower casing and getting rid of some basic punctuation 
                        //TODO: put together more comprehensive regex. 
                        word = word.toLowerCase();
                        //word = word.replace(/[,."!?@#$%&*]+/g, " ").trim();
                        word = word.replace(/[^A-Za-z]+/g, " ").trim();

                        // if map hasnt been initialized it initializes it to an array before pushing.
                        

                        // for some reason the word constructor causes an issue .. so we exclude it here along with anything that isnt registered as a string
                        if (word && word != "constructor"){
                            
                            // creating the map, using a set for values so there are no duplicates. 
                            try {
                                refMap[word] = refMap[word] || new Set();
                                refMap[word].add(fileHandle.name)

                                wordCounterFile[word] = wordCounterFile[word] + 1 || 1; 
                            }
                                catch(err){
                                    console.log(typeof word);
                                    console.log(word);
                                    console.log(err);
                            }
                        } 
                    // nesting joy. 
                }
            }else {
                console.log("not a file");
            }
         setProgress(progress += 1);
        }

        // saves the map before returning it. 
        await saveWordCount(wordCounter)
        await saveMap(refMap);
        return refMap;
    }

    // saves the map we have created. 
    const saveMap = async (refMap) => {
        // TODO add some fail catches
        const dirHandle = await corpus_dir.getDirectoryHandle("Winnow_data", {create:true});
        const mapFileHandle = await dirHandle.getFileHandle("searchMap.txt", {create:true})

        const mapFileWriter = await mapFileHandle.createWritable();

        // some extra processing here, Sets are not serializable so we must turn them into an array first. 
        Object.keys(refMap).map(function(key) {
            refMap[key] = Array.from(refMap[key]);
          });

          // writing the map to the corpus dir
       await mapFileWriter.write(JSON.stringify(refMap)).then(() => mapFileWriter.close());
       // await counterFileWriter.write(JSON.stringify(wordCounter,null,2)).then(()=> counterFileWriter.close());
        // TODO: return some sort of success metric
    }

    const saveWordCount = async(wordCounter) => {
        const dirHandle = await corpus_dir.getDirectoryHandle("Winnow_data", {create:true});
        const wordCountHandle = await dirHandle.getFileHandle("wordCounts.txt", {create:true});

        const wordCountWriter = await wordCountHandle.createWritable();
        console.log(wordCounter);
        await wordCountWriter.write(JSON.stringify(wordCounter)).then(() => wordCountWriter.close());
    }

    
    // TODO: comment, and needs to return a falsy if no matching files. 
    const findFiles = async(ref) => {
        console.log("finding files");
       const files = new Set();
        for (const word of includeTokens){
            if ( Object.keys(ref).includes(word)){
                for (const file of ref[word]){
                files.add(file);
                }
            }
        }

        for (const word of excludeTokens){
            if(Object.keys(ref).includes(word)){
                for(const file of ref[word]){
                    if (files.has(file)){
                        files.delete(file);
                    }
                }
            }
        }
        console.log("we have found "+ files.size);
    return files;
    }

       //TODO: turn this into checks for finding the correct directory, creating the correct subdir and so on, currently it is hardcoded for testing
        // guard against falsy find files values. 
    // Copies over the subcorpus files into the subcorpus directory
    const saveFiles = async(subCorpus, subCorpusHandle) => {
            console.log("now saving files"); 

        // create a subcorpus folder in the working directory
          //  console.log(winnowDir);
            
        for (const file of subCorpus) {
            // grab file from corpus dir
            
            const fileHandle = await corpus_dir.getFileHandle(file);
            // turn that file into a string to write with
            const toWrite = await fileHandle.getFile().then( file => file.text());

            // create new file of same filename
            // TODO: add a try catch here or other error handling. 
            var destFileHandle = await subCorpusHandle.getFileHandle(file, {create: true})

            // create a writeable object pass the read of the file into this to perform a copy
            if(destFileHandle){
            const destWriter = await destFileHandle.createWritable();

            destWriter.write(toWrite).then(() => destWriter.close());}
        }

   }
   // creates the subcorpus folder with the user entered name
   const createSubCorpus = async() => {
        const destCorpus = await winnowDir.getDirectoryHandle(subCorpusName, {create:true});
        return destCorpus;
   }
   
   // adds in metadata for the search, including keywordcounts. 
   const initMetaData =async (aboutFile,filesToSave,subCorpusHandle,keywordCounts) => {
        
        aboutFile["Subcorpus Name"] = subCorpusName;
        aboutFile["Source Corpus"] = corpus_dir.name;
        aboutFile["Search Keywords"] = includeTokens;
        aboutFile["Search Exclude Keywords"] = excludeTokens;
        aboutFile["Files in SubCorpus"] = filesToSave.size;
        aboutFile["KeyWord Counts"] = keywordCounts;

        const aboutHandle = await subCorpusHandle.getFileHandle("about.txt",{create:true});
        const aboutWriter = await aboutHandle.createWritable();
        await aboutWriter.write(JSON.stringify(aboutFile,null,2)).then(()=> aboutWriter.close());


        console.log(aboutFile);
   }

   // Grabs the word counts and tallies them, creating a counter both for total sum of keywords in subcorpus and a more in depth, 
   // per file word count. Saving the more in deph version in the directory.  
   const fetchWordCounts = async (filesToSave,wordCounter,subCorpusHandle) => {
        // a simple count of the tallies of each keyword across all files
        const keywordCount = {}
        // a more in depth file containing the keyword counts for each individual file (for processing with metadata);
        const keywordFile = {}
        for (const keyword of includeTokens){
            keywordCount[keyword] = 0;
            keywordFile[keyword] = {};
            for (const file of filesToSave){
                //const fileHandle = await corpus_dir.getFileHandle(file);
                if(wordCounter[file][keyword]){
                    keywordCount[keyword] += wordCounter[file][keyword];
                    keywordFile[keyword][file] = wordCounter[file][keyword];
                }
               
            }
        }

        //writing the keyword file to the subcorpus
    
        const keywordHandle = await subCorpusHandle.getFileHandle("aaakeywords.txt",{create:true});
        const keywordWriter = await keywordHandle.createWritable();
        await keywordWriter.write(JSON.stringify(keywordFile,null,2)).then(()=> keywordWriter.close());

        return keywordCount;
   }
   // NEW IMPLEMENTATON THOUGHTS:
   /*
   // CONSIDER: should we do things in such a way that each subcorpus created contains all the searchable winnow data that we will create for the main corpus, sort of recursive in nature. 


   */

   const invertSearch = async(wordCounter) => {
    var map = null;
    // attempts to read in a search map and word counter
    var map = await readMap();
    var wordCounter = await readWordCounter();
  // if no map exists then we build one, otherwise we roll with the existing one
    map  = map ? map : await buildMap(wordCounter);
    // executing the actual search
    const filesToSave = await findFiles(map);
    console.log("this is word counter inside search");
    console.log(wordCounter);
    return {filesToSave,wordCounter};

   }

// AHO CORASICK SEARCH IMPLEMENTATION 
// ######################################################################################################################################



// #######################################################################################################################################



   const main = async () => {
        // creating subcorpus directory
        const subCorpusHandle = await createSubCorpus();
        //creating an object for tracking word counts. 
    
        // creating metadata object 
        const aboutFile = {};

        
        // running the search function
       const {filesToSave,wordCounter}  = await invertSearch();

       console.log(wordCounter);
        // if the search returns something
        if (filesToSave){
            // Specific to a full dictionary of wordCounts 
            const keywordCounts = await fetchWordCounts(filesToSave,wordCounter,subCorpusHandle);
            // save the files
            await saveFiles(filesToSave,subCorpusHandle);
            // enter the about data
            await initMetaData(aboutFile,filesToSave,subCorpusHandle,keywordCounts);
            return subCorpusHandle;
           
        }
        else {
            console.log("subcorp empty");
            alert("There were no resources found that matched your search terms.")
        }
        alert("we fell through somewhere");
        return false;
   }

    return  main();
}

