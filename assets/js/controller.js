//showing directory dialog
function showSaveDialogMessage() {
  let message = {
    message: "Select folder to save images."
  }

  let directory = {
    properties: ['openDirectory']
  }

  dialog.showMessageBoxSync(message)
  dialog.showOpenDialog(directory)
    .then(function (res) {
      const savePath = res.filePaths[0]
      store.set("savePath", savePath)
      directoriesStructure(savePath)
    }).catch(function (err) {
    });


}

//checking directories structure to be followed
function directoriesStructure(savePath) {
  var baseDir = ""
  if (validator.equals(store.get("platform"), "both_platform")) {
    //check for combine
    if (validator.equals(store.get("combined"), "combined_result")) {
      //make base directory
      baseDir = path.join(savePath, 'images')
      seperateDirCreate(baseDir)
    }
    else {
      //make base directory
      baseDir = path.join(savePath, 'pexels')
      seperateDirCreate(baseDir)

      //make base directory
      baseDir = path.join(savePath, 'unsplash')
      seperateDirCreate(baseDir)

    }


  }
  else if (validator.equals(store.get("platform"), "pexels")) {
    //make base directory
    baseDir = path.join(savePath, 'pexels')
    seperateDirCreate(baseDir)

  }
  else if (validator.equals(store.get("platform"), "unsplash")) {
    //make base directory
    baseDir = path.join(savePath, 'unsplash')
    seperateDirCreate(baseDir)
  }

  liveCheck()


}

//creating seperate directories
function seperateDirCreate(baseDir) {

  var srch_arr = store.get("search_term").split(',');
  var unique_srch_arr = new Set(srch_arr); //avoid repetition of same search_terms  

  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir)

  //make search terms categories
  for (var term of unique_srch_arr) {
    if (!fs.existsSync(path.join(baseDir, term))) fs.mkdirSync(path.join(baseDir, term))

  }

}

//checking for internet connection
function liveCheck() {

  internetAvailable({
    // Provide maximum execution time for the verification
    timeout: 5000,
    // If it tries 5 times and it fails, then it will throw no internet
    retries: 5
  }).then(() => {
    console.log("Internet available");
    dataBridge()
  }).catch(() => {
    let message = {
      message: "Your network seems Not working"
    }

    dialog.showMessageBoxSync(message)

    console.log("No internet");
  });
}

//bridging common data
function dataBridge() {

  let srch_arr = store.get("search_term").split(',');
  let unique_srch_arr = new Set(srch_arr); //avoid repetition of same search_terms
  let quantity_str = store.get("quantity")
  let qty = parseInt(quantity_str)
  let search_term_length = unique_srch_arr.size
  let ttl_qty = search_term_length * qty
  qty = validator.equals(store.get("platform"), "both_platform") ? parseInt(quantity_str) / 2 : parseInt(quantity_str)

  init_api_call(unique_srch_arr, qty, ttl_qty);

}

//initializing call for api
async function init_api_call(unique_srch_arr, qty, ttl_qty) {

  if (validator.equals(store.get("platform"), "both_platform")) {

    var promise1 = unsplash_init(unique_srch_arr, qty, ttl_qty);
    var promise2 = pexel_init(unique_srch_arr, qty, ttl_qty);
    // Renderer process


    ipcRenderer.send('init-progress', "ping")

    Promise.all([promise1, promise2])
      .then(results => {
      }
      );

  }
  else if (validator.equals(store.get("platform"), "pexels")) {
    ipcRenderer.send('init-progress', "ping")
    pexel_init(unique_srch_arr, qty, ttl_qty);

  }
  else if (validator.equals(store.get("platform"), "unsplash")) {
    ipcRenderer.send('init-progress', "ping")
    unsplash_init(unique_srch_arr, qty, ttl_qty);
  }

}

