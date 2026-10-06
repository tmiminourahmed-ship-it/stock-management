# 📦 StockFlow — Système de Gestion de Stock

Application MERN Stack complète pour la gestion de stock d'un petit commerce ou magasin.

---

## 🚀 Technologies

**Frontend:** React 18 · Vite · React Router · Axios · Recharts · React Toastify

**Backend:** Node.js · Express.js · Mongoose · MongoDB Atlas

---

## 📂 Architecture

```
stock-management/
├── client/                   # Frontend React/Vite
│   └── src/
│       ├── components/       # Composants réutilisables
│       ├── layouts/          # Sidebar, Header, MainLayout
│       ├── pages/            # Dashboard, Products, StockEntry...
│       ├── services/api.js   # Couche Axios centralisée
│       ├── hooks/useApi.js   # Hook API personnalisé
│       └── utils/format.js   # Formatage devise et dates
└── server/                   # Backend Express
    ├── config/db.js          # Connexion MongoDB
    ├── controllers/          # Logique métier
    ├── models/               # Schémas Mongoose
    ├── routes/               # Routes API
    ├── middleware/           # Gestion des erreurs
    └── utils/                # Helpers + seed script
```

---

## ⚙️ Installation

### 1. Prérequis

- Node.js ≥ 18
- npm
- Un compte MongoDB Atlas

### 2. Backend

```bash
cd server
npm install
```

Créez/modifiez le fichier `server/.env` :

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/stockflow?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
```

> ⚠️ **Ne commitez jamais ce fichier !** Il est dans `.gitignore`.

```bash
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

L'application sera disponible sur : **http://localhost:5173**

---

## 🗄️ MongoDB Atlas — Configuration

1. Créez un cluster sur [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Créez un utilisateur de base de données
3. Autorisez votre IP (ou 0.0.0.0/0 pour le développement)
4. Copiez la chaîne de connexion dans `server/.env`

---

## 🌱 Données de Test (Optionnel)

Pour insérer des produits tunisiens réalistes :

```bash
cd server
npm run seed
```

> ⚠️ Efface toutes les données existantes et insère les données de test.

---

## 📡 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/products` | Liste des produits |
| POST | `/api/products` | Créer un produit |
| PUT | `/api/products/:id` | Modifier un produit |
| DELETE | `/api/products/:id` | Supprimer un produit |
| POST | `/api/stock/entry` | Enregistrer une entrée stock |
| GET | `/api/stock/movements` | Historique des mouvements |
| POST | `/api/sales` | Enregistrer une vente |
| GET | `/api/sales` | Liste des ventes |
| GET | `/api/dashboard/stats` | Statistiques tableau de bord |
| GET | `/api/dashboard/sales-chart` | Données graphique ventes |
| GET | `/api/dashboard/profit-chart` | Données graphique bénéfices |
| GET | `/api/reports/profit` | Rapport bénéfices |
| GET | `/api/reports/sales` | Rapport ventes |

---

## 💰 Calcul du Stock et des Bénéfices

### Entrée Stock
```
stockQuantité = stockQuantité + quantitéEntrée
```

### Vente
```
Chiffre d'affaires = quantité × prixDeVente
Coût = quantité × prixD'achat
Bénéfice = Chiffre d'affaires − Coût
stockQuantité = stockQuantité − quantité
```

Le bénéfice est **toujours calculé automatiquement** depuis les données de vente enregistrées.

---

## 🔒 Sécurité

- Les identifiants MongoDB ne sont **jamais** dans le code source
- Le fichier `.env` est dans `.gitignore`
- Validation côté serveur sur toutes les routes
- Transactions atomiques MongoDB pour les opérations critiques
- Vérification du stock avant chaque vente

---

## 🖥️ Pages de l'application

| Page | URL | Description |
|------|-----|-------------|
| Tableau de bord | `/` | Statistiques, graphiques, alertes |
| Produits | `/produits` | CRUD produits avec recherche |
| Entrée Stock | `/entree-stock` | Enregistrer une réception |
| Nouvelle Vente | `/nouvelle-vente` | Enregistrer une vente |
| Historique | `/historique` | Tous les mouvements filtrables |
| Bénéfices | `/benefices` | Analyse rentabilité |
| Rapports | `/rapports` | Rapport ventes détaillé |

---

## 🎯 Commandes

```bash
# Backend (développement)
cd server && npm run dev

# Frontend (développement)  
cd client && npm run dev

# Seed données de test
cd server && npm run seed
```
