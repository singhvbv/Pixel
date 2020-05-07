
function unsplash_init(unique_srch_arr, qty, ttl_qty) {

  var orientation = '&orientation=' + store.get("orientation")
  qty = Math.ceil(qty)
  var page = 1
  var width = ''
  var height = ''

  let featured = validator.equals(store.get("featured"), "featured_images") ? '&featured' : ""

  if (validator.equals(store.get("orientation"), "custom")) {

    width = '&w=' + store.get("custom_width")
    height = '&h=' + store.get("custom_height")

  }

  if (validator.equals(store.get("orientation"), "mixed") || validator.equals(store.get("orientation"), "custom")) {

    orientation = ''

  }
  unique_srch_arr.forEach(search => {
    var src = new Array()
    unsplash_search(src, search, qty, orientation, featured, width, height, page, ttl_qty)
  });
}


function unsplash_search(src, search, qty, orientation, featured, width, height, page, ttl_qty) {

  let url = Constants.UNSPLASH_URL + "client_id=" + Constants.UNSPLASH_ACCESS_KEY + "&count=30" + orientation + featured + width + height + "&query=" + search + "&page=" + page

  fetch(url, {})
    .then(response => response.json())
    .then(parser => {
      parser.forEach(element => {
        if (validator.equals(store.get("orientation"), "custom")) {
          if (src.length < qty)
            src.push(element.urls.custom)
        }
        else {
          if (src.length < qty)
            src.push(element.urls.raw)
        }

      });

      src.length < qty ? unsplash_search(src, search, qty, orientation, featured, width, height, page += 1, ttl_qty) : downloadUnsplashInit(src, search, ttl_qty)

    })
    .catch(function (err) {
      return Promise.reject(err);
    });

}

function downloadUnsplashInit(src, search, ttl_qty) {

  var savePath = store.get("savePath")
  var baseDir = ""
  var final_path = ""
  //check for combine 
  if (validator.equals(store.get("platform"), "both_platform")) {
    validator.equals(store.get("combined"), "combined_result") ? baseDir = path.join(savePath, 'images') : baseDir = path.join(savePath, 'unsplash')
  }
  else if (validator.equals(store.get("platform"), "unsplash")) {
    baseDir = path.join(savePath, 'unsplash')
  }

  final_path = path.join(baseDir, search)

  src.forEach(url => {
    console.log(url)
    const image_name_part1 = url.split('?');
    const image_name_part2 = image_name_part1[0].split('/');
    const name = image_name_part2[image_name_part2.length - 1]
    downloadUnsplashImage(url, path.join(final_path, name), ttl_qty)

  });

}
async function downloadUnsplashImage(url, name, ttl_qty) {
  const res = await fetch(url);
  await new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(name + ".jpg");
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