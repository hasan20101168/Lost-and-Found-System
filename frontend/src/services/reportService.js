import api from "../api/axios";

export const createReport = async (
  reportData
) => {
  const response = await api.post(
    "/reports",
    reportData
  );

  return response.data;
};
