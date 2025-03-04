# Project TradeCard - A Pokémon TCG Collection Manager
## CSC7062 Web Development Project 2023-24

### Overview
TradeCard is a full-stack web application designed for Pokémon Trading Card Game (TCG) collectors. It enables users to explore, manage, 
and create their card collections with ease. Built as part of my MSc in Software Development, this project showcases my knowledge in 
web development, backend integration, and database management. 

### Features
- User Authentication: Secure user registration, login, and session management using bcrypt and express-session. 
- Dynamic Card Display: Fetch and display Pokémon cards dynamically using MySQL and EJS templating. 
- Personal Collections: Users can create, update, and delete personalised card collections. 
- Wishlist Management: Save cards for future acquisitions. 
- Sorting & Filtering: Sort cards by rarity, expansion, and other attributes for easy browsing. 
- Community Engagement: Like and view other members' collections. 
- Responsive Design: Optimised layout using Bootstrap to give a seamless experience across devices.
- Security Measures: Parameterised queries, hashed passwords, and session handling to prevent common vulnerabilities.

### Technologies Used
#### Frontend
- HTML, CSS, JavaScript
- Bootstrap
- EJS for server-side templating

#### Backend
- Node.js with Express.js
- MySQL database managed via phpMyAdmin
- bcrypt for password hashing
- express-session for user session management

### Steps to Run Locally
1. Clone the repository
2. Import the database:
- Open phpMyAdmin and create a new database
- Import 40429391.sql into the database
3. Install dependencies: npm install
4. Start the server: npx nodemon
5. Open your browser and go to: http://localhost:3000/

### Future Improvements
- Scalability
- Implement a password recovery feature
- Enhance the UI
- Improve query optimisation for large collections
- Expand user interactions (e.g. trading cards)