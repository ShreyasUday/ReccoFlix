ReccoFlix — Anime Discovery Platform

A backend-driven anime discovery platform built using Node.js, Express, and server-side rendering with EJS, integrated with the Kitsu REST API to fetch and display real-time anime data with dynamic routing and UI templating.

🚀 Features

Search anime by keyword using backend API calls

Filter and browse by category

Dynamic server-side rendering using EJS templates

Organized route and view architecture for scalable expansion

Future support planned for:

Anime detail pages

Authentication flow (Sign-in/Sign-up)

User favorites or watchlist

🧰 Tech Stack
Category	Tools
Runtime	Node.js
Framework	Express.js
Template Engine	EJS
External API	Kitsu REST API
Styling	CSS
Version Control	Git & GitHub
📁 Folder Structure
ReccoFlix/
│── public/              # Static assets (CSS, JS, fonts)
│── views/               # EJS templates
│   ├── partials/        # Shared UI components
│   ├── home.ejs
│   ├── browse.ejs
│   └── ...
│── server.js            # Express server
│── index.js             # App entry
│── package.json
└── README.md

🔗 API Used

Kitsu API — A public anime data REST service
Documentation: https://kitsu.docs.apiary.io/

⚙ How to Run Locally

Clone repository:

git clone https://github.com/<your-username>/ReccoFlix.git


Install dependencies:

npm install


Start server:

npm start


App will run at:

➡ http://localhost:3000

📌 What This Project Demonstrates (Backend Skills)

Working with external REST API integration

Server-side rendering logic

Route handling & dynamic view population

Backend architecture structuring

Passing API data from backend → template → UI

📍 Roadmap (Planned Enhancements)

Complete anime description page

Add authentication middleware (JWT planned)

Add user watchlist stored in database

Deploy to Render / Railway for public access

🤝 Contributions

Feel free to fork and submit PRs if you'd like to enhance UI, routing, or API capabilities.

⭐ If you like this project, don't forget to star the repo!
