import {
  useEffect,
  useState
} from "react";

import {
  loginUser,
  registerUser,
  getProfile,
  updateProfile as saveProfile
} from "../services/authService";
import { AuthContext } from "./authContextCore";

export const AuthProvider = ({
  children
}) => {
  const [user, setUser] = useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token =
        localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const profile =
          await getProfile();

        setUser(profile);
      } catch (error) {
        console.error(error);

        localStorage.removeItem(
          "token"
        );
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (
    email,
    password
  ) => {
    const data = await loginUser({
      email,
      password
    });

    localStorage.setItem(
      "token",
      data.token
    );

    setUser(data.user);

    return data.user;
  };

  const register = async (
    name,
    email,
    password
  ) => {
    const data = await registerUser({
      name,
      email,
      password
    });

    localStorage.setItem(
      "token",
      data.token
    );

    setUser(data.user);

    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateProfile = async (
    profileData
  ) => {
    const updatedUser =
      await saveProfile(profileData);

    setUser(updatedUser);

    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
