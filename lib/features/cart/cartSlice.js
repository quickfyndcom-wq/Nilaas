import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

const emptyCart = { total: 0, cartItems: {}, hydrated: false }

function readCartFromStorage() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('cartState')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return {
      total: Number(parsed.total) || 0,
      cartItems:
        parsed.cartItems && typeof parsed.cartItems === 'object'
          ? parsed.cartItems
          : {},
    }
  } catch {
    return null
  }
}

function writeCartToStorage(state) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      'cartState',
      JSON.stringify({
        total: state.total || 0,
        cartItems: state.cartItems || {},
      })
    )
  } catch {}
}

export const uploadCart = createAsyncThunk(
  'cart/uploadCart',
  async ({ getToken }, thunkAPI) => {
    try {
      const { cartItems } = thunkAPI.getState().cart
      const token = await getToken()
      if (!token) return
      await axios.post(
        '/api/cart',
        { cart: cartItems },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.response?.data || error.message)
    }
  }
)

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async ({ getToken }, thunkAPI) => {
    try {
      const token = await getToken()
      if (!token) return thunkAPI.rejectWithValue('No token')
      const { data } = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return data
    } catch (error) {
      return thunkAPI.rejectWithValue(error?.response?.data || error.message)
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  // Always start empty for SSR; rehydrate on client mount
  initialState: emptyCart,
  reducers: {
    rehydrateCart: (state) => {
      const saved = readCartFromStorage()
      if (saved) {
        state.cartItems = saved.cartItems
        state.total =
          saved.total ||
          Object.values(saved.cartItems).reduce((a, n) => a + Number(n || 0), 0)
      }
      state.hydrated = true
    },
    addToCart: (state, action) => {
      const { productId } = action.payload
      if (!productId) return
      const id = String(productId)
      if (state.cartItems[id]) {
        state.cartItems[id]++
      } else {
        state.cartItems[id] = 1
      }
      state.total += 1
      writeCartToStorage(state)
    },
    removeFromCart: (state, action) => {
      const { productId } = action.payload
      const id = String(productId)
      if (state.cartItems[id]) {
        state.cartItems[id]--
        if (state.cartItems[id] === 0) {
          delete state.cartItems[id]
        }
        state.total = Math.max(0, state.total - 1)
        writeCartToStorage(state)
      }
    },
    deleteItemFromCart: (state, action) => {
      const { productId } = action.payload
      const id = String(productId)
      state.total = Math.max(
        0,
        state.total - (state.cartItems[id] ? state.cartItems[id] : 0)
      )
      delete state.cartItems[id]
      writeCartToStorage(state)
    },
    clearCart: (state) => {
      state.cartItems = {}
      state.total = 0
      writeCartToStorage(state)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCart.fulfilled, (state, action) => {
      const serverCart = action.payload?.cart
      if (!serverCart || typeof serverCart !== 'object') return

      const serverCount = Object.keys(serverCart).length
      const localCount = Object.keys(state.cartItems || {}).length

      // Don't wipe a local cart with an empty server cart
      if (serverCount === 0 && localCount > 0) return

      state.cartItems = serverCart
      state.total = Object.values(serverCart).reduce(
        (acc, item) => acc + Number(item || 0),
        0
      )
      writeCartToStorage(state)
    })
  },
})

export const {
  addToCart,
  removeFromCart,
  clearCart,
  deleteItemFromCart,
  rehydrateCart,
} = cartSlice.actions

export default cartSlice.reducer
