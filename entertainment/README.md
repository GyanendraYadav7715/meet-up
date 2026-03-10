# Entertainment API 🎬

A robust RESTful API built with **Spring Boot 3** and **Java 21** that serves as an entertainment management system (currently focused on Movies). The project utilizes **MySQL** for data persistence and **Flyway** for database migrations, ensuring reliable and structured database version control.

## ✨ Features

- **CRUD Operations:** Complete functionality to Create, Read, Update, and Delete movies.
- **Data Validation:** Strict input validation using Spring Boot Validation (`@Valid`, constraints on rating, year, etc.).
- **Global Exception Handling:** Clean, structured JSON responses for exceptions (e.g., Resource Not Found, Bad Request).
- **Uniform API Responses:** A consistent `ApiResponse<T>` wrapper for all endpoints.
- **Database Migrations:** Automated schema tracking and migrations using Flyway.
- **Actuator Enabled:** Ready for production monitoring and health checks.

---

## 🚀 Technologies Used

- **Java 21**
- **Spring Boot 3.x**
  - Spring Web
  - Spring Data JPA
  - Spring Boot Validation
  - Spring Boot Actuator
- **Database:** MySQL
- **Migration:** Flyway
- **Tooling:** Gradle, Lombok

---

## 🛠️ Folder Structure

```text
src/
└── main/
    ├── java/com/gyan/entertainment/
    │   ├── controller/      # REST API endpoints (MovieController)
    │   ├── dto/             # Data Transfer Objects
    │   │   ├── request/     # Incoming payload structures (MovieRequest)
    │   │   └── response/    # Outgoing data structures (MovieResponse)
    │   ├── entity/          # Database Entities (Movie)
    │   ├── exception/       # Global Exception handling and custom exceptions
    │   ├── filter/          # Request/Response Logging filters
    │   ├── repository/      # Spring Data JPA interfaces (MovieRepository)
    │   ├── response/        # Standardized API response wrapper (ApiResponse)
    │   ├── service/         # Business logic interfaces
    │   │   └── impl/        # Service implementations (MovieServiceImpl)
    │   └── EntertainmentApplication.java # Application Runner
    │
    └── resources/
        ├── db/migration/    # Flyway SQL migration scripts
        └── application.yaml # Application configurations
```

---

## ⚙️ How to Run

### 1. Prerequisites
- **Java 21** installed
- **MySQL Server** installed and running on port `3306`

### 2. Database Setup
Create the MySQL database (or allow Flyway/Hibernate to initialize it if configured). By default, the app looks for:
- **Database url:** `jdbc:mysql://localhost:3306/entertainment_db`
- **Username:** `root`
- **Password:** `7539`

*(You can update these details in `src/main/resources/application.yaml` or set environment variables).*

### 3. Run the Application
Open your terminal in the project root directory and use the Gradle wrapper:

```bash
# Clean and build the project
./gradlew clean build

# Step 2: Run the application
./gradlew bootRun
```
*The server will start on `http://localhost:8080`.*

---

## 📖 API Documentation

The API standardizes its responses. A typical successful HTTP 200/201 response looks like this:
```json
{
  "success": true,
  "message": "Movie fetched successfully",
  "data": { ... }
}
```

### 🎬 Movie Endpoints

#### 1. Create a New Movie
- **URL:** `POST /api/v1/movies`
- **Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "title": "Inception",
    "genre": "Sci-Fi",
    "releaseYear": 2010,
    "rating": 8.8
  }
  ```

#### 2. Get All Movies
- **URL:** `GET /api/v1/movies`

#### 3. Get a Movie by ID
- **URL:** `GET /api/v1/movies/{id}`

#### 4. Get Movies by Genre
- **URL:** `GET /api/v1/movies/genre/{genre}`

#### 5. Update a Movie
- **URL:** `PUT /api/v1/movies/{id}`
- **Headers:** `Content-Type: application/json`
- **Request Body:** *(All fields are required)*
  ```json
  {
    "title": "Inception: Extended",
    "genre": "Sci-Fi",
    "releaseYear": 2010,
    "rating": 9.0
  }
  ```

#### 6. Delete a Movie
- **URL:** `DELETE /api/v1/movies/{id}`

---

## 📝 Validations

When sending `MovieRequest` payloads, the following validations are strictly enforced:
- `title`: Must not be blank.
- `genre`: Must not be blank.
- `releaseYear`: Must be after 1888 and before 2100.
- `rating`: Allowed between `0.0` and `10.0`.

*(If validation fails, the API gracefully responds with a `400 Bad Request` and detailed error messages).*
