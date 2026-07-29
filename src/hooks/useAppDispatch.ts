import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../redux/store'

// Dùng thay cho useDispatch thuần để có đúng type AppDispatch mọi nơi.
export const useAppDispatch = () => useDispatch<AppDispatch>()
