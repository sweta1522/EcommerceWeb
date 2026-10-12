const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;
const publicDir = path.join(__dirname, 'public');
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const semanticAliases = {
  tech: ['tech', 'electronics', 'device', 'gadget', 'smart'],
  electronics: ['electronics', 'tech', 'device', 'gadget', 'smart'],
  home: ['home', 'home & living', 'living', 'decor', 'furniture'],
  clothing: ['clothing', 'apparel', 'fashion', 'wear', 'style'],
  sports: ['sports', 'fitness', 'athletic', 'gym', 'exercise'],
  kitchen: ['kitchen', 'kitchenware', 'utensil', 'cookware', 'appliance'],
  fitness: ['fitness', 'sports', 'athletic', 'gym', 'exercise'],
  apparel: ['apparel', 'clothing', 'fashion', 'wear', 'style'],
};

function expandSemanticTerms(search) {
  const normalized = String(search || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s&]/g, ' ')
    .replace(/\s+/g, ' ');

  if (!normalized) {
    return [];
  }

  const tokens = normalized.split(' ');
  const expanded = new Set();

  tokens.forEach((token) => {
    if (!token) {
      return;
    }

    expanded.add(token);

    const aliases = semanticAliases[token] || [];
    aliases.forEach((alias) => expanded.add(alias));
  });

  const fullPhrase = normalized.replace(/\s+/g, ' ');
  if (fullPhrase) {
    expanded.add(fullPhrase);
  }

  const phraseAliases = semanticAliases[fullPhrase] || [];
  phraseAliases.forEach((alias) => expanded.add(alias));

  return Array.from(expanded).filter(Boolean).slice(0, 12);
}

function normalizeCategory(value) {
  if (!value) {
    return null;
  }

  const map = {
    electronics: 'Electronics',
    'home & living': 'Home & Living',
    'home living': 'Home & Living',
    home: 'Home & Living',
    clothing: 'Clothing',
    apparel: 'Clothing',
    fashion: 'Clothing',
    sports: 'Sports',
    fitness: 'Sports',
    kitchen: 'Kitchenware',
    kitchenware: 'Kitchenware',
  };

  const normalized = String(value).toLowerCase().trim();
  return map[normalized] || value;
}

function cleanIntentText(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => cleanIntentText(entry)).filter(Boolean).slice(0, 8);
  }

  if (typeof value !== 'string') {
    return null;
  }

  const cleaned = value
    .replace(/```json|```/gi, '')
    .replace(/\n+/g, ' ')
    .trim();

  return cleaned || null;
}

function parseIntentResponse(rawResponse, fallbackTerms) {
  if (!rawResponse) {
    return {
      terms: fallbackTerms,
      category: null,
      maxPrice: null,
      sort: null,
    };
  }

  const cleaned = cleanIntentText(rawResponse);
  if (!cleaned) {
    return {
      terms: fallbackTerms,
      category: null,
      maxPrice: null,
      sort: null,
    };
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      terms: Array.isArray(parsed.terms) && parsed.terms.length
        ? parsed.terms
        : fallbackTerms,
      category: normalizeCategory(parsed.category || parsed.categoryName || parsed.targetCategory),
      maxPrice: parsed.maxPrice ?? parsed.max_price ?? null,
      sort: parsed.sort === 'price_desc' ? 'price_desc' : 'price_asc',
    };
  } catch (error) {
    return {
      terms: fallbackTerms,
      category: null,
      maxPrice: null,
      sort: null,
    };
  }
}

async function getIntentFromLLM(search) {
  if (!process.env.OPENAI_API_KEY || !search) {
    return null;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You convert product-search intents into structured JSON. Return only JSON with keys: terms, category, maxPrice, sort. terms is an array of search tokens/aliases, category is one of Electronics, Home & Living, Clothing, Sports, Kitchenware or null, maxPrice is a number or null, sort is either price_asc or price_desc.',
          },
          {
            role: 'user',
            content: `Search intent: ${search}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return content || null;
  } catch (error) {
    console.warn('LLM intent lookup failed, using local semantic fallback:', error.message);
    return null;
  }
}

async function buildSearchIntent(search) {
  const fallbackTerms = expandSemanticTerms(search);

  if (!search) {
    return {
      terms: [],
      category: null,
      maxPrice: null,
      sort: null,
    };
  }

  const llmResponse = await getIntentFromLLM(search);
  return parseIntentResponse(llmResponse, fallbackTerms);
}

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false },
      }
    : {
        host: process.env.PG_HOST || 'localhost',
        port: Number(process.env.PG_PORT || 5432),
        user: process.env.PG_USER || 'postgres',
        password: process.env.PG_PASSWORD || 'postgres',
        database: process.env.PG_DATABASE || 'website_db',
      }
);

async function ensureVectorSupport() {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
    await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(1536);');
  } catch (error) {
    console.warn('Vector support unavailable:', error.message);
  }
}

async function generateEmbedding(text) {
  if (!text) {
    return null;
  }

  if (openai) {
    try {
      const response = await openai.embeddings.create({
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        input: String(text).trim(),
      });

      return response.data?.[0]?.embedding || null;
    } catch (error) {
      console.warn('OpenAI embedding generation failed:', error.message);
    }
  }

  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

  try {
    const response = await fetch(`${ollamaBaseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: String(text).trim(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding request failed: ${response.status}`);
    }

    const payload = await response.json();
    return payload.embedding || null;
  } catch (error) {
    console.warn('Ollama embedding generation failed:', error.message);
    return null;
  }
}

async function ensureProductEmbeddings() {
  if (!openai && !process.env.OLLAMA_BASE_URL && !process.env.OLLAMA_EMBEDDING_MODEL) {
    return;
  }

  try {
    const result = await pool.query(
      `SELECT product_id, title, category
       FROM products
       WHERE embedding IS NULL
       ORDER BY product_id ASC
       LIMIT 50`
    );

    for (const product of result.rows) {
      const vector = await generateEmbedding(`${product.title} ${product.category}`);
      if (vector) {
        await pool.query('UPDATE products SET embedding = $1 WHERE product_id = $2', [vector, product.product_id]);
      }
    }
  } catch (error) {
    console.warn('Embedding backfill failed:', error.message);
  }
}

app.set('trust proxy', 1);

const rateBuckets = new Map();
function rateLimit({ windowMs = 60000, max = 60 } = {}) {
  setInterval(() => rateBuckets.clear(), windowMs).unref();
  return (req, res, next) => {
    const count = (rateBuckets.get(req.ip) || 0) + 1;
    rateBuckets.set(req.ip, count);
    if (count > max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
}

app.use(express.static(publicDir));
app.use('/api', rateLimit());

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/health', async (_req, res) => {
  let database = process.env.PG_DATABASE || 'website_db';
  if (process.env.DATABASE_URL) {
    try {
      database = new URL(process.env.DATABASE_URL).pathname.slice(1);
    } catch {
      database = 'unknown';
    }
  }
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({ ok: false });
  }
});

app.get('/api/categories', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT category FROM products ORDER BY category ASC'
    );

    res.json(result.rows.map((row) => row.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const category = typeof req.query.category === 'string' ? req.query.category.slice(0, 50) : null;
    const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const rawSort = req.query.sort === 'price_desc' ? 'price_desc' : 'price_asc';
    const intent = await buildSearchIntent(search);
    const sort = intent.sort || rawSort;
    const effectiveCategory = category && category !== 'all' ? category : intent.category || null;

    const hasCursor =
      req.query.cursorPrice !== undefined || req.query.cursorProductId !== undefined;
    const cursorPrice = hasCursor ? Number(req.query.cursorPrice) : null;
    const cursorProductId = hasCursor ? Number(req.query.cursorProductId) : null;

    const queryParams = [];
    const whereClauses = [];
    let nextParamIndex = 1;

    const addParam = (value) => {
      const index = nextParamIndex;
      nextParamIndex += 1;
      queryParams.push(value);
      return index;
    };

    if (effectiveCategory && effectiveCategory !== 'all') {
      whereClauses.push(`category = $${addParam(effectiveCategory)}`);
    }

    if (intent.maxPrice) {
      whereClauses.push(`price <= $${addParam(Number(intent.maxPrice))}`);
    }

    if (search) {
      const semanticTerms = Array.isArray(intent.terms) && intent.terms.length
        ? [...new Set(intent.terms.map((term) => String(term).toLowerCase().trim()).filter(Boolean))]
        : expandSemanticTerms(search);
      const likeConditions = [];

      semanticTerms.forEach((term) => {
        const placeholderIndex = addParam(`%${term}%`);
        likeConditions.push(`(title ILIKE $${placeholderIndex} OR category ILIKE $${placeholderIndex})`);
      });

      const semanticQuery = semanticTerms
        .map((term) => term.replace(/["'&]/g, ' ').trim())
        .filter(Boolean)
        .join(' | ');

      if (semanticQuery) {
        whereClauses.push(
          `(${likeConditions.join(' OR ')} OR to_tsvector('english', title || ' ' || category) @@ plainto_tsquery('english', $${addParam(semanticQuery)}))`
        );
      } else {
        const placeholderIndex = addParam(`%${search}%`);
        whereClauses.push(`(title ILIKE $${placeholderIndex} OR category ILIKE $${placeholderIndex})`);
      }
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const totalResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM products ${whereSql}`,
      queryParams
    );

    const total = totalResult.rows[0].total;

    if (process.env.OPENAI_API_KEY && search) {
      const semanticVector = await generateEmbedding(search);
      if (semanticVector) {
        const vectorWhereClauses = [];
        const vectorParams = [semanticVector];

        if (effectiveCategory && effectiveCategory !== 'all') {
          vectorWhereClauses.push('category = $2');
          vectorParams.push(effectiveCategory);
        }

        if (intent.maxPrice) {
          vectorWhereClauses.push('price <= $' + (vectorParams.length + 1));
          vectorParams.push(Number(intent.maxPrice));
        }

        const vectorWhereSql = vectorWhereClauses.length ? `WHERE ${vectorWhereClauses.join(' AND ')}` : '';
        const vectorQuery = `
          SELECT product_id, title, sku, category, price, stock_quantity, created_at,
                 1 - (embedding <=> $1) AS similarity
          FROM products
          ${vectorWhereSql}
          ORDER BY embedding <=> $1
          LIMIT $${vectorParams.length + 1}
        `;

        const vectorRows = await pool.query(vectorQuery, [...vectorParams, limit]);
        if (vectorRows.rowCount > 0) {
          const vectorProducts = vectorRows.rows.map((row) => ({
            product_id: row.product_id,
            title: row.title,
            sku: row.sku,
            category: row.category,
            price: row.price,
            stock_quantity: row.stock_quantity,
            created_at: row.created_at,
          }));

          return res.json({
            total: total || vectorProducts.length,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil((total || vectorProducts.length) / limit)),
            count: vectorProducts.length,
            products: vectorProducts,
          });
        }
      }
    }

    if (hasCursor && Number.isFinite(cursorPrice) && Number.isFinite(cursorProductId)) {
      const cursorPriceIndex = queryParams.length + 1;
      const cursorProductIdIndex = queryParams.length + 2;
      const cursorCondition =
        sort === 'price_desc'
          ? `AND (
              price < $${cursorPriceIndex}
              OR (price = $${cursorPriceIndex} AND product_id < $${cursorProductIdIndex})
            )`
          : `AND (
              price > $${cursorPriceIndex}
              OR (price = $${cursorPriceIndex} AND product_id > $${cursorProductIdIndex})
            )`;

      const cursorParams = [...queryParams, cursorPrice, cursorProductId];
      const cursorSql = `
        SELECT product_id, title, sku, category, price, stock_quantity, created_at
        FROM products
        ${whereSql}
        ${cursorCondition}
        ORDER BY price ${sort === 'price_desc' ? 'DESC' : 'ASC'}, product_id ${sort === 'price_desc' ? 'DESC' : 'ASC'}
        LIMIT $${cursorParams.length + 1}
      `;

      const rows = await pool.query(cursorSql, [...cursorParams, limit + 1]);
      const hasMore = rows.rows.length > limit;
      const products = hasMore ? rows.rows.slice(0, limit) : rows.rows;
      const lastProduct = products[products.length - 1];

      return res.json({
        total,
        limit,
        hasMore,
        nextCursor: hasMore && lastProduct
          ? {
              cursorPrice: Number(lastProduct.price),
              cursorProductId: Number(lastProduct.product_id),
            }
          : null,
        products,
      });
    }

    const orderBy =
      sort === 'price_desc'
        ? 'ORDER BY price DESC, product_id ASC'
        : 'ORDER BY price ASC, product_id ASC';

    const productsParams = [...queryParams, limit, offset];

    const productsResult = await pool.query(
      `
        SELECT product_id, title, sku, category, price, stock_quantity, created_at
        FROM products
        ${whereSql}
        ${orderBy}
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `,
      productsParams
    );

    res.json({
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      count: productsResult.rows.length,
      products: productsResult.rows,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

async function startServer() {
  await ensureVectorSupport();
  await ensureProductEmbeddings();

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

['SIGINT', 'SIGTERM'].forEach((signal) =>
  process.on(signal, async () => {
    await pool.end();
    process.exit(0);
  })
);
