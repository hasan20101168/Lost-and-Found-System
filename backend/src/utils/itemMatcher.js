const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .trim();

const tokenize = (value) =>
  normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);

const unique = (values) => [...new Set(values)];

const getKeywordTokens = (item, fields) =>
  unique(
    fields.flatMap((field) => tokenize(item[field]))
  );

const getKeywordScore = (lostItem, foundItem) => {
  const lostTokens = getKeywordTokens(lostItem, [
    "title",
    "description",
    "category"
  ]);
  const foundTokens = getKeywordTokens(foundItem, [
    "title",
    "description",
    "category"
  ]);

  if (
    lostTokens.length === 0 ||
    foundTokens.length === 0
  ) {
    return {
      score: 0,
      matches: []
    };
  }

  const foundTokenSet = new Set(foundTokens);
  const matches = lostTokens.filter((token) =>
    foundTokenSet.has(token)
  );
  const overlapRatio =
    matches.length /
    Math.max(lostTokens.length, foundTokens.length);

  return {
    score: Math.round(Math.min(overlapRatio * 30, 30)),
    matches
  };
};

const getLocationScore = (lostItem, foundItem) => {
  const lostLocation = normalize(lostItem.location);
  const foundLocation = normalize(foundItem.foundLocation);

  if (!lostLocation || !foundLocation) {
    return {
      score: 0,
      matched: false
    };
  }

  if (lostLocation === foundLocation) {
    return {
      score: 20,
      matched: true
    };
  }

  if (
    lostLocation.includes(foundLocation) ||
    foundLocation.includes(lostLocation)
  ) {
    return {
      score: 16,
      matched: true
    };
  }

  const lostTokens = new Set(tokenize(lostLocation));
  const sharedTokens = tokenize(foundLocation).filter((token) =>
    lostTokens.has(token)
  );

  return {
    score: Math.min(sharedTokens.length * 6, 12),
    matched: sharedTokens.length > 0,
    matches: sharedTokens
  };
};

const getDateScore = (lostItem, foundItem) => {
  const dateLost = new Date(lostItem.dateLost);
  const dateFound = new Date(foundItem.dateFound);

  if (
    Number.isNaN(dateLost.getTime()) ||
    Number.isNaN(dateFound.getTime())
  ) {
    return {
      score: 0,
      daysApart: null
    };
  }

  const daysApart = Math.round(
    Math.abs(dateFound.getTime() - dateLost.getTime()) /
      DAY_IN_MS
  );

  if (daysApart <= 1) {
    return {
      score: 20,
      daysApart
    };
  }

  if (daysApart <= 3) {
    return {
      score: 16,
      daysApart
    };
  }

  if (daysApart <= 7) {
    return {
      score: 12,
      daysApart
    };
  }

  if (daysApart <= 14) {
    return {
      score: 8,
      daysApart
    };
  }

  if (daysApart <= 30) {
    return {
      score: 4,
      daysApart
    };
  }

  return {
    score: 0,
    daysApart
  };
};

const getConfidence = (score) => {
  if (score >= 75) {
    return "high";
  }

  if (score >= 50) {
    return "medium";
  }

  return "low";
};

const getMatchedOn = (details) => {
  const matchedOn = [];

  if (details.category.matched) {
    matchedOn.push("category");
  }

  if (details.keywords.matches.length > 0) {
    matchedOn.push("keywords");
  }

  if (details.location.matched) {
    matchedOn.push("location");
  }

  if (details.date.score > 0) {
    matchedOn.push("date proximity");
  }

  return matchedOn;
};

const calculateMatch = (lostItem, foundItem) => {
  const categoryMatched =
    normalize(lostItem.category) ===
    normalize(foundItem.category);
  const keywords = getKeywordScore(lostItem, foundItem);
  const location = getLocationScore(lostItem, foundItem);
  const date = getDateScore(lostItem, foundItem);

  const details = {
    category: {
      score: categoryMatched ? 30 : 0,
      matched: categoryMatched
    },
    keywords,
    location,
    date
  };

  const score =
    details.category.score +
    details.keywords.score +
    details.location.score +
    details.date.score;

  return {
    score,
    confidence: getConfidence(score),
    matchedOn: getMatchedOn(details),
    details
  };
};

const buildMatches = (
  lostItems,
  foundItems,
  {
    minScore = 30,
    limit = 50
  } = {}
) =>
  lostItems
    .flatMap((lostItem) =>
      foundItems.map((foundItem) => {
        const match = calculateMatch(lostItem, foundItem);

        return {
          lostItem,
          foundItem,
          ...match
        };
      })
    )
    .filter((match) => match.score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return (
        new Date(b.foundItem.updatedAt).getTime() -
        new Date(a.foundItem.updatedAt).getTime()
      );
    })
    .slice(0, limit);

module.exports = {
  buildMatches,
  calculateMatch
};
