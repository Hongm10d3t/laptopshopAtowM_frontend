import { useSelector, type TypedUseSelectorHook } from 'react-redux'
import type { RootState } from '../redux/store'

// Dùng thay cho useSelector thuần để có đúng type RootState mọi nơi.
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
