import { useLocation } from 'react-router-dom';
import { formatDate } from '../utils/format';
import { Calendar } from 'lucide-react';

const pageTitles = {
  '/': { title: 'Tableau de bord', subtitle: 'Vue d\'ensemble de votre activité et alertes de stock' },
  '/produits': { title: 'Produits & Catalogue', subtitle: 'Gérez vos articles, prix d\'achat et vente par pack/unité' },
  '/entree-stock': { title: 'Entrée en Stock', subtitle: 'Ajoutez du stock et conservez la traçabilité des achats' },
  '/nouvelle-vente': { title: 'Nouvelle Vente', subtitle: 'Enregistrez vos ventes et suivez le bénéfice instantané' },
  '/historique': { title: 'Historique des Mouvements', subtitle: 'Consultez l\'historique complet des entrées et sorties' },
  '/benefices': { title: 'Analyse des Bénéfices', subtitle: 'Suivez vos gains nets jour par jour et par période' },
  '/rapports': { title: 'Rapports & Statistiques', subtitle: 'Statistiques détaillées sur vos performances de vente' },
};

const Header = () => {
  const location = useLocation();
  const page = pageTitles[location.pathname] || { title: 'StockFlow', subtitle: '' };
  const today = formatDate(new Date());

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-title">{page.title}</div>
        <div className="header-subtitle">{page.subtitle}</div>
      </div>
      <div className="header-right">
        <div className="header-pill">
          <Calendar size={15} className="text-primary" />
          <span>{today}</span>
        </div>
        <div className="header-avatar">SF</div>
      </div>
    </header>
  );
};

export default Header;
