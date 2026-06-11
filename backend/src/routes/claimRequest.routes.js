const express = require("express");

const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const {
  createClaimRequest,
  getMyClaimRequests,
  getReviewClaimRequests,
  updateClaimRequestStatus
} = require("../controllers/claimRequest.controller");

router.use(auth);

router.post("/", createClaimRequest);
router.get("/my", getMyClaimRequests);
router.get("/review", getReviewClaimRequests);
router.patch(
  "/:id/status",
  updateClaimRequestStatus
);

module.exports = router;
