import { useState } from "react";
import { createLostItem } from "../services/lostItemService";
import { useNavigate } from "react-router-dom";

function CreateLostItem() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    dateLost: "",
    reward: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createLostItem(formData);

      alert("Lost item created successfully");

      navigate("/lost-items");
    } catch (error) {
      console.error("Create Lost Item Error:", error);

      const message =
        error.response?.data?.message ||
        "Failed to create item";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Report Lost Item</h1>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={formData.category}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="location"
          placeholder="Location"
          value={formData.location}
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="dateLost"
          value={formData.dateLost}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="reward"
          placeholder="Reward (optional)"
          value={formData.reward}
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Submitting..."
            : "Submit"}
        </button>
      </form>
    </div>
  );
}

export default CreateLostItem;