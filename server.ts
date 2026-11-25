import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {createServer as createViteServer} from 'vite';
import {db, initializeDatabase, uploadsDir} from './src/server/db.ts';
import {seedDatabaseIfEmpty} from './src/server/seed.ts';

dotenv.config();

initializeDatabase();
seedDatabaseIfEmpty();

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface TokenPayload {
  sub: string;
  role: 'user' | 'admin';
  exp: number;
}

function signToken(sub: string, role: 'user' | 'admin'): string {
  const payload: TokenPayload = {
    sub,
    role,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string | undefined): TokenPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function hashSecret(secret: string, salt?: string): {hash: string; salt: string} {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(secret, actualSalt, 64).toString('hex');
  return {hash: derived, salt: actualSalt};
}

function verifySecret(secret: string, storedHash: string, salt: string): boolean {
  const derived = crypto.scryptSync(secret, salt, 64);
  const storedBuf = Buffer.from(storedHash, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

function safeEqualStrings(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}

function isSafeMediaUrl(url: string): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 1024) return false;
  if (trimmed.startsWith('/src/assets/') || trimmed.startsWith('/api/uploads/')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function formatProductRow(row: Record<string, unknown>) {
  const original = Number(row.original_price) || 0;
  const discount = Number(row.discount_price) || original;
  const discountPercent =
    original > 0 && discount < original ? Math.round(((original - discount) / original) * 100) : 0;
  let images: string[] = [];
  let specifications: {label: string; value: string}[] = [];
  try {
    images = JSON.parse(String(row.images || '[]'));
  } catch {
    images = [];
  }
  try {
    specifications = JSON.parse(String(row.specifications || '[]'));
  } catch {
    specifications = [];
  }
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    brand_id: String(row.brand_id),
    brand_name: String(row.brand_name),
    category_id: String(row.category_id),
    category_name: String(row.category_name),
    original_price: original,
    discount_price: discount,
    discount_percent: discountPercent,
    stock: Number(row.stock) || 0,
    sku: String(row.sku),
    short_description: String(row.short_description),
    description: String(row.description),
    warranty: String(row.warranty),
    images,
    specifications,
    is_trending: Boolean(row.is_trending),
    is_bestseller: Boolean(row.is_bestseller),
    is_new_arrival: Boolean(row.is_new_arrival),
    is_featured_deal: Boolean(row.is_featured_deal),
    rating_avg: Number(row.rating_avg) || 4.8,
    rating_count: Number(row.rating_count) || 0,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function extractBearer(req: express.Request): string | undefined {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return undefined;
  return header.slice(7).trim();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const payload = verifyToken(extractBearer(req));
  if (!payload || payload.role !== 'admin') {
    res.status(401).json({error: 'Admin authentication required.'});
    return;
  }
  next();
}

function requireUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const payload = verifyToken(extractBearer(req));
  if (!payload || payload.role !== 'user') {
    res.status(401).json({error: 'Customer authentication required.'});
    return;
  }
  (req as express.Request & {userId: string}).userId = payload.sub;
  next();
}

async function startServer() {
  const app = express();
  app.use(express.json({limit: '6mb'}));

  // Serve safely uploaded product images with path traversal protection
  app.get('/api/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    if (!/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/.test(filename)) {
      res.status(400).json({error: 'Invalid filename.'});
      return;
    }
    const resolved = path.resolve(uploadsDir, filename);
    if (!resolved.startsWith(uploadsDir + path.sep) || !fs.existsSync(resolved)) {
      res.status(404).json({error: 'Image not found.'});
      return;
    }
    res.sendFile(resolved);
  });

  // Public Storefront Bootstrap
  app.get('/api/storefront', (_req, res) => {
    const categories = (
      db
        .prepare(
          `SELECT c.*, COUNT(p.id) as product_count
           FROM categories c
           LEFT JOIN products p ON p.category_id = c.id
           GROUP BY c.id
           ORDER BY c.sort_order ASC, c.name ASC`,
        )
        .all() as Record<string, unknown>[]
    ).map((row) => ({
      ...row,
      featured: Boolean(row.featured),
      product_count: Number(row.product_count) || 0,
    }));

    const brands = (
      db
        .prepare(
          `SELECT b.*, COUNT(p.id) as product_count
           FROM brands b
           LEFT JOIN products p ON p.brand_id = b.id
           GROUP BY b.id
           ORDER BY b.featured DESC, b.name ASC`,
        )
        .all() as Record<string, unknown>[]
    ).map((row) => ({
      ...row,
      featured: Boolean(row.featured),
      product_count: Number(row.product_count) || 0,
    }));

    const products = (db.prepare('SELECT * FROM products ORDER BY created_at DESC').all() as Record<string, unknown>[]).map(
      (row) => formatProductRow(row),
    );

    const banners = (
      db.prepare('SELECT * FROM banners WHERE active = 1 ORDER BY sort_order ASC').all() as Record<string, unknown>[]
    ).map((row) => ({
      ...row,
      active: Boolean(row.active),
    }));

    const reviews = (
      db.prepare('SELECT * FROM reviews ORDER BY created_at DESC LIMIT 12').all() as Record<string, unknown>[]
    ).map((row) => ({
      ...row,
      verified: Boolean(row.verified),
    }));

    res.json({categories, brands, products, banners, reviews});
  });

  // Product Detail & Reviews
  app.get('/api/products/:slug', (req, res) => {
    const row = db
      .prepare('SELECT * FROM products WHERE slug = ? OR id = ?')
      .get(req.params.slug, req.params.slug) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({error: 'Product not found.'});
      return;
    }
    const product = formatProductRow(row);
    const reviews = (
      db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC').all(product.id) as Record<
        string,
        unknown
      >[]
    ).map((r) => ({...r, verified: Boolean(r.verified)}));
    res.json({product, reviews});
  });

  app.post('/api/products/:id/reviews', (req, res) => {
    const {author_name, author_role, rating, title, comment} = req.body || {};
    if (
      typeof author_name !== 'string' ||
      author_name.trim().length < 2 ||
      typeof comment !== 'string' ||
      comment.trim().length < 8
    ) {
      res.status(400).json({error: 'Please enter your name and review comment.'});
      return;
    }
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      res.status(404).json({error: 'Product not found.'});
      return;
    }
    const clampedRating = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
    const reviewId = `rev-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const createReviewTx = db.transaction(() => {
      db.prepare(
        `INSERT INTO reviews (id, product_id, author_name, author_role, rating, title, comment, verified, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      ).run(
        reviewId,
        req.params.id,
        author_name.trim().slice(0, 80),
        typeof author_role === 'string' && author_role.trim() ? author_role.trim().slice(0, 80) : 'Verified Buyer',
        clampedRating,
        typeof title === 'string' && title.trim() ? title.trim().slice(0, 120) : 'Verified Purchase Review',
        comment.trim().slice(0, 1000),
        now,
      );

      const stats = db
        .prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE product_id = ?')
        .get(req.params.id) as {avg_rating: number; total: number};

      db.prepare('UPDATE products SET rating_avg = ?, rating_count = ? WHERE id = ?').run(
        Number((stats.avg_rating || clampedRating).toFixed(1)),
        stats.total || 1,
        req.params.id,
      );
    });

    createReviewTx();
    const created = db.prepare('SELECT * FROM reviews WHERE id = ?').get(reviewId) as Record<string, unknown>;
    res.status(201).json({review: {...created, verified: Boolean(created.verified)}});
  });

  // Orders & WhatsApp Checkout
  app.post('/api/orders', (req, res) => {
    const body = req.body || {};
    const customerName = String(body.customer_name || '').trim();
    const customerPhone = String(body.customer_phone || '').trim();
    const country = String(body.country || '').trim();
    const city = String(body.city || '').trim();
    const address = String(body.address || '').trim();
    const instructions = String(body.instructions || '').trim();
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (!customerName || !customerPhone || !country || !city || !address) {
      res.status(400).json({error: 'All required delivery details must be completed.'});
      return;
    }
    if (rawItems.length === 0 || rawItems.length > 50) {
      res.status(400).json({error: 'Your order must include at least one valid product.'});
      return;
    }

    const tokenPayload = verifyToken(extractBearer(req));
    const userId = tokenPayload && tokenPayload.role === 'user' ? tokenPayload.sub : null;

    try {
      const orderResult = db.transaction(() => {
        const verifiedItems: {
          product_id: string;
          title: string;
          brand_name: string;
          sku: string;
          image: string;
          quantity: number;
          original_price: number;
          unit_price: number;
          line_total: number;
        }[] = [];

        let subtotal = 0;
        let discountedSum = 0;

        const getProductStmt = db.prepare('SELECT * FROM products WHERE id = ?');
        const decrementStockStmt = db.prepare('UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ?');

        const now = new Date().toISOString();

        for (const item of rawItems) {
          const productId = String(item?.product_id || '');
          const quantity = Math.floor(Number(item?.quantity) || 0);
          if (!productId || quantity < 1 || quantity > 99) {
            throw new Error('INVALID_ITEM');
          }
          const prodRow = getProductStmt.get(productId) as Record<string, unknown> | undefined;
          if (!prodRow) {
            throw new Error('PRODUCT_NOT_FOUND');
          }
          const stockUpdate = decrementStockStmt.run(quantity, now, productId, quantity);
          if (stockUpdate.changes === 0) {
            throw new Error(`OUT_OF_STOCK:${String(prodRow.title)}`);
          }

          const orig = Number(prodRow.original_price);
          const unit = Number(prodRow.discount_price) || orig;
          const lineTotal = Number((unit * quantity).toFixed(2));
          subtotal += orig * quantity;
          discountedSum += lineTotal;

          let images: string[] = [];
          try {
            images = JSON.parse(String(prodRow.images || '[]'));
          } catch {
            images = [];
          }

          verifiedItems.push({
            product_id: productId,
            title: String(prodRow.title),
            brand_name: String(prodRow.brand_name),
            sku: String(prodRow.sku),
            image: images[0] || '',
            quantity,
            original_price: orig,
            unit_price: unit,
            line_total: lineTotal,
          });
        }

        const discountTotal = Number(Math.max(0, subtotal - discountedSum).toFixed(2));
        const deliveryCharges = discountedSum >= 70000 ? 0 : 2500;
        const grandTotal = Number((discountedSum + deliveryCharges).toFixed(2));

        const countRow = db.prepare('SELECT COUNT(*) as total FROM orders').get() as {total: number};
        const orderNumber = `TB-2026-${1001 + countRow.total}`;
        const orderId = `ord-${crypto.randomUUID().slice(0, 10)}`;

        db.prepare(
          `INSERT INTO orders (
            id, order_number, user_id, customer_name, customer_phone, country, city,
            address, instructions, items, subtotal, discount_total, delivery_charges,
            grand_total, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Confirmation', ?, ?)`,
        ).run(
          orderId,
          orderNumber,
          userId,
          customerName.slice(0, 120),
          customerPhone.slice(0, 40),
          country.slice(0, 80),
          city.slice(0, 80),
          address.slice(0, 400),
          instructions.slice(0, 400),
          JSON.stringify(verifiedItems),
          Number(subtotal.toFixed(2)),
          discountTotal,
          deliveryCharges,
          grandTotal,
          now,
          now,
        );

        return {
          id: orderId,
          order_number: orderNumber,
          user_id: userId,
          customer_name: customerName,
          customer_phone: customerPhone,
          country,
          city,
          address,
          instructions,
          items: verifiedItems,
          subtotal: Number(subtotal.toFixed(2)),
          discount_total: discountTotal,
          delivery_charges: deliveryCharges,
          grand_total: grandTotal,
          status: 'Pending Confirmation',
          created_at: now,
          updated_at: now,
        };
      })();

      res.status(201).json({order: orderResult});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Order creation failed.';
      if (msg.startsWith('OUT_OF_STOCK:')) {
        res.status(409).json({error: `Insufficient stock for ${msg.split(':')[1]}.`});
        return;
      }
      if (msg === 'PRODUCT_NOT_FOUND' || msg === 'INVALID_ITEM') {
        res.status(400).json({error: 'One or more products in your cart could not be verified.'});
        return;
      }
      res.status(500).json({error: 'Could not place order. Please try again.'});
    }
  });

  app.get('/api/orders/track/:orderNumber', (req, res) => {
    const orderNum = String(req.params.orderNumber || '').trim().toUpperCase();
    const row = db
      .prepare('SELECT * FROM orders WHERE UPPER(order_number) = ?')
      .get(orderNum) as Record<string, unknown> | undefined;
    if (!row) {
      res.status(404).json({error: 'No order found matching that reference number.'});
      return;
    }
    res.json({
      order: {
        id: row.id,
        order_number: row.order_number,
        customer_name: row.customer_name,
        country: row.country,
        city: row.city,
        items: JSON.parse(String(row.items || '[]')),
        subtotal: row.subtotal,
        discount_total: row.discount_total,
        delivery_charges: row.delivery_charges,
        grand_total: row.grand_total,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
      },
    });
  });

  // Newsletter & Contact
  app.post('/api/newsletter', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({error: 'Please enter a valid email address.'});
      return;
    }
    const existing = db.prepare('SELECT id FROM newsletter_subscribers WHERE email = ?').get(email);
    if (existing) {
      res.json({message: 'You are already subscribed to THREE BROTHERS dispatches.'});
      return;
    }
    db.prepare('INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?)').run(
      `sub-${crypto.randomUUID().slice(0, 8)}`,
      email,
      new Date().toISOString(),
    );
    res.status(201).json({message: 'Subscribed to THREE BROTHERS product drops and exclusive offers.'});
  });

  app.post('/api/contact', (req, res) => {
    const {name, email, phone, subject, message} = req.body || {};
    if (
      typeof name !== 'string' ||
      name.trim().length < 2 ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof message !== 'string' ||
      message.trim().length < 10
    ) {
      res.status(400).json({error: 'Please complete your name, valid email, and inquiry message.'});
      return;
    }
    const id = `msg-${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(
      `INSERT INTO contact_messages (id, name, email, phone, subject, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'new', ?)`,
    ).run(
      id,
      name.trim().slice(0, 100),
      email.trim().toLowerCase().slice(0, 120),
      String(phone || '').trim().slice(0, 40),
      String(subject || 'General Inquiry').trim().slice(0, 140),
      message.trim().slice(0, 2000),
      new Date().toISOString(),
    );
    res.status(201).json({message: 'Inquiry received. Our concierge team will respond shortly.'});
  });

  // Customer Auth & Persistent User State
  app.post('/api/auth/register', (req, res) => {
    const {name, email, password, phone} = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanName = String(name || '').trim();
    if (cleanName.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || String(password || '').length < 6) {
      res.status(400).json({error: 'Name, valid email, and password (min 6 chars) are required.'});
      return;
    }
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (exists) {
      res.status(409).json({error: 'An account with this email already exists.'});
      return;
    }
    const id = `usr-${crypto.randomUUID().slice(0, 10)}`;
    const {hash, salt} = hashSecret(String(password));
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO users (id, name, email, phone, password_hash, salt, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, cleanName.slice(0, 100), cleanEmail, String(phone || '').trim().slice(0, 40), hash, salt, now);
    db.prepare('INSERT INTO user_state (user_id, cart_json, wishlist_json, updated_at) VALUES (?, ?, ?, ?)').run(
      id,
      '[]',
      '[]',
      now,
    );
    const token = signToken(id, 'user');
    res.status(201).json({
      token,
      user: {id, name: cleanName, email: cleanEmail, phone: String(phone || ''), country: '', city: '', address: '', created_at: now},
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const cleanEmail = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as Record<string, unknown> | undefined;
    if (!userRow || !verifySecret(password, String(userRow.password_hash), String(userRow.salt))) {
      res.status(401).json({error: 'Invalid email or password.'});
      return;
    }
    const token = signToken(String(userRow.id), 'user');
    res.json({
      token,
      user: {
        id: userRow.id,
        name: userRow.name,
        email: userRow.email,
        phone: userRow.phone,
        country: userRow.country,
        city: userRow.city,
        address: userRow.address,
        created_at: userRow.created_at,
      },
    });
  });

  app.get('/api/auth/me', requireUser, (req, res) => {
    const userId = (req as express.Request & {userId: string}).userId;
    const user = db
      .prepare('SELECT id, name, email, phone, country, city, address, created_at FROM users WHERE id = ?')
      .get(userId);
    if (!user) {
      res.status(404).json({error: 'User not found.'});
      return;
    }
    const orders = (
      db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Record<
        string,
        unknown
      >[]
    ).map((o) => ({...o, items: JSON.parse(String(o.items || '[]'))}));
    const state = db.prepare('SELECT cart_json, wishlist_json FROM user_state WHERE user_id = ?').get(userId) as
      | {cart_json: string; wishlist_json: string}
      | undefined;
    res.json({
      user,
      orders,
      wishlist: state ? JSON.parse(state.wishlist_json) : [],
    });
  });

  app.put('/api/auth/profile', requireUser, (req, res) => {
    const userId = (req as express.Request & {userId: string}).userId;
    const {name, phone, country, city, address} = req.body || {};
    db.prepare('UPDATE users SET name = ?, phone = ?, country = ?, city = ?, address = ? WHERE id = ?').run(
      String(name || '').trim().slice(0, 100),
      String(phone || '').trim().slice(0, 40),
      String(country || '').trim().slice(0, 80),
      String(city || '').trim().slice(0, 80),
      String(address || '').trim().slice(0, 300),
      userId,
    );
    const user = db
      .prepare('SELECT id, name, email, phone, country, city, address, created_at FROM users WHERE id = ?')
      .get(userId);
    res.json({user});
  });

  app.put('/api/auth/state', requireUser, (req, res) => {
    const userId = (req as express.Request & {userId: string}).userId;
    const wishlist = Array.isArray(req.body?.wishlist) ? req.body.wishlist.slice(0, 100) : [];
    const cart = Array.isArray(req.body?.cart) ? req.body.cart.slice(0, 100) : [];
    db.prepare(
      `INSERT INTO user_state (user_id, cart_json, wishlist_json, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET cart_json = excluded.cart_json, wishlist_json = excluded.wishlist_json, updated_at = excluded.updated_at`,
    ).run(userId, JSON.stringify(cart), JSON.stringify(wishlist), new Date().toISOString());
    res.json({ok: true});
  });

  // Admin Auth (env ADMIN_PASSCODE overrides claimed DB passcode)
  app.get('/api/admin/auth-status', (req, res) => {
    const envPasscode = String(process.env.ADMIN_PASSCODE || '').trim();
    const dbConfig = db.prepare("SELECT id FROM admin_config WHERE id = 'primary'").get();
    const tokenPayload = verifyToken(extractBearer(req));
    res.json({
      envConfigured: envPasscode.length > 0,
      configured: envPasscode.length > 0 || Boolean(dbConfig),
      authenticated: Boolean(tokenPayload && tokenPayload.role === 'admin'),
    });
  });

  app.post('/api/admin/claim', (req, res) => {
    const envPasscode = String(process.env.ADMIN_PASSCODE || '').trim();
    if (envPasscode.length > 0) {
      res.status(403).json({error: 'Admin passcode is managed by environment secrets.'});
      return;
    }
    const existing = db.prepare("SELECT id FROM admin_config WHERE id = 'primary'").get();
    if (existing) {
      res.status(409).json({error: 'Admin passcode has already been claimed. Please sign in.'});
      return;
    }
    const passcode = String(req.body?.passcode || '').trim();
    if (passcode.length < 6 || passcode.length > 128) {
      res.status(400).json({error: 'Choose an admin passcode between 6 and 128 characters.'});
      return;
    }
    const {hash, salt} = hashSecret(passcode);
    db.prepare("INSERT INTO admin_config (id, passcode_hash, salt, updated_at) VALUES ('primary', ?, ?, ?)").run(
      hash,
      salt,
      new Date().toISOString(),
    );
    const token = signToken('admin-primary', 'admin');
    res.status(201).json({token});
  });

  app.post('/api/admin/login', (req, res) => {
    const passcode = String(req.body?.passcode || '').trim();
    const envPasscode = String(process.env.ADMIN_PASSCODE || '').trim();
    if (envPasscode.length > 0) {
      if (!safeEqualStrings(passcode, envPasscode)) {
        res.status(401).json({error: 'Invalid admin passcode.'});
        return;
      }
      res.json({token: signToken('admin-primary', 'admin')});
      return;
    }
    const dbConfig = db.prepare("SELECT passcode_hash, salt FROM admin_config WHERE id = 'primary'").get() as
      | {passcode_hash: string; salt: string}
      | undefined;
    if (!dbConfig) {
      res.status(400).json({error: 'No admin passcode configured yet. Claim initial setup first.'});
      return;
    }
    if (!verifySecret(passcode, dbConfig.passcode_hash, dbConfig.salt)) {
      res.status(401).json({error: 'Invalid admin passcode.'});
      return;
    }
    res.json({token: signToken('admin-primary', 'admin')});
  });

  // Admin Protected Overview & Data
  app.get('/api/admin/dashboard', requireAdmin, (_req, res) => {
    const orders = (
      db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all() as Record<string, unknown>[]
    ).map((row) => ({
      ...row,
      items: JSON.parse(String(row.items || '[]')),
    }));

    const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
    const banners = (
      db.prepare('SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC').all() as Record<string, unknown>[]
    ).map((row) => ({...row, active: Boolean(row.active)}));

    const totalProducts = (db.prepare('SELECT COUNT(*) as c FROM products').get() as {c: number}).c;
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o: Record<string, unknown>) => o.status !== 'Cancelled')
      .reduce((sum: number, o: Record<string, unknown>) => sum + Number(o.grand_total || 0), 0);
    const pendingOrders = orders.filter((o: Record<string, unknown>) => o.status === 'Pending Confirmation').length;
    const subscriberCount = (db.prepare('SELECT COUNT(*) as c FROM newsletter_subscribers').get() as {c: number}).c;

    res.json({
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        pendingOrders,
        subscriberCount,
      },
      orders,
      messages,
      banners,
    });
  });

  // Admin Image Upload
  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    const dataUrl = String(req.body?.dataUrl || '');
    const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({error: 'Invalid image format. Upload PNG, JPG, or WebP.'});
      return;
    }
    const mime = match[1];
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 4 * 1024 * 1024) {
      res.status(400).json({error: 'Image exceeds 4MB upload limit.'});
      return;
    }
    const filename = `prod_${crypto.randomUUID().slice(0, 12)}.${ext}`;
    const dest = path.resolve(uploadsDir, filename);
    if (!dest.startsWith(uploadsDir + path.sep)) {
      res.status(400).json({error: 'Invalid upload destination.'});
      return;
    }
    fs.writeFileSync(dest, buffer);
    res.status(201).json({url: `/api/uploads/${filename}`});
  });

  // Admin Product CRUD
  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const b = req.body || {};
    const title = String(b.title || '').trim();
    const categoryId = String(b.category_id || '').trim();
    const brandId = String(b.brand_id || '').trim();
    if (!title || !categoryId || !brandId) {
      res.status(400).json({error: 'Product title, category, and brand are required.'});
      return;
    }
    const cat = db.prepare('SELECT id, name FROM categories WHERE id = ?').get(categoryId) as
      | {id: string; name: string}
      | undefined;
    const brand = db.prepare('SELECT id, name FROM brands WHERE id = ?').get(brandId) as
      | {id: string; name: string}
      | undefined;
    if (!cat || !brand) {
      res.status(400).json({error: 'Invalid category or brand selected.'});
      return;
    }
    const origPrice = Math.max(0, Number(b.original_price) || 0);
    const discPrice = Math.max(0, Number(b.discount_price) || origPrice);
    const images = Array.isArray(b.images) ? b.images.filter((u: unknown) => isSafeMediaUrl(String(u))) : [];
    const specs = Array.isArray(b.specifications)
      ? b.specifications
          .filter((s: unknown) => s && typeof s === 'object')
          .map((s: {label?: unknown; value?: unknown}) => ({
            label: String(s.label || '').trim(),
            value: String(s.value || '').trim(),
          }))
          .filter((s: {label: string; value: string}) => s.label && s.value)
      : [];

    const id = `prod-${crypto.randomUUID().slice(0, 8)}`;
    const slug = `${slugify(title)}-${id.slice(-4)}`;
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO products (
        id, slug, title, brand_id, brand_name, category_id, category_name,
        original_price, discount_price, stock, sku, short_description, description,
        warranty, images, specifications, is_trending, is_bestseller, is_new_arrival,
        is_featured_deal, rating_avg, rating_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 4.9, 1, ?, ?)`,
    ).run(
      id,
      slug,
      title.slice(0, 140),
      brand.id,
      brand.name,
      cat.id,
      cat.name,
      origPrice,
      discPrice,
      Math.max(0, Math.floor(Number(b.stock) || 0)),
      String(b.sku || `TB-${id.slice(-6).toUpperCase()}`).trim().slice(0, 40),
      String(b.short_description || '').trim().slice(0, 300),
      String(b.description || '').trim().slice(0, 3000),
      String(b.warranty || '1 Year Official Manufacturer Warranty').trim().slice(0, 240),
      JSON.stringify(images.length ? images : ['/src/assets/images/product_smart_accessories_1795408033153.jpg']),
      JSON.stringify(specs),
      b.is_trending ? 1 : 0,
      b.is_bestseller ? 1 : 0,
      b.is_new_arrival ? 1 : 0,
      b.is_featured_deal ? 1 : 0,
      now,
      now,
    );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown>;
    res.status(201).json({product: formatProductRow(created)});
  });

  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) {
      res.status(404).json({error: 'Product not found.'});
      return;
    }
    const b = req.body || {};
    const title = String(b.title ?? existing.title).trim();
    const categoryId = String(b.category_id ?? existing.category_id);
    const brandId = String(b.brand_id ?? existing.brand_id);
    const cat = db.prepare('SELECT id, name FROM categories WHERE id = ?').get(categoryId) as
      | {id: string; name: string}
      | undefined;
    const brand = db.prepare('SELECT id, name FROM brands WHERE id = ?').get(brandId) as
      | {id: string; name: string}
      | undefined;
    if (!cat || !brand) {
      res.status(400).json({error: 'Invalid category or brand.'});
      return;
    }
    const origPrice = Math.max(0, Number(b.original_price ?? existing.original_price));
    const discPrice = Math.max(0, Number(b.discount_price ?? existing.discount_price));
    const images = Array.isArray(b.images)
      ? b.images.filter((u: unknown) => isSafeMediaUrl(String(u)))
      : JSON.parse(String(existing.images || '[]'));
    const specs = Array.isArray(b.specifications)
      ? b.specifications
      : JSON.parse(String(existing.specifications || '[]'));

    db.prepare(
      `UPDATE products SET
        title = ?, brand_id = ?, brand_name = ?, category_id = ?, category_name = ?,
        original_price = ?, discount_price = ?, stock = ?, sku = ?, short_description = ?,
        description = ?, warranty = ?, images = ?, specifications = ?,
        is_trending = ?, is_bestseller = ?, is_new_arrival = ?, is_featured_deal = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      title.slice(0, 140),
      brand.id,
      brand.name,
      cat.id,
      cat.name,
      origPrice,
      discPrice,
      Math.max(0, Math.floor(Number(b.stock ?? existing.stock))),
      String(b.sku ?? existing.sku).trim().slice(0, 40),
      String(b.short_description ?? existing.short_description).trim().slice(0, 300),
      String(b.description ?? existing.description).trim().slice(0, 3000),
      String(b.warranty ?? existing.warranty).trim().slice(0, 240),
      JSON.stringify(images),
      JSON.stringify(specs),
      b.is_trending !== undefined ? (b.is_trending ? 1 : 0) : Number(existing.is_trending),
      b.is_bestseller !== undefined ? (b.is_bestseller ? 1 : 0) : Number(existing.is_bestseller),
      b.is_new_arrival !== undefined ? (b.is_new_arrival ? 1 : 0) : Number(existing.is_new_arrival),
      b.is_featured_deal !== undefined ? (b.is_featured_deal ? 1 : 0) : Number(existing.is_featured_deal),
      new Date().toISOString(),
      req.params.id,
    );

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id) as Record<string, unknown>;
    res.json({product: formatProductRow(updated)});
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    if (info.changes === 0) {
      res.status(404).json({error: 'Product not found.'});
      return;
    }
    res.json({ok: true});
  });

  // Admin Categories & Brands CRUD
  app.post('/api/admin/categories', requireAdmin, (req, res) => {
    const {name, description, image, icon_name, featured} = req.body || {};
    const cleanName = String(name || '').trim();
    if (!cleanName) {
      res.status(400).json({error: 'Category name is required.'});
      return;
    }
    const id = `cat-${crypto.randomUUID().slice(0, 8)}`;
    const slug = `${slugify(cleanName)}-${id.slice(-3)}`;
    const safeImg = isSafeMediaUrl(String(image || ''))
      ? String(image)
      : '/src/assets/images/product_smart_accessories_1795408033153.jpg';
    const maxSort = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) as m FROM categories').get() as {m: number}).m;
    db.prepare(
      `INSERT INTO categories (id, slug, name, description, image, icon_name, featured, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      slug,
      cleanName.slice(0, 60),
      String(description || '').trim().slice(0, 240),
      safeImg,
      String(icon_name || 'Cpu').trim().slice(0, 40),
      featured ? 1 : 0,
      maxSort + 1,
      new Date().toISOString(),
    );
    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.status(201).json({category: created});
  });

  app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
    const inUse = (db.prepare('SELECT COUNT(*) as c FROM products WHERE category_id = ?').get(req.params.id) as {c: number}).c;
    if (inUse > 0) {
      res.status(409).json({error: 'Reassign or delete products in this category before removing it.'});
      return;
    }
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ok: true});
  });

  app.post('/api/admin/brands', requireAdmin, (req, res) => {
    const {name, tagline, country, featured} = req.body || {};
    const cleanName = String(name || '').trim();
    if (!cleanName) {
      res.status(400).json({error: 'Brand name is required.'});
      return;
    }
    const id = `brand-${crypto.randomUUID().slice(0, 8)}`;
    const slug = `${slugify(cleanName)}-${id.slice(-3)}`;
    db.prepare(
      `INSERT INTO brands (id, slug, name, tagline, country, featured, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      slug,
      cleanName.slice(0, 60),
      String(tagline || '').trim().slice(0, 180),
      String(country || 'Global').trim().slice(0, 60),
      featured ? 1 : 0,
      new Date().toISOString(),
    );
    const created = db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
    res.status(201).json({brand: created});
  });

  app.delete('/api/admin/brands/:id', requireAdmin, (req, res) => {
    const inUse = (db.prepare('SELECT COUNT(*) as c FROM products WHERE brand_id = ?').get(req.params.id) as {c: number}).c;
    if (inUse > 0) {
      res.status(409).json({error: 'Reassign or delete products from this brand before removing it.'});
      return;
    }
    db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id);
    res.json({ok: true});
  });

  // Admin Orders Status Management
  app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const allowedStatuses = ['Pending Confirmation', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const status = String(req.body?.status || '');
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({error: 'Invalid order status.'});
      return;
    }
    const info = db
      .prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, new Date().toISOString(), req.params.id);
    if (info.changes === 0) {
      res.status(404).json({error: 'Order not found.'});
      return;
    }
    res.json({ok: true, status});
  });

  // Admin Banners CRUD
  app.post('/api/admin/banners', requireAdmin, (req, res) => {
    const {title, subtitle, headline, description, cta_text, cta_target, image, placement, active} = req.body || {};
    if (!String(headline || '').trim()) {
      res.status(400).json({error: 'Banner headline is required.'});
      return;
    }
    const id = `banner-${crypto.randomUUID().slice(0, 8)}`;
    const safeImg = isSafeMediaUrl(String(image || ''))
      ? String(image)
      : '/src/assets/images/hero_flagship_tech_1795408033150.jpg';
    db.prepare(
      `INSERT INTO banners (id, title, subtitle, headline, description, cta_text, cta_target, image, placement, active, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    ).run(
      id,
      String(title || 'Featured Campaign').trim().slice(0, 100),
      String(subtitle || '').trim().slice(0, 140),
      String(headline).trim().slice(0, 140),
      String(description || '').trim().slice(0, 320),
      String(cta_text || 'SHOP NOW').trim().slice(0, 40),
      String(cta_target || 'shop').trim().slice(0, 40),
      safeImg,
      placement === 'promo' ? 'promo' : 'hero',
      active === false ? 0 : 1,
      new Date().toISOString(),
    );
    const created = db.prepare('SELECT * FROM banners WHERE id = ?').get(id);
    res.status(201).json({banner: created});
  });

  app.put('/api/admin/banners/:id', requireAdmin, (req, res) => {
    const existing = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id) as
      | Record<string, unknown>
      | undefined;
    if (!existing) {
      res.status(404).json({error: 'Banner not found.'});
      return;
    }
    const b = req.body || {};
    const safeImg = isSafeMediaUrl(String(b.image || '')) ? String(b.image) : String(existing.image);
    db.prepare(
      `UPDATE banners SET title = ?, subtitle = ?, headline = ?, description = ?, cta_text = ?, cta_target = ?, image = ?, placement = ?, active = ?
       WHERE id = ?`,
    ).run(
      String(b.title ?? existing.title).trim().slice(0, 100),
      String(b.subtitle ?? existing.subtitle).trim().slice(0, 140),
      String(b.headline ?? existing.headline).trim().slice(0, 140),
      String(b.description ?? existing.description).trim().slice(0, 320),
      String(b.cta_text ?? existing.cta_text).trim().slice(0, 40),
      String(b.cta_target ?? existing.cta_target).trim().slice(0, 40),
      safeImg,
      b.placement === 'promo' ? 'promo' : b.placement === 'hero' ? 'hero' : String(existing.placement),
      b.active !== undefined ? (b.active ? 1 : 0) : Number(existing.active),
      req.params.id,
    );
    const updated = db.prepare('SELECT * FROM banners WHERE id = ?').get(req.params.id) as Record<string, unknown>;
    res.json({banner: {...updated, active: Boolean(updated.active)}});
  });

  app.delete('/api/admin/banners/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM banners WHERE id = ?').run(req.params.id);
    res.json({ok: true});
  });

  app.patch('/api/admin/messages/:id', requireAdmin, (req, res) => {
    const status = req.body?.status === 'reviewed' ? 'reviewed' : 'new';
    db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ok: true});
  });

  // Vite / Static SPA Hosting
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THREE BROTHERS storefront server listening on port ${PORT}`);
  });
}

startServer();
