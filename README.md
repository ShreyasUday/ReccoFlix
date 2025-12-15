# ReccoFlix
ReccoFlix is a robust, full-stack anime discovery and tracking web application. It serves as a centralized platform for anime enthusiasts to explore new titles, search a comprehensive database, and manage their personal viewing library.
The application allows users to track their anime journey by categorizing titles into statuses such as "Watched", "Watching", "Planned", "On Hold", and "Dropped". With persistent authentication and a personalized profile system, ReccoFlix provides a seamless and customized user experience.
## Features
- **Anime Discovery**: Browse trending anime and filter titles by various categories.
- **Search System**: Search for specific anime titles using the Kitsu API integration.
- **Detailed Information**: View comprehensive details including synopsis, ratings, episode counts, and related franchises.
- **User Authentication**: Secure signup and login via local credentials (email/password) or Google OAuth.
- **Personal Library**: Add anime to a personalized library and track viewing status (Planned, Watching, Completed, On Hold, Dropped).
- **Library Management**: Update statuses or remove anime from the library directly from the interface.
- **Responsive Design**: A fully responsive user interface ensuring compatibility across desktop, tablet, and mobile devices.
- **Profile Management**: View user details and manage library content from a dedicated profile page.
## Tech Stack
### Frontend
- **EJS**: Server-side templating for dynamic HTML rendering.
- **HTML5**: Semantic markup structure.
- **CSS3**: Custom styling with responsive design principles.
- **Vanilla JavaScript**: Client-side interactivity and DOM manipulation.
### Backend
- **Node.js**: JavaScript runtime environment.
- **Express.js**: Web framework for routing and middleware.
- **Passport.js**: Authentication middleware supporting Local Strategy and Google OAuth 2.0.
- **Express-session**: Session management for persistent user login states.
### Database
- **PostgreSQL**: Relational database for storing user data and library entries.
### External API
- **Kitsu Anime API**: Source for fetching real-time anime data and metadata.
### Tools & Utilities
- **Axios**: HTTP client for making API requests.
- **bcrypt**: Library for hashing and securing user passwords.
- **connect-pg-simple**: PostgreSQL session store for Express.
- **dotenv**: Environment variable management.
## Folder Structure
```
ReccoFlix
├── node_modules
├── public
│   ├── fonts
│   │   ├── animeace2bb_ot
│   │   └── animeace2bb_tt
│   │       ├── animeace2_bld.ttf
│   │       ├── animeace2_ital.ttf
│   │       └── animeace2_reg.ttf
│   ├── js
│   │   └── main.js
│   └── styles
│       └── main.css
├── views
│   ├── partials
│   │   ├── footer.ejs
│   │   └── header.ejs
│   ├── about.ejs
│   ├── browse.ejs
│   ├── category.ejs
│   ├── description.ejs
│   ├── home.ejs
│   ├── login.ejs
│   ├── privacy.ejs
│   ├── profile.ejs
│   ├── register.ejs
│   ├── search.ejs
│   └── terms.ejs
├── .env
├── .env.example
├── .gitignore
├── db.js
├── index.js
├── package-lock.json
├── package.json
├── README.md
├── schema.sql
└── update_schema.js
```
## Installation & Setup
Follow these steps to set up the project locally.
### 1. Clone the Repository
```bash
git clone https://github.com/ShreyasUday/ReccoFlix.git
cd ReccoFlix
```
### 2. Install Dependencies
```bash
npm install
```
### 3. Database Setup
Ensure you have PostgreSQL installed and running. Create a new database for the project.
```sql
CREATE DATABASE reccoflix;
```
Execute the schema file (if provided) or create the necessary tables (`users`, `user_library`, `session`).
### 4. Configure Environment Variables
Create a `.env` file in the root directory and add the following variables:
```env
DB_USER=your_postgres_user
DB_HOST=localhost
DB_NAME=reccoflix
DB_PASSWORD=your_postgres_password
DB_PORT=5432
SESSION_SECRET=your_secure_session_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```
### 5. Run the Server
```bash
npm start
```
The application will be accessible at `http://localhost:3000`.
## Environment Variables
The application requires the following environment variables to function correctly:
- `DB_USER`: Your PostgreSQL username.
- `DB_HOST`: Database host address (usually localhost).
- `DB_NAME`: The name of your PostgreSQL database.
- `DB_PASSWORD`: Your PostgreSQL password.
- `DB_PORT`: The port your database is running on (default is 5432).
- `SESSION_SECRET`: A string used to sign the session ID cookie.
- `GOOGLE_CLIENT_ID`: OAuth 2.0 Client ID from Google Cloud Console.
- `GOOGLE_CLIENT_SECRET`: OAuth 2.0 Client Secret from Google Cloud Console.
- `GOOGLE_CALLBACK_URL`: The callback URL registered in Google Cloud Console.
## Usage
1.  **Register/Login**: Create an account using email/password or sign in with Google.
2.  **Browse**: Explore anime by category from the home or browse pages.
3.  **Search**: Use the search bar to find specific titles.
4.  **Add to Library**: Click on an anime card to view details, then select a status (e.g., "Watching") and click the add button to save it to your library.
5.  **Manage Library**: Go to your Profile to see your saved anime. You can update their status or remove them.
## Attribution
- **Kitsu API**: All anime data, images, and metadata are provided by the [Kitsu API](https://kitsu.io/docs/api).
- **Google OAuth**: Authentication services provided by Google.
## License
This project is licensed under the MIT License.
