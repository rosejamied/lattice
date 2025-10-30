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

// --- Database Schema Migrations ---
// This is a simple way to handle schema changes without dropping the table.
db.serialize(() => {
  // --- CREATE TABLES ---
  // Create tables without foreign keys first, or where they are not strictly dependent.
  db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, firstName TEXT, lastName TEXT, role TEXT, jobTitle TEXT, passwordHash TEXT, createdAt TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT UNIQUE, status TEXT, createdAt TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT UNIQUE, status TEXT, createdAt TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS hauliers (id TEXT PRIMARY KEY, name TEXT UNIQUE, status TEXT, createdAt TEXT)`);

  // Create tables with foreign key dependencies.
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY, seriesId TEXT, name TEXT, type TEXT, startDateTime TEXT, endDateTime TEXT, status TEXT, expectedPallets INTEGER, customer_id TEXT, supplier_id TEXT, haulier_id TEXT, contract_id TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY, name TEXT, sku TEXT, quantity INTEGER, location TEXT, createdAt TEXT, updatedAt TEXT, customer_id TEXT, FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, customer_id TEXT NOT NULL, status TEXT, createdAt TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`, (err) => { if (err) { console.error("Error creating contracts table:", err.message); }});

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, orderNumber TEXT UNIQUE NOT NULL, customer_id TEXT NOT NULL, status TEXT NOT NULL, createdAt TEXT, updatedAt TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`, (err) => { if (err) { console.error("Error creating orders table:", err.message); }});

  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL, inventory_id TEXT NOT NULL, quantity INTEGER NOT NULL, price_at_time REAL, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE SET NULL
  )`, (err) => { if (err) { console.error("Error creating order_items table:", err.message); }});

  // --- ALTER TABLES (Add columns if they don't exist) ---
  // This section is for adding new columns to existing tables in a non-destructive way.

  // Add columns to the 'bookings' table
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
  )`, (err) => { if (err) { console.error("Error creating customer_hauliers table:", err.message); }});

  // Add contract_id to bookings table
  db.run(`ALTER TABLE bookings ADD COLUMN contract_id TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore */ }
    else if (err) { console.error('Error adding "contract_id" to "bookings":', err.message); }
  });
});

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
  db.all("SELECT id, username, firstName, lastName, role, jobTitle, createdAt FROM users ORDER BY lastName ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST a new user
app.post('/api/users', (req, res) => {
  const { username, firstName, lastName, role, jobTitle, password } = req.body;

  // Basic validation
  if (!username || !firstName || !lastName || !role || !jobTitle || !password) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const newUserId = `user_${Date.now()}`; // Generate a unique ID on the server
  // Securely hash the password
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  const storedPassword = `${salt}:${passwordHash}`; // Store salt with hash

  const sql = `INSERT INTO users (id, username, firstName, lastName, role, jobTitle, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [newUserId, username, firstName, lastName, role, jobTitle, storedPassword, new Date().toISOString()], function(err) {
    if (err) {
      // Handle unique constraint violation for username
      if (err.message.includes('UNIQUE constraint failed: users.username')) {
        return res.status(409).json({ message: `Username '${username}' already exists.` });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: newUserId, username, firstName, lastName, role, jobTitle, createdAt: new Date().toISOString() });
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
    status: 'Active', // Default status to Active
    customer_id,
    createdAt: new Date().toISOString(),
  };
  const sql = `INSERT INTO contracts (id, name, status, customer_id, createdAt) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [newContract.id, newContract.name, newContract.status, newContract.customer_id, newContract.createdAt], function(err) {
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

// --- Roles Routes ---

// GET all available roles
app.get('/api/roles', (req, res) => {
  // For now, we'll return a hardcoded list of roles.
  // This can be moved to a database table later if needed.
  const roles = ['Admin', 'Manager', 'User', 'Viewer'];
  res.status(200).json(roles);
});

// --- Order Routes ---

// GET all orders
app.get('/api/orders', (req, res) => {
  const sql = `
    SELECT o.*, c.name as customerName 
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY o.createdAt DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

// POST a new order
app.post('/api/orders', (req, res) => {
  const { orderNumber, customer_id, status } = req.body;
  if (!orderNumber || !customer_id || !status) {
    return res.status(400).json({ message: "orderNumber, customer_id, and status are required." });
  }
  const newOrder = {
    id: `ord_${Date.now()}`,
    orderNumber,
    customer_id,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const sql = `INSERT INTO orders (id, orderNumber, customer_id, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(sql, [newOrder.id, newOrder.orderNumber, newOrder.customer_id, newOrder.status, newOrder.createdAt, newOrder.updatedAt], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // Fetch the newly created order with customer name to return to client
    db.get(`SELECT o.*, c.name as customerName FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?`, [newOrder.id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json(row);
    });
  });
});

// PUT (update) an order
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { orderNumber, customer_id, status } = req.body;
  const updatedAt = new Date().toISOString();
  const sql = `UPDATE orders SET orderNumber = ?, customer_id = ?, status = ?, updatedAt = ? WHERE id = ?`;
  db.run(sql, [orderNumber, customer_id, status, updatedAt, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(this.changes > 0 ? 200 : 404).json({ message: "Order updated" });
  });
});

// DELETE an order
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  // The ON DELETE CASCADE on the order_items table will handle deleting line items automatically.
  db.run(`DELETE FROM orders WHERE id = ?`, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(this.changes > 0 ? 204 : 404).send();
  });
});

// DELETE all orders
app.delete('/api/orders/all', (req, res) => {
  // The ON DELETE CASCADE on the order_items table will handle deleting line items automatically.
  db.run(`DELETE FROM orders`, [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`All order data cleared. ${this.changes} rows affected.`);
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
