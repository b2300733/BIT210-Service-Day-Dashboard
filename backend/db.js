const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'service_day',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: false,
});

const query = (sql, params = []) => pool.execute(sql, params);

const initialiseDatabase = async () => {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      department VARCHAR(150) NOT NULL,
      role ENUM('employee', 'admin') NOT NULL DEFAULT 'employee',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS activities (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(200) NOT NULL,
      service_type VARCHAR(150) NOT NULL,
      schedule_date VARCHAR(20) NOT NULL,
      schedule_time VARCHAR(20) NOT NULL,
      location VARCHAR(255) NOT NULL,
      registered INT UNSIGNED NOT NULL DEFAULT 0,
      total_slots INT UNSIGNED NOT NULL,
      cutoff_date VARCHAR(20) NOT NULL,
      cutoff_time VARCHAR(20) NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS registrations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      employee_id INT UNSIGNED NOT NULL,
      activity_id INT UNSIGNED NOT NULL,
      qr_data VARCHAR(500) NULL UNIQUE,
      qr_generated_at DATETIME NULL,
      qr_checked BOOLEAN NOT NULL DEFAULT FALSE,
      checked_in_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY registrations_employee_activity (employee_id, activity_id),
      CONSTRAINT registrations_employee_fk FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT registrations_activity_fk FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS reminders (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      activity VARCHAR(200) NOT NULL,
      type VARCHAR(100) NOT NULL,
      scheduled_for VARCHAR(100) NOT NULL,
      status ENUM('sent', 'pending') NOT NULL DEFAULT 'pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB`,
  ];

  for (const statement of statements) {
    await pool.query(statement);
  }
};

module.exports = { pool, query, initialiseDatabase };
