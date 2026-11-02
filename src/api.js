export async function fetchParts(number, brand, signal) {
  const url = new URL('https://api.favorit-parts.ru/hs/hsprice/');
  url.searchParams.set('key', import.meta.env.VITE_FAVORIT_API_KEY || '00000000-0000-0000-0000-000000000001');
  url.searchParams.set('number', number.trim());
  if (brand) {
    url.searchParams.set('brand', brand);
    url.searchParams.set('analogues', 'on');
  }

  const timeout = AbortSignal.timeout(15000);
  let response;
  try {
    response = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(timeout.aborted ? 'Сервис не отвечает. Попробуйте позже.' : 'Не удалось выполнить запрос. Проверьте соединение.', { cause: error });
  }
  if (!response.ok) throw new Error(`Ошибка сервиса: ${response.status}`);

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  if (!Array.isArray(data.goods)) throw new Error('Неверный формат ответа API');
  return data.goods.filter((part) => part.brand?.trim());
}

export function getOffers(parts) {
  return parts.flatMap((part) => [part, ...(part.analogues || [])]).flatMap((part) => {
    const base = { brand: part.brand, number: part.number, name: part.name };
    if (!part.warehouses.length) return [{ ...base, warehouse: '', price: null, stock: 0 }];
    return part.warehouses.map((warehouse) => ({
      ...base,
      warehouse: warehouse.code || warehouse.id,
      price: warehouse.price,
      stock: warehouse.stock,
    }));
  });
}
