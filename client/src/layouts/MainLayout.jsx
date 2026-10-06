import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
