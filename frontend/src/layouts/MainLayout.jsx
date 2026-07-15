import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default function MainLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}