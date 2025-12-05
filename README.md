# 🎥 ReccoFlix — Anime Discovery Platform

ReccoFlix is a **backend-driven anime discovery platform** built using **Node.js**, **Express**, and **EJS (server-side rendering)**.  
The application integrates with the **Kitsu REST API** to fetch and display real-time anime data with dynamic routing and UI templating.

---

## 🚀 Features

- 🔎 Search anime by keyword using backend API calls  
- 🗂 Filter and browse anime by category  
- 🧱 Server-side rendering using EJS templates  
- 🧩 Modular route and view structure for scalability  
- 🛠 Planned Enhancements:
  - Anime detail pages
  - Authentication (Sign-in / Sign-up)
  - User favorites / watchlist

---

## 🧰 Tech Stack

| Category | Tools |
|---------|------|
| Runtime | Node.js |
| Framework | Express.js |
| Template Engine | EJS |
| External API | Kitsu REST API |
| Styling | CSS |
| Version Control | Git & GitHub |

---

## 📁 Folder Structure

📦 ReccoFlix
┣ 📁 public
┃ ┣ 📁 styles
┃ ┗ 📁 js
┣ 📁 views
┃ ┣ 📁 partials
┃ ┣ 📝 home.ejs
┃ ┣ 📝 browse.ejs
┃ ┗ 📝 search.ejs
┣ 📝 server.js
┣ 📝 index.js
┣ 📝 package.json
┗ 📝 README.md

---

## 🔗 API Used

- **Kitsu REST API** — Public anime information service  
📄 Docs → https://kitsu.docs.apiary.io/

---

## ⚙ How to Run Locally

```bash
# Clone the repository
git clone https://github.com/<your-username>/ReccoFlix.git

# Navigate to folder
cd ReccoFlix

# Install dependencies
npm install

# Run the server
npm start

➡ The app will run at http://localhost:3000
```

📌 What This Project Demonstrates — Backend Skills

 REST API Integration  
 Server-side Rendering  
 Route Handling & Dynamic Views  
 Backend Architecture & Modular Folder Structure  
 Passing API data from server → view → UI

🧭 Roadmap

 Anime description pages  
 JWT authentication  
 Watchlist or favorites feature  
 Deployment to Render / Railway

 🤝 Contributions

Contributions are welcome!
Feel free to fork this project and submit PRs to enhance UI, routing, or API capabilities.
