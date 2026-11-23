import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App'
import './index.css'
import './dark.css'

export const createRoot = ViteReactSSG({ routes })
