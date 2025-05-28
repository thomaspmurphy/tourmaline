import { configureStore } from '@reduxjs/toolkit'
import threadsReducer from './slices/threadsSlice'
import usersReducer from './slices/usersSlice'

export const store = configureStore({
  reducer: {
    threads: threadsReducer,
    users: usersReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 