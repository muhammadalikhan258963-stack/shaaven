import express, { type Request, type Response, type NextFunction } from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const rawEnvPin = process.env.ADMIN_PIN?.trim();
const ADMIN_PIN =
  rawEnvPin && rawEnvPin !== '1234' && rawEnvPin !== 'shaven' ? rawEnvPin : 'shaaven';
const TOKEN_SECRET = process.env.SESSION_SECRET || crypto.createHash('sha256').update(`shaaven-${ADMIN_PIN}`).digest('hex');

const PROJECT_DATA_DIR = path.resolve(__dirname, 'data');
const SEED_PATH = path.join(PROJECT_DATA_DIR, 'seedProducts.json');
const PROJECT_UPLOADS_DIR = path.resolve(__dirname, 'uploads');

function resolveWritableDir(preferredDir: string, fallbackSubdir: string): string {
  try {
    if (!fs.existsSync(preferredDir)) {
      fs.mkdirSync(preferredDir, { recursive: true });
    }
    fs.accessSync(preferredDir, fs.constants.W_OK);
    return preferredDir;
  } catch {
    const tmpDir = path.join(os.tmpdir(), 'shaaven-store', fallbackSubdir);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    return tmpDir;
  }
}

const DATA_DIR = resolveWritableDir(PROJECT_DATA_DIR, 'data');
const DB_PATH = path.join(DATA_DIR, 'store.json');
const UPLOADS_DIR = resolveWritableDir(PROJECT_UPLOADS_DIR, 'uploads');

interface ColorVariant {
  name: string;
  hex: string;
  imageFilter?: string;
}

interface ProductRecord {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  price: number;
  inStock: boolean;
  image: string;
  colors: ColorVariant[];
  specs: string[];
  featured?: boolean;
  createdAt?: string;
}

interface OrderRecord {
  orderNumber: string;
  customer: {
    fullName: string;
    phone: string;
    city: string;
    address: string;
    paymentMethod: 'cod' | 'online';
    notes?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    image: string;
    price: number;
    selectedColor: string;
    quantity: number;
  }>;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
}

interface SavedCartItem {
  productId: string;
  selectedColor: string;
  quantity: number;
}

interface StoreDatabase {
  products: ProductRecord[];
  orders: OrderRecord[];
  carts: Record<string, SavedCartItem[]>;
}

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    let seedProducts: ProductRecord[] = [];
    if (fs.existsSync(SEED_PATH)) {
      const raw = fs.readFileSync(SEED_PATH, 'utf-8');
      seedProducts = JSON.parse(raw) as ProductRecord[];
    }
    const initialDb: StoreDatabase = {
      products: seedProducts,
      orders: [],
      carts: {},
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
  }
}

function readDb(): StoreDatabase {
  ensureStorage();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreDatabase>;
    return {
      products: Array.isArray(parsed.products) ? parsed.products : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      carts:
        parsed.carts && typeof parsed.carts === 'object' && !Array.isArray(parsed.carts)
          ? parsed.carts
          : {},
    };
  } catch {
    return { products: [], orders: [], carts: {} };
  }
}

function writeDb(db: StoreDatabase): void {
  ensureStorage();
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);
}

function signAdminToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ role: 'admin', iat: Date.now() })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token: string | undefined): boolean {
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const headerToken = req.header('x-admin-token');
  if (!verifyAdminToken(headerToken)) {
    res.status(401).json({ error: 'Unauthorized. Please log in to Admin Panel.' });
    return;
  }
  next();
}

function slugifyId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
  return `${base || 'product'}-${crypto.randomBytes(2).toString('hex')}`;
}

async function startServer() {
  ensureStorage();

  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Serve uploaded product images
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Health endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    const db = readDb();
    res.json({
      ok: true,
      productsCount: db.products.length,
      ordersCount: db.orders.length,
    });
  });

  // Admin Login & Verification
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { pin } = req.body as { pin?: string };
    if (String(pin || '').trim() !== ADMIN_PIN) {
      res.status(401).json({ error: 'Invalid Admin PIN.' });
      return;
    }
    res.json({ token: signAdminToken() });
  });

  app.post('/api/admin/verify', (req: Request, res: Response) => {
    const token = req.header('x-admin-token');
    res.json({ valid: verifyAdminToken(token) });
  });

  // Public: List Products
  app.get('/api/products', (req: Request, res: Response) => {
    const db = readDb();
    const category = typeof req.query.category === 'string' ? req.query.category : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

    let items = db.products;
    if (category && category !== 'all') {
      items = items.filter((p) => p.category === category);
    }
    if (q) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    res.json({ products: items });
  });

  // Admin: Upload Product Image (base64 data URL)
  app.post('/api/upload', requireAdmin, (req: Request, res: Response) => {
    const { dataUrl } = req.body as { filename?: string; dataUrl?: string };
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Missing image data.' });
      return;
    }
    const match = /^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i.exec(dataUrl);
    if (!match) {
      res.status(400).json({ error: 'Unsupported image format. Use PNG, JPG, or WEBP.' });
      return;
    }
    const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 8 * 1024 * 1024) {
      res.status(400).json({ error: 'Image size must be under 8MB.' });
      return;
    }

    const savedName = `prod-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, savedName), buffer);
    res.status(201).json({ url: `/uploads/${savedName}` });
  });

  // Admin: Add New Product
  app.post('/api/products', requireAdmin, (req: Request, res: Response) => {
    const body = req.body as Partial<ProductRecord>;
    const name = String(body.name || '').trim();
    const category = String(body.category || 'accessories').trim();
    const price = Number(body.price);

    if (!name || !Number.isFinite(price) || price <= 0) {
      res.status(400).json({ error: 'Product name and a valid positive price are required.' });
      return;
    }

    const colors: ColorVariant[] =
      Array.isArray(body.colors) && body.colors.length > 0
        ? body.colors
            .filter((c) => c && typeof c.name === 'string' && c.name.trim())
            .map((c) => ({
              name: c.name.trim().toUpperCase(),
              hex: c.hex || '#111827',
              ...(c.imageFilter ? { imageFilter: c.imageFilter } : {}),
            }))
        : [{ name: 'BLACK', hex: '#111827' }];

    const specs: string[] = Array.isArray(body.specs)
      ? body.specs.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const newProduct: ProductRecord = {
      id: slugifyId(name),
      name,
      shortDescription:
        String(body.shortDescription || '').trim() ||
        `Premium ${name} available with Cash on Delivery across Pakistan.`,
      fullDescription:
        String(body.fullDescription || '').trim() ||
        String(body.shortDescription || '').trim() ||
        `${name} — high-quality gear from SHA.AVEN Online Solution with fast nationwide Cash on Delivery.`,
      category,
      price: Math.round(price),
      inStock: body.inStock !== false,
      image:
        String(body.image || '').trim() ||
        '/src/assets/images/prod_grooming_trimmer_1794914427604.jpg',
      colors,
      specs: specs.length > 0 ? specs : ['Cash on Delivery Available', 'Premium Quality Checked'],
      featured: body.featured !== false,
      createdAt: new Date().toISOString(),
    };

    const db = readDb();
    db.products.unshift(newProduct);
    writeDb(db);

    res.status(201).json({ product: newProduct });
  });

  // Admin: Update Product
  app.put('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body as Partial<ProductRecord>;
    const db = readDb();
    const index = db.products.findIndex((p) => p.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const existing = db.products[index];
    const updated: ProductRecord = {
      ...existing,
      ...(typeof body.name === 'string' && body.name.trim() ? { name: body.name.trim() } : {}),
      ...(typeof body.shortDescription === 'string'
        ? { shortDescription: body.shortDescription.trim() }
        : {}),
      ...(typeof body.fullDescription === 'string'
        ? { fullDescription: body.fullDescription.trim() }
        : {}),
      ...(typeof body.category === 'string' && body.category.trim()
        ? { category: body.category.trim() }
        : {}),
      ...(body.price !== undefined && Number.isFinite(Number(body.price)) && Number(body.price) > 0
        ? { price: Math.round(Number(body.price)) }
        : {}),
      ...(typeof body.inStock === 'boolean' ? { inStock: body.inStock } : {}),
      ...(typeof body.featured === 'boolean' ? { featured: body.featured } : {}),
      ...(typeof body.image === 'string' && body.image.trim() ? { image: body.image.trim() } : {}),
      ...(Array.isArray(body.colors) && body.colors.length > 0 ? { colors: body.colors } : {}),
      ...(Array.isArray(body.specs) ? { specs: body.specs } : {}),
    };

    db.products[index] = updated;
    writeDb(db);

    res.json({ product: updated });
  });

  // Admin: Delete Product
  app.delete('/api/products/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = readDb();
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    if (db.products.length === before) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    writeDb(db);
    res.json({ deleted: true, id });
  });

  // Public: Submit Customer Order
  app.post('/api/orders', (req: Request, res: Response) => {
    const body = req.body as {
      customer?: OrderRecord['customer'];
      items?: OrderRecord['items'];
      total?: number;
    };

    if (
      !body.customer ||
      !body.customer.fullName?.trim() ||
      !body.customer.phone?.trim() ||
      !body.customer.city?.trim() ||
      !body.customer.address?.trim()
    ) {
      res.status(400).json({ error: 'Complete customer shipping details are required.' });
      return;
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'Order must contain at least one item.' });
      return;
    }

    const orderNumber = `SHA-${Math.floor(1000 + Math.random() * 9000)}`;
    const calculatedTotal = body.items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );

    const newOrder: OrderRecord = {
      orderNumber,
      customer: {
        fullName: body.customer.fullName.trim(),
        phone: body.customer.phone.trim(),
        city: body.customer.city.trim(),
        address: body.customer.address.trim(),
        paymentMethod: body.customer.paymentMethod === 'online' ? 'online' : 'cod',
        notes: body.customer.notes?.trim() || '',
      },
      items: body.items.map((item) => ({
        productId: String(item.productId),
        productName: String(item.productName),
        image: String(item.image || ''),
        price: Number(item.price),
        selectedColor: String(item.selectedColor || 'BLACK'),
        quantity: Math.max(1, Number(item.quantity || 1)),
      })),
      total: calculatedTotal,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    const db = readDb();
    db.orders.unshift(newOrder);
    writeDb(db);

    res.status(201).json({ order: newOrder });
  });

  // Admin: List Orders
  app.get('/api/orders', requireAdmin, (_req: Request, res: Response) => {
    const db = readDb();
    res.json({ orders: db.orders });
  });

  // Admin: Update Order Status
  app.patch('/api/orders/:orderNumber', requireAdmin, (req: Request, res: Response) => {
    const { orderNumber } = req.params;
    const { status } = req.body as { status?: OrderRecord['status'] };
    const allowed: OrderRecord['status'][] = [
      'Pending',
      'Confirmed',
      'Shipped',
      'Delivered',
      'Cancelled',
    ];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }

    const db = readDb();
    const order = db.orders.find((o) => o.orderNumber === orderNumber);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    order.status = status;
    writeDb(db);
    res.json({ order });
  });

  // Public: Persistent Cart Sync
  const resolveCartKey = (req: Request): string => {
    const raw = req.header('x-cart-id') || 'default';
    return raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'default';
  };

  app.get('/api/cart', (req: Request, res: Response) => {
    const cartKey = resolveCartKey(req);
    const db = readDb();
    const savedItems = db.carts[cartKey] || [];
    const hydrated = savedItems
      .map((entry) => {
        const product = db.products.find((p) => p.id === entry.productId);
        if (!product) return null;
        return {
          product,
          selectedColor: entry.selectedColor,
          quantity: Math.max(1, Number(entry.quantity || 1)),
        };
      })
      .filter(Boolean);
    res.json({ items: hydrated });
  });

  app.put('/api/cart', (req: Request, res: Response) => {
    const cartKey = resolveCartKey(req);
    const { items } = req.body as {
      items?: Array<{ productId?: string; selectedColor?: string; quantity?: number }>;
    };
    const db = readDb();
    const sanitized: SavedCartItem[] = Array.isArray(items)
      ? items
          .filter((i) => i && typeof i.productId === 'string' && i.productId.trim())
          .map((i) => ({
            productId: String(i.productId),
            selectedColor: String(i.selectedColor || 'BLACK'),
            quantity: Math.max(1, Number(i.quantity || 1)),
          }))
      : [];
    db.carts[cartKey] = sanitized;
    writeDb(db);
    res.json({ ok: true, count: sanitized.reduce((sum, i) => sum + i.quantity, 0) });
  });

  // Vite integration in dev vs static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    const srcImagesDir = path.resolve(__dirname, 'src/assets/images');
    if (fs.existsSync(srcImagesDir)) {
      app.use('/src/assets/images', express.static(srcImagesDir));
    }
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SHA.AVEN server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SHA.AVEN server:', err);
  process.exit(1);
});
