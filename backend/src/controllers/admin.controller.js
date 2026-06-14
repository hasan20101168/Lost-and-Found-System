const prisma = require("../config/prisma");

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true
};

const claimInclude = {
  foundItem: {
    include: {
      user: {
        select: userSelect
      }
    }
  },
  claimant: {
    select: userSelect
  }
};

const getReportItem = async (report) => {
  if (report.itemType === "LOST_ITEM") {
    return prisma.lostItem.findUnique({
      where: {
        id: report.itemId
      },
      include: {
        user: {
          select: userSelect
        }
      }
    });
  }

  return prisma.foundItem.findUnique({
    where: {
      id: report.itemId
    },
    include: {
      user: {
        select: userSelect
      }
    }
  });
};

exports.getMetrics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalLostItems,
      totalFoundItems,
      resolvedLostItems,
      resolvedFoundItems,
      pendingClaims,
      openReports
    ] = await Promise.all([
      prisma.user.count(),
      prisma.lostItem.count(),
      prisma.foundItem.count(),
      prisma.lostItem.count({
        where: {
          status: "RESOLVED"
        }
      }),
      prisma.foundItem.count({
        where: {
          status: {
            in: ["CLAIMED", "RESOLVED"]
          }
        }
      }),
      prisma.claimRequest.count({
        where: {
          status: "PENDING"
        }
      }),
      prisma.report.count({
        where: {
          status: "OPEN"
        }
      })
    ]);

    res.json({
      totalUsers,
      totalLostItems,
      totalFoundItems,
      resolvedCases:
        resolvedLostItems + resolvedFoundItems,
      pendingClaims,
      openReports
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "User id must be a valid number"
      });
    }

    if (id === req.user.id) {
      return res.status(400).json({
        message: "You cannot remove yourself"
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id
      }
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.role === "ADMIN") {
      return res.status(400).json({
        message: "Admin users cannot be removed"
      });
    }

    await prisma.user.delete({
      where: {
        id
      }
    });

    res.json({
      message: "User removed"
    });
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(409).json({
        message:
          "Cannot remove a user with existing activity"
      });
    }

    res.status(500).json({
      message: error.message
    });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const [lostItems, foundItems] =
      await Promise.all([
        prisma.lostItem.findMany({
          include: {
            user: {
              select: userSelect
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }),
        prisma.foundItem.findMany({
          include: {
            user: {
              select: userSelect
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        })
      ]);

    res.json({
      lostItems,
      foundItems
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const type = req.params.type;
    const id = Number(req.params.id);

    if (
      !["lost", "found"].includes(type) ||
      Number.isNaN(id)
    ) {
      return res.status(400).json({
        message: "Invalid post reference"
      });
    }

    if (type === "lost") {
      const conversations =
        await prisma.conversation.findMany({
          where: {
            lostItemId: id
          },
          select: {
            id: true
          }
        });
      const conversationIds =
        conversations.map(
          (conversation) => conversation.id
        );

      await prisma.$transaction([
        prisma.message.deleteMany({
          where: {
            conversationId: {
              in: conversationIds
            }
          }
        }),
        prisma.conversation.deleteMany({
          where: {
            id: {
              in: conversationIds
            }
          }
        }),
        prisma.report.deleteMany({
          where: {
            itemType: "LOST_ITEM",
            itemId: id
          }
        }),
        prisma.lostItem.delete({
          where: {
            id
          }
        })
      ]);
    } else {
      const conversations =
        await prisma.conversation.findMany({
          where: {
            foundItemId: id
          },
          select: {
            id: true
          }
        });
      const conversationIds =
        conversations.map(
          (conversation) => conversation.id
        );

      await prisma.$transaction([
        prisma.message.deleteMany({
          where: {
            conversationId: {
              in: conversationIds
            }
          }
        }),
        prisma.conversation.deleteMany({
          where: {
            id: {
              in: conversationIds
            }
          }
        }),
        prisma.claimRequest.deleteMany({
          where: {
            foundItemId: id
          }
        }),
        prisma.report.deleteMany({
          where: {
            itemType: "FOUND_ITEM",
            itemId: id
          }
        }),
        prisma.foundItem.delete({
          where: {
            id
          }
        })
      ]);
    }

    res.json({
      message: "Post removed"
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Post not found"
      });
    }

    res.status(500).json({
      message: error.message
    });
  }
};

exports.getClaims = async (req, res) => {
  try {
    const claims =
      await prisma.claimRequest.findMany({
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

exports.getReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: userSelect
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const reportsWithItems =
      await Promise.all(
        reports.map(async (report) => ({
          ...report,
          item: await getReportItem(report)
        }))
      );

    res.json(reportsWithItems);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.updateReportStatus = async (
  req,
  res
) => {
  try {
    const id = Number(req.params.id);
    const status =
      req.body.status?.toUpperCase();

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message: "Report id must be a valid number"
      });
    }

    if (
      !["OPEN", "REVIEWED", "DISMISSED"].includes(
        status
      )
    ) {
      return res.status(400).json({
        message:
          "Status must be OPEN, REVIEWED, or DISMISSED"
      });
    }

    const report = await prisma.report.update({
      where: {
        id
      },
      data: {
        status
      },
      include: {
        reporter: {
          select: userSelect
        }
      }
    });

    res.json({
      ...report,
      item: await getReportItem(report)
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
