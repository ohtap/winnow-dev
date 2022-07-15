import {useRef, useState} from "react";
/*
Notes to self: 
    Can access a file by name within a dir by using the dirHandle.getFileHandle(fileName); 
    The same can be done for directories - the create option can be set and it will create a new directory if not found! 
*/

// adapted this transform from 
// https://stackoverflow.com/questions/58268844/how-can-i-read-files-by-word-divided-with-space-and-return-like-s-g-with
// just creating a transform to take the stream and save it into the 


export default async function SearchFiles (corpus_dir, includeTokens, excludeTokens,dest_name,progress, setProgress, setFlag){
    // here we can do a bunch of data work on whatever was passed in
    
    
    
    

    console.log(corpus_dir.name)
    console.log(includeTokens);

    // the example code shown on mdn web_docs, verifies read/write usage
    

    
    const buildRef = async() => {
        const refMap = {};
        for await(const entry of corpus_dir.values()){
            // ignores folders and any ds store files
            if (entry.kind === 'file' && entry.name !== ".DS_Store"){
                const fileHandle = await entry.getFile();

                // TODO: consider using a readableStream with a BYOB reader and implementing a single byte buffer to read into. 
                // things to discover: is the texts usable with a BYOB, will the chunks returned by the reader reduce down to the buffer size automatically, or will we hit overflow? 
                // ultimately if it overflows, the implementation to get a buffer and read system when chunk size is uknown is difficult at best. 
                // for now we will keep it at a high level of editing. Only pursue this if we need more speed. 

                const contents = await fileHandle.text();

                // regex splits on spaces and new lines
                const words = contents.split(/  *|\n/);
    

                for (var word of words){
                    if (word){

                        // cleaning up the keys: lower casing and getting rid of some basic punctuation TODO: put together more comprehensive regex. 
                        word = word.toLowerCase();
                        word = word.replace(/[,."!?@#$%&*]+/g, " ").trim();

                        // if map hasnt been initialized it initializes it to an array before pushing.
                    
                        if (word && word != "constructor"){
                        try {refMap[word] = refMap[word] || [];
                        refMap[word].push(fileHandle.name)} catch(err){
                            console.log(typeof word);
                            console.log(word);
                            console.log(err);
                        }
                        } 

                    }
                }

            }else {
                console.log("not a file");
            }
        console.log("n");
         setProgress(progress += 1);
        }
        return refMap;
    }

    // TODO: comment, and needs to return a falsy if no matching files. 
    const findFiles = async(ref) => {
        //console.log(ref)
       const files = new Set();
       //console.log(Object.keys(ref));
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
            // create new file of same filename in this dir


           try { 
            const destCorpus = await corpus_dir.getDirectoryHandle(dest_name, {create:true});
            var destFileHandle = await destCorpus.getFileHandle(file, {create: true})
                }catch(err){console.log(err)}

            // create a writeable object pass the read of the file into this to perform a copy
            if(destFileHandle){
            const destWriter = await destFileHandle.createWritable();

            destWriter.write(toWrite).then(() => destWriter.close());}
        }
   }

   

   




    return  buildRef().then(refMap => findFiles(refMap)).then( subCorp => saveFiles(subCorp));
}