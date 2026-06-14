const prisma = require("../config/prisma");
const {
  createNotification
} = require("../services/notification.service");

const claimInclude = {
  foundItem: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  },
  claimant: {
    select: {
      id: true,
      name: true,
      email: true
    }
  }
};

const canReviewClaim = (user, foundItem) =>
  user.role === "ADMIN" ||
  foundItem.userId === user.id;

exports.createClaimRequest = async (
  req,
  res
) => {
  try {
    const {
      foundItemId,
      proofOfOwnership
    } = req.body;

    const parsedFoundItemId =
      Number(foundItemId);

    if (
      Number.isNaN(parsedFoundItemId)
    ) {
      return res.status(400).json({
        message: "Found item id is required"
      });
    }

    if (!proofOfOwnership?.trim()) {
      return res.status(400).json({
        message: "Proof of ownership is required"
      });
    }

    const foundItem =
      await prisma.foundItem.findUnique({
        where: {
          id: parsedFoundItemId
        }
      });

    if (!foundItem) {
      return res.status(404).json({
        message: "Found item not found"
      });
    }

    if (foundItem.userId === req.user.id) {
      return res.status(400).json({
        message: "You cannot claim your own found item"
      });
    }

    if (foundItem.status !== "FOUND") {
      return res.status(400).json({
        message: "This item is not open for claims"
      });
    }

    const claim =
      await prisma.claimRequest.create({
        data: {
          foundItemId: parsedFoundItemId,
          claimantId: req.user.id,
          proofOfOwnership:
            proofOfOwnership.trim()
        },
        include: claimInclude
      });

    await createNotification({
      userId: claim.foundItem.userId,
      type: "CLAIM_UPDATE",
      title: "New claim request",
      message: `${claim.claimant.name} submitted a claim for ${claim.foundItem.title}.`,
      link: "/review-claims"
    });

    res.status(201).json(claim);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message:
          "You already submitted a claim for this item"
      });
    }

    res.status(500).json({
      message: error.message
    });
  }
};

exports.getMyClaimRequests = async (
  req,
  res
) => {
  try {
    const claims =
      await prisma.claimRequest.findMany({
        where: {
          claimantId: req.user.id
        },
        include: claimInclude,
        orderBy: {
          createdAt: "desc"
        }
      });

    res.json(claims);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getReviewClaimRequests = async (
  req,
  res
) => {
  try {
    const claims =
      await prisma.claimRequest.findMany({
        where:
          req.user.role === "ADMIN"
            ? {}
            : {
                foundItem: {
                  userId: req.user.id
                }
              },
        include: claimInclude,
        orderBy: {
          createdAt: "desc"
        }
      });

    res.json(claims);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.updateClaimRequestStatus = async (
  req,
  res
) => {
  try {
    const id = Number(req.params.id);
    const status =
      req.body.status?.toUpperCase();

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Claim id must be a valid number"
      });
    }

    if (
      !["ACCEPTED", "REJECTED"].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Status must be ACCEPTED or REJECTED"
      });
    }

    const claim =
      await prisma.claimRequest.findUnique({
        where: {
          id
        },
        include: {
          foundItem: true
        }
      });

    if (!claim) {
      return res.status(404).json({
        message: "Claim request not found"
      });
    }

    if (
      !canReviewClaim(
        req.user,
        claim.foundItem
      )
    ) {
      return res.status(403).json({
        message: "Forbidden"
      });
    }

    if (claim.status !== "PENDING") {
      return res.status(400).json({
        message:
          "Only pending claims can be reviewed"
      });
    }

    const [updatedClaim] =
      await prisma.$transaction([
        prisma.claimRequest.update({
          where: {
            id
          },
          data: {
            status
          },
          include: claimInclude
        }),
        ...(status === "ACCEPTED"
          ? [
              prisma.claimRequest.updateMany({
                where: {
                  foundItemId: claim.foundItemId,
                  id: {
                    not: id
                  },
                  status: "PENDING"
                },
                data: {
                  status: "REJECTED"
                }
              }),
              prisma.foundItem.update({
                where: {
                  id: claim.foundItemId
                },
                data: {
                  status: "CLAIMED"
                }
              })
            ]
          : [])
      ]);

    await createNotification({
      userId: updatedClaim.claimantId,
      type: "CLAIM_UPDATE",
      title: "Claim updated",
      message: `Your claim for ${updatedClaim.foundItem.title} was ${updatedClaim.status.toLowerCase()}.`,
      link: "/my-claims"
    });

    res.json(updatedClaim);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
