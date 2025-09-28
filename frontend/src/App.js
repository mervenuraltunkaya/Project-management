import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Layout from "./components/Layout";
import ProjectDetail from "./components/ProjectDetail";
import Projects from "./components/Projects";
import ProjectEdit from "./components/UpdateProjectModal";
import TaskManager from "./components/TaskManager";
import TeamMember from "./components/TeamMember";
import FileUpload from "./components/TaskAttachment";
import Calendar from "./components/CalendarPage";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />

        {/* Layout ile sarmalanmış sayfalar */}
        <Route
          path="/projects"
          element={
            <Layout>
              <Projects />
            </Layout>
          }
        />

        {/* ProjectDetail için farklı layout ayarları */}
        <Route
          path="/projects/:id"
          element={
            <Layout showSidebar={true}>
              <ProjectDetail />
            </Layout>
          }
        />

        <Route path="/projects/:id/edit" element={<ProjectEdit />} />

        {/* Task Manager sayfası */}
        <Route
          path="/tasks"
          element={
            <Layout>
              <TaskManager />
            </Layout>
          }
        />

        {/* Team sayfası */}
        <Route
          path="/team"
          element={
            <Layout>
              <TeamMember />
            </Layout>
          }
        />

        {/* Task Manager sayfası */}
        <Route
          path="/fileUpload"
          element={
            <Layout>
              <FileUpload />
            </Layout>
          }
        />

        <Route
          path="/calendar"
          element={
            <Layout>
              <Calendar />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
