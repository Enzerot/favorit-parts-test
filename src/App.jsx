import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { brandSelected, fetchBrands, fetchOffers, numberChanged } from './store.js';

const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });

function Loader() {
  return <div className="my-3" role="status"><span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />Загрузка...</div>;
}

export default function App() {
  const dispatch = useDispatch();
  const { number, brand, brands, offers } = useSelector((state) => state.search);
  const [limit, setLimit] = useState(30);

  useEffect(() => {
    if (!number.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      dispatch(fetchBrands(number.trim(), { signal: controller.signal }));
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [number, dispatch]);

  useEffect(() => {
    if (!brand) return;
    const request = dispatch(fetchOffers({ number: number.trim(), brand }));
    return () => request.abort();
  }, [number, brand, dispatch]);

  return (
    <main className="container py-4">
      <h1 className="h3 mb-4">Поиск автозапчастей</h1>
      <div className="row g-3 mb-4">
        <div className="col-sm-6">
          <label className="form-label" htmlFor="number">Артикул</label>
          <input
            id="number"
            className="form-control"
            placeholder="01089"
            autoComplete="off"
            maxLength={100}
            value={number}
            onChange={(event) => { dispatch(numberChanged(event.target.value)); setLimit(30); }}
          />
        </div>
        <div className="col-sm-6">
          <label className="form-label" htmlFor="brand">Производитель</label>
          <select
            id="brand"
            className="form-select"
            value={brand}
            disabled={brands.status !== 'success' || !brands.items.length}
            onChange={(event) => { dispatch(brandSelected(event.target.value)); setLimit(30); }}
          >
            <option value="">Выберите производителя</option>
            {brands.items.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      {brands.status === 'loading' && <Loader />}
      {brands.status === 'error' && <div className="alert alert-danger" role="alert">
        {brands.error}
        <button className="btn btn-sm btn-outline-danger ms-3" onClick={() => dispatch(fetchBrands(number.trim()))}>Повторить</button>
      </div>}
      {brands.status === 'success' && !brands.items.length && <p role="status">По этому артикулу ничего не найдено.</p>}

      {offers.status === 'loading' && <Loader />}
      {offers.status === 'error' && <div className="alert alert-danger" role="alert">
        {offers.error}
        <button className="btn btn-sm btn-outline-danger ms-3" onClick={() => dispatch(fetchOffers({ number: number.trim(), brand }))}>Повторить</button>
      </div>}
      {offers.status === 'success' && !offers.items.length && <p role="status">Предложений не найдено.</p>}
      {offers.status === 'success' && offers.items.length > 0 && <>
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead><tr><th scope="col">Деталь / Производитель</th><th scope="col">Склад</th><th scope="col" className="text-end">Остаток</th><th scope="col" className="text-end">Цена</th></tr></thead>
            <tbody>
              {offers.items.slice(0, limit).map((offer, index) => <tr key={index}>
                <td><div>{offer.brand} {offer.number}</div><small className="text-secondary">{offer.name}</small></td>
                <td>{offer.warehouse || 'Нет на складах'}</td>
                <td className="text-end">{offer.stock} шт.</td>
                <td className="text-end">{offer.price === null ? 'Не указана' : money.format(offer.price)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {offers.items.length > limit && <button className="btn btn-outline-secondary" onClick={() => setLimit(limit + 30)}>Показать ещё</button>}
      </>}
    </main>
  );
}
