import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchParts, getOffers } from './api.js';

function emptyRequest() {
  return { items: [], status: 'idle', error: '' };
}

export const fetchBrands = createAsyncThunk('search/brands', async (number, { signal }) => {
  const parts = await fetchParts(number, undefined, signal);
  return [...new Set(parts.map((part) => part.brand.trim()))].sort();
});

export const fetchOffers = createAsyncThunk('search/offers', async ({ number, brand }, { signal }) => {
  return getOffers(await fetchParts(number, brand, signal));
});

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    number: '',
    brand: '',
    brands: emptyRequest(),
    offers: emptyRequest(),
  },
  reducers: {
    numberChanged(state, action) {
      state.number = action.payload;
      state.brand = '';
      state.brands = emptyRequest();
      state.offers = emptyRequest();
    },
    brandSelected(state, action) {
      if (state.brand === action.payload) return;
      state.brand = action.payload;
      state.offers = emptyRequest();
    },
  },
  extraReducers(builder) {
    builder.addCase(fetchBrands.pending, (state, action) => {
      state.brands = { items: [], status: 'loading', error: '', requestId: action.meta.requestId };
      state.brand = '';
      state.offers = emptyRequest();
    });
    builder.addCase(fetchBrands.fulfilled, (state, action) => {
      if (state.brands.requestId !== action.meta.requestId) return;
      state.brands = { items: action.payload, status: 'success', error: '' };
    });
    builder.addCase(fetchBrands.rejected, (state, action) => {
      if (state.brands.requestId !== action.meta.requestId) return;
      state.brands = { items: [], status: action.meta.aborted ? 'idle' : 'error', error: action.meta.aborted ? '' : action.error.message || 'Ошибка поиска' };
    });
    builder.addCase(fetchOffers.pending, (state, action) => {
      state.offers = { items: [], status: 'loading', error: '', requestId: action.meta.requestId };
    });
    builder.addCase(fetchOffers.fulfilled, (state, action) => {
      if (state.offers.requestId !== action.meta.requestId) return;
      state.offers = { items: action.payload, status: 'success', error: '' };
    });
    builder.addCase(fetchOffers.rejected, (state, action) => {
      if (state.offers.requestId !== action.meta.requestId) return;
      state.offers = { items: [], status: action.meta.aborted ? 'idle' : 'error', error: action.meta.aborted ? '' : action.error.message || 'Ошибка поиска' };
    });
  },
});

export const { numberChanged, brandSelected } = searchSlice.actions;
export const store = configureStore({ reducer: { search: searchSlice.reducer } });
