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
export default async function search(corpus_dir, searchWords, subCorp_name, winnowDir, updateProgCount, ignoreWords){
  
    // adapted from the recursive scan function provided in the mozilla documentation https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle
    async function* getFilesRecursively (entry, pathname) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (file !== null) {
            file.relativePath = pathname;
            yield file;
          }
        } else if (entry.kind === 'directory') {
          for await (const handle of entry.values()) {
            yield* getFilesRecursively(handle,(pathname + `/${handle.name}`));
          }
        }
      }
      

// 
class Queue {
    /**
     * @constructor
     */
    constructor () {
        this.items = {};
        this.headIndex = 0;
        this.tailIndex = 0;
    }

    enqueue(item){
        this.items[this.tailIndex] = item;
        this.tailIndex++;
    }

    dequeue(){
        const item = this.items[this.headIndex];
        delete this.items[this.headIndex];
        this.headIndex++;
        return item;
    }

    peek(){
        return this.items[this.headIndex];
    }
    get length(){
        return this.tailIndex - this.headIndex;
    }

}

// implementing the Aho-Corasick search, adapted from the example provided by
// https://www.toptal.com/algorithms/aho-corasick-algorithm

// Vertexes serve as the nodes for the Trie that we construct in the Aho Corasik algorithm. 
// TODO add some fields here for things like strict search, wild card, etc. 
class Vertex {
    constructor(){};

    Children = {};
    Leaf = false;
    Parent = -1;
    Char = '';
    SuffixLink = -1;
    WordID = -1;
    EndWordLink = -1;
    // -1 to denote there is no ignore term after this leaf, 1 to denote there is one, and 2 to denote this leaf is the ignore term itself
    IgnoreTerm = -1;
}

// we can in the future tear this thing open and implement it such that it creates
// a sub aho corasick search trie and searches this trie to eliminate the exclude words.  
class AC_search {
    
    Trie = [];
    WordsLength = [];
    size = 0;
    root = 0;
    aboutSearch = {};

    constructor(){
        this.Trie.push(new Vertex());
        this.size++;
        this.aboutSearch["wordCounts"] = {};
        
    };

    /**
     * 
     * @param {String} s - The keyword to be added into the trie
     * @param {String} wordID - The identifier for the word, typically the word itself to be stored in the leaf node
     */
    AddString(s,wordID){

        var curVertex = this.root;
        for (var i = 0; i < s.length; i++){
            var c = s[i];

            // if a vertex with this edge does not exist we add it
            if (!this.Trie[curVertex].Children || !this.Trie[curVertex].Children.hasOwnProperty(c)){
                const edge = new Vertex();
                edge.SuffixLink = -1;
                edge.Parent = curVertex; 
                edge.Char = c;
                this.Trie.push(edge);
    
                this.Trie[curVertex].Children[c] = this.size; 
                this.size ++;
            }
            //updating curVertex, may need to be cast to a number
            curVertex = this.Trie[curVertex].Children[c];
        }

        // mark the end of the word 
        this.Trie[curVertex].Leaf = true;
        this.Trie[curVertex].WordID = wordID;
        this.WordsLength.push(s.length);
    }

    AddIgnoreString(s,wordID){
        var curVertex = this.root;
        for (var i = 0; i < s.length; i++){
            var c = s[i];

            // if a vertex with this edge does not exist we add it
            if (!this.Trie[curVertex].Children || !this.Trie[curVertex].Children.hasOwnProperty(c)){
                // if the current Vertex is a leaf we add to it that we have an ignore word
                if(this.Trie[curVertex].Leaf){
                    this.Trie[curVertex].IgnoreTerm = 1;
                }
                const edge = new Vertex();
                edge.SuffixLink = -1;
                edge.Parent = curVertex; 
                edge.Char = c;
                this.Trie.push(edge);
    
                this.Trie[curVertex].Children[c] = this.size; 
                this.size ++;
            }
            //updating curVertex, may need to be cast to a number
            curVertex = this.Trie[curVertex].Children[c];
        }

        // mark the end of the word 
        this.Trie[curVertex].Leaf = true;
        this.Trie[curVertex].WordID = wordID;
        this.Trie[curVertex].IgnoreTerm = 2;
        this.WordsLength.push(s.length);
    }
    

    CalcSuffLink(vertex){
        // below are the two degenerate cases, the root and its immediate children
        if (vertex == this.root){
            this.Trie[vertex].SuffixLink = this.root;
            this.Trie[vertex].EndWordLink = this.root;
            return;
        }
        if(this.Trie[vertex].Parent == this.root){
            this.Trie[vertex].SuffixLink = this.root;
            if (this.Trie[vertex].Leaf) {Trie[vertex].EndWordLink = vertex;}
            else {this.Trie[vertex].EndWordLink = this.Trie[this.Trie[vertex].SuffixLink].EndWordLink;}
            return;
        }

        // now we grab the suffix link for the parent of the vertex and the character of the current vertex. 
        var curBetterVertex = this.Trie[this.Trie[vertex].Parent].SuffixLink;
        var chVertex = this.Trie[vertex].Char;

        // now we look for the maximum prefix for the vertex and its substring
        while(true){

            // if we find the char we update the suffix and break
            if(this.Trie[curBetterVertex].Children.hasOwnProperty(chVertex)){
                this.Trie[vertex].SuffixLink = this.Trie[curBetterVertex].Children[chVertex];
                break;
            }
            
            // otherwise continue to follow suffix links until we find a prefix or reach the root
            if (curBetterVertex == this.root){
                this.Trie[vertex].SuffixLink = this.root;
                break;
            }
            curBetterVertex = this.Trie[curBetterVertex].SuffixLink;
        }
        
        // now we update the end word link to the max length word
        if (this.Trie[vertex].Leaf) {
            this.Trie[vertex].EndWordLink = vertex;
        }else {
            this.Trie[vertex].EndWordLink = this.Trie[this.Trie[vertex].SuffixLink].EndWordLink;
        }
    }

    prepareSearch(){
        const vertexQueue = new Queue();
        vertexQueue.enqueue(this.root);

        while(vertexQueue.length > 0){
            var curVertex = vertexQueue.dequeue();
            this.CalcSuffLink(curVertex);

            for (var key of Object.keys(this.Trie[curVertex].Children)){
                vertexQueue.enqueue(this.Trie[curVertex].Children[key]);
            }
        }
    }


    // TODO Adding ignore terms 
    /*
        To Accomplish this we must first add a field in the Trie to hold wether or not there is an ignore term
        at each word end. 

        if we come upon a word that contains an ignore term we must carry along some data. 
        first we must have some kind of flag to denote that we are on the lookout to see if further words are found from this prefix 
        then we must set the flag in the second while loop upon finding a match, I think we might need to ignore any smaller words here, as we don't want to keep looping in the find words
        loop - possible that we could and just set the flag once 

        we will need to pass along some information - first and foremost we want to store the word we had found
        from there we will run search as normal - if we go up a suffix link then we will clear the flag and process the saved word as it was a valid word
        otherwise we will first check to see if the current State is an ignore term if so we wipe the flag, skip the rest of the while loop then continue processing
        
        note we will continue to dive down the tree - it is possible someone searched "win*"" entered an ignore for "wind" 
        but also entered "window" 

        here we would get to "win" and see it is a word that matches our prefix - but we also see it has an ignore term so we must continue
        from there we get to "wind" we see we hit our ignore term so we drop the flag and ignore adding "win", then we keep moving and see we have found 'window" - there are no more 
        flags so we add the term. 

    */

    /* Strict searching 
        We need a way to strict search by default. That is search for only keywords and not prefixes. 
        first we will keep track of the start of each word by keeping track of the last seen space. This is to prevent issues with
        finding words in the middle of other words 

        next we will say - if we hit a word in the Trie - if its Wildcard Search flag is set to false then we will check if the next character is a space/punct 
        if so - 
        

        if instead the word in the trie has its flag set to true we treat it like we would now - (except we work to find the word itself not just the prefix) 
        - we go on and apply the check for ignore terms - we also will walk till the punct/space and store that word instead of just the prefix. 

        Note - Do We Double Count Words in this case ? Like if someone entered win* and wind - do we double count wind ? 
        if we follow the ignore terms - and just ensure that we clear the flag if we find an additional word - then we are great. 
        JUST NEED TO GET MORE CERTAIN ON HOW IT KNOWS ITS A WORD - SEE EndWordLink .. ?
    */
    // actually searching the text

    // NOTE TO SELF - test ignore terms now - need to add connect Ignore Box from UI to this backend. 
    ProcessString(text){
        var ignoreFound = -1;
        var storedWord = "";
        var currentState = this.root;

        var result = 0;

        var wordBegin = 0;

        //###### TODO find the place to mark the beginning of the word. Then 
        for (var j = 0; j < text.length; j++){
            // calculating new state in trie
            while(true){
                var curChar = text[j].toLowerCase();
                if (this.Trie[currentState].Children.hasOwnProperty(curChar)){
                    currentState = this.Trie[currentState].Children[curChar];
                    break;
                }else if (ignoreFound == 1){
                    // add word and update its count
                    var word = (this.Trie[currentState].WordID);
                    console.log("this is our word");
                    console.log(word);
                    var wordCounts = this.aboutSearch["wordCounts"];
                    wordCounts[word] = wordCounts[word] || 0;
                    wordCounts[word] += 1;
                    ignoreFound = -1;
                }

                // otherwise we will folow the suffix links, where we will either find the char
                // or make it to the root where we can stop
                if(currentState == this.root) break;
                currentState = this.Trie[currentState].SuffixLink;
            }
            var checkState = currentState;

            // finding word matches NOTE 
            // TODO It doesnt need to be in the while loop, but change would involve restructuring all the breaks. Leaving in while loop is the easiest thing to do until we hit a stable version.
            while(true){
                // finding the possible word from the state
                checkState = this.Trie[checkState].EndWordLink;

                // if we make it to root we havent got a match
                if(checkState == this.root){ break;}
                console.log("found word");
                // if we get here we have a match, we can handle it how we want to in the future
                // since we have a match we check if the vertex has an ignore term flag 
                if(this.Trie[checkState].IgnoreTerm == 2){
                    // we hit the ignore term - just clear the flags and break to ignore it
                    ignoreFound = -1;
                    storedWord = "";
                    console.log("hit ignore term");
                    break;
                }else if (this.Trie[checkState].IgnoreTerm == 1){
                    // we know there is a future ignore term lets set the flags, and break to avoid entering the data just yet
                    ignoreFound = 1;
                    storedWord = this.Trie[checkState].WordID;
                    break;
                }
                

                // Add it to the wordCount dictionary, more work will need to be done in the recursion if we wish to obtain seperate counts 
                // for each folder
                // Adds word and updates its count.
                var word = (this.Trie[checkState].WordID);
                var wordCounts = this.aboutSearch["wordCounts"];
                wordCounts[word] = wordCounts[word] || 0;
                wordCounts[word]+= 1;

                result ++;
                break;
            
                // we can add a field to the leaf of vertex that denotes if it is a strict search word
                // then check for it here and if so then we can run a check if it is a substring and ignore if so.
                
                // finds matched patterns of smaller length  - note we don't care for this right now. 
                // checkState = this.Trie[checkState].SuffixLink;

            }
        }
        return result;
    }

}

// This is currenty inefficient, we can reduce the workload by assuming we are starting out in the right directory and backing up recursively from there
// but for now the simpler method works
const saveFile = async (fileHandle,subCorp_handle) =>{
    var destHandle = subCorp_handle;
    const paths = [];
   // console.log(subCorp_handle);

    // splitting to get each folder along the path 
    var filePath = fileHandle.relativePath.split('/');
    for ( var path of filePath){
        paths.push(path);
    }
    // TODO once we remove filename from relative path we dont need to push to array, can process after split

    // jumping through the file path and creating the folders if need be as we go
    for ( var i = 1; i < (paths.length -1); i++){
        destHandle = await destHandle.getDirectoryHandle(paths[i], {create:true});
    }

    var destFileHandle = await destHandle.getFileHandle(fileHandle.name, {create: true});

    // CONSIDER pasing this in to avoid the extra work. 
    const text = await fileHandle.text();

    const destWriter = await destFileHandle.createWritable();
    destWriter.write(text).then(() => destWriter.close());
}   



const createSubCorpus = async () => {
    const destCorpus = await winnowDir.getDirectoryHandle(subCorp_name, {create:true});
    return destCorpus;
}

const createWinnowData = async(subCorp_handle) => {
    const destCorpus = await subCorp_handle.getDirectoryHandle("Winnow_data", {create:true});
    return destCorpus;
}

const aboutWriter = async(data_handle,data) => {

    const aboutHandle = await data_handle.getFileHandle("about.txt",{create:true});
    const aboutWriter = await aboutHandle.createWritable();
    await aboutWriter.write(JSON.stringify(data,null,2)).then(()=> aboutWriter.close());
}




const prepACSearch = () =>{
    const search = new AC_search();

    for (var i = 0; i < searchWords.length; i ++){
        search.AddString(searchWords[i].toLowerCase(),searchWords[i].toLowerCase());
    }
    for(var i = 0; i < ignoreWords.length; i++){
        search.AddIgnoreString(ignoreWords[i].toLowerCase(), ignoreWords[i].toLowerCase());
    }
    search.prepareSearch();
   
    return search;
}


const main = async () => {

    // prepping the Aho Corasick search alg
    var fileCount = 0;
    const search = prepACSearch();

    // creating the SubCorpus
    const subCorp_handle = await createSubCorpus();

    for await (const fileHandle of getFilesRecursively(corpus_dir, corpus_dir.name)) {
        // here we can feed the files to the search method. they each have the data necessary for searching and copying them into a new dir. 
       
        updateProgCount();

        var file_text = await fileHandle.text();
        //console.log("searching files"+ fileHandle.name);

        const success = search.ProcessString(file_text);
        
        // if we found a search word in the file
        if(success > 0){
            
            try{
                saveFile(fileHandle,subCorp_handle);
                fileCount += 1;
            }catch(err){
                    console.log(err);
                }
        }
      }

      // Here we add relevant search information to be added to the about file
      // This is likely where we would haul in the meta-data as well

      search.aboutSearch["Name"] = subCorp_name;
      search.aboutSearch["Source Corpus Name"] = winnowDir.name;
      search.aboutSearch["Files in Corpus"] = fileCount;
      
       // create Winnow data and write about file
        const data_handle = await createWinnowData(subCorp_handle);
        await aboutWriter(data_handle,search.aboutSearch);

    //  console.log(search.wordCounts);
      console.log("returning " + subCorp_handle);
      return subCorp_handle;
    }
      

return main();
}