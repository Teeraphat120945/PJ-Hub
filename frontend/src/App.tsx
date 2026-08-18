import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
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
        {/* หน้าสำหรับผู้ที่ยังไม่ได้เข้าสู่ระบบ (Guest Only) */}
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

        <Route element={<MainLayout />}>
          {/* หน้าสาธารณะ ทุกคนเข้าชมได้ */}
          <Route index element={<Home />} />
          <Route path="/class/:class_id" element={<ClassDetail />} />
          <Route path="/assignment/:assignment_id" element={<AssignmentDetail />} />

          {/* สิทธิ์เฉพาะผู้ดูแลระบบ (Admin: Role 0) */}
          <Route
            path="/UserManagement"
            element={
              <ProtectedRoute allowedRoles={[0]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* สิทธิ์สำหรับผู้ดูแลระบบและอาจารย์ (Admin: 0, Teacher: 1) */}
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

          {/* สิทธิ์สำหรับผู้ใช้ที่มีสิทธิ์ส่งผลงาน (Admin: 0, Teacher: 1, Student: 2) */}
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

