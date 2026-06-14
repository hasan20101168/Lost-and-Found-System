import {
  useState
} from "react";
import { useAuth } from "../context/useAuth";
import { createReport } from "../services/reportService";

function LostItemCard({ item }) {
  const {
    user
  } = useAuth();
  const [reportMessage, setReportMessage] =
    useState("");

  const handleReport = async () => {
    const reason = window.prompt(
      "Why are you reporting this lost item?"
    );

    if (!reason?.trim()) {
      return;
    }

    try {
      await createReport({
        itemType: "LOST_ITEM",
        itemId: item.id,
        reason
      });

      setReportMessage("Report submitted.");
    } catch (error) {
      setReportMessage(
        error.response?.data?.message ||
          "Could not submit report"
      );
    }
  };

  return (
    <div className="item-card">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.title}
          className="item-image"
        />
      )}

      <h3>{item.title}</h3>

      <p>
        <strong>Category:</strong> {item.category}
      </p>

      <p>
        <strong>Location:</strong> {item.location}
      </p>

      <p>{item.description}</p>

      <p>
        <strong>Status:</strong> {item.status}
      </p>

      {user && user.id !== item.userId && (
        <button
          type="button"
          className="secondary-button"
          onClick={handleReport}
        >
          Report Post
        </button>
      )}

      {reportMessage && (
        <p className="claim-message">
          {reportMessage}
        </p>
      )}
    </div>
  );
}

export default LostItemCard;
