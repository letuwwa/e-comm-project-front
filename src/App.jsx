import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5000';
const ACCESS_TOKEN_KEY = 'ecomm_access_token';
const REFRESH_TOKEN_KEY = 'ecomm_refresh_token';

const emptyAuthForm = {
  email: '',
  password: '',
};

const emptyProductForm = {
  name: '',
  price: '',
  description: '',
};

function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

function storeTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function apiRequest(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.msg || data.message || data.error || 'Request failed');
    error.status = response.status;
    throw error;
  }

  return data;
}

async function refreshAccessToken() {
  const { refreshToken } = getStoredTokens();

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const data = await apiRequest('/auth/refresh', {
    method: 'POST',
    token: refreshToken,
  });

  storeTokens(data.access_token, refreshToken);
  return data.access_token;
}

async function authorizedRequest(path, options = {}) {
  const { accessToken } = getStoredTokens();

  if (!accessToken) {
    throw new Error('No access token available');
  }

  try {
    return await apiRequest(path, { ...options, token: accessToken });
  } catch (error) {
    if (error.status === 401) {
      const nextAccessToken = await refreshAccessToken();
      return apiRequest(path, { ...options, token: nextAccessToken });
    }

    throw error;
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

function App() {
  const [mode, setMode] = useState('login');
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [products, setProducts] = useState([]);
  const [publicProducts, setPublicProducts] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getStoredTokens().accessToken));
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadPublicProducts() {
    try {
      const data = await apiRequest('/products/public');
      setPublicProducts(data);
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  async function loadProducts() {
    setIsBusy(true);
    setError('');

    try {
      const data = await authorizedRequest('/products');
      setProducts(data);
      setIsAuthenticated(true);
    } catch (loadError) {
      clearTokens();
      setIsAuthenticated(false);
      setProducts([]);
      setError(loadError.message);
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    loadPublicProducts();

    if (getStoredTokens().accessToken) {
      loadProducts();
    }
  }, []);

  function updateAuthField(event) {
    const { name, value } = event.target;
    setAuthForm((current) => ({ ...current, [name]: value }));
  }

  function updateProductField(event) {
    const { name, value } = event.target;
    setProductForm((current) => ({ ...current, [name]: value }));
  }

  async function handleRegister(event) {
    event.preventDefault();
    setIsBusy(true);
    setError('');
    setMessage('');

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: authForm,
      });
      setMessage(data.msg || 'User created. You can sign in now.');
      setMode('login');
      setAuthForm(emptyAuthForm);
    } catch (registerError) {
      setError(registerError.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setIsBusy(true);
    setError('');
    setMessage('');

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: authForm,
      });
      storeTokens(data.access_token, data.refresh_token);
      setAuthForm(emptyAuthForm);
      setIsAuthenticated(true);
      setMessage('Signed in successfully.');
      await loadProducts();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateProduct(event) {
    event.preventDefault();
    setIsBusy(true);
    setError('');
    setMessage('');

    try {
      await authorizedRequest('/products', {
        method: 'POST',
        body: {
          ...productForm,
          price: Number(productForm.price),
        },
      });
      setProductForm(emptyProductForm);
      setMessage('Product created.');
      await loadPublicProducts();
      await loadProducts();
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteProduct(productId) {
    setIsBusy(true);
    setError('');
    setMessage('');

    try {
      await authorizedRequest(`/products/${productId}`, { method: 'DELETE' });
      setProducts((current) => current.filter((product) => product.id !== productId));
      setPublicProducts((current) => current.filter((product) => product.id !== productId));
      setMessage('Product deleted.');
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogout() {
    setIsBusy(true);
    setError('');
    setMessage('');

    const { accessToken, refreshToken } = getStoredTokens();

    try {
      if (accessToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          token: accessToken,
        });
      }

      if (refreshToken) {
        await apiRequest('/auth/logout/refresh', {
          method: 'POST',
          token: refreshToken,
        });
      }
    } catch (logoutError) {
      setError(logoutError.message);
    } finally {
      clearTokens();
      setProducts([]);
      setIsAuthenticated(false);
      setMode('login');
      setMessage('Signed out.');
      setIsBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Flask + React starter</p>
          <h1>JWT auth and a simple products dashboard</h1>
          <p className="lede">
            Frontend targets <code>{API_URL}</code> and uses the Flask endpoints for
            register, login, refresh, logout, and product CRUD.
          </p>
        </div>
        {message ? <p className="notice success">{message}</p> : null}
        {error ? <p className="notice error">{error}</p> : null}
      </section>

      <section className="grid">
        <article className="panel">
          <div className="panel-header">
            <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                setMode((current) => (current === 'login' ? 'register' : 'login'));
                setError('');
                setMessage('');
              }}
            >
              {mode === 'login' ? 'Need an account?' : 'Have an account?'}
            </button>
          </div>

          <form className="stack" onSubmit={mode === 'login' ? handleLogin : handleRegister}>
            <label>
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={authForm.email}
                onChange={updateAuthField}
                placeholder="user@example.com"
                required
              />
            </label>

            <label>
              <span>Password</span>
              <input
                name="password"
                type="password"
                value={authForm.password}
                onChange={updateAuthField}
                placeholder="At least one strong password"
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={isBusy}>
              {isBusy ? 'Working...' : mode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>My products</h2>
            <div className="actions">
              <button className="ghost-button" type="button" onClick={loadProducts} disabled={isBusy}>
                Refresh
              </button>
              <button
                className="ghost-button"
                type="button"
                onClick={handleLogout}
                disabled={isBusy || !isAuthenticated}
              >
                Logout
              </button>
            </div>
          </div>

          <form className="stack product-form" onSubmit={handleCreateProduct}>
            <label>
              <span>Name</span>
              <input
                name="name"
                value={productForm.name}
                onChange={updateProductField}
                placeholder="Wireless mouse"
                required
              />
            </label>

            <label>
              <span>Price</span>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={productForm.price}
                onChange={updateProductField}
                placeholder="49.99"
                required
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                name="description"
                rows="4"
                value={productForm.description}
                onChange={updateProductField}
                placeholder="Short product description"
                required
              />
            </label>

            <button className="primary-button" type="submit" disabled={isBusy || !isAuthenticated}>
              Add product
            </button>
          </form>

          <div className="product-list">
            {products.length === 0 ? (
              <div className="empty-state">
                <p>{isAuthenticated ? 'No products yet.' : 'Login to load your products.'}</p>
              </div>
            ) : (
              products.map((product) => (
                <div className="product-card" key={product.id}>
                  <div>
                    <h3>{product.name}</h3>
                    <p>{formatPrice(product.price)}</p>
                  </div>
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => handleDeleteProduct(product.id)}
                    disabled={isBusy}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="panel public-panel">
        <div className="panel-header">
          <h2>All products</h2>
          <button className="ghost-button" type="button" onClick={loadPublicProducts} disabled={isBusy}>
            Refresh public feed
          </button>
        </div>

        <div className="product-list">
          {publicProducts.length === 0 ? (
            <div className="empty-state">
              <p>No public products found.</p>
            </div>
          ) : (
            publicProducts.map((product) => (
              <div className="product-card" key={product.id}>
                <div>
                  <h3>{product.name}</h3>
                  <p>{formatPrice(product.price)}</p>
                </div>
                <span className="owner-tag">{product.owner_email}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
