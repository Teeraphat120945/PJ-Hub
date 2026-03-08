import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserManagement from "./pages/UserManagement";
import CreateClass from "./pages/class/CreateClass";
import ClassUserManagement from "./pages/class/ClassUserManagement";
import ClassDetail from "./pages/class/ClassDetail"
import ClassEdit from "./pages/class/ClassEdit";
import CreateAssignment from "./pages/assignment/CreateAssignment";
import TeacherClassManagement from "./pages/class/TeacherClassManagement"
import AssignmentDetail from "./pages/assignment/AssignmentDetail";
import AssignmentManagement from "./pages/assignment/AssignmentManagement";
import AssignmentEdit from "./pages/assignment/AssignmentEdit";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<MainLayout />}>
        <Route index element={<Home />} />

        <Route path="/UserManagement" element={<UserManagement />} />

        <Route path="/CreateClass" element={<CreateClass />} />
        <Route path="/ClassUserManagement" element={<ClassUserManagement />} />
        <Route path="/TeacherClassManagement" element={<TeacherClassManagement />} />
        <Route path="/class/:class_id" element={<ClassDetail />} />
        <Route path="/class/:class_id/edit" element={<ClassEdit />} />

        <Route path="/assignments" element={<AssignmentManagement />} />
        <Route path="/create-assignment" element={<CreateAssignment />} />
        <Route path="/assignment/:assignment_id" element={<AssignmentDetail />} />
        <Route path="/edit-assignment/:assignment_id/edit" element={<AssignmentEdit />} />
      </Route>
      </Routes>
    </>
  );
}

export default App;
