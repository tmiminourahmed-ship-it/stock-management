import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import StockEntry from './pages/StockEntry';
import NewSale from './pages/NewSale';
import History from './pages/History';
import Profits from './pages/Profits';
import Reports from './pages/Reports';

const App = () => {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/produits" element={<Products />} />
          <Route path="/entree-stock" element={<StockEntry />} />
          <Route path="/nouvelle-vente" element={<NewSale />} />
          <Route path="/historique" element={<History />} />
          <Route path="/benefices" element={<Profits />} />
          <Route path="/rapports" element={<Reports />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;
