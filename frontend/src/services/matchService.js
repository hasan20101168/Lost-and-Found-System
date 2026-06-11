import api from "../api/axios";

export const getMatches = async (
  filters = {}
) => {
  const response = await api.get(
    "/matches",
    {
      params: filters
    }
  );

  return response.data;
};
