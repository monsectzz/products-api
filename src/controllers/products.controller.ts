import pool from '../conf/dbConnection';

// ---------- Helpers ----------

const serverError = (res: any, error: any) => {
  // Solo se registra el código; nunca se expone al cliente
  console.error('DB error:', error?.code || error?.message);
  return res.status(500).json({ ok: false, message: 'Error interno del servidor' });
};

const parseId = (value: any): number | null => {
  if (!/^\d+$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Precio numérico, > 0, máximo 2 decimales y dentro de DECIMAL(10,2)
const parsePrice = (value: any): number | null => {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const price = Number(text);
  return price > 0 && price <= 99999999.99 ? price : null;
};

const isText = (v: any) => typeof v === 'string' && v.trim().length > 0;
const isOptionalText = (v: any) => v === undefined || v === null || typeof v === 'string';

// Valida y normaliza el cuerpo de POST / PUT
const validateProductBody = (body: any): { error?: string; data?: any } => {
  const { name, price, stock, description, brand, img } = body || {};

  if (!isText(name)) return { error: 'name es obligatorio y debe ser texto' };
  if (!isText(description)) return { error: 'description es obligatorio y debe ser texto' };

  const validPrice = parsePrice(price);
  if (validPrice === null) {
    return { error: 'price debe ser numérico, mayor que cero y con máximo 2 decimales' };
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return { error: 'stock es obligatorio y debe ser un entero mayor o igual a 0' };
  }
  if (!isOptionalText(brand) || !isOptionalText(img)) {
    return { error: 'brand e img deben ser texto' };
  }

  return {
    data: {
      name: name.trim(),
      price: validPrice,
      stock,
      description: description.trim(),
      brand: brand ?? null,
      img: img ?? null,
    },
  };
};

const findActiveById = async (id: number): Promise<any> => {
  const [rows]: any = await pool.query(
    'SELECT * FROM products WHERE id = ? AND active = TRUE',
    [id]
  );
  return rows[0] || null;
};

const badId = (res: any) =>
  res.status(400).json({ ok: false, message: 'El id debe ser un entero positivo' });

const notFound = (res: any) =>
  res.status(404).json({ ok: false, message: 'Producto no encontrado' });

// ---------- Controladores ----------

export const getAll = async (req: any, res: any) => {
  try {
    const { active } = req.query;

    // Solo se listan activos; active=TRUE es el único valor aceptado
    if (active !== undefined && String(active).toLowerCase() !== 'true') {
      return res.status(400).json({ ok: false, message: 'El query param active solo acepta TRUE' });
    }

    const [rows]: any = await pool.query('SELECT * FROM products WHERE active = ?', [true]);
    return res.status(200).json({ ok: true, data: rows });
  } catch (error: any) {
    return serverError(res, error);
  }
};

export const getById = async (req: any, res: any) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return badId(res);

    const product = await findActiveById(id);
    if (!product) return notFound(res);

    return res.status(200).json({ ok: true, data: product });
  } catch (error: any) {
    return serverError(res, error);
  }
};

export const create = async (req: any, res: any) => {
  try {
    const { error, data } = validateProductBody(req.body);
    if (error) return res.status(400).json({ ok: false, message: error });

    const [result]: any = await pool.query(
      'INSERT INTO products (name, price, stock, description, brand, img) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.price, data.stock, data.description, data.brand, data.img]
    );

    const product = await findActiveById(result.insertId);
    return res.status(201).json({ ok: true, message: 'Producto creado', data: product });
  } catch (error: any) {
    return serverError(res, error);
  }
};

export const update = async (req: any, res: any) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return badId(res);

    const { error, data } = validateProductBody(req.body);
    if (error) return res.status(400).json({ ok: false, message: error });

    if (!(await findActiveById(id))) return notFound(res);

    await pool.query(
      `UPDATE products
       SET name = ?, price = ?, stock = ?, description = ?, brand = ?, img = ?
       WHERE id = ? AND active = TRUE`,
      [data.name, data.price, data.stock, data.description, data.brand, data.img, id]
    );

    const product = await findActiveById(id);
    return res.status(200).json({ ok: true, message: 'Producto actualizado', data: product });
  } catch (error: any) {
    return serverError(res, error);
  }
};

// Baja lógica: active = FALSE (sin DELETE físico)
export const remove = async (req: any, res: any) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return badId(res);

    if (!(await findActiveById(id))) return notFound(res);

    await pool.query('UPDATE products SET active = FALSE WHERE id = ?', [id]);
    return res.status(200).json({ ok: true, message: 'Producto dado de baja' });
  } catch (error: any) {
    return serverError(res, error);
  }
};

export const changePrice = async (req: any, res: any) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return badId(res);

    const body: any = req.body || {};
    if (Object.keys(body).length !== 1 || !('price' in body)) {
      return res.status(400).json({ ok: false, message: 'El cuerpo debe contener únicamente price' });
    }

    const price = parsePrice(body.price);
    if (price === null) {
      return res.status(400).json({
        ok: false,
        message: 'price debe ser numérico, mayor que cero y con máximo 2 decimales',
      });
    }

    if (!(await findActiveById(id))) return notFound(res);

    await pool.query('UPDATE products SET price = ? WHERE id = ? AND active = TRUE', [price, id]);

    const product = await findActiveById(id);
    return res.status(200).json({ ok: true, message: 'Precio actualizado', data: product });
  } catch (error: any) {
    return serverError(res, error);
  }
};
