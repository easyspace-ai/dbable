import ReactDOM from 'react-dom/client'
import { NbGrid } from '../src'

const App = () => {
  return (
    <NbGrid 
      height={600}
      width={1200}
      className="w-full h-full"
    />
  )
}

const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(<App />)
