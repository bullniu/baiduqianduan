import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ProcedureList } from "@/pages/ProcedureList";
import { ProcedureDetail } from "@/pages/ProcedureDetail";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<ProcedureList />} />
          <Route path="/procedure/:id" element={<ProcedureDetail />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
