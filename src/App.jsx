import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Maintenance } from "./components/Maintenance";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="*" element={<Maintenance />} />
      </Routes>
    </Router>
  );
}

export default App;
