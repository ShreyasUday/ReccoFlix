CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    name VARCHAR(255)
);

CREATE TABLE user_library (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    anime_id VARCHAR(255) NOT NULL,
    anime_title VARCHAR(255),
    poster_image VARCHAR(255),
    status VARCHAR(50), -- 'planned', 'watching', 'completed', 'dropped', 'on_hold'
    UNIQUE(user_id, anime_id)
);

CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");
