import { useEffect, useRef, useState } from 'react'
import { request, getSession, saveSession, clearSession } from './api'
import './App.css'
const empty = { product_name: '', description: '', price: '', quantity: '' }
const currency = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
function Icon({ name = 'box', size = 20 }) {
  const paths = {
    box: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9M7.5 5.5l9 5"/></>,
    plus: <path d="M12 5v14M5 12h14"/>, search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></>,
    edit: <><path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5"/></>,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>, logout: <><path d="M9 4H4v16h5M13 8l4 4-4 4M8 12h13"/></>,
    chart: <><path d="M4 20h17M7 16V9M12 16V4M17 16v-5"/></>, arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>, check: <path d="m5 12 4 4L19 6"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
function ProductDialog({ product, onClose, onSave }) {
  const dialog = useRef(null)
  const [form, setForm] = useState(product || empty)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  useEffect(() => { dialog.current.showModal() }, [])
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setErrors({})
    try { const data = await request(product ? `/products/${product.id}` : '/products', { method: product ? 'PUT' : 'POST', body: form }); onSave(data.product, data.message) }
    catch (err) { setError(err.message); setErrors(err.errors || {}) } finally { setBusy(false) }
  }
  const field = key => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }), 'aria-invalid': !!errors[key] })
  return <dialog ref={dialog} className="modal" onCancel={e => { if (busy) e.preventDefault(); else onClose() }}>
    <div className="modal-heading"><div><span className="eyebrow">YOUR INVENTORY</span><h2>{product ? 'Edit product' : 'Add a product'}</h2></div><button className="icon-button" aria-label="Close form" disabled={busy} onClick={onClose}><Icon name="close"/></button></div>
    <p className="muted">{product ? 'Update the details of your product.' : 'A few details, and your new product is ready.'}</p>
    <form onSubmit={submit}>{error && <div className="error" role="alert">{error}</div>}
      <label>Product name<input autoFocus {...field('product_name')} required maxLength={100} placeholder="e.g. Wireless keyboard"/>{errors.product_name && <small className="field-error">{errors.product_name}</small>}</label>
      <label>Description <span className="optional">optional</span><textarea {...field('description')} maxLength={65535} rows={3} placeholder="What makes this product special?"/>{errors.description && <small className="field-error">{errors.description}</small>}</label>
      <div className="form-row"><label>Price (₱)<input {...field('price')} type="number" required min="0" max="99999999.99" step="0.01" placeholder="0.00"/>{errors.price && <small className="field-error">{errors.price}</small>}</label><label>Quantity<input {...field('quantity')} type="number" required min="0" max="2147483647" step="1" placeholder="0"/>{errors.quantity && <small className="field-error">{errors.quantity}</small>}</label></div>
      <div className="modal-actions"><button type="button" className="secondary" onClick={onClose} disabled={busy}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : product ? 'Save changes' : 'Add product'}<Icon name="check" size={17}/></button></div>
    </form></dialog>
}
function DeleteDialog({ product, onClose, onDelete }) {
  const dialog = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { dialog.current.showModal() }, [])
  async function remove() {
    setBusy(true)
    try { await request(`/products/${product.id}`, { method: 'DELETE' }); onDelete(product.id) }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="modal delete-modal" onCancel={e => { if (busy) e.preventDefault(); else onClose() }}><div className="delete-symbol"><Icon name="trash" size={27}/></div><h2>Delete this product?</h2><p className="muted"><strong>{product.product_name}</strong> will be permanently removed from your inventory.</p>{error && <div className="error" role="alert">{error}</div>}<div className="modal-actions"><button className="secondary" disabled={busy} onClick={onClose}>Keep product</button><button className="danger" disabled={busy} onClick={remove}>{busy ? 'Deleting…' : 'Delete product'}</button></div></dialog>
}
function Auth({ onLogin }) {
  const [register, setRegister] = useState(false)
  const [form, setForm] = useState({ identity: '', username: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const data = await request(`/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: form, auth: false })
      if (register) { setRegister(false); setNotice(data.message); setForm({ ...form, identity: form.username, password: '' }) }
      else {
        if (!data.access_token || !data.refresh_token || !data.user?.id || !data.user?.username) {
          throw new Error('Sign-in did not complete. Refresh this page and try again.')
        }
        saveSession(data); onLogin(data.user)
      }
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const field = key => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) })
  return <div className="auth-page"><section className="auth-story"><a className="brand" href="./"><span className="brand-icon"><Icon size={24}/></span>stockroom<span className="brand-dot">.</span></a><div className="story-content"><span className="eyebrow">LESS CLUTTER. MORE CONTROL.</span><h1>A little order.<br/>A lot of possibility.</h1><p>Your products, quantities, and prices.<br/>All together in one simple workspace.</p><div className="illustration" aria-hidden="true"><div className="visual-card"><span className="visual-icon"><Icon size={38}/></span><div><strong>Everything in its place</strong><span>Make room for what comes next.</span></div></div><div className="visual-bars"><i/><i/><i/><i/><i/></div><div className="visual-label"><span className="green-dot"/> Inventory, organized.</div></div></div><span className="story-footer">PRODUCT MANAGEMENT, MADE SIMPLE</span></section><section className="auth-form-panel"><form className="auth-form" onSubmit={submit}><span className="eyebrow">WELCOME TO STOCKROOM</span><h2>{register ? 'Create your account' : 'Good to see you.'}</h2><p className="muted">{register ? 'Start managing your products in one place.' : 'Sign in to make yourself at home.'}</p>{error && <div className="error" role="alert">{error}</div>}{notice && <div className="success" role="status">{notice}</div>}{register ? <><label>Username<input {...field('username')} autoComplete="username" required minLength={3} maxLength={40} pattern="[a-zA-Z0-9_]+" placeholder="Your username"/></label><label>Email address<input {...field('email')} type="email" autoComplete="email" required placeholder="you@example.com"/></label></> : <label>Username or email<input {...field('identity')} autoComplete="username" required placeholder="you@example.com"/></label>}<label>Password<input {...field('password')} type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : undefined} required placeholder={register ? 'At least 8 characters' : 'Enter your password'}/></label><button className="primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}<Icon name="arrow" size={18}/></button><p className="switch-auth">{register ? 'Already have an account?' : 'New to Stockroom?'} <button type="button" className="text-button" disabled={busy} onClick={() => { setRegister(!register); setError(''); setNotice('') }}>{register ? 'Sign in' : 'Create an account'}</button></p><div className="auth-footnote"><span className="green-dot"/> A secure space for your inventory</div></form></section></div>
}
export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(!!getSession())
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [modal, setModal] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)
  useEffect(() => {
    if (getSession()) request('/auth/me').then(data => setUser(data.user)).catch(err => { if (err.status === 401 || err.status === 403) clearSession(); else setError(err.message) }).finally(() => setChecking(false))
    const expired = () => { setUser(null); setProducts([]); setModal(null); setDeleting(null); setError('Your session expired. Please sign in again.') }
    window.addEventListener('session-expired', expired)
    return () => window.removeEventListener('session-expired', expired)
  }, [])
  async function load() {
    setLoading(true); setError('')
    try { const data = await request('/products'); setProducts(data.products) }
    catch (err) { setError(err.message) } finally { setLoading(false) }
  }
  useEffect(() => {
    if (!user) return
    let active = true
    request('/products').then(data => { if (active) setProducts(data.products) })
      .catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(timer) } }, [notice])
  async function logout() {
    setLoggingOut(true)
    try { await request('/auth/logout', { method: 'POST', body: { refresh_token: getSession()?.refresh_token }, auth: false }); clearSession(); setUser(null); setProducts([]); setNotice('') }
    catch (err) { setError(`Could not sign out: ${err.message}`) } finally { setLoggingOut(false) }
  }
  if (checking) return <div className="boot"><span className="brand-icon"><Icon size={28}/></span><p>Opening your workspace…</p></div>
  if (!user) return <>{error && <div className="global-error" role="alert">{error}</div>}<Auth onLogin={value => { setError(''); setUser(value) }}/></>
  const isAdmin = user.role === 'admin'
  const visible = products.filter(p => `${p.product_name} ${p.description}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || (filter === 'low' ? Number(p.quantity) > 0 && Number(p.quantity) <= 10 : Number(p.quantity) === 0))).sort((a, b) => sort === 'name' ? a.product_name.localeCompare(b.product_name) : sort === 'price' ? Number(a.price) - Number(b.price) : Number(b.id) - Number(a.id))
  const units = products.reduce((n, p) => n + Number(p.quantity), 0)
  const value = products.reduce((n, p) => n + Number(p.quantity) * Number(p.price), 0)
  const low = products.filter(p => Number(p.quantity) <= 10).length
  return <div className="workspace"><aside className="sidebar"><a className="brand" href="./"><span className="brand-icon"><Icon size={22}/></span>stockroom<span className="brand-dot">.</span></a><span className="nav-label">WORKSPACE</span><button className="nav-item active" onClick={() => { setFilter('all'); setQuery('') }}><Icon/>Products<span>{products.length}</span></button><div className="sidebar-note"><span className="green-dot"/><strong>A little more organized.</strong><p>Everything you need to keep your inventory moving.</p></div><div className="profile"><span className="avatar">{user.username.slice(0, 2).toUpperCase()}</span><div><strong>{user.username}</strong><small>{isAdmin ? 'Administrator' : 'View-only account'}</small></div><button className="icon-button" aria-label="Sign out" title="Sign out" disabled={loggingOut} onClick={logout}><Icon name="logout" size={19}/></button></div></aside><main className="main"><header className="topbar"><span>Workspace <span className="breadcrumb-separator">/</span> <strong>Products</strong></span><span className="topbar-status"><span className="green-dot"/>Your inventory workspace</span></header><div className="main-content"><div className="page-heading"><div><span className="eyebrow">YOUR INVENTORY, AT A GLANCE</span><h1>Products<span className="brand-dot">.</span></h1><p className="muted">Keep track of the things that keep your business moving.</p></div>{isAdmin && <button className="primary" onClick={() => setModal({ product: null })}><Icon name="plus" size={18}/>Add product</button>}</div>
    <section className="stats" aria-label="Inventory summary"><div className="stat"><span className="stat-label">Total products<Icon/></span><strong>{products.length.toLocaleString()}</strong><small>Products in your collection</small></div><div className="stat"><span className="stat-label">Units in stock<Icon name="chart"/></span><strong>{units.toLocaleString()}</strong><small>Across your entire inventory</small></div><div className="stat"><span className="stat-label">Inventory value<span className="peso">₱</span></span><strong>{currency.format(value)}</strong><small>Based on current product prices</small></div><div className="stat"><span className="stat-label">Needs attention<span className="attention-icon">!</span></span><strong>{low}<span className="stat-badge">Low stock</span></strong><small>Products with 10 units or fewer</small></div></section>
    {!isAdmin && <p className="view-only-note">View-only access. An administrator manages product changes.</p>}
    {error && <div className="error" role="alert">{error}<button className="text-button" onClick={load}>Try again</button></div>}{notice && <div className="toast" role="status"><Icon name="check" size={18}/>{notice}</div>}
    <section className="inventory-panel"><div className="panel-heading"><div><h2>Product collection <span>{products.length}</span></h2><p className="muted">A home for every product.</p></div><button className="text-button refresh-button" disabled={loading} onClick={load}>{loading ? 'Refreshing…' : 'Refresh'}</button></div><div className="toolbar"><div className="tabs" aria-label="Filter products">{[['all', 'All products'], ['low', 'Low stock'], ['out', 'Out of stock']].map(([key, label]) => <button key={key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)} aria-pressed={filter === key}>{label}</button>)}</div><div className="search-sort"><div className="search"><Icon name="search" size={17}/><input aria-label="Search products" placeholder="Search products…" value={query} onChange={e => setQuery(e.target.value)}/></div><select aria-label="Sort products" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="name">Name: A–Z</option><option value="price">Price: low to high</option></select></div></div>
    <div className="table-scroll"><table><thead><tr><th>PRODUCT</th><th>PRICE</th><th>STOCK</th><th>ADDED</th>{isAdmin && <th className="actions-heading">ACTIONS</th>}</tr></thead><tbody>{visible.map(p => <tr key={p.id}><td><div className="product-cell"><span className="product-icon"><Icon size={23}/></span><div><strong>{p.product_name}</strong><span title={p.description}>{p.description || 'No description added'}</span></div></div></td><td className="price-cell">{currency.format(Number(p.price))}</td><td><span className={`stock-pill ${Number(p.quantity) === 0 ? 'out' : Number(p.quantity) <= 10 ? 'low' : ''}`}><i/>{Number(p.quantity) === 0 ? 'Out of stock' : `${Number(p.quantity).toLocaleString()} in stock`}</span></td><td className="date-cell">{new Date(p.created_at.replace(' ', 'T')).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>{isAdmin && <td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${p.product_name}`} title="Edit product" onClick={() => setModal({ product: p })}><Icon name="edit" size={17}/></button><button className="icon-button delete-button" aria-label={`Delete ${p.product_name}`} title="Delete product" onClick={() => setDeleting(p)}><Icon name="trash" size={17}/></button></div></td>}</tr>)}</tbody></table></div>
    {loading && !products.length ? <div className="empty-state"><p>Loading your products…</p></div> : !visible.length && <div className="empty-state"><span className="empty-icon"><Icon size={35}/></span><h3>{error ? 'Your inventory is unavailable' : products.length ? 'No products match your search' : 'Make room for your first product'}</h3><p>{error ? 'Check the connection and try again.' : products.length ? 'Try another search or stock filter.' : isAdmin ? 'Add a product and start building your collection.' : 'Products will appear here when an administrator adds them.'}</p>{isAdmin && !products.length && !error && <button className="primary" onClick={() => setModal({ product: null })}><Icon name="plus" size={17}/>Add your first product</button>}</div>}
    <div className="table-footer"><span>Showing {visible.length} of {products.length} products</span><span>Made for a little more clarity.</span></div></section><footer className="page-footer">Stockroom <span>·</span> Your products. In good order.</footer></div></main>
    {isAdmin && modal && <ProductDialog product={modal.product} onClose={() => setModal(null)} onSave={(product, message) => { setProducts(previous => modal.product ? previous.map(p => p.id === product.id ? product : p) : [product, ...previous]); setModal(null); setNotice(message) }}/>}
    {isAdmin && deleting && <DeleteDialog product={deleting} onClose={() => setDeleting(null)} onDelete={id => { setProducts(previous => previous.filter(p => p.id !== id)); setDeleting(null); setNotice('Product deleted.') }}/>}</div>
}
