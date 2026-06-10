import {
  useEffect,
  useState
} from "react";
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
    reward: "",
    image: null
  });

  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;

    setFormData((prev) => ({
      ...prev,
      image: file
    }));

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(file ? URL.createObjectURL(file) : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          payload.append(key, value);
        }
      });

      await createLostItem(payload);

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

        <label className="file-field">
          <span>Item photo (optional)</span>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Selected lost item preview"
            className="image-preview"
          />
        )}

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
