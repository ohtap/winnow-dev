
// 
export default async function search(corpus_dir, searchWords, subCorp_name, winnowDir, updateProgCount){
  
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
      

// bc apparently js doesnt have one?! everything is O(1) time for this. Unlike the array implementation
class Queue {
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

    // actually searching the text
    ProcessString(text){
        var currentState = this.root;

        var result = 0;

        for (var j = 0; j < text.length; j++){
            // calculating new state in trie
            while(true){
                var curChar = text[j].toLowerCase();
                if (this.Trie[currentState].Children.hasOwnProperty(curChar)){
                    currentState = this.Trie[currentState].Children[curChar];
                    break;
                }

                // otherwise we will folow the suffix links, where we will either find the char
                // or make it to the root where we can stop

                if(currentState == this.root) break;
                currentState = this.Trie[currentState].SuffixLink;
            }
            var checkState = currentState;

            // finding word matches
            while(true){
                // finding the possible word from the state
                checkState = this.Trie[checkState].EndWordLink;

                // if we make it to root we havent got a match
                if(checkState == this.root){ break;}

                // if we get here we have a match, we can handle it how we want to in the future
                // which will ideally be to check it against any exclude words, then continue a count before processing the file. 

                // Add it to the wordCount dictionary, more work will need to be done in the recursion if we wish to obtain seperate counts 
                // for each folder
                var word = (this.Trie[checkState].WordID);
                var wordCounts = this.aboutSearch["wordCounts"];
                wordCounts[word] = wordCounts[word] || 0;
                wordCounts[word]+= 1;

                result ++;
                
                
                // we can add a field to the leaf of vertex that denotes if it is a strict search word
                // then check for it here and if so then we can run a check if it is a substring and ignore if so.
                
                // finds matched patterns of smaller length 
                 checkState = this.Trie[checkState].SuffixLink;

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

// TODO 
// write an Aho exclude which just returns a bool on its search
// then initialize the exclude inside the init for the aho include.  Then we can double up and check against ignore words
// then write something to check for a "quotations" string and write strict search options for that. 
// - perhaps to do this we pass in a series of objects instead of strings, and the objects are already parsed with their respective search adjusters
