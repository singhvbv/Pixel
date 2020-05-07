
function pexel_init(unique_srch_arr, qty, ttl_qty) {
  var pexel_size = store.get("pexel_size")
  qty = Math.floor(qty)

  unique_srch_arr.forEach(search => {
    var src = new Array()
    pexel_search(src, search, qty, pexel_size, ttl_qty)
  });
}

function pexel_search(src, search, qty, pexel_size, ttl_qty, next_page = "") {

  let url = !validator.isEmpty(next_page) ? next_page : Constants.PEXEL_URL + search

  fetch(url, {
    headers: { 'Authorization': Constants.PEXEL_API_KEY }
  })
    .then(response => response.json())
    .then(parser => {
      let photos = parser.photos
      next_page = parser.next_page
      photos.forEach(element => {
        if (src.length < qty)
          src.push(element.src[pexel_size])
      });

      src.length < qty ? pexel_search(src, search, qty, pexel_size, ttl_qty, next_page) : downloadPexelInit(src, search, ttl_qty)

    })
    .catch(function (err) {
      return Promise.reject(err);
    });

}

function downloadPexelInit(src, search, ttl_qty) {

  var savePath = store.get("savePath")
  var baseDir = ""
  var final_path = ""

  //check for combine results
  if (validator.equals(store.get("platform"), "both_platform")) {

    validator.equals(store.get("combined"), "combined_result") ? baseDir = path.join(savePath, 'images') : baseDir = path.join(savePath, 'pexels')

  }
  else if (validator.equals(store.get("platform"), "pexels")) {
    baseDir = path.join(savePath, 'pexels')
  }

  final_path = path.join(baseDir, search)

  src.forEach(url => {
    const image_name_part1 = url.split('?');
    const image_name_part2 = image_name_part1[0].split('/');
    const name = image_name_part2[image_name_part2.length - 1]

    downloadPexelImage(url, path.join(final_path, name), ttl_qty)

  });



}

async function downloadPexelImage(url, name, ttl_qty) {
  const res = await fetch(url);
  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(name);
    res.body.pipe(fileStream);
    res.body.on("error", (err) => {
      reject(err);
    });
    fileStream.on("finish", function () {
      ipcRenderer.send('progress_increment', ttl_qty, "ping")
      resolve();
    });
  });
}