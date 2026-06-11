import api from "../api/axios";

export const createClaimRequest = async (
  claimData
) => {
  const response = await api.post(
    "/claims",
    claimData
  );

  return response.data;
};

export const getMyClaimRequests = async () => {
  const response = await api.get(
    "/claims/my"
  );

  return response.data;
};

export const getReviewClaimRequests = async () => {
  const response = await api.get(
    "/claims/review"
  );

  return response.data;
};

export const updateClaimRequestStatus = async (
  id,
  status
) => {
  const response = await api.patch(
    `/claims/${id}/status`,
    {
      status
    }
  );

  return response.data;
};
