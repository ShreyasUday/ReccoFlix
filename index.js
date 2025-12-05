import express from "express"
import bodyParser from "body-parser"
import axios from "axios"

const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static("public"))
app.set("view engine", "ejs")
app.set("views", "./views")

app.get("/", async (req, res) => {
  res.render("home")
})

app.get("/search", (req, res) => {
  res.render("search", {
    items: "shreyas"
  })
})

app.post("/search", async (req, res) => {
  const request = req.body.search_data
  console.log(request)
  try {
    const response = await axios.get(`https://kitsu.io/api/edge/anime?filter[text]=${request}`)
    const items = response.data.data

    if (items.length !== 0) {
      res.render("browse", {
        items: items,
        content: items.length ? items[0].attributes.posterImage.small : ""
      })
    } else {
      res.render("search", {
        items: items
      })
    }
  } catch (error) {
    console.error(error)
  }
})

app.post("/browse", async (req, res) => {
  let selectedCategory = ""
  const genreKeys = [
    "action", "adventure", "scifi", "fantasy", "drama", "comedy",
    "mystery", "thriller", "sports", "romance", "slice of life", "historical"
  ];
  for (const key of genreKeys) {
    if (req.body.hasOwnProperty(key)) {
      selectedCategory = key;
      break;
    }
  }
  const finalCategory = selectedCategory || "action";
  console.log(`Filtering by category: ${finalCategory}`);
  try {
    const response = await axios.get(`https://kitsu.io/api/edge/anime?filter[categories]=${selectedCategory}&include=categories&page[limit]=20`)
    const items = response.data.data

    res.render("browse", {
      items: items,
      content: items.length ? items[0].attributes.posterImage.small : ""
    })

  } catch (error) {
    // console.error(error)
  }
})

app.post("/description", async (req, res) => {
  try {
    const animeName = req.body.anime_name || req.body.message

    if (!animeName) {
      console.error("Error: Anime name not provided in POST body.");
      return res.status(400).send("Anime name required.");
    }

    console.log(animeName)
    const response = await axios.get(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(animeName)}&page[limit]=1`)
    res.render("description", {
      desc: response.data.data,
      anime: animeName
    })
  } catch (error) {
    console.error("Error fetching anime details:", error.message || error);
    res.status(500).render("error_page", { error: "Failed to load anime details." });
  }


})

app.get("/")

app.get("/category", async (req, res) => {
  res.render("category")
})

app.get("/browse", async (req, res) => {
  res.render("browse")
})



app.listen(3000, () => {
  console.log("Server running on http://localhost:3000")
})