import {useRef, useState} from "react";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
/*
Notes to self: 
    Can access a file by name within a dir by using the dirHandle.getFileHandle(fileName); 
    The same can be done for directories - the create option can be set and it will create a new directory if not found! 
*/

// adapted this transform from 
// https://stackoverflow.com/questions/58268844/how-can-i-read-files-by-word-divided-with-space-and-return-like-s-g-with
// just creating a transform to take the stream and save it into the 


export default async function SearchFiles (corpus_dir, includeTokens, excludeTokens,dest_name,progress, setProgress, winnowDir){
    
    
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
            mapFile = await mapFile.getFile();
            mapFile = await mapFile.text();
            contents = await JSON.parse(mapFile);
        }
        return contents;
    }

    // Builds and then saves the search dictionary
    // TODO: build in metrics. 
    const buildRef = async() => {
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
                contents = contents.split(/  *|\n/);
    
                // going through each word 
                for (var word of contents){
                    if (word){

                        // cleaning up the keys: lower casing and getting rid of some basic punctuation TODO: put together more comprehensive regex. 
                        word = word.toLowerCase();
                        word = word.replace(/[,."!?@#$%&*]+/g, " ").trim();

                        // if map hasnt been initialized it initializes it to an array before pushing.
                    
                        // for some reason the word constructor causes an issue .. so we exclude it here along with anything that isnt registered as a string
                        if (word && word != "constructor"){
                            // creating the map, using a set for values so there are no duplicates. 
                            try {
                                refMap[word] = refMap[word] || new Set();
                                refMap[word].add(fileHandle.name)} catch(err){
                                console.log(typeof word);
                                console.log(word);
                                console.log(err);
                            }
                        } 
                    } // nesting joy. 
                }
            }else {
                console.log("not a file");
            }
         setProgress(progress += 1);
        }
        // saves the map before returning it. 
        saveMap(refMap);
        return refMap;
    }

    // saves the map we have created. 
    const saveMap = async (refMap) => {
        // TODO add some fail catches
        const mapDirHandle = await corpus_dir.getDirectoryHandle("Winnow_data", {create:true});
        const mapFileHandle = await mapDirHandle.getFileHandle("searchMap.txt", {create:true})
        const mapFileWriter = await mapFileHandle.createWritable();

        // some extra processing here, Sets are not serializable so we must turn them into an array first. 
        Object.keys(refMap).map(function(key) {
            refMap[key] = Array.from(refMap[key]);
          });

          // writing the map to the corpus dir
        mapFileWriter.write(JSON.stringify(refMap)).then(() => mapFileWriter.close());
        // TODO: return some sort of success metric
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
    const saveFiles = async(subCorpus) => {
            console.log("now saving files"); 
        // creating the folder to store the files in

        for (const file of subCorpus) {
            // grab file from corpus dir
            const fileHandle = await corpus_dir.getFileHandle(file);
            // turn that file into a string to write with
            const toWrite = await fileHandle.getFile().then( file => file.text());

            // create a subcorpus folder in the working directory and then
            // create new file of same filename in this dir
            // TODO: move the handle grab outside of the for loop, its not necessary inside. 
           try { 
            const destCorpus = await winnowDir.getDirectoryHandle(dest_name, {create:true});
            var destFileHandle = await destCorpus.getFileHandle(file, {create: true})
                }catch(err){console.log(err)}

            // create a writeable object pass the read of the file into this to perform a copy
            if(destFileHandle){
            const destWriter = await destFileHandle.createWritable();

            destWriter.write(toWrite).then(() => destWriter.close());}
        }
   }

   

   

   const main = async () => {
        var map = await readMap();

        map  = map ? map : await buildRef();
        const subCorp = await findFiles(map);
        
        if (subCorp){
            await saveFiles(subCorp);
        }
        else {
            console.log("subcorp empty");
        }
   }

   // here we run all these functions in a synchronous manner
   // TODO clean up into main function. 
  // readMap();
    return  main();//buildRef().then(refMap => findFiles(refMap)).then( subCorp => saveFiles(subCorp));
}