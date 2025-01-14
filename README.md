# Mangobot

Mangobot is a Generative AI chatbot built using Node.js and MySQL. It was created as an entrance project for the **CSEC-ASTU Club** at **Adama Science and Technology University**. This application allows users to register, log in, and interact with an AI chatbot while keeping track of their conversation history. It also supports Google and GitHub authentication for seamless login.

---

## Features

### User Authentication
- **Registration**: Users can register with their full name, phone number, email, and password. Passwords are securely hashed using bcrypt.
- **Login**: Login system with email and password verification.
- **OAuth Support**: Login via Google and GitHub accounts is supported.

### Chat Functionality
- **Generative AI**: Users can interact with the Mangobot AI chatbot, powered by `getGeminiResponse`.
- **Conversation History**: Chat history is stored and updated in the MySQL database for each user.

### Account Management
- **Password Setup for OAuth Users**: New users signing in via Google or GitHub are prompted to set up a password if one isn't already provided.

---

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Authentication**: Passport.js (Google and GitHub OAuth 2.0)
- **Security**: Password hashing with bcrypt
- **Frontend**: Static files served via Express (`public` folder)

---

## Installation

### Prerequisites
- Node.js installed on your machine
- MySQL database set up with a `user_database` schema
- Google and GitHub OAuth credentials

### Steps
1. Clone this repository.
   ```bash
   git clone https://github.com/yourusername/mangobot.git
   cd mangobot
   ```

2. Install the required dependencies.
   ```bash
   npm install
   ```

3. Configure your environment variables:
   - Replace `SECRET_KEY` in the `session` middleware with your own secret.
   - Add your Google and GitHub OAuth credentials in their respective strategy configurations.

4. Set up your MySQL database:
   - Create a database named `user_database`.
   - Run the following SQL to create the necessary table:
     ```sql
     CREATE TABLE user_register (
         id INT AUTO_INCREMENT PRIMARY KEY,
         full_name VARCHAR(255) NOT NULL,
         phone VARCHAR(20),
         email VARCHAR(255) NOT NULL UNIQUE,
         password VARCHAR(255),
         hash VARCHAR(255),
         history TEXT
     );
     ```

5. Start the server:
   ```bash
   node app.js
   ```

6. Open your browser and navigate to `http://localhost:3000`.

---

## Screenshots

### Login Page
![Login Page](https://github.com/Moh-Sad/Mango-Generative-AI/blob/main/public/images/LoginPage.png)

### Signup Page
![Signup Page](https://github.com/Moh-Sad/Mango-Generative-AI/blob/main/public/images/SignupPage.png)

### Homepage
![Homepage](https://github.com/Moh-Sad/Mango-Generative-AI/blob/main/public/images/HomePage.png)

---

## Endpoints

### Authentication
- `POST /submit`: Register a new user.
- `POST /login`: Log in with email and password.
- `POST /setup-password`: Set up a password for users signing in via OAuth.
- `GET /auth/google`: Google OAuth login.
- `GET /auth/github`: GitHub OAuth login.

### Chatbot
- `POST /geminiResponse`: Send a prompt to the chatbot and get a response.

---

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

---