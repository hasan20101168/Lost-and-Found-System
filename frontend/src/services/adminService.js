import api from "../api/axios";

export const getAdminMetrics = async () => {
  const response = await api.get(
    "/admin/metrics"
  );

  return response.data;
};

export const getAdminUsers = async () => {
  const response = await api.get(
    "/admin/users"
  );

  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await api.delete(
    `/admin/users/${id}`
  );

  return response.data;
};

export const getAdminPosts = async () => {
  const response = await api.get(
    "/admin/posts"
  );

  return response.data;
};

export const deleteAdminPost = async (
  type,
  id
) => {
  const response = await api.delete(
    `/admin/posts/${type}/${id}`
  );

  return response.data;
};

export const getAdminClaims = async () => {
  const response = await api.get(
    "/admin/claims"
  );

  return response.data;
};

export const getAdminReports = async () => {
  const response = await api.get(
    "/admin/reports"
  );

  return response.data;
};

export const updateAdminReportStatus = async (
  id,
  status
) => {
  const response = await api.patch(
    `/admin/reports/${id}/status`,
    {
      status
    }
  );

  return response.data;
};
