const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 2707; // We'll use port 2707 for the server

// --- Middleware ---
// Enable Cross-Origin Resource Sharing for all routes
app.use(cors());
// Enable the express.json middleware to parse JSON request bodies, with a larger limit for file uploads
app.use(express.json({ limit: '50mb' }));

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

  // Drop the old inventory table to replace it with the new, more detailed schema. 
  // This command has been run and is now disabled to prevent data loss on every server restart.
  // db.run(`DROP TABLE IF EXISTS inventory`);

  // Create the new inventory table with all required fields and uniqueness constraint.
  db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    stockNumber TEXT NOT NULL,
    inboundOrderNumber TEXT,
    description TEXT,
    quantity INTEGER NOT NULL,
    location TEXT,
    status TEXT,
    inboundDate TEXT,
    inboundReference TEXT NOT NULL,
    storageCostPerWeek REAL,
    rhdIn REAL,
    rhdOut REAL,
    customer_id TEXT,
    updatedAt TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    UNIQUE(stockNumber, inboundReference)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, customer_id TEXT NOT NULL, status TEXT, createdAt TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
  )`, (err) => { if (err) { console.error("Error creating contracts table:", err.message); }});

  // Schema migration for the 'orders' table to change the UNIQUE constraint.
  db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'", (err, row) => {
    if (err) { console.error("Could not check orders table schema:", err); return; }
    
    if (row) {
      // Check if the table schema has the old, single-column UNIQUE constraint.
      const needsMigration = row.sql.includes('UNIQUE ("orderNumber")') || (row.sql.includes('orderNumber TEXT UNIQUE NOT NULL'));
      if (needsMigration) {
        console.log("Orders table needs migration. Changing UNIQUE constraint...");
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");
          db.run("CREATE TABLE orders_new (id TEXT PRIMARY KEY, orderNumber TEXT NOT NULL, customer_id TEXT NOT NULL, status TEXT NOT NULL, createdAt TEXT, updatedAt TEXT, FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE, UNIQUE(orderNumber, createdAt))");
          db.run("INSERT INTO orders_new (id, orderNumber, customer_id, status, createdAt, updatedAt) SELECT id, orderNumber, customer_id, status, createdAt, updatedAt FROM orders");
          db.run("DROP TABLE orders");
          db.run("ALTER TABLE orders_new RENAME TO orders");
          db.run("COMMIT", () => console.log("Orders table migration complete."));
        });
      }
    } else {
      // Table doesn't exist, create it with the correct composite UNIQUE constraint.
      db.run(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, orderNumber TEXT NOT NULL, customer_id TEXT NOT NULL, status TEXT NOT NULL, createdAt TEXT, updatedAt TEXT, FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE, UNIQUE(orderNumber, createdAt))`);
    }
  });

  // Create locations table for warehouse visualizer
  db.run(`CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'pallet',
    createdAt TEXT
  )`, (err) => { if (err) { console.error("Error creating locations table:", err.message); }});

  // Add capacity and enabled columns to locations table
  db.run(`ALTER TABLE locations ADD COLUMN capacity INTEGER DEFAULT 1`, (err) => {
    if (err && !err.message.includes('duplicate column name')) { console.error('Error adding "capacity" to "locations":', err.message); }
  });
  db.run(`ALTER TABLE locations ADD COLUMN enabled INTEGER DEFAULT 1`, (err) => {
    if (err && !err.message.includes('duplicate column name')) { console.error('Error adding "enabled" to "locations":', err.message); }
  });


  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL, inventory_id TEXT NOT NULL, quantity INTEGER NOT NULL, price_at_time REAL, FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE, FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE SET NULL
  )`, (err) => { if (err) { console.error("Error creating order_items table:", err.message); }});

  // --- ALTER TABLES (Add columns if they don't exist) ---
  // This section is for adding new columns to existing tables in a non-destructive way.

  // Add 'customer_id' to 'inventory' table if it doesn't exist
  db.run(`ALTER TABLE inventory ADD COLUMN customer_id TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore error if column already exists */ } 
    else if (err) { console.error('Error adding "customer_id" to "inventory":', err.message); }
    else { console.log('Column "customer_id" added to "inventory" table.'); }
  });

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

  // Add role_permissions table
  db.run(`CREATE TABLE IF NOT EXISTS role_permissions (
    role TEXT NOT NULL, permission TEXT NOT NULL, PRIMARY KEY (role, permission)
  )`, (err) => { if (err) { console.error("Error creating role_permissions table:", err.message); }});

  // Add contract_id to bookings table
  db.run(`ALTER TABLE bookings ADD COLUMN contract_id TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore */ }
    else if (err) { console.error('Error adding "contract_id" to "bookings":', err.message); }
  });

  // Add columns to the 'inventory' table for outbound details from import
  db.run(`ALTER TABLE inventory ADD COLUMN originalBookingReference TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore */ }
    else if (err) { console.error('Error adding "originalBookingReference" to "inventory":', err.message); }
    else { console.log('Column "originalBookingReference" added to "inventory" table.'); }
  });
  db.run(`ALTER TABLE inventory ADD COLUMN originalOrderDate TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore */ }
    else if (err) { console.error('Error adding "originalOrderDate" to "inventory":', err.message); }
    else { console.log('Column "originalOrderDate" added to "inventory" table.'); }
  });
  db.run(`ALTER TABLE inventory ADD COLUMN originalTimeBooked TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore */ }
    else if (err) { console.error('Error adding "originalTimeBooked" to "inventory":', err.message); }
    else { console.log('Column "originalTimeBooked" added to "inventory" table.'); }
  });

  // Add 'updatedAt' to 'inventory' table if it doesn't exist
  db.run(`ALTER TABLE inventory ADD COLUMN updatedAt TEXT`, (err) => {
    if (err && err.message.includes('duplicate column name')) { /* Ignore */ }
    else if (err) { console.error('Error adding "updatedAt" to "inventory":', err.message); }
    else { console.log('Column "updatedAt" added to "inventory" table.'); }
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

// DELETE all bookings
app.delete('/api/bookings/all', (req, res) => {
  db.run(`DELETE FROM bookings`, [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`All booking data cleared. ${this.changes} rows affected.`);
    res.status(204).send();
  });
});

// DELETE all bookings
app.delete('/api/bookings/all', (req, res) => {
  db.run(`DELETE FROM bookings`, [], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    console.log(`All booking data cleared. ${this.changes} rows affected.`);
    res.status(204).send();
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
  db.all("SELECT * FROM inventory ORDER BY description ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST a new inventory item
app.post('/api/inventory', (req, res) => {
  const item = req.body;
  const sql = `INSERT INTO inventory (id, stockNumber, inboundOrderNumber, description, quantity, location, status, inboundDate, inboundReference, storageCostPerWeek, rhdIn, rhdOut, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    item.id || `inv_${Date.now()}`,
    item.stockNumber,
    item.inboundOrderNumber,
    item.description,
    item.quantity,
    item.location,
    item.status || 'In Stock',
    item.inboundDate,
    item.inboundReference,
    item.storageCostPerWeek,
    item.rhdIn,
    item.rhdOut,
    item.customer_id
  ];
  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, ...item });
  });
});

// New, intelligent endpoint for processing a full import.
app.post('/api/inventory/process-import', (req, res) => {
    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Request body must be a non-empty array of inventory items.' });
    }

    // Step 1: Get all existing customers to build a cache for performance.
    db.all("SELECT id, name FROM customers", [], (err, existingCustomers) => {
        if (err) return res.status(500).json({ error: `Failed to fetch existing customers: ${err.message}` });

        const customerCache = new Map(existingCustomers.map(c => [c.name.toLowerCase(), c.id]));

        // Step 2: Group items by a unique order key (Ref + Date + Time)
        const ordersToCreate = new Map();
        items.forEach(item => {
            if (item.originalBookingReference || item.originalOrderDate) { // Only group items that have outbound details
                // Normalize the date to a consistent ISO string format to ensure accurate grouping.
                const isoDate = item.originalOrderDate ? new Date(item.originalOrderDate).toISOString() : '';
                // Create a unique key for each order
                const orderKey = `${item.originalBookingReference || ''}-${isoDate}-${item.originalTimeBooked || ''}`;
                if (!ordersToCreate.has(orderKey)) {
                    // **THE FIX**: Manually construct the full ISO string to avoid timezone issues.
                    let finalTimestamp;
                    const datePart = isoDate ? isoDate.split('T')[0] : new Date().toISOString().split('T')[0];
                    if (item.originalTimeBooked) {
                        finalTimestamp = `${datePart}T${item.originalTimeBooked}:00.000Z`;
                    } else {
                        finalTimestamp = isoDate || new Date().toISOString();
                    }

                    ordersToCreate.set(orderKey, {
                        orderNumber: item.originalBookingReference || `ORD-${item.id}`,
                        customerName: item.customerName,
                        status: item.status === 'Dispatched' ? 'Completed' : (item.status === 'Allocated' ? 'Processing' : 'Pending'),
                        createdAt: finalTimestamp,
                        items: []
                    });
                }
                ordersToCreate.get(orderKey).items.push(item);
            }
        });

        // Step 3: Start a single database transaction for the entire import.
        db.serialize(() => {
            db.run("BEGIN TRANSACTION", (err) => {
                if (err) return res.status(500).json({ error: `Failed to begin transaction: ${err.message}` });
            });

            // Prepare all necessary SQL statements once.
            const customerInsertStmt = db.prepare(`INSERT INTO customers (id, name, status, createdAt) VALUES (?, ?, ?, ?)`);
            const orderInsertStmt = db.prepare(`INSERT INTO orders (id, orderNumber, customer_id, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`);
            const inventoryInsertStmt = db.prepare(`INSERT OR IGNORE INTO inventory (id, stockNumber, inboundOrderNumber, description, quantity, location, status, inboundDate, inboundReference, storageCostPerWeek, rhdIn, rhdOut, customer_id, originalBookingReference, originalOrderDate, originalTimeBooked, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            const orderItemInsertStmt = db.prepare(`INSERT INTO order_items (order_id, inventory_id, quantity) VALUES (?, ?, ?)`);
            const bookingInsertStmt = db.prepare("INSERT INTO bookings (id, seriesId, name, type, startDateTime, endDateTime, status, expectedPallets, customer_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");

            // A function to get or create a customer ID
            const getCustomerId = (customerName) => {
                if (typeof customerName === 'string' && customerName.trim() !== '') {
                    const lowerName = customerName.toLowerCase();
                    if (customerCache.has(lowerName)) return customerCache.get(lowerName);

                    const newId = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                    customerInsertStmt.run(newId, customerName, 'Active', new Date().toISOString());
                    customerCache.set(lowerName, newId);
                    return newId;
                }
                return null; // Return null if customerName is not a valid string
            };

            // Process all items that are part of an order
            let orderIndex = 0; // Used to ensure unique timestamps
            for (const [orderKey, orderData] of ordersToCreate.entries()) {
                const customerId = getCustomerId(orderData.customerName);
                if (!customerId) {
                    console.warn(`Skipping order creation for key ${orderKey} due to missing customer name.`);
                    continue; // Skip if we can't associate with a customer
                }

                // Ensure createdAt is unique for each order to prevent constraint violations
                const uniqueCreatedAt = new Date(new Date(orderData.createdAt).getTime() + orderIndex++).toISOString();
                const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                const now = new Date().toISOString();
                orderInsertStmt.run(orderId, orderData.orderNumber, customerId, orderData.status, uniqueCreatedAt, now);

                // --- Automatically create a corresponding schedule booking ---
                const bookingId = `book_from_${orderId}`;
                const bookingStart = new Date(uniqueCreatedAt);
                // Default to a 1-hour booking slot
                const bookingEnd = new Date(bookingStart.getTime() + 60 * 60 * 1000); 
                
                // Map the order status to a corresponding booking status
                let bookingStatus = 'Booked'; // Default
                if (orderData.status === 'Completed') {
                  bookingStatus = 'Completed';
                } else if (orderData.status === 'Processing') {
                  bookingStatus = 'Allocated';
                }

                bookingInsertStmt.run(
                    bookingId, `series_from_${orderId}`, orderData.orderNumber, 'Outbound', 
                    bookingStart.toISOString(), bookingEnd.toISOString(), bookingStatus, 
                    orderData.items.length, // The number of pallets in this order
                    customerId
                );

                // Process each inventory item within this order
                orderData.items.forEach(item => {
                    inventoryInsertStmt.run(
                        item.id, item.stockNumber, item.inboundOrderNumber, item.description,
                        item.quantity, item.location, item.status, item.inboundDate,
                        item.inboundReference, item.storageCostPerWeek, item.rhdIn, item.rhdOut, customerId,
                        item.originalBookingReference, item.originalOrderDate, item.originalTimeBooked, now
                    );
                    orderItemInsertStmt.run(orderId, item.id, item.quantity);
                });
            }

            // Process all items that are NOT part of an order (stock intake only)
            const stockOnlyItems = items.filter(item => !(item.originalBookingReference || item.originalOrderDate));
            stockOnlyItems.forEach(item => {
                const customerId = getCustomerId(item.customerName);
                const now = new Date().toISOString();
                inventoryInsertStmt.run(
                    item.id, item.stockNumber, item.inboundOrderNumber, item.description,
                    item.quantity, item.location, item.status, item.inboundDate,
                    item.inboundReference, item.storageCostPerWeek, item.rhdIn, item.rhdOut, customerId,
                    item.originalBookingReference, item.originalOrderDate, item.originalTimeBooked, now
                );
            });

            // Finalize all statements
            customerInsertStmt.finalize();
            orderInsertStmt.finalize();
            inventoryInsertStmt.finalize();
            orderItemInsertStmt.finalize();
            bookingInsertStmt.finalize();

            db.run("COMMIT", (commitErr) => {
                if (commitErr) {
                    console.error("Full import transaction failed, rolling back:", commitErr);
                    db.run("ROLLBACK"); // Rollback on commit failure
                    return res.status(500).json({ error: `Transaction failed: ${commitErr.message}` });
                }
                console.log(`Successfully imported ${items.length} items.`);
                res.status(201).json({ message: `Successfully imported ${items.length} items.` });
            });
        });
    });
});

// PUT (update) an inventory item by ID
app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const {
    stockNumber, inboundOrderNumber, description, quantity, location, status,
    inboundDate, inboundReference, storageCostPerWeek, rhdIn, rhdOut
  } = req.body;
  const updatedAt = new Date().toISOString();

  const sql = `UPDATE inventory SET 
    stockNumber = ?, inboundOrderNumber = ?, description = ?, quantity = ?, 
    location = ?, status = ?, inboundDate = ?, inboundReference = ?, 
    storageCostPerWeek = ?, rhdIn = ?, rhdOut = ?, updatedAt = ? 
    WHERE id = ?`;
  
  const params = [
    stockNumber, inboundOrderNumber, description, quantity, location, status, inboundDate, inboundReference, storageCostPerWeek, rhdIn, rhdOut, updatedAt, id
  ];

  db.run(sql, params, function(err) {
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

// PUT (update) a user by ID
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, role, jobTitle } = req.body;

  // Basic validation
  if (!firstName || !lastName || !role || !jobTitle) {
    return res.status(400).json({ message: "Missing required fields for update." });
  }

  const sql = `UPDATE users SET firstName = ?, lastName = ?, role = ?, jobTitle = ? WHERE id = ?`;
  db.run(sql, [firstName, lastName, role, jobTitle, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(this.changes > 0 ? 200 : 404).json({ message: "User updated successfully." });
  });
});

// DELETE a user by ID
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM users WHERE id = ?`;
  db.run(sql, id, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(this.changes > 0 ? 204 : 404).send(); // 204 No Content, or 404 Not Found
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
    SELECT 
      o.*, 
      c.name as customerName,
      COUNT(oi.id) as palletCount
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id
    ORDER BY o.createdAt DESC, c.name ASC, o.orderNumber ASC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

// POST a new order, or return existing if orderNumber is a duplicate
app.post('/api/orders', (req, res) => {
  const { orderNumber, customer_id, status, createdAt } = req.body;
  if (!orderNumber || !customer_id || !status) {
    return res.status(400).json({ message: "orderNumber, customer_id, and status are required." });
  }

  // The logic to find an existing order is now handled by the import process.
  // This endpoint will now primarily focus on creating a new order.
  // The UNIQUE(orderNumber, createdAt) constraint will prevent duplicates.

  // A check can still be useful for non-import related order creation to provide a better error.
  db.get(`SELECT id FROM orders WHERE orderNumber = ? AND createdAt = ?`, [orderNumber, createdAt || new Date().toISOString()], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(409).json({ message: 'An order with this exact reference and date already exists.' });

    // If no existing order, create a new one
    const newOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      orderNumber,
      customer_id,
      status,
      createdAt: createdAt || new Date().toISOString(),
      updatedAt: createdAt || new Date().toISOString(),
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
});

// POST a new order item
app.post('/api/order_items', (req, res) => {
  const { order_id, inventory_id, quantity, price_at_time } = req.body;
  if (!order_id || !inventory_id || quantity === undefined) {
    return res.status(400).json({ message: "order_id, inventory_id, and quantity are required." });
  }
  const sql = `INSERT INTO order_items (order_id, inventory_id, quantity, price_at_time) VALUES (?, ?, ?, ?)`;
  db.run(sql, [order_id, inventory_id, quantity, price_at_time || 0], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, order_id, inventory_id, quantity, price_at_time });
  });
});

// GET all items for a specific order
app.get('/api/orders/:id/items', (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT i.id, i.stockNumber, i.description, i.location, oi.quantity
    FROM inventory i
    JOIN order_items oi ON i.id = oi.inventory_id
    WHERE oi.order_id = ?
  `;
  db.all(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// PUT (update) an order
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { orderNumber, customer_id, status } = req.body;
  const updatedAt = new Date().toISOString();

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const updateOrderSql = `UPDATE orders SET orderNumber = ?, customer_id = ?, status = ?, updatedAt = ? WHERE id = ?`;
    db.run(updateOrderSql, [orderNumber, customer_id, status, updatedAt, id], function(err) {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        db.run("ROLLBACK");
        return res.status(404).json({ message: "Order not found." });
      }

      // If the order is marked as Completed, update the status of all associated inventory items.
      if (status === 'Completed') {
        const updateInventorySql = `UPDATE inventory SET status = 'Dispatched' WHERE id IN (SELECT inventory_id FROM order_items WHERE order_id = ?)`;
        db.run(updateInventorySql, [id]);
      }

      // Also, update the status of the corresponding booking, if it exists.
      const bookingId = `book_from_${id}`;
      let bookingStatus = 'Booked'; // Default
      if (status === 'Completed') {
        bookingStatus = 'Completed';
      } else if (status === 'Processing') {
        bookingStatus = 'Allocated';
      }
      const updateBookingSql = `UPDATE bookings SET status = ? WHERE id = ?`;
      db.run(updateBookingSql, [bookingStatus, bookingId]);

      db.run("COMMIT", (commitErr) => {
        if (commitErr) { db.run("ROLLBACK"); return res.status(500).json({ error: `Failed to commit order update: ${commitErr.message}` }); }
        res.status(200).json({ message: "Order updated successfully." });
      });
    });
  })
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
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // Step 1: Reset the status of all pallets that are not currently 'In Stock'.
    // This puts them back into available inventory.
    const updateInventorySql = `UPDATE inventory SET status = 'In Stock' WHERE status IS NOT 'In Stock'`;
    db.run(updateInventorySql);

    // Step 2: Delete all orders. The 'ON DELETE CASCADE' will handle deleting order_items.
    db.run(`DELETE FROM orders`);

    db.run("COMMIT", (err) => {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
      console.log('All orders cleared and inventory status reset.');
      res.status(204).send();
    });
  });
});

// --- Master Data Clear Route ---

// DELETE all data except for users and their permissions
app.delete('/api/data/all-except-users', (req, res) => {
  console.log("!!! Received request to clear all application data except users.");
  const tablesToClear = [
    'settings',
    'customers',
    'suppliers',
    'hauliers',
    'bookings',
    'inventory',
    'contracts',
    'orders',
    'order_items',
    'customer_suppliers',
    'customer_hauliers',
    'locations',
  ];

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    tablesToClear.forEach(table => {
      db.run(`DELETE FROM ${table}`);
    });
    db.run("COMMIT", (err) => {
      if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: `Failed to commit data clearing: ${err.message}` }); }
      console.log("All application data cleared successfully. Users and permissions remain.");
      res.status(204).send();
    });
  });
});

// --- Location Routes ---

// GET all locations
app.get('/api/locations', (req, res) => {
  db.all("SELECT * FROM locations ORDER BY name ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json(rows);
  });
});

// POST for bulk location creation
app.post('/api/locations/bulk', (req, res) => {
    const { locations } = req.body;
    if (!Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({ message: 'Request body must be an array of location names.' });
    }

    const stmt = db.prepare("INSERT OR IGNORE INTO locations (id, name, createdAt) VALUES (?, ?, ?)");
    const now = new Date().toISOString();

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        locations.forEach(name => {
            if (name && name.trim() !== '') {
                const id = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                stmt.run(id, name.trim().toUpperCase(), now);
            }
        });
        stmt.finalize();
        db.run("COMMIT", () => res.status(201).json({ message: 'Locations created successfully.' }));
    });
});

// PUT (update) a location by ID
app.put('/api/locations/:id', (req, res) => {
  const { id } = req.params;
  const { capacity, enabled } = req.body;

  const sql = `UPDATE locations SET capacity = ?, enabled = ? WHERE id = ?`;
  const params = [capacity, enabled, id];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(this.changes > 0 ? 200 : 404).json({ message: "Location updated" });
  });
});

// POST for bulk location updates
app.post('/api/locations/bulk-update', (req, res) => {
  const { locationIds, capacity } = req.body;

  if (!Array.isArray(locationIds) || locationIds.length === 0 || capacity === undefined) {
    return res.status(400).json({ message: 'Request must include an array of locationIds and a capacity.' });
  }

  // Using a placeholder for each ID to prevent SQL injection
  const placeholders = locationIds.map(() => '?').join(',');
  const sql = `UPDATE locations SET capacity = ? WHERE id IN (${placeholders})`;
  const params = [capacity, ...locationIds];

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: `${this.changes} locations updated successfully.` });
  });
});

// --- Location Format Settings ---
app.get('/api/settings/location-format', (req, res) => {
  db.get("SELECT value FROM settings WHERE key = ?", ['locationFormat'], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) res.status(200).json(JSON.parse(row.value));
    else res.status(404).json({ message: "Location format not set." });
  });
});
app.put('/api/settings/location-format', (req, res) => {
  const value = JSON.stringify(req.body);
  db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, ['locationFormat', value], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(200).json({ message: "Location format updated." });
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
  
  // Find and display the most relevant local network IP address
  const interfaces = os.networkInterfaces();
  const relevantAddresses = [];

  Object.keys(interfaces).forEach(ifname => {
    // Ignore common virtual network interfaces
    if (ifname.includes('Virtual') || ifname.includes('VMware') || ifname.includes('vEthernet')) {
      return;
    }
    interfaces[ifname].forEach(iface => {
      // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if ('IPv4' === iface.family && !iface.internal) {
        relevantAddresses.push(`- ${ifname}: http://${iface.address}:${PORT}`);
      }
    });
  });

  if (relevantAddresses.length > 0) {
    console.log("\nAccess the server on your local network at:");
    relevantAddresses.forEach(addr => console.log(addr));
    console.log("\n");
  }
});

     