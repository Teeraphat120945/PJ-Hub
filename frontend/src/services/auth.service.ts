export const getProfile = async () => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No token");

  const res = await fetch("http://localhost:3000/api/auth/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Unauthorized");
  }

  return res.json();
};
