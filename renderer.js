// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering

var validator = require('validator')
var store = require('store')
const { shell, remote, ipcRenderer, webFrame } = require('electron')
const { dialog } = require('electron').remote
var fs = require('fs');
var path = require('path');
const internetAvailable = require("internet-available");
var dropdown = null
var Constants = require(path.join(__dirname, '../config'))
const fetch = require('node-fetch')
const config_path = path.join(__dirname, '../config.js')



let fieldBlankOptions = {
  message: "Uh oh, seems like there is something wrong with the input or you left it empty."
}



// for smooth transition between files.
document.body.classList.add('fade');

document.addEventListener("DOMContentLoaded", function (e) {
  document.body.classList.remove('fade');
});


//not persisting , deleting all data on close 
remote.getCurrentWindow().on('close', () => {
  store.clearAll()
})

//setting api keys on first start
function get_api_key() {

  var pexel_api_key = document.getElementById("pexel_api_key").value;
  var unsplash_api_key = document.getElementById("unsplash_access_key").value;

  if (validator.contains(pexel_api_key, "\"") || validator.contains(unsplash_api_key, "\"") ||
    validator.isEmpty(pexel_api_key) || validator.isEmpty(unsplash_api_key)) {
    dialog.showMessageBox(fieldBlankOptions)
  }
  else {
    var save_config = `module.exports = {

        PEXEL_URL               :       "https://api.pexels.com/v1/search?query=",
        PEXEL_API_KEY           :       "`+ pexel_api_key + `",
        UNSPLASH_URL            :       "https://api.unsplash.com/photos/random?",
        UNSPLASH_ACCESS_KEY     :        "`+ unsplash_api_key + `",
    
        
    }`

    //checking api config
    try {
      const data = fs.writeFileSync(config_path, save_config)

    } catch (err) {
      remote.getCurrentWindow().loadFile("get_keys.html")
    }
    remote.getCurrentWindow().loadFile("index.html")
  }


}

function openDir() { remote.shell.openItem(store.get('savePath')) }

function go_Back() { window.history.back() }


function browseDir(id) {

  const savePath = store.get('savePath')
  const currPath = store.get("current_browse_path") ? store.get("current_browse_path") : savePath
  dir = path.join(currPath, id)

  folders = Array()
  var is_File = false
  fs.readdirSync(dir).forEach(file => {
    fs.existsSync(path.join(dir, file)) && fs.lstatSync(path.join(dir, file)).isDirectory() ? folders.push(file) : is_File = true

  });

  store.set("current_browse_path", path.join(currPath, id))
  store.set("folders", folders)

  is_File ? remote.getCurrentWindow().loadFile("show_images.html") : remote.getCurrentWindow().loadFile("browse_folder.html")

}

function openImage(id) {

  remote.shell.openItem(path.join(store.get("current_browse_path"), id))
}

function closeApp() { remote.app.quit() }

//search term function
function check_search_terms() {

  var value = document.getElementsByClassName('nl-form')[0]["elements"]["search_terms"].value;
  var check1 = validator.isLength(value, { min: 1, max: undefined });
  var check2 = !validator.isEmpty(value);
  var file = "get_quantity.html";

  checks("search_term", value, file, check1, check2);

}

//platform check function
function check_platform() {
  var value = document.getElementsByClassName('nl-form')[0]["elements"]["get_platform_val"].value;
  var check1 = validator.isLength(value, { min: 1, max: undefined });
  var check2 = !validator.isEmpty(value);
  var file = ""

  if (validator.equals(value, "both_platform")) file = "get_pexel_sizes.html";

  if (validator.equals(value, "pexels")) file = "get_pexel_sizes.html";

  if (validator.equals(value, "unsplash")) file = "get_unsplash_featured.html";

  checks("platform", value, file, check1, check2);


}

//quantity check function
function check_quantity() {
  var value = document.getElementsByClassName('nl-form')[0]["elements"]["get_quantity_val"].value;
  var check1 = validator.isLength(value, { min: 1, max: undefined });
  var check2 = !validator.isEmpty(value);
  var check3 = !validator.contains(value, ".");
  var file = "get_platform.html";

  checks("quantity", value, file, check1, check2, check3);

}

//pexel image size check function
function check_pexel_size() {
  var value = document.getElementsByClassName('nl-form')[0]["elements"]["get_pexel_size_val"].value;
  var check1 = validator.isLength(value, { min: 1, max: undefined });
  var check2 = !validator.isEmpty(value);
  var file = validator.equals(store.get("platform"), "both_platform") ? "get_unsplash_featured.html" : "#"

  checks("pexel_size", value, file, check1, check2);

}

//checking if image featured for unsplash
function check_unsplash_featured() {
  var value = document.getElementsByClassName('nl-form')[0]["elements"]["get_featured_val"].value;
  var check1 = validator.isLength(value, { min: 1, max: undefined });
  var check2 = !validator.isEmpty(value);
  var file = "get_unsplash_orientation.html";

  checks("featured", value, file, check1, check2);

}

//checking image orientation for unsplash
function check_unsplash_orientation() {
  var value = document.getElementsByClassName('nl-form')[0]["elements"]["get_orientation_val"].value;
  var check1 = validator.isLength(value, { min: 1, max: undefined });
  var check2 = !validator.isEmpty(value);
  var file = validator.equals(store.get("platform"), "both_platform") ? "get_combine.html" : "#"

  if (document.getElementById("custom_val").style.display === "block") {
    var valueHeight = document.getElementsByClassName('nl-form')[0]["elements"]["custom_height"].value;
    var checkHeight1 = validator.isLength(valueHeight, { min: 1, max: undefined });
    var checkHeight2 = !validator.isEmpty(valueHeight);
    var valueWidth = document.getElementsByClassName('nl-form')[0]["elements"]["custom_width"].value;
    var checkWidth1 = validator.isLength(valueWidth, { min: 1, max: undefined });
    var checkWidth2 = !validator.isEmpty(valueWidth);

    store.set("custom_width", valueWidth)
    store.set("custom_height", valueHeight)
    checks("orientation", value, file, check1, check2, checkHeight1, checkHeight2, checkWidth1, checkWidth2);

  }
  else {
    checks("orientation", value, file, check1, check2);

  }


}

//checking custom dropdown for unsplash
function dropdown_emit_from_nlform(val = null) {
  dropdown = val
  let custom = document.getElementById("custom_val");
  if (validator.equals(dropdown, "custom")) {
    custom.style.display === "none" ? custom.style.display = "block" : custom.style.display = "none"

  }
  else {
    custom.style.display = "none";
  }

}

//checking if user wants result from both website
function check_combine() {
  var value = document.getElementsByClassName('nl-form')[0]["elements"]["get_combine_val"].value;
  var check1 = validator.isLength(value, { min: 1, max: undefined });
  var check2 = !validator.isEmpty(value);
  var file = "#";

  checks("combined", value, file, check1, check2);
}

//field integrity checks
function checks(key, value, file, ...args) {
  if (args.includes(false)) {
    dialog.showMessageBox(fieldBlankOptions)

  }
  else {
    store.set(key, value)
    validator.equals(file, "#") ? showSaveDialogMessage() : remote.getCurrentWindow().loadFile(file)

  }
}

