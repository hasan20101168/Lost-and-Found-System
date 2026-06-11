import {
  useEffect,
  useState
} from "react";
import { useNavigate } from "react-router-dom";
import { createFoundItem } from "../services/foundItemService";

function CreateFoundItem() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    foundLocation: "",
    dateFound: "",
    storageLocation: "",
    contactInfo: "",
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

      await createFoundItem(payload);

      alert("Found item report created successfully");
      navigate("/found-items");
    } catch (error) {
      console.error("Create Found Item Error:", error);

      const message =
        error.response?.data?.message ||
        "Failed to create found item";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Report Found Item</h1>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          name="title"
          placeholder="Item title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Item details"
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
          name="foundLocation"
          placeholder="Found location"
          value={formData.foundLocation}
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="dateFound"
          value={formData.dateFound}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="storageLocation"
          placeholder="Storage location"
          value={formData.storageLocation}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="contactInfo"
          placeholder="Contact information"
          value={formData.contactInfo}
          onChange={handleChange}
          required
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
            alt="Selected found item preview"
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

export default CreateFoundItem;
