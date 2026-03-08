import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import './css/index.css'
import App from './App.tsx'
//import Login from './login/page.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
