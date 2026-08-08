import { Outlet } from "react-router-dom";

import Header from "./Header";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  return (
    <>
      <Header />

      <div
        style={{
          display: "flex",
        }}
      >
        <Sidebar />

        <main
          style={{
            flex: 1,
            padding: "20px",
          }}
        >
          <Outlet />
        </main>
      </div>
    </>
  );
}