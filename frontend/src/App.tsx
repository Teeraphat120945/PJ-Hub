import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import UserManagement from "./pages/UserManagement";
import CreateClass from "./pages/class/CreateClass";
import ClassUserManagement from "./pages/class/ClassUserManagement";
import ClassDetail from "./pages/class/ClassDetail";
import ClassEdit from "./pages/class/ClassEdit";
import CreateAssignment from "./pages/assignment/CreateAssignment";
import TeacherClassManagement from "./pages/class/TeacherClassManagement";
import AssignmentDetail from "./pages/assignment/AssignmentDetail";
import AssignmentManagement from "./pages/assignment/AssignmentManagement";
import AssignmentEdit from "./pages/assignment/AssignmentEdit";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={2500} />

      <Routes>
        <Route
          path="/login"
          element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register"
          element={
            <ProtectedRoute requireAuth={false}>
              <Register />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <ProtectedRoute requireAuth={false}>
              <ForgotPassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forget-password"
          element={
            <ProtectedRoute requireAuth={false}>
              <ForgotPassword />
            </ProtectedRoute>
          }
        />

        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/class/:class_id" element={<ClassDetail />} />
          <Route path="/assignment/:assignment_id" element={<AssignmentDetail />} />

          <Route
            path="/UserManagement"
            element={
              <ProtectedRoute allowedRoles={[0]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/CreateClass"
            element={
              <ProtectedRoute allowedRoles={[0, 1]}>
                <CreateClass />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ClassUserManagement"
            element={
              <ProtectedRoute allowedRoles={[0, 1]}>
                <ClassUserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/TeacherClassManagement"
            element={
              <ProtectedRoute allowedRoles={[0, 1]}>
                <TeacherClassManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/class/:class_id/edit"
            element={
              <ProtectedRoute allowedRoles={[0, 1]}>
                <ClassEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assignments"
            element={
              <ProtectedRoute allowedRoles={[0, 1, 2]}>
                <AssignmentManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-assignment"
            element={
              <ProtectedRoute allowedRoles={[0, 1, 2]}>
                <CreateAssignment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-assignment/:assignment_id/edit"
            element={
              <ProtectedRoute allowedRoles={[0, 1, 2]}>
                <AssignmentEdit />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;

