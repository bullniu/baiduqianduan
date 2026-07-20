import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ProcedureList } from "@/pages/ProcedureList";
import { ProcedureDetail } from "@/pages/ProcedureDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProcedureList />} />
        <Route path="/procedure/:id" element={<ProcedureDetail />} />
      </Routes>
    </Router>
  );
}
