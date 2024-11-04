const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "wpr",
  password: "fit2024",
  multipleStatements: true,
});

const dbName = "";

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL");

  connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
    if (err) throw err;
    console.log(`Database ${dbName} created or already exists`);

    connection.query(`USE ${dbName}`, (err) => {
      if (err) throw err;
      console.log(`Using database ${dbName}`);

      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          fullname VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL
        );
      `;
      connection.query(createUsersTable, (err) => {
        if (err) throw err;
        console.log("Users table created or already exists");

        const insertUsers = `
          INSERT INTO users (fullname, email, password) VALUES
          ('User One', 'a@a.com', '123'),
          ('User Two', 'b@b.com', '123'),
          ('User Three', 'c@c.com', '123')
          ON DUPLICATE KEY UPDATE email=email;
        `;
        connection.query(insertUsers, (err) => {
          if (err) throw err;
          console.log("Default users inserted or already exist");

          const createEmailsTable = `
            CREATE TABLE IF NOT EXISTS emails (
              id INT AUTO_INCREMENT PRIMARY KEY,
              sender_id INT NOT NULL,
              receiver_id INT NOT NULL,
              subject VARCHAR(255),
              body TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              sendDeleted BOOLEAN DEFAULT false,
              receiveDeleted BOOLEAN DEFAULT false,
              attachment VARCHAR(255),
              FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
            );
          `;
          connection.query(createEmailsTable, (err) => {
            if (err) throw err;
            console.log("Emails table created or already exists");

            const insertEmails = `
              INSERT INTO emails (sender_id, receiver_id, subject, body) VALUES
              (1, 2, 'Hello', 'Hi there!'),
              (2, 1, 'Greetings', 'How are you?'),
              (1, 3, 'Project', 'About the project'),
              (3, 1, 'Reply', 'Received your email')
              ON DUPLICATE KEY UPDATE subject=subject;
            `;
            connection.query(insertEmails, (err) => {
              if (err) throw err;
              console.log("Default emails inserted or already exist");
              connection.end();
            });
          });
        });
      });
    });
  });
});
