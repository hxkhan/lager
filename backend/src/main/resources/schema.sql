CREATE TABLE IF NOT EXISTS Items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR_IGNORECASE(255) NOT NULL UNIQUE,
    amount INT NOT NULL CHECK (amount >= 0),
    unit VARCHAR(16) NOT NULL CHECK (unit IN ('st', 'fp', 'fl', 'lådor', 'par', 'set', 'rullar')),
    last_updated TIMESTAMP NOT NULL
);