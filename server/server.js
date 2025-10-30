const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 2707; // We'll use port 2707 for the server

// --- Middleware ---
// Enable Cross-Origin Resource Sharing for all routes
app.use(cors());
// Enable the express.json middleware to parse JSON request bodies, with a larger limit for file uploads
app.use(express.json({ limit: '10mb' }));

// In a real production app, use an environment variable for this!
const JWT_SECRET = 'your-super-secret-key-for-lattice-app';

// --- Database Setup ---
const db = new sqlite3.Database('./lattice.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the lattice.db SQLite database.');
});

// --- SSE (Server-Sent Events) Setup ---
let clients = [];

const sendEventToAll = (data) => {
  console.log('Sending event to all clients:', data);
  clients.forEach(client => client.res.write(`data: ${JSON.stringify(data)}\n\n`));
};

app.get('/api/events', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res: res,
  };
  clients.push(newClient);
  console.log(`Client ${clientId} connected`);

  req.on('close', () => {
    console.log(`Client ${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
});

// --- Database Schema Migrations ---
// This is a simple way to handle schema changes without dropping the table.
db.serialize(() => {
  // Add columns to the 'bookings' table if they don't exist
  db.run(`ALTER TABLE bookings ADD COLUMN expectedPallets INTEGER`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore error if column already exists */ } 
    else if (err) { console.error('Error adding "expectedPallets" to "bookings":', err.message); }
    else { console.log('Column "expectedPallets" added to "bookings" table.'); }
  });
  db.run(`ALTER TABLE bookings ADD COLUMN customer_id TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore error if column already exists */ }
    else if (err) { console.error('Error adding "customer_id" to "bookings":', err.message); }
    else { console.log('Column "customer_id" added to "bookings" table.'); }
  });

  // Add column to the 'inventory' table if it doesn't exist
  db.run(`ALTER TABLE inventory ADD COLUMN customer_id TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore error if column already exists */ }
    else if (err) { console.error('Error adding "customer_id" to "inventory":', err.message); }
    else { console.log('Column "customer_id" added to "inventory" table.'); }
  });

  // Add new columns to the 'bookings' table for suppliers and hauliers
  db.run(`ALTER TABLE bookings ADD COLUMN supplier_id TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore */ }
    else if (err) { console.error('Error adding "supplier_id" to "bookings":', err.message); }
    else { console.log('Column "supplier_id" added to "bookings" table.'); }
  });
  db.run(`ALTER TABLE bookings ADD COLUMN haulier_id TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore */ }
    else if (err) { console.error('Error adding "haulier_id" to "bookings":', err.message); }
    else { console.log('Column "haulier_id" added to "bookings" table.'); }
  });

  // Add customer_suppliers join table
  db.run(`CREATE TABLE IF NOT EXISTS customer_suppliers (
    customer_id TEXT NOT NULL, supplier_id TEXT NOT NULL, PRIMARY KEY (customer_id, supplier_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
  )`, (err) => { if (err) { console.error("Error creating customer_suppliers table:", err.message); }});

  // Add customer_hauliers join table
  db.run(`CREATE TABLE IF NOT EXISTS customer_hauliers (
    customer_id TEXT NOT NULL, haulier_id TEXT NOT NULL, PRIMARY KEY (customer_id, haulier_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (haulier_id) REFERENCES hauliers(id) ON DELETE CASCADE
  )`, (err) => { if (err) { console.error("Error creating customer_suppliers table:", err.message); }});

  // Add contract_id to bookings table
  db.run(`ALTER TABLE bookings ADD COLUMN contract_id TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore */ }
    else if (err) { console.error('Error adding "contract_id" to "bookings":', err.message); }
  });

  // Add contracts table
  db.run(`CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, customer_id TEXT NOT NULL, createdAt TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`, (err) => { if (err) { console.error("Error creating contracts table:", err.message); }});

  // Add jobTitle to users table
  db.run(`ALTER TABLE users ADD COLUMN jobTitle TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore */ }
    else if (err) { console.error('Error adding "jobTitle" to "users":', err.message); }
  });

  // Add role_permissions join table
  db.run(`CREATE TABLE IF NOT EXISTS role_permissions (
    role TEXT NOT NULL, permission TEXT NOT NULL, PRIMARY KEY (role, permission)
  )`, (err) => { if (err) { console.error("Error creating role_permissions table:", err.message); }});

  // Add roles table
  db.run(`CREATE TABLE IF NOT EXISTS roles (
    name TEXT PRIMARY KEY
  )`, (err) => { if (err) { console.error("Error creating roles table:", err.message); }});


});

// Create bookings table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY, seriesId TEXT, name TEXT, type TEXT, startDateTime TEXT, endDateTime TEXT, status TEXT, expectedPallets INTEGER, customer_id TEXT, supplier_id TEXT, haulier_id TEXT, contract_id TEXT
)`);

// Create inventory table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY, name TEXT, sku TEXT, quantity INTEGER, location TEXT, createdAt TEXT, updatedAt TEXT, customer_id TEXT
)`);

// Create settings table if it doesn't exist (using a simple key-value structure)
db.run(`CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
)`);

// Create customers table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY, name TEXT UNIQUE, status TEXT, createdAt TEXT
)`);

// Create suppliers table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY, name TEXT UNIQUE, status TEXT, createdAt TEXT
)`);

// Create hauliers table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS hauliers (
  id TEXT PRIMARY KEY, name TEXT UNIQUE, status TEXT, createdAt TEXT
)`);

// Create users table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, username TEXT UNIQUE, firstName TEXT, lastName TEXT, role TEXT, passwordHash TEXT, createdAt TEXT, jobTitle TEXT
)`);

// --- Routes ---
// A simple test route to make sure the server is running
app.get('/api', (req, res) => {
  res.json({ message: "Hello from the Lattice Data Server!" });
});

// GET all bookings
app.get('/api/bookings', (req, res) => {
  const sql = `
    SELECT b.*, c.name as contractName 
    FROM bookings b
    LEFT JOIN contracts c ON b.contract_id = c.id
    ORDER BY b.startDateTime ASC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(200).json(rows);
  });
});

// POST a new booking (or multiple bookings for recurring events)
app.post('/api/bookings', (req, res) => {
  const newBookings = req.body; // Expecting an array of new bookings
  if (!Array.isArray(newBookings)) {
    return res.status(400).json({ message: 'Request body must be an array of bookings.' });
  }

  const stmt = db.prepare("INSERT INTO bookings (id, seriesId, name, type, startDateTime, endDateTime, status, expectedPallets, customer_id, supplier_id, haulier_id, contract_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  newBookings.forEach(booking => {
    stmt.run(booking.id, booking.seriesId, booking.name, booking.type, booking.startDateTime, booking.endDateTime, booking.status || 'Booked', booking.expectedPallets, booking.customer_id, booking.supplier_id, booking.haulier_id, booking.contract_id);
  });
  stmt.finalize((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    sendEventToAll({ type: 'bookings-changed' });
    res.status(201).json(newBookings);
  });
});

// PUT (update) a booking by ID
app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, startDateTime, endDateTime, expectedPallets, customer_id, supplier_id, haulier_id, status, contract_id } = req.body;

  const sql = `UPDATE bookings SET name = ?, type = ?, startDateTime = ?, endDateTime = ?, expectedPallets = ?, customer_id = ?, supplier_id = ?, haulier_id = ?, status = ?, contract_id = ? WHERE id = ?`;

  const params = [
    name,
    type,
    startDateTime,
    endDateTime,
    expectedPallets || 0,
    customer_id || null,
    supplier_id || null,
    haulier_id || null,
    status || 'Booked',
    contract_id || null,
    id
  ];
  db.run(sql, params, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    sendEventToAll({ type: 'bookings-changed' });
    res.status(this.changes > 0 ? 200 : 404).json({ message: "Booking updated", changes: this.changes });
  });
});

// DELETE a booking by ID
app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM bookings WHERE id = ?`, id, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    sendEventToAll({ type: 'bookings-changed' });
    res.status(this.changes > 0 ? 204 : 404).send(); // 204 No Content, or 404 Not Found
  });
});

// --- Settings Routes ---

// GET settings by key
app.get('/api/settings/:key', (req, res) => {
  const { key } = req.params;
  db.get("SELECT value FROM settings WHERE key = ?", [key], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    // If settings exist, parse and send them. Otherwise, we can let the front-end use defaults.
    if (row) {
      res.status(200).json(JSON.parse(row.value));
    } else {
      res.status(404).json({ message: "Settings not found for this key." });
    }
  });
});

// PUT (upsert) settings by key
app.put('/api/settings/:key', (req, res) => {
  const { key } = req.params;
  const value = JSON.stringify(req.body);
  const sql = `INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`;
  db.run(sql, [key, value], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "Settings updated" });
  });
});

// --- Inventory Routes ---

// GET all inventory
app.get('/api/inventory', (req, res) => {
  db.all("SELECT * FROM inventory ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST a new inventory item
app.post('/api/inventory', (req, res) => {
  const { id, name, sku, quantity, location, createdAt, updatedAt, customer_id } = req.body;
  const sql = `INSERT INTO inventory (id, name, sku, quantity, location, createdAt, updatedAt, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [id, name, sku, quantity, location, createdAt, updatedAt, customer_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, ...req.body });
  });
});

// POST for bulk inventory import
app.post('/api/inventory/bulk', (req, res) => {
  const items = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Request body must be a non-empty array of inventory items.' });
  }

  const sql = `INSERT INTO inventory (id, name, sku, quantity, location, createdAt, updatedAt, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare(sql);
    items.forEach(item => {
      stmt.run(item.id, item.name, item.sku, item.quantity, item.location, item.createdAt, item.updatedAt, item.customer_id);
    });
    stmt.finalize((err) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }
      db.run("COMMIT", () => res.status(201).json({ message: `${items.length} items imported successfully.` }));
    });
  });
});

// PUT (update) an inventory item by ID
app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { name, sku, quantity, location, updatedAt, customer_id } = req.body;
  const sql = `UPDATE inventory SET name = ?, sku = ?, quantity = ?, location = ?, updatedAt = ?, customer_id = ? WHERE id = ?`;
  db.run(sql, [name, sku, quantity, location, updatedAt, customer_id, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(this.changes > 0 ? 200 : 404).json({ message: "Inventory item updated" });
  });
});

// DELETE all inventory items
app.delete('/api/inventory/all', (req, res) => {
  db.run(`DELETE FROM inventory`, [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`All inventory data cleared. ${this.changes} rows affected.`);
    res.status(204).send(); // 204 No Content
  });
});

// DELETE an inventory item by ID
app.delete('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM inventory WHERE id = ?`, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(this.changes > 0 ? 204 : 404).send();
  });
});

// --- User Routes ---

// GET all users
app.get('/api/users', (req, res) => {
  // Select all fields except passwordHash for security
  db.all("SELECT id, username, firstName, lastName, role, createdAt, jobTitle FROM users ORDER BY lastName ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST a new user
app.post('/api/users', (req, res) => {
  const { id, username, firstName, lastName, role, password, createdAt, jobTitle } = req.body;

  // Basic validation
  if (!username || !firstName || !lastName || !role || !password || !jobTitle) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  // Securely hash the password
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  const storedPassword = `${salt}:${passwordHash}`; // Store salt with hash

  const sql = `INSERT INTO users (id, username, firstName, lastName, role, passwordHash, createdAt, jobTitle) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [id, username, firstName, lastName, role, storedPassword, createdAt, jobTitle], function(err) {
    if (err) {
      // Handle unique constraint violation for username
      if (err.message.includes('UNIQUE constraint failed: users.username')) {
        return res.status(409).json({ message: `Username '${username}' already exists.` });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, username, firstName, lastName, role, createdAt, jobTitle });
  });
});

// PUT (update) a user by ID
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { username, firstName, lastName, role, jobTitle } = req.body;

  // Basic validation
  if (!username || !firstName || !lastName || !role || !jobTitle) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const sql = `UPDATE users SET username = ?, firstName = ?, lastName = ?, role = ?, jobTitle = ? WHERE id = ?`;
  db.run(sql, [username, firstName, lastName, role, jobTitle, id], function(err) {
    if (err && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: `Username '${username}' already exists.` });
    }
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ message: "User updated successfully." });
  });
});

// PUT to change a user's password
app.put('/api/users/:id/password', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required." });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  const storedPassword = `${salt}:${passwordHash}`;

  db.run(`UPDATE users SET passwordHash = ? WHERE id = ?`, [storedPassword, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ message: "Password updated successfully." });
  });
});

// DELETE a user by ID
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM users WHERE id = ?`, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(this.changes > 0 ? 204 : 404).send();
  });
});

// --- Customer Routes ---

// GET all customers
app.get('/api/customers', (req, res) => {
  db.all("SELECT * FROM customers ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST a new customer
app.post('/api/customers', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Customer name is required." });
  }

  const newCustomer = {
    id: `cust_${Date.now()}`,
    name: name,
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  const sql = `INSERT INTO customers (id, name, status, createdAt) VALUES (?, ?, ?, ?)`;
  db.run(sql, [newCustomer.id, newCustomer.name, newCustomer.status, newCustomer.createdAt], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(newCustomer);
  });
});

// DELETE a customer by ID
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM customers WHERE id = ?`, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(this.changes > 0 ? 204 : 404).send();
  });
});

// PUT (update) a customer by ID
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, status, isSupplier, isHaulier } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Update the customer table
    db.run(`UPDATE customers SET name = ?, status = ? WHERE id = ?`, [name, status, id]);

    // Handle "is also a supplier" logic
    if (isSupplier) {
      db.run(`INSERT OR REPLACE INTO suppliers (id, name, status, createdAt) VALUES (?, ?, 'Active', COALESCE((SELECT createdAt FROM suppliers WHERE id = ?), ?))`, [`supp_from_${id}`, name, `supp_from_${id}`, new Date().toISOString()]);
    } else {
      db.run(`DELETE FROM suppliers WHERE id = ?`, [`supp_from_${id}`]);
    }

    // Handle "is also a haulier" logic
    if (isHaulier) {
      db.run(`INSERT OR REPLACE INTO hauliers (id, name, status, createdAt) VALUES (?, ?, 'Active', COALESCE((SELECT createdAt FROM hauliers WHERE id = ?), ?))`, [`haul_from_${id}`, name, `haul_from_${id}`, new Date().toISOString()]);
    } else {
      db.run(`DELETE FROM hauliers WHERE id = ?`, [`haul_from_${id}`]);
    }

    db.run("COMMIT", (err) => {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
      res.status(200).json({ message: "Customer updated successfully." });
    });
  });
});

// GET a customer's associated suppliers
app.get('/api/customers/:id/suppliers', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT s.id, s.name FROM suppliers s
    JOIN customer_suppliers cs ON s.id = cs.supplier_id
    WHERE cs.customer_id = ?
  `;
  db.all(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows.map(r => r.id)); // Return an array of supplier IDs
  });
});

// PUT (update) a customer's associated suppliers
app.put('/api/customers/:id/suppliers', (req, res) => {
  const { id } = req.params;
  const { supplierIds } = req.body; // Expecting an array of supplier IDs

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    // First, delete all existing associations for this customer
    db.run("DELETE FROM customer_suppliers WHERE customer_id = ?", [id]);
    // Then, insert the new associations
    const stmt = db.prepare("INSERT INTO customer_suppliers (customer_id, supplier_id) VALUES (?, ?)");
    supplierIds.forEach(supplierId => {
      stmt.run(id, supplierId);
    });
    stmt.finalize(err => {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
      db.run("COMMIT", () => res.status(200).json({ message: "Customer suppliers updated successfully." }));
    });
  });
});

// GET a customer's associated hauliers
app.get('/api/customers/:id/hauliers', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT h.id, h.name FROM hauliers h
    JOIN customer_hauliers ch ON h.id = ch.haulier_id
    WHERE ch.customer_id = ?
  `;
  db.all(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows.map(r => r.id)); // Return an array of haulier IDs
  });
});

// PUT (update) a customer's associated hauliers
app.put('/api/customers/:id/hauliers', (req, res) => {
  const { id } = req.params;
  const { haulierIds } = req.body; // Expecting an array of haulier IDs

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    // First, delete all existing associations for this customer
    db.run("DELETE FROM customer_hauliers WHERE customer_id = ?", [id]);
    // Then, insert the new associations
    const stmt = db.prepare("INSERT INTO customer_hauliers (customer_id, haulier_id) VALUES (?, ?)");
    haulierIds.forEach(haulierId => {
      stmt.run(id, haulierId);
    });
    stmt.finalize(err => {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
      db.run("COMMIT", () => res.status(200).json({ message: "Customer hauliers updated successfully." }));
    });
  });
});

// --- Contract Routes ---

// GET all contracts for a specific customer
app.get('/api/customers/:id/contracts', (req, res) => {
  const { id } = req.params;
  db.all("SELECT * FROM contracts WHERE customer_id = ? ORDER BY name ASC", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST a new contract
app.post('/api/contracts', (req, res) => {
  const { name, customer_id } = req.body;
  if (!name || !customer_id) {
    return res.status(400).json({ message: "Contract name and customer_id are required." });
  }
  const newContract = {
    id: `cont_${Date.now()}`,
    name,
    customer_id,
    createdAt: new Date().toISOString(),
  };
  const sql = `INSERT INTO contracts (id, name, customer_id, createdAt) VALUES (?, ?, ?, ?)`;
  db.run(sql, [newContract.id, newContract.name, newContract.customer_id, newContract.createdAt], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(newContract);
  });
});

// DELETE a contract by ID
app.delete('/api/contracts/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM contracts WHERE id = ?`, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(this.changes > 0 ? 204 : 404).send();
  });
});

// --- Supplier Routes ---
app.get('/api/suppliers', (req, res) => {
  db.all("SELECT * FROM suppliers ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

app.post('/api/suppliers', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Supplier name is required." });

  const newSupplier = {
    id: `supp_${Date.now()}`,
    name: name,
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  const sql = `INSERT INTO suppliers (id, name, status, createdAt) VALUES (?, ?, ?, ?)`;
  db.run(sql, [newSupplier.id, newSupplier.name, newSupplier.status, newSupplier.createdAt], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(newSupplier);
  });
});

// DELETE all suppliers
app.delete('/api/suppliers/all', (req, res) => {
  db.run(`DELETE FROM suppliers`, [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`All supplier data cleared. ${this.changes} rows affected.`);
    res.status(204).send();
  });
});

// --- Haulier Routes ---
app.get('/api/hauliers', (req, res) => {
  db.all("SELECT * FROM hauliers ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

app.post('/api/hauliers', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Haulier name is required." });

  const newHaulier = {
    id: `haul_${Date.now()}`,
    name: name,
    status: 'Active',
    createdAt: new Date().toISOString(),
  };

  const sql = `INSERT INTO hauliers (id, name, status, createdAt) VALUES (?, ?, ?, ?)`;
  db.run(sql, [newHaulier.id, newHaulier.name, newHaulier.status, newHaulier.createdAt], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(newHaulier);
  });
});

// DELETE all hauliers
app.delete('/api/hauliers/all', (req, res) => {
  db.run(`DELETE FROM hauliers`, [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`All haulier data cleared. ${this.changes} rows affected.`);
    res.status(204).send();
  });
});

// --- Role Permissions Routes ---

// GET all defined roles
app.get('/api/roles', (req, res) => {
  db.all("SELECT name FROM roles ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows.map(r => r.name));
  });
});

// POST a new role
app.post('/api/roles', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Role name is required." });
  }
  db.run(`INSERT INTO roles (name) VALUES (?)`, [name], function(err) {
    if (err && err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: `Role '${name}' already exists.` });
    }
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ name });
  });
});

// GET all role permissions
app.get('/api/permissions', (req, res) => {
  db.all("SELECT * FROM role_permissions", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // Group permissions by role
    const rolePermissions = rows.reduce((acc, row) => {
      if (!acc[row.role]) {
        acc[row.role] = [];
      }
      acc[row.role].push(row.permission);
      return acc;
    }, {});

    res.status(200).json(rolePermissions);
  });
});

// PUT (update) all role permissions
app.put('/api/permissions', (req, res) => {
  const rolePermissions = req.body; // Expecting an object like { "Manager": ["perm1", "perm2"], ... }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run("DELETE FROM role_permissions"); // Clear the table first
    const stmt = db.prepare("INSERT INTO role_permissions (role, permission) VALUES (?, ?)");
    for (const role in rolePermissions) {
      rolePermissions[role].forEach(permission => {
        stmt.run(role, permission);
      });
    }
    stmt.finalize(err => {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
      db.run("COMMIT", () => res.status(200).json({ message: "Permissions updated successfully." }));
    });
  });
});

// DELETE all role permissions
app.delete('/api/permissions/all', (req, res) => {
  db.run(`DELETE FROM role_permissions`, [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`All role permissions cleared. ${this.changes} rows affected.`);
    res.status(204).send();
  });
});

// --- Auth Routes ---

// POST to login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  const sql = `SELECT * FROM users WHERE username = ?`;
  db.get(sql, [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    // Verify password
    const [salt, storedHash] = user.passwordHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    if (hash !== storedHash) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Passwords match, create JWT
    const userPayload = { id: user.id, username: user.username, role: user.role, firstName: user.firstName, lastName: user.lastName, jobTitle: user.jobTitle };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '8h' });

    res.status(200).json({ token, user: userPayload });
  });
});

// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Lattice data server is running and listening on port ${PORT}`);
});
