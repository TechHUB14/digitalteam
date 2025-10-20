import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./components/Home";
import Faculty from "./components/Faculty";
import Member from "./components/Member";
import { Team } from "./components/Team";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/faculty-dashboard" element={<Faculty />} />
        <Route path="/member-dashboard" element={<Member />} /> 
        <Route path="/team" element={<Team />} /> 

      </Routes>
    </Router>
  );
}

export default App;
