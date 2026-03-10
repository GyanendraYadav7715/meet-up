CREATE TABLE movies (
                        id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                        title        VARCHAR(255)   NOT NULL,
                        genre        VARCHAR(100)   NOT NULL,
                        release_year INT            NOT NULL,
                        rating       DECIMAL(3, 1)  NOT NULL,
                        created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);